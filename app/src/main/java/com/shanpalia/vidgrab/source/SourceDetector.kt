package com.shanpalia.vidgrab.source

import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.source.adapters.DirectMediaAdapter
import com.shanpalia.vidgrab.source.adapters.OfficialApiAdapter
import com.shanpalia.vidgrab.source.adapters.PublicMediaAdapter
import com.shanpalia.vidgrab.source.adapters.UnsupportedSourceAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import java.net.URI
import java.util.concurrent.TimeUnit

class SourceDetector(private val okHttpClient: OkHttpClient) {

    private val adapters: List<SourceAdapter> = listOf(
        UnsupportedSourceAdapter(),
        DirectMediaAdapter(okHttpClient),
        OfficialApiAdapter(okHttpClient),
        PublicMediaAdapter(okHttpClient)
    )

    fun isValidUrl(url: String): Boolean {
        if (url.isBlank()) return false
        return try {
            val uri = URI(url.trim())
            val scheme = uri.scheme?.lowercase()
            (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank()
        } catch (e: Exception) {
            false
        }
    }

    fun extractDomain(url: String): String {
        return try {
            val uri = URI(url.trim())
            val host = uri.host ?: ""
            if (host.startsWith("www.")) host.substring(4) else host
        } catch (e: Exception) {
            "unknown"
        }
    }

    suspend fun analyze(
        url: String,
        onProgressState: (String) -> Unit = {}
    ): MediaAnalysisResult = withContext(Dispatchers.IO) {
        val trimmed = url.trim()
        if (!isValidUrl(trimmed)) {
            return@withContext MediaAnalysisResult(
                originalUrl = trimmed,
                title = "Invalid URL",
                sourceDomain = "Unknown",
                sourceName = "Unknown",
                isSupported = false,
                unsupportedReason = "Please enter a valid media URL."
            )
        }

        onProgressState("Checking link...")
        val domain = extractDomain(trimmed)

        onProgressState("Detecting source...")
        val matchingAdapter = adapters.firstOrNull { it.canHandle(trimmed, domain) }
            ?: adapters.last()

        onProgressState("Finding available media...")
        val result = matchingAdapter.analyze(trimmed, domain)

        onProgressState("Preparing options...")
        result
    }

    companion object {
        fun createDefaultHttpClient(): OkHttpClient {
            return OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .followRedirects(true)
                .followSslRedirects(true)
                .build()
        }
    }
}
