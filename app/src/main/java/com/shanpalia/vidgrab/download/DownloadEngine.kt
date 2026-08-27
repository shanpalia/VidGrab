package com.shanpalia.vidgrab.download

import android.content.Context
import android.net.Uri
import com.shanpalia.vidgrab.data.database.AppDatabase
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.DownloadStatus
import com.shanpalia.vidgrab.data.model.HistoryItem
import com.shanpalia.vidgrab.media.AudioExtractor
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.RandomAccessFile
import java.util.concurrent.ConcurrentHashMap

class DownloadEngine(
    private val context: Context,
    private val database: AppDatabase,
    private val okHttpClient: OkHttpClient,
    private val notificationHelper: DownloadNotificationHelper
) {
    private val engineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val activeJobs = ConcurrentHashMap<Long, Job>()
    private val pausedFlags = ConcurrentHashMap<Long, Boolean>()

    private val _activeDownloadsCount = MutableStateFlow(0)
    val activeDownloadsCount: StateFlow<Int> = _activeDownloadsCount.asStateFlow()

    fun startDownload(
        url: String,
        title: String,
        mediaType: String,
        format: String,
        resolution: String? = null,
        quality: String? = null,
        thumbnail: String? = null,
        expectedSizeBytes: Long = 0L,
        isAudioExtractionRequired: Boolean = false,
        customBitrateKbps: Int = 192
    ): Long {
        val targetFileName = "${FileUtils.sanitizeFileName(title)}.${format.lowercase()}"
        val targetFile = FileUtils.getTargetFile(context, targetFileName, mediaType)

        var newId = 0L
        engineScope.launch {
            val item = DownloadItem(
                url = url,
                title = title,
                filePath = targetFile.absolutePath,
                thumbnail = thumbnail,
                mediaType = mediaType,
                format = format,
                resolution = resolution,
                quality = quality,
                size = expectedSizeBytes,
                status = DownloadStatus.WAITING,
                progress = 0f,
                downloadedBytes = 0L
            )
            newId = database.downloadDao().insertDownload(item)

            // Insert into history
            database.historyDao().insertHistory(
                HistoryItem(
                    url = url,
                    title = title,
                    thumbnail = thumbnail,
                    format = format,
                    mediaType = mediaType,
                    status = "Downloading"
                )
            )

            launchDownloadJob(newId, url, targetFile, expectedSizeBytes, isAudioExtractionRequired, customBitrateKbps)
        }
        return newId
    }

    fun resumeDownload(downloadId: Long) {
        pausedFlags[downloadId] = false
        engineScope.launch {
            val item = database.downloadDao().getDownloadById(downloadId) ?: return@launch
            val file = File(item.filePath)
            launchDownloadJob(
                downloadId = downloadId,
                url = item.url,
                targetFile = file,
                expectedSize = item.size,
                isAudioExtractionRequired = item.mediaType == "audio" && item.format != "MP4",
                customBitrateKbps = 192
            )
        }
    }

    fun pauseDownload(downloadId: Long) {
        pausedFlags[downloadId] = true
        activeJobs[downloadId]?.cancel()
        activeJobs.remove(downloadId)
        engineScope.launch {
            database.downloadDao().markPaused(downloadId)
            notificationHelper.cancelNotification(downloadId)
            updateActiveCount()
        }
    }

    fun cancelDownload(downloadId: Long) {
        activeJobs[downloadId]?.cancel()
        activeJobs.remove(downloadId)
        pausedFlags.remove(downloadId)
        engineScope.launch {
            val item = database.downloadDao().getDownloadById(downloadId)
            database.downloadDao().markCancelled(downloadId)
            if (item != null) {
                val file = File(item.filePath)
                if (file.exists()) file.delete()
                database.historyDao().insertHistory(
                    HistoryItem(
                        url = item.url,
                        title = item.title,
                        thumbnail = item.thumbnail,
                        format = item.format,
                        mediaType = item.mediaType,
                        status = "Cancelled"
                    )
                )
            }
            notificationHelper.cancelNotification(downloadId)
            updateActiveCount()
        }
    }

    private fun launchDownloadJob(
        downloadId: Long,
        url: String,
        targetFile: File,
        expectedSize: Long,
        isAudioExtractionRequired: Boolean,
        customBitrateKbps: Int
    ) {
        activeJobs[downloadId]?.cancel()

        val job = engineScope.launch {
            updateActiveCount()
            try {
                database.downloadDao().updateProgress(
                    id = downloadId,
                    status = DownloadStatus.STARTING,
                    progress = 0f,
                    downloadedBytes = 0L,
                    speed = 0L,
                    eta = 0L
                )

                // Storage check
                val freeSpace = FileUtils.getFreeSpaceBytes(context)
                if (expectedSize > 0 && freeSpace < expectedSize + (20 * 1024 * 1024L)) {
                    database.downloadDao().markFailed(downloadId, "Not enough storage space.")
                    notificationHelper.showFailedNotification(downloadId, targetFile.name, "Not enough storage space.")
                    return@launch
                }

                val downloadTargetFile = if (isAudioExtractionRequired) {
                    File(context.cacheDir, "temp_dl_${downloadId}.mp4")
                } else {
                    targetFile
                }

                // Check existing partial file for Resume support
                var existingBytes = 0L
                if (downloadTargetFile.exists()) {
                    existingBytes = downloadTargetFile.length()
                }

                val requestBuilder = Request.Builder()
                    .url(url)
                    .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) VidGrab/1.0")

                if (existingBytes > 0) {
                    requestBuilder.header("Range", "bytes=$existingBytes-")
                }

                val response = okHttpClient.newCall(requestBuilder.build()).execute()

                if (!response.isSuccessful && response.code != 206) {
                    // Range request may have failed, retry from start
                    if (existingBytes > 0) {
                        downloadTargetFile.delete()
                        existingBytes = 0L
                        val cleanReq = Request.Builder()
                            .url(url)
                            .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) VidGrab/1.0")
                            .build()
                        val retryResp = okHttpClient.newCall(cleanReq).execute()
                        if (!retryResp.isSuccessful) {
                            handleFailure(downloadId, targetFile.name, "Server error (${retryResp.code})")
                            retryResp.close()
                            return@launch
                        }
                        streamResponseToFile(downloadId, retryResp, downloadTargetFile, 0L, expectedSize, isAudioExtractionRequired, targetFile, customBitrateKbps)
                        return@launch
                    } else {
                        handleFailure(downloadId, targetFile.name, "Download failed with HTTP ${response.code}")
                        response.close()
                        return@launch
                    }
                }

                streamResponseToFile(
                    downloadId = downloadId,
                    response = response,
                    downloadFile = downloadTargetFile,
                    existingBytes = existingBytes,
                    expectedSize = expectedSize,
                    isAudioExtractionRequired = isAudioExtractionRequired,
                    finalTargetFile = targetFile,
                    customBitrateKbps = customBitrateKbps
                )

            } catch (e: CancellationException) {
                if (pausedFlags[downloadId] == true) {
                    database.downloadDao().markPaused(downloadId)
                }
            } catch (e: Exception) {
                handleFailure(downloadId, targetFile.name, e.localizedMessage ?: "Network error. Check connection.")
            } finally {
                activeJobs.remove(downloadId)
                updateActiveCount()
            }
        }

        activeJobs[downloadId] = job
    }

    private suspend fun streamResponseToFile(
        downloadId: Long,
        response: okhttp3.Response,
        downloadFile: File,
        existingBytes: Long,
        expectedSize: Long,
        isAudioExtractionRequired: Boolean,
        finalTargetFile: File,
        customBitrateKbps: Int
    ) = withContext(Dispatchers.IO) {
        val body = response.body
        if (body == null) {
            handleFailure(downloadId, finalTargetFile.name, "Empty response body from source.")
            return@withContext
        }

        val contentLength = body.contentLength()
        val totalBytes = if (contentLength > 0) {
            if (response.code == 206) existingBytes + contentLength else contentLength
        } else {
            expectedSize
        }

        val isAppend = response.code == 206 && existingBytes > 0
        val inputStream: InputStream = body.byteStream()
        val outputStream = if (isAppend) {
            FileOutputStream(downloadFile, true)
        } else {
            FileOutputStream(downloadFile, false)
        }

        val buffer = ByteArray(32 * 1024)
        var bytesRead: Int
        var downloadedBytes = if (isAppend) existingBytes else 0L

        var lastUpdateTime = System.currentTimeMillis()
        var bytesSinceLastUpdate = 0L
        var smoothedSpeed = 0L

        database.downloadDao().updateProgress(
            id = downloadId,
            status = DownloadStatus.DOWNLOADING,
            progress = if (totalBytes > 0) (downloadedBytes.toFloat() / totalBytes).coerceIn(0f, 1f) else 0.05f,
            downloadedBytes = downloadedBytes,
            speed = 0L,
            eta = 0L
        )

        try {
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                if (pausedFlags[downloadId] == true || !isActive) {
                    outputStream.flush()
                    outputStream.close()
                    inputStream.close()
                    response.close()
                    return@withContext
                }

                outputStream.write(buffer, 0, bytesRead)
                downloadedBytes += bytesRead
                bytesSinceLastUpdate += bytesRead

                val now = System.currentTimeMillis()
                val delta = now - lastUpdateTime
                if (delta >= 600) {
                    val instantSpeed = (bytesSinceLastUpdate * 1000L) / delta
                    smoothedSpeed = if (smoothedSpeed == 0L) instantSpeed else (smoothedSpeed * 0.7 + instantSpeed * 0.3).toLong()
                    val etaSec = if (smoothedSpeed > 0 && totalBytes > downloadedBytes) {
                        (totalBytes - downloadedBytes) / smoothedSpeed
                    } else 0L

                    val prog = if (totalBytes > 0) (downloadedBytes.toFloat() / totalBytes).coerceIn(0f, 0.99f) else 0.5f

                    database.downloadDao().updateProgress(
                        id = downloadId,
                        status = DownloadStatus.DOWNLOADING,
                        progress = prog,
                        downloadedBytes = downloadedBytes,
                        speed = smoothedSpeed,
                        eta = etaSec
                    )

                    val percent = (prog * 100).toInt()
                    notificationHelper.showProgressNotification(
                        downloadId = downloadId,
                        title = finalTargetFile.name,
                        progressPercent = percent,
                        speedStr = FileUtils.formatSpeed(smoothedSpeed),
                        etaStr = FileUtils.formatEta(etaSec)
                    )

                    lastUpdateTime = now
                    bytesSinceLastUpdate = 0L
                }
            }

            outputStream.flush()
            outputStream.close()
            inputStream.close()
            response.close()

            // Check if audio extraction is required on downloaded file
            if (isAudioExtractionRequired) {
                database.downloadDao().updateProgress(
                    id = downloadId,
                    status = DownloadStatus.PROCESSING,
                    progress = 0.95f,
                    downloadedBytes = downloadedBytes,
                    speed = 0L,
                    eta = 0L
                )

                val extResult = AudioExtractor.extractAudio(
                    context = context,
                    inputUri = Uri.fromFile(downloadFile),
                    outputFormat = finalTargetFile.extension.uppercase(),
                    outputQualityKbps = customBitrateKbps,
                    customOutputName = finalTargetFile.nameWithoutExtension
                )

                downloadFile.delete() // remove temp mp4

                if (extResult.isSuccess) {
                    val extractedFile = extResult.getOrThrow()
                    handleSuccess(downloadId, extractedFile)
                } else {
                    handleFailure(downloadId, finalTargetFile.name, extResult.exceptionOrNull()?.localizedMessage ?: "Audio extraction failed.")
                }
            } else {
                handleSuccess(downloadId, downloadFile)
            }

        } catch (e: Exception) {
            outputStream.close()
            inputStream.close()
            response.close()
            throw e
        }
    }

    private suspend fun handleSuccess(downloadId: Long, finalFile: File) {
        val finalSize = finalFile.length()
        database.downloadDao().markCompleted(
            id = downloadId,
            completedAt = System.currentTimeMillis(),
            filePath = finalFile.absolutePath,
            finalSize = finalSize
        )
        val item = database.downloadDao().getDownloadById(downloadId)
        if (item != null) {
            database.historyDao().insertHistory(
                HistoryItem(
                    url = item.url,
                    title = item.title,
                    thumbnail = item.thumbnail,
                    format = item.format,
                    mediaType = item.mediaType,
                    status = "Completed"
                )
            )
        }
        notificationHelper.showCompleteNotification(downloadId, finalFile.name, finalFile.absolutePath)
        updateActiveCount()
    }

    private suspend fun handleFailure(downloadId: Long, fileName: String, reason: String) {
        database.downloadDao().markFailed(downloadId, reason)
        val item = database.downloadDao().getDownloadById(downloadId)
        if (item != null) {
            database.historyDao().insertHistory(
                HistoryItem(
                    url = item.url,
                    title = item.title,
                    thumbnail = item.thumbnail,
                    format = item.format,
                    mediaType = item.mediaType,
                    status = "Failed"
                )
            )
        }
        notificationHelper.showFailedNotification(downloadId, fileName, reason)
        updateActiveCount()
    }

    private fun updateActiveCount() {
        _activeDownloadsCount.value = activeJobs.size
    }
}
