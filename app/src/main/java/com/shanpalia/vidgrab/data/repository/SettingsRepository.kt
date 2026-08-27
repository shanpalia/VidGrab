package com.shanpalia.vidgrab.data.repository

import com.shanpalia.vidgrab.data.database.AppDatabase
import com.shanpalia.vidgrab.data.model.AppSetting
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class SettingsRepository(private val database: AppDatabase) {

    fun observeThemeMode(): Flow<String> {
        return database.settingDao().observeSetting(KEY_THEME_MODE).map { it ?: "light" }
    }

    suspend fun setThemeMode(mode: String) {
        database.settingDao().saveSetting(AppSetting(KEY_THEME_MODE, mode))
    }

    fun observeDefaultAudioFormat(): Flow<String> {
        return database.settingDao().observeSetting(KEY_AUDIO_FORMAT).map { it ?: "M4A" }
    }

    suspend fun setDefaultAudioFormat(format: String) {
        database.settingDao().saveSetting(AppSetting(KEY_AUDIO_FORMAT, format))
    }

    fun observeDefaultQuality(): Flow<String> {
        return database.settingDao().observeSetting(KEY_AUDIO_QUALITY).map { it ?: "192 kbps" }
    }

    suspend fun setDefaultQuality(quality: String) {
        database.settingDao().saveSetting(AppSetting(KEY_AUDIO_QUALITY, quality))
    }

    fun observeNotificationsEnabled(): Flow<Boolean> {
        return database.settingDao().observeSetting(KEY_NOTIFICATIONS_ENABLED).map { it?.toBooleanStrictOrNull() ?: true }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        database.settingDao().saveSetting(AppSetting(KEY_NOTIFICATIONS_ENABLED, enabled.toString()))
    }

    fun observeMaxDownloads(): Flow<Int> {
        return database.settingDao().observeSetting(KEY_MAX_DOWNLOADS).map { it?.toIntOrNull() ?: 3 }
    }

    suspend fun setMaxDownloads(count: Int) {
        database.settingDao().saveSetting(AppSetting(KEY_MAX_DOWNLOADS, count.toString()))
    }

    companion object {
        const val KEY_THEME_MODE = "theme_mode" // "system", "dark", "light"
        const val KEY_AUDIO_FORMAT = "default_audio_format" // "M4A", "MP3", "WAV"
        const val KEY_AUDIO_QUALITY = "default_audio_quality" // "128 kbps", "192 kbps", "256 kbps", "320 kbps"
        const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
        const val KEY_MAX_DOWNLOADS = "max_downloads"
    }
}
