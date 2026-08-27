package com.shanpalia.vidgrab.data.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.DownloadStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadDao {
    @Query("SELECT * FROM download_items ORDER BY createdAt DESC")
    fun getAllDownloads(): Flow<List<DownloadItem>>

    @Query("SELECT * FROM download_items WHERE mediaType = :type ORDER BY createdAt DESC")
    fun getDownloadsByType(type: String): Flow<List<DownloadItem>>

    @Query("SELECT * FROM download_items WHERE status = 'COMPLETED' ORDER BY completedAt DESC, createdAt DESC")
    fun getCompletedDownloads(): Flow<List<DownloadItem>>

    @Query("SELECT * FROM download_items WHERE status = 'COMPLETED' AND mediaType = 'audio' ORDER BY completedAt DESC, createdAt DESC")
    fun getAudioLibrary(): Flow<List<DownloadItem>>

    @Query("SELECT * FROM download_items WHERE status = 'COMPLETED' AND mediaType = 'video' ORDER BY completedAt DESC, createdAt DESC")
    fun getVideoLibrary(): Flow<List<DownloadItem>>

    @Query("SELECT * FROM download_items WHERE status IN ('WAITING', 'STARTING', 'DOWNLOADING', 'PAUSED', 'PROCESSING') ORDER BY createdAt DESC")
    fun getActiveDownloads(): Flow<List<DownloadItem>>

    @Query("SELECT * FROM download_items WHERE id = :id")
    suspend fun getDownloadById(id: Long): DownloadItem?

    @Query("SELECT * FROM download_items WHERE id = :id")
    fun observeDownloadById(id: Long): Flow<DownloadItem?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDownload(item: DownloadItem): Long

    @Update
    suspend fun updateDownload(item: DownloadItem)

    @Query("UPDATE download_items SET status = :status, progress = :progress, downloadedBytes = :downloadedBytes, downloadSpeed = :speed, etaSeconds = :eta WHERE id = :id")
    suspend fun updateProgress(id: Long, status: DownloadStatus, progress: Float, downloadedBytes: Long, speed: Long, eta: Long)

    @Query("UPDATE download_items SET status = 'COMPLETED', progress = 1.0, completedAt = :completedAt, filePath = :filePath, size = :finalSize WHERE id = :id")
    suspend fun markCompleted(id: Long, completedAt: Long, filePath: String, finalSize: Long)

    @Query("UPDATE download_items SET status = 'FAILED', errorMessage = :error WHERE id = :id")
    suspend fun markFailed(id: Long, error: String)

    @Query("UPDATE download_items SET status = 'CANCELLED' WHERE id = :id")
    suspend fun markCancelled(id: Long)

    @Query("UPDATE download_items SET status = 'PAUSED' WHERE id = :id")
    suspend fun markPaused(id: Long)

    @Query("UPDATE download_items SET title = :newTitle, filePath = :newPath WHERE id = :id")
    suspend fun updateTitleAndPath(id: Long, newTitle: String, newPath: String)

    @Delete
    suspend fun deleteDownload(item: DownloadItem)

    @Query("DELETE FROM download_items WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM download_items WHERE status = 'COMPLETED'")
    suspend fun clearCompleted()
}
