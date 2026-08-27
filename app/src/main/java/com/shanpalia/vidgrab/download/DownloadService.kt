package com.shanpalia.vidgrab.download

import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.shanpalia.vidgrab.VidGrabApplication

class DownloadService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val notification = NotificationCompat.Builder(this, DownloadNotificationHelper.CHANNEL_ID_DOWNLOADS)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("VidGrab")
            .setContentText("VidGrab background download service active")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        startForeground(DownloadNotificationHelper.NOTIFICATION_ID_FOREGROUND, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        val downloadId = intent?.getLongExtra(EXTRA_DOWNLOAD_ID, -1L) ?: -1L

        val app = application as? VidGrabApplication
        val downloadEngine = app?.downloadEngine

        if (downloadEngine != null && downloadId > 0) {
            when (action) {
                ACTION_PAUSE -> downloadEngine.pauseDownload(downloadId)
                ACTION_RESUME -> downloadEngine.resumeDownload(downloadId)
                ACTION_CANCEL -> downloadEngine.cancelDownload(downloadId)
            }
        }

        return START_NOT_STICKY
    }

    companion object {
        const val EXTRA_DOWNLOAD_ID = "extra_download_id"
        const val ACTION_PAUSE = "com.shanpalia.vidgrab.vidgrab.PAUSE"
        const val ACTION_RESUME = "com.shanpalia.vidgrab.vidgrab.RESUME"
        const val ACTION_CANCEL = "com.shanpalia.vidgrab.vidgrab.CANCEL"
    }
}
