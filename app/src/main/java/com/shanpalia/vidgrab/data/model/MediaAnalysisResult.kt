package com.shanpalia.vidgrab.data.model

data class MediaAnalysisResult(
    val originalUrl: String,
    val title: String,
    val sourceDomain: String,
    val sourceName: String,
    val thumbnail: String? = null,
    val durationSeconds: Long = 0L,
    val isSupported: Boolean = true,
    val unsupportedReason: String? = null,
    val videoOptions: List<MediaOption> = emptyList(),
    val audioOptions: List<MediaOption> = emptyList(),
    val directDownloadUrl: String? = null,
    val isDirectFile: Boolean = false,
    val directFileSize: Long = 0L,
    val directFileName: String? = null
)
