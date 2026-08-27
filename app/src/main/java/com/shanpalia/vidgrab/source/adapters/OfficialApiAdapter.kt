package com.shanpalia.vidgrab.source.adapters

import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.data.model.MediaOption
import com.shanpalia.vidgrab.source.SourceAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.UUID

class OfficialApiAdapter(private val okHttpClient: OkHttpClient) : SourceAdapter {
    override val name: String = "Open Media / Public Archive Adapter"

    private val supportedDomains = listOf(
        "wikimedia.org",
        "wikipedia.org",
        "archive.org",
        "commondatastorage.googleapis.com",
        "w3schools.com",
        "sample-videos.com",
        "filesamples.com",
        "freepd.com",
        "incompetech.com"
    )

    override fun canHandle(url: String, domain: String): Boolean {
        val lowerDomain = domain.lowercase()
        return supportedDomains.any { lowerDomain.contains(it) }
    }

    override suspend fun analyze(url: String, domain: String): MediaAnalysisResult = withContext(Dispatchers.IO) {
        // Probe URL for size & metadata
        var realSize = 0L
        var mimeType = "video/mp4"
        var cleanTitle = "Open Media Stream"

        try {
            val req = Request.Builder()
                .url(url)
                .head()
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) VidGrab/1.0")
                .build()
            val resp = okHttpClient.newCall(req).execute()
            if (resp.isSuccessful) {
                realSize = resp.header("Content-Length")?.toLongOrNull() ?: 0L
                mimeType = resp.header("Content-Type") ?: "video/mp4"
            }
            resp.close()
        } catch (ignored: Exception) {}

        val isAudio = mimeType.startsWith("audio/") || url.contains(".mp3") || url.contains(".m4a") || url.contains(".wav")
        val cleanName = url.substringAfterLast("/").substringBefore("?").replace("%20", " ")
        if (cleanName.isNotBlank() && cleanName.contains(".")) {
            cleanTitle = cleanName.substringBeforeLast(".")
        }

        val videoOpts = mutableListOf<MediaOption>()
        val audioOpts = mutableListOf<MediaOption>()

        if (!isAudio) {
            videoOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "1080p Full HD",
                    quality = "High Definition",
                    estimatedSizeBytes = if (realSize > 0) realSize else 45 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )
            videoOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "720p HD",
                    quality = "Standard HD",
                    estimatedSizeBytes = if (realSize > 0) (realSize * 0.65).toLong() else 25 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )
            videoOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "480p SD",
                    quality = "Standard Definition",
                    estimatedSizeBytes = if (realSize > 0) (realSize * 0.4).toLong() else 14 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )
            videoOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "360p Low",
                    quality = "Data Saver",
                    estimatedSizeBytes = if (realSize > 0) (realSize * 0.25).toLong() else 8 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )

            audioOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "M4A",
                    quality = "256 kbps (AAC)",
                    estimatedSizeBytes = if (realSize > 0) (realSize * 0.15).toLong() else 5 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = false,
                    bitrate = 256,
                    mimeType = "audio/mp4"
                )
            )
            audioOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "MP3",
                    quality = "192 kbps (MP3)",
                    estimatedSizeBytes = if (realSize > 0) (realSize * 0.12).toLong() else 4 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = false,
                    bitrate = 192,
                    mimeType = "audio/mpeg"
                )
            )
        } else {
            audioOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "MP3",
                    quality = "High Quality (320 kbps)",
                    estimatedSizeBytes = if (realSize > 0) realSize else 8 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = true,
                    bitrate = 320,
                    mimeType = "audio/mpeg"
                )
            )
            audioOpts.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "M4A",
                    quality = "Standard (192 kbps)",
                    estimatedSizeBytes = if (realSize > 0) (realSize * 0.7).toLong() else 5 * 1024 * 1024L,
                    downloadUrl = url,
                    isDirectStream = false,
                    bitrate = 192,
                    mimeType = "audio/mp4"
                )
            )
        }

        MediaAnalysisResult(
            originalUrl = url,
            title = cleanTitle,
            sourceDomain = domain,
            sourceName = "Public Media Archive",
            thumbnail = null,
            durationSeconds = 180L,
            isSupported = true,
            videoOptions = videoOpts,
            audioOptions = audioOpts,
            directDownloadUrl = url,
            isDirectFile = true,
            directFileSize = realSize,
            directFileName = cleanName
        )
    }
}
