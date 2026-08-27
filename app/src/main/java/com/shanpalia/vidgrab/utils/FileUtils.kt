package com.shanpalia.vidgrab.utils

import android.content.Context
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import java.io.File
import java.text.DecimalFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FileUtils {

    fun getAppVideosDirectory(context: Context): File {
        val dir = File(context.getExternalFilesDir(Environment.DIRECTORY_MOVIES), "VidGrab")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    fun getAppAudioDirectory(context: Context): File {
        val dir = File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "VidGrab")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    fun getTargetFile(context: Context, fileName: String, mediaType: String): File {
        val baseDir = if (mediaType.equals("audio", ignoreCase = true)) {
            getAppAudioDirectory(context)
        } else {
            getAppVideosDirectory(context)
        }
        
        val sanitized = sanitizeFileName(fileName)
        var file = File(baseDir, sanitized)
        
        if (!file.exists()) return file

        val nameWithoutExt = file.nameWithoutExtension
        val ext = file.extension
        var counter = 1
        while (file.exists()) {
            val candidate = if (ext.isNotEmpty()) "$nameWithoutExt ($counter).$ext" else "$nameWithoutExt ($counter)"
            file = File(baseDir, candidate)
            counter++
        }
        return file
    }

    fun sanitizeFileName(name: String): String {
        val clean = name.replace(Regex("[\\\\/:*?\"<>|]"), "_")
            .trim()
            .take(120)
        return if (clean.isBlank()) "VidGrab_Media_${System.currentTimeMillis()}" else clean
    }

    fun formatFileSize(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        val units = arrayOf("B", "KB", "MB", "GB", "TB")
        val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
        val format = DecimalFormat("#,##0.#")
        val clampedGroup = digitGroups.coerceIn(0, units.size - 1)
        return "${format.format(bytes / Math.pow(1024.0, clampedGroup.toDouble()))} ${units[clampedGroup]}"
    }

    fun formatSpeed(bytesPerSecond: Long): String {
        if (bytesPerSecond <= 0) return "0 KB/s"
        return "${formatFileSize(bytesPerSecond)}/s"
    }

    fun formatDuration(seconds: Long): String {
        if (seconds <= 0) return "--:--"
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        return if (hours > 0) {
            String.format(Locale.getDefault(), "%d:%02d:%02d", hours, minutes, secs)
        } else {
            String.format(Locale.getDefault(), "%02d:%02d", minutes, secs)
        }
    }

    fun formatEta(seconds: Long): String {
        if (seconds <= 0) return "Estimating..."
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        return if (hours > 0) {
            "${hours}h ${minutes}m left"
        } else if (minutes > 0) {
            "${minutes}m ${secs}s left"
        } else {
            "${secs}s left"
        }
    }

    fun formatDate(timestamp: Long): String {
        if (timestamp <= 0) return ""
        val sdf = SimpleDateFormat("MMM d, yyyy · HH:mm", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }

    fun getMimeTypeFromExtension(extension: String): String {
        return when (extension.lowercase()) {
            "mp4" -> "video/mp4"
            "webm" -> "video/webm"
            "mkv" -> "video/x-matroska"
            "3gp" -> "video/3gpp"
            "m4a" -> "audio/mp4"
            "mp3" -> "audio/mpeg"
            "wav" -> "audio/wav"
            "ogg" -> "audio/ogg"
            "aac" -> "audio/aac"
            "flac" -> "audio/flac"
            else -> "application/octet-stream"
        }
    }

    fun getUriForFile(context: Context, file: File): Uri {
        return FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
    }

    fun getUsedStorageBytes(context: Context): Long {
        var total = 0L
        val videoDir = getAppVideosDirectory(context)
        val audioDir = getAppAudioDirectory(context)
        
        videoDir.listFiles()?.forEach { if (it.isFile) total += it.length() }
        audioDir.listFiles()?.forEach { if (it.isFile) total += it.length() }
        return total
    }

    fun getFreeSpaceBytes(context: Context): Long {
        val dir = context.getExternalFilesDir(null) ?: context.filesDir
        return dir.freeSpace
    }
}
