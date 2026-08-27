package com.shanpalia.vidgrab.source.adapters

import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.source.SourceAdapter

class UnsupportedSourceAdapter : SourceAdapter {
    override val name: String = "Restricted Source Adapter"

    // Restricted / DRM / Paywalled / Private-account gated domains that require bypassing technical restrictions
    private val restrictedDomains = listOf(
        "netflix.com",
        "primevideo.com",
        "disneyplus.com",
        "hulu.com",
        "hbomax.com",
        "max.com",
        "apple.com/apple-tv-plus",
        "spotify.com",
        "deezer.com",
        "tidal.com",
        "onlyfans.com",
        "patreon.com"
    )

    override fun canHandle(url: String, domain: String): Boolean {
        val lowerDomain = domain.lowercase()
        return restrictedDomains.any { lowerDomain.contains(it) }
    }

    override suspend fun analyze(url: String, domain: String): MediaAnalysisResult {
        return MediaAnalysisResult(
            originalUrl = url,
            title = "Protected / Restricted Source",
            sourceDomain = domain,
            sourceName = "Restricted Media",
            isSupported = false,
            unsupportedReason = "This source isn't supported for downloading by VidGrab."
        )
    }
}
