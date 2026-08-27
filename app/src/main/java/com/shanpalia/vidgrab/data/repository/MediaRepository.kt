package com.shanpalia.vidgrab.data.repository

import com.shanpalia.vidgrab.data.database.AppDatabase
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.HistoryItem
import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.download.DownloadEngine
import com.shanpalia.vidgrab.source.SourceDetector
import kotlinx.coroutines.flow.Flow
import java.io.File

class MediaRepository(
    private val database: AppDatabase,
    private val sourceDetector: SourceDetector,
    private val downloadEngine: DownloadEngine
) {
    val allDownloads: Flow<List<DownloadItem>> = database.downloadDao().getAllDownloads()
    val completedDownloads: Flow<List<DownloadItem>> = database.downloadDao().getCompletedDownloads()
    val audioLibrary: Flow<List<DownloadItem>> = database.downloadDao().getAudioLibrary()
    val videoLibrary: Flow<List<DownloadItem>> = database.downloadDao().getVideoLibrary()
    val activeDownloads: Flow<List<DownloadItem>> = database.downloadDao().getActiveDownloads()
    val historyItems: Flow<List<HistoryItem>> = database.historyDao().getAllHistory()

    fun getDownloadsByType(type: String): Flow<List<DownloadItem>> = database.downloadDao().getDownloadsByType(type)

    fun observeDownload(id: Long): Flow<DownloadItem?> = database.downloadDao().observeDownloadById(id)

    suspend fun analyzeUrl(url: String, onProgress: (String) -> Unit = {}): MediaAnalysisResult {
        return sourceDetector.analyze(url, onProgress)
    }

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
        return downloadEngine.startDownload(
            url = url,
            title = title,
            mediaType = mediaType,
            format = format,
            resolution = resolution,
            quality = quality,
            thumbnail = thumbnail,
            expectedSizeBytes = expectedSizeBytes,
            isAudioExtractionRequired = isAudioExtractionRequired,
            customBitrateKbps = customBitrateKbps
        )
    }

    fun pauseDownload(id: Long) = downloadEngine.pauseDownload(id)

    fun resumeDownload(id: Long) = downloadEngine.resumeDownload(id)

    fun cancelDownload(id: Long) = downloadEngine.cancelDownload(id)

    suspend fun deleteDownload(item: DownloadItem) {
        val file = File(item.filePath)
        if (file.exists()) {
            file.delete()
        }
        database.downloadDao().deleteDownload(item)
    }

    suspend fun renameDownload(item: DownloadItem, newTitle: String): Boolean {
        val file = File(item.filePath)
        if (!file.exists()) {
            database.downloadDao().updateTitleAndPath(item.id, newTitle, item.filePath)
            return true
        }

        val parentDir = file.parentFile ?: return false
        val ext = file.extension
        val newFileName = if (ext.isNotEmpty()) "$newTitle.$ext" else newTitle
        val newFile = File(parentDir, newFileName)

        val renamed = file.renameTo(newFile)
        if (renamed) {
            database.downloadDao().updateTitleAndPath(item.id, newTitle, newFile.absolutePath)
            return true
        }
        return false
    }

    suspend fun clearCompletedDownloads() {
        database.downloadDao().clearCompleted()
    }

    suspend fun deleteHistory(item: HistoryItem) {
        database.historyDao().deleteHistory(item)
    }

    suspend fun clearAllHistory() {
        database.historyDao().clearAllHistory()
    }

    suspend fun saveExtractedAudioItem(
        file: File,
        title: String,
        format: String,
        quality: String
    ): Long {
        val item = DownloadItem(
            url = "file://${file.absolutePath}",
            title = title,
            filePath = file.absolutePath,
            mediaType = "audio",
            format = format.uppercase(),
            quality = quality,
            size = file.length(),
            status = com.shanpalia.vidgrab.data.model.DownloadStatus.COMPLETED,
            progress = 1.0f,
            downloadedBytes = file.length(),
            completedAt = System.currentTimeMillis()
        )
        val id = database.downloadDao().insertDownload(item)
        database.historyDao().insertHistory(
            HistoryItem(
                url = "file://${file.absolutePath}",
                title = title,
                format = format.uppercase(),
                mediaType = "audio",
                status = "Completed"
            )
        )
        return id
    }
}
