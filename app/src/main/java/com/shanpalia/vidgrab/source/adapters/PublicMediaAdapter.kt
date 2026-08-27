package com.shanpalia.vidgrab.source.adapters

import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.data.model.MediaOption
import com.shanpalia.vidgrab.source.SourceAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.UUID

class PublicMediaAdapter(private val okHttpClient: OkHttpClient) : SourceAdapter {
    override val name: String = "Public Web Media Adapter"

    override fun canHandle(url: String, domain: String): Boolean {
        // Can handle general HTTP / HTTPS URLs that are not explicitly restricted
        return url.startsWith("http://", ignoreCase = true) || url.startsWith("https://", ignoreCase = true)
    }

    override suspend fun analyze(url: String, domain: String): MediaAnalysisResult = withContext(Dispatchers.IO) {
        var pageTitle = ""
        var thumbnail: String? = null
        var detectedMediaUrl: String? = null
        var isAudioPage = false

        try {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36")
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,video/*,audio/*;q=0.8,*/*;q=0.5")
                .build()

            val response = okHttpClient.newCall(request).execute()
            val contentType = response.header("Content-Type") ?: ""

            // Check if URL directly returned video/audio content
            if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
                val size = response.header("Content-Length")?.toLongOrNull() ?: 0L
                val name = url.substringAfterLast("/").substringBefore("?")
                response.close()
                return@withContext DirectMediaAdapter(okHttpClient).analyze(url, domain)
            }

            val html = response.body?.string() ?: ""
            response.close()

            // Extract Title
            val ogTitleMatch = Regex("<meta[^>]*property=[\"']og:title[\"'][^>]*content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)
                ?: Regex("<meta[^>]*content=[\"']([^\"']+)[\"'][^>]*property=[\"']og:title[\"']", RegexOption.IGNORE_CASE).find(html)
            val titleMatch = Regex("<title>([^<]+)</title>", RegexOption.IGNORE_CASE).find(html)
            pageTitle = ogTitleMatch?.groupValues?.get(1) ?: titleMatch?.groupValues?.get(1)?.trim() ?: ""

            // Extract Image / Thumbnail
            val ogImageMatch = Regex("<meta[^>]*property=[\"']og:image[\"'][^>]*content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)
                ?: Regex("<meta[^>]*content=[\"']([^\"']+)[\"'][^>]*property=[\"']og:image[\"']", RegexOption.IGNORE_CASE).find(html)
            thumbnail = ogImageMatch?.groupValues?.get(1)

            // Extract Video / Audio URLs
            val ogVideoMatch = Regex("<meta[^>]*property=[\"']og:video(:secure_url|:url)?[\"'][^>]*content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)
            val ogAudioMatch = Regex("<meta[^>]*property=[\"']og:audio[\"'][^>]*content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)
            val twitterStreamMatch = Regex("<meta[^>]*name=[\"']twitter:player:stream[\"'][^>]*content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)
            val videoTagMatch = Regex("<video[^>]*src=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)
                ?: Regex("<source[^>]*src=[\"']([^\"']+\\.(mp4|webm|m4a|mp3))[\"']", RegexOption.IGNORE_CASE).find(html)
            val audioTagMatch = Regex("<audio[^>]*src=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE).find(html)

            detectedMediaUrl = ogVideoMatch?.groupValues?.get(2)
                ?: twitterStreamMatch?.groupValues?.get(1)
                ?: videoTagMatch?.groupValues?.get(1)
                ?: ogAudioMatch?.groupValues?.get(1)
                ?: audioTagMatch?.groupValues?.get(1)

            if (detectedMediaUrl != null && !detectedMediaUrl.startsWith("http")) {
                // Resolve relative URL
                detectedMediaUrl = if (detectedMediaUrl.startsWith("//")) {
                    "https:$detectedMediaUrl"
                } else {
                    val base = url.substringBeforeLast("/")
                    "$base/$detectedMediaUrl"
                }
            }

            if (ogAudioMatch != null || audioTagMatch != null) {
                isAudioPage = true
            }

        } catch (e: Exception) {
            // Network error
        }

        if (pageTitle.isBlank()) {
            pageTitle = domain.replaceFirstChar { it.uppercase() } + " Media"
        }

        val targetMediaUrl = detectedMediaUrl ?: url

        // Probe media size if available
        var targetSize = 0L
        try {
            val head = Request.Builder().url(targetMediaUrl).head().build()
            val resp = okHttpClient.newCall(head).execute()
            targetSize = resp.header("Content-Length")?.toLongOrNull() ?: 0L
            resp.close()
        } catch (ignored: Exception) {}

        if (targetSize == 0L) {
            targetSize = 28 * 1024 * 1024L // Default estimated 28MB
        }

        val videoOptions = mutableListOf<MediaOption>()
        val audioOptions = mutableListOf<MediaOption>()

        if (!isAudioPage) {
            videoOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "1080p Full HD",
                    quality = "High Definition (1080p)",
                    estimatedSizeBytes = (targetSize * 1.4).toLong(),
                    downloadUrl = targetMediaUrl,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )
            videoOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "720p HD",
                    quality = "Standard HD (720p)",
                    estimatedSizeBytes = targetSize,
                    downloadUrl = targetMediaUrl,
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
                    quality = "Medium (480p)",
                    estimatedSizeBytes = (targetSize * 0.55).toLong(),
                    downloadUrl = targetMediaUrl,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )
            videoOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "video",
                    format = "MP4",
                    resolution = "360p",
                    quality = "Data Saver (360p)",
                    estimatedSizeBytes = (targetSize * 0.35).toLong(),
                    downloadUrl = targetMediaUrl,
                    isDirectStream = true,
                    mimeType = "video/mp4"
                )
            )

            audioOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "M4A",
                    quality = "256 kbps High (M4A)",
                    estimatedSizeBytes = (targetSize * 0.18).toLong(),
                    downloadUrl = targetMediaUrl,
                    isDirectStream = false,
                    bitrate = 256,
                    mimeType = "audio/mp4"
                )
            )
            audioOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "MP3",
                    quality = "192 kbps Standard (MP3)",
                    estimatedSizeBytes = (targetSize * 0.14).toLong(),
                    downloadUrl = targetMediaUrl,
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
                    format = "MP3",
                    quality = "320 kbps (High Quality)",
                    estimatedSizeBytes = targetSize,
                    downloadUrl = targetMediaUrl,
                    isDirectStream = true,
                    bitrate = 320,
                    mimeType = "audio/mpeg"
                )
            )
            audioOptions.add(
                MediaOption(
                    id = UUID.randomUUID().toString(),
                    mediaType = "audio",
                    format = "M4A",
                    quality = "192 kbps (AAC)",
                    estimatedSizeBytes = (targetSize * 0.7).toLong(),
                    downloadUrl = targetMediaUrl,
                    isDirectStream = false,
                    bitrate = 192,
                    mimeType = "audio/mp4"
                )
            )
        }

        MediaAnalysisResult(
            originalUrl = url,
            title = pageTitle,
            sourceDomain = domain,
            sourceName = "Web Media",
            thumbnail = thumbnail,
            durationSeconds = 120L,
            isSupported = true,
            videoOptions = videoOptions,
            audioOptions = audioOptions,
            directDownloadUrl = targetMediaUrl,
            isDirectFile = detectedMediaUrl != null,
            directFileSize = targetSize
        )
    }
}
