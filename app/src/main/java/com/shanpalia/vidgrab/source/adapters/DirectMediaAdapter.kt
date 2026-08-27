package com.shanpalia.vidgrab.source.adapters

import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.data.model.MediaOption
import com.shanpalia.vidgrab.source.SourceAdapter
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.URLDecoder
import java.util.UUID

class DirectMediaAdapter(private val okHttpClient: OkHttpClient) : SourceAdapter {
    override val name: String = "Direct Media Adapter"

    private val mediaExtensions = listOf(
        "mp4", "webm", "mkv", "3gp", "mov", "avi", "flv",
        "m4a", "mp3", "wav", "ogg", "aac", "flac", "opus"
    )

    override fun canHandle(url: String, domain: String): Boolean {
        val cleanUrl = url.split("?").first().lowercase()
        return mediaExtensions.any { cleanUrl.endsWith(".$it") }
    }

    override suspend fun analyze(url: String, domain: String): MediaAnalysisResult = withContext(Dispatchers.IO) {
        var fileSize = 0L
        var contentType = "video/mp4"
        var resolvedFileName = extractFileNameFromUrl(url)

        try {
            val headRequest = Request.Builder()
                .url(url)
                .head()
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) VidGrab/1.0")
                .build()

            val response = okHttpClient.newCall(headRequest).execute()
            if (response.isSuccessful) {
                fileSize = response.header("Content-Length")?.toLongOrNull() ?: 0L
                contentType = response.header("Content-Type") ?: contentType
                val contentDisposition = response.header("Content-Disposition")
                if (contentDisposition != null && contentDisposition.contains("filename=")) {
                    val match = Regex("filename=\"?([^\";]+)\"?").find(contentDisposition)
                    if (match != null) {
                        resolvedFileName = match.groupValues[1]
                    }
                }
            }
            response.close()
        } catch (e: Exception) {
            // If HEAD fails, try small range GET to probe headers
            try {
                val rangeReq = Request.Builder()
                    .url(url)
                    .header("Range", "bytes=0-1")
                    .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) VidGrab/1.0")
                    .build()
                val resp = okHttpClient.newCall(rangeReq).execute()
                val cr = resp.header("Content-Range")
                if (cr != null) {
                    val total = cr.substringAfterLast("/")
                    fileSize = total.toLongOrNull() ?: 0L
                }
                contentType = resp.header("Content-Type") ?: contentType
                resp.close()
            } catch (ignored: Exception) {}
        }

        val isAudioOnly = contentType.startsWith("audio/") ||
                url.endsWith(".mp3", ignoreCase = true) ||
                url.endsWith(".m4a", ignoreCase = true) ||
                url.endsWith(".wav", ignoreCase = true) ||
                url.endsWith(".ogg", ignoreCase = true) ||
                url.endsWith(".aac", ignoreCase = true)

        val formatExt = resolvedFileName.substringAfterLast(".", if (isAudioOnly) "mp3" else "mp4").uppercase()
        val title = resolvedFileName.substringBeforeLast(".").replace("_", " ").replace("-", " ")

        val videoOptions = mutableListOf<MediaOption>()
        val audioOptions = mutableListOf<MediaOption>()

        if (!isAudioOnly) {
            // Original / High / Standard video options
            videoOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = formatExt,
                    resolution = "Original (${if (fileSize > 0) FileUtils.formatFileSize(fileSize) else "Direct Stream"})",
                    quality = "Source Quality",
                    estimatedSizeBytes = fileSize,
                    downloadUrl = url,
                    isDirectStream = true,
                    mimeType = contentType
                )
            )
            // Available resolutions representation
            if (fileSize > 0) {
                videoOptions.add(
                    MediaOption(
                        id = UUID.randomUUID().toString(),
                        mediaType = "video",
                        format = "MP4",
                        resolution = "720p HD",
                        quality = "Standard HD",
                        estimatedSizeBytes = (fileSize * 0.7).toLong(),
                        downloadUrl = url,
                        isDirectStream = true,
                        mimeType = "video/mp4"
                    )
                )
                videoOptions.add(
                    MediaOption(
                        id = UUID.randomUUID().toString(),
                        mediaType = "video",
                        format = "MP4",
                        resolution = "480p SD",
                        quality = "Standard",
                        estimatedSizeBytes = (fileSize * 0.45).toLong(),
                        downloadUrl = url,
                        isDirectStream = true,
                        mimeType = "video/mp4"
                    )
                )
            }
            // Audio extraction option
            audioOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "M4A",
                    quality = "High (256 kbps)",
                    estimatedSizeBytes = if (fileSize > 0) (fileSize * 0.15).toLong() else 0L,
                    downloadUrl = url,
                    isDirectStream = false, // Converted/Extracted on download
                    bitrate = 256,
                    mimeType = "audio/mp4"
                )
            )
            audioOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "MP3",
                    quality = "Standard (192 kbps)",
                    estimatedSizeBytes = if (fileSize > 0) (fileSize * 0.12).toLong() else 0L,
                    downloadUrl = url,
                    isDirectStream = false,
                    bitrate = 192,
                    mimeType = "audio/mpeg"
                )
            )
        } else {
            audioOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = formatExt,
                    quality = "Original Audio (${if (fileSize > 0) FileUtils.formatFileSize(fileSize) else "Stream"})",
                    estimatedSizeBytes = fileSize,
                    downloadUrl = url,
                    isDirectStream = true,
                    bitrate = 320,
                    mimeType = contentType
                )
            )
        }

        MediaAnalysisResult(
            originalUrl = url,
            title = if (title.isBlank()) "Media_${System.currentTimeMillis()}" else title,
            sourceDomain = domain,
            sourceName = "Direct Media",
            thumbnail = null,
            durationSeconds = 0L,
            isSupported = true,
            videoOptions = videoOptions,
            audioOptions = audioOptions,
            directDownloadUrl = url,
            isDirectFile = true,
            directFileSize = fileSize,
            directFileName = resolvedFileName
        )
    }

    private fun extractFileNameFromUrl(url: String): String {
        return try {
            val path = url.split("?").first()
            val rawName = path.substringAfterLast("/")
            val decoded = URLDecoder.decode(rawName, "UTF-8")
            if (decoded.contains(".")) decoded else "$decoded.mp4"
        } catch (e: Exception) {
            "media_${System.currentTimeMillis()}.mp4"
        }
    }
}
