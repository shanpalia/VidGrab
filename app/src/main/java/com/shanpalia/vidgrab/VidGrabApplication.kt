package com.shanpalia.vidgrab

import android.app.Application
import com.shanpalia.vidgrab.data.database.AppDatabase
import com.shanpalia.vidgrab.data.repository.MediaRepository
import com.shanpalia.vidgrab.data.repository.SettingsRepository
import com.shanpalia.vidgrab.download.DownloadEngine
import com.shanpalia.vidgrab.download.DownloadNotificationHelper
import com.shanpalia.vidgrab.media.MediaPlaybackController
import com.shanpalia.vidgrab.source.SourceDetector

class VidGrabApplication : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var downloadEngine: DownloadEngine
        private set

    lateinit var mediaRepository: MediaRepository
        private set

    lateinit var settingsRepository: SettingsRepository
        private set

    lateinit var mediaPlaybackController: MediaPlaybackController
        private set

    lateinit var notificationHelper: DownloadNotificationHelper
        private set

    override fun onCreate() {
        super.onCreate()

        database = AppDatabase.getInstance(this)
        val okHttpClient = SourceDetector.createDefaultHttpClient()
        val sourceDetector = SourceDetector(okHttpClient)
        notificationHelper = DownloadNotificationHelper(this)

        downloadEngine = DownloadEngine(
            context = this,
            database = database,
            okHttpClient = okHttpClient,
            notificationHelper = notificationHelper
        )

        mediaRepository = MediaRepository(
            database = database,
            sourceDetector = sourceDetector,
            downloadEngine = downloadEngine
        )

        settingsRepository = SettingsRepository(database)
        mediaPlaybackController = MediaPlaybackController(this)
    }
}
