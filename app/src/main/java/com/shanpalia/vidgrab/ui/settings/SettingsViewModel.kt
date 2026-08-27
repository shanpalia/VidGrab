package com.shanpalia.vidgrab.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shanpalia.vidgrab.VidGrabApplication
import com.shanpalia.vidgrab.data.repository.SettingsRepository
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    private val app = getApplication<VidGrabApplication>()
    private val settingsRepository = app.settingsRepository

    val themeMode: StateFlow<String> = settingsRepository.observeThemeMode()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "light")

    val defaultAudioFormat: StateFlow<String> = settingsRepository.observeDefaultAudioFormat()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "M4A")

    val defaultAudioQuality: StateFlow<String> = settingsRepository.observeDefaultQuality()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "192 kbps")

    val notificationsEnabled: StateFlow<Boolean> = settingsRepository.observeNotificationsEnabled()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val maxDownloads: StateFlow<Int> = settingsRepository.observeMaxDownloads()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 3)

    private val _usedStorageBytes = MutableStateFlow(0L)
    val usedStorageBytes: StateFlow<Long> = _usedStorageBytes.asStateFlow()

    private val _cacheBytes = MutableStateFlow(0L)
    val cacheBytes: StateFlow<Long> = _cacheBytes.asStateFlow()

    init {
        refreshStorageInfo()
    }

    fun setThemeMode(mode: String) {
        viewModelScope.launch {
            settingsRepository.setThemeMode(mode)
        }
    }

    fun setDefaultAudioFormat(format: String) {
        viewModelScope.launch {
            settingsRepository.setDefaultAudioFormat(format)
        }
    }

    fun setDefaultAudioQuality(quality: String) {
        viewModelScope.launch {
            settingsRepository.setDefaultQuality(quality)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            settingsRepository.setNotificationsEnabled(enabled)
        }
    }

    fun setMaxDownloads(count: Int) {
        viewModelScope.launch {
            settingsRepository.setMaxDownloads(count)
        }
    }

    fun clearCache() {
        viewModelScope.launch {
            app.cacheDir.deleteRecursively()
            app.cacheDir.mkdirs()
            refreshStorageInfo()
        }
    }

    fun refreshStorageInfo() {
        _usedStorageBytes.value = FileUtils.getUsedStorageBytes(app)
        var cSize = 0L
        app.cacheDir.listFiles()?.forEach { if (it.isFile) cSize += it.length() }
        _cacheBytes.value = cSize
    }
}
