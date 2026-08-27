package com.shanpalia.vidgrab.download

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.shanpalia.vidgrab.MainActivity
import com.shanpalia.vidgrab.utils.FileUtils
import com.shanpalia.vidgrab.utils.ShareUtils
import java.io.File

class DownloadNotificationHelper(private val context: Context) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_DOWNLOADS,
                "VidGrab Downloads",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active and completed media downloads"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showProgressNotification(
        downloadId: Long,
        title: String,
        progressPercent: Int,
        speedStr: String,
        etaStr: String
    ) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("navigate_to", "downloads")
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            downloadId.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID_DOWNLOADS)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("VidGrab")
            .setContentText("Downloading $title... $progressPercent%")
            .setSubText("$speedStr · $etaStr")
            .setProgress(100, progressPercent.coerceIn(0, 100), progressPercent < 0)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)

        notificationManager.notify(downloadId.toInt(), builder.build())
    }

    fun showCompleteNotification(downloadId: Long, title: String, filePath: String) {
        val file = File(filePath)
        val viewIntent = if (file.exists()) {
            val uri = FileUtils.getUriForFile(context, file)
            val mime = FileUtils.getMimeTypeFromExtension(file.extension)
            Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mime)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        } else {
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("navigate_to", "downloads")
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            (downloadId + 10000).toInt(),
            viewIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID_DOWNLOADS)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle("VidGrab")
            .setContentText("Download complete: $title")
            .setAutoCancel(true)
            .setOngoing(false)
            .setContentIntent(pendingIntent)

        notificationManager.notify(downloadId.toInt(), builder.build())
    }

    fun showFailedNotification(downloadId: Long, title: String, errorReason: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("navigate_to", "downloads")
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            (downloadId + 20000).toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID_DOWNLOADS)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("VidGrab - Download failed")
            .setContentText("$title: $errorReason")
            .setAutoCancel(true)
            .setOngoing(false)
            .setContentIntent(pendingIntent)

        notificationManager.notify(downloadId.toInt(), builder.build())
    }

    fun cancelNotification(downloadId: Long) {
        notificationManager.cancel(downloadId.toInt())
    }

    companion object {
        const val CHANNEL_ID_DOWNLOADS = "vidgrab_downloads_channel"
        const val NOTIFICATION_ID_FOREGROUND = 9999
    }
}
