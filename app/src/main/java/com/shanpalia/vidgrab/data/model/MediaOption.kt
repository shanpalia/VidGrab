package com.shanpalia.vidgrab.data.model

data class MediaOption(
    val id: String,
    val mediaType: String,      // "video" or "audio"
    val format: String,         // "MP4", "WEBM", "M4A", "MP3", "WAV", "AAC"
    val resolution: String? = null, // "1080p", "720p", "480p", "360p"
    val quality: String? = null,    // "320 kbps", "192 kbps", "128 kbps", "HD", "High"
    val estimatedSizeBytes: Long = 0L,
    val downloadUrl: String,
    val isDirectStream: Boolean = true,
    val bitrate: Int? = null,
    val mimeType: String = "video/mp4"
)
