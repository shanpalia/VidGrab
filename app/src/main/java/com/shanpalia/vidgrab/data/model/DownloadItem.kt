package com.shanpalia.vidgrab.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "download_items")
data class DownloadItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val url: String,
    val title: String,
    val filePath: String,
    val thumbnail: String? = null,
    val mediaType: String, // "video" or "audio"
    val format: String,    // "MP4", "WEBM", "M4A", "MP3", "WAV"
    val resolution: String? = null, // "1080p", "720p", "480p", "360p"
    val quality: String? = null,    // "320 kbps", "192 kbps", etc.
    val size: Long = 0L,            // Total size in bytes
    val status: DownloadStatus = DownloadStatus.WAITING,
    val progress: Float = 0f,       // 0.0 to 1.0
    val downloadedBytes: Long = 0L,
    val downloadSpeed: Long = 0L,   // bytes per second
    val etaSeconds: Long = 0L,
    val createdAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null,
    val errorMessage: String? = null
)
