package com.shanpalia.vidgrab.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "history_items")
data class HistoryItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val url: String,
    val title: String,
    val thumbnail: String? = null,
    val format: String,
    val mediaType: String = "video",
    val status: String, // "Completed", "Failed", "Cancelled"
    val createdAt: Long = System.currentTimeMillis()
)
