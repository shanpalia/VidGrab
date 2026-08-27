package com.shanpalia.vidgrab.ui.downloads

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shanpalia.vidgrab.VidGrabApplication
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class DownloadTab { ALL, VIDEOS, AUDIO }
enum class SortOption { NEWEST, OLDEST, LARGEST, SMALLEST, NAME }

class DownloadsViewModel(application: Application) : AndroidViewModel(application) {

    private val app = getApplication<VidGrabApplication>()
    private val mediaRepository = app.mediaRepository

    private val _selectedTab = MutableStateFlow(DownloadTab.ALL)
    val selectedTab: StateFlow<DownloadTab> = _selectedTab.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _sortOption = MutableStateFlow(SortOption.NEWEST)
    val sortOption: StateFlow<SortOption> = _sortOption.asStateFlow()

    val activeDownloads: StateFlow<List<DownloadItem>> = mediaRepository.activeDownloads
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val completedDownloads: StateFlow<List<DownloadItem>> = combine(
        mediaRepository.completedDownloads,
        _selectedTab,
        _searchQuery,
        _sortOption
    ) { all, tab, query, sort ->
        var list = all

        // Filter by tab
        list = when (tab) {
            DownloadTab.ALL -> list
            DownloadTab.VIDEOS -> list.filter { it.mediaType.equals("video", ignoreCase = true) }
            DownloadTab.AUDIO -> list.filter { it.mediaType.equals("audio", ignoreCase = true) }
        }

        // Search query
        if (query.isNotBlank()) {
            val q = query.trim().lowercase()
            list = list.filter { it.title.lowercase().contains(q) || it.format.lowercase().contains(q) }
        }

        // Sort
        when (sort) {
            SortOption.NEWEST -> list.sortedByDescending { it.completedAt ?: it.createdAt }
            SortOption.OLDEST -> list.sortedBy { it.completedAt ?: it.createdAt }
            SortOption.LARGEST -> list.sortedByDescending { it.size }
            SortOption.SMALLEST -> list.sortedBy { it.size }
            SortOption.NAME -> list.sortedBy { it.title.lowercase() }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _usedStorageBytes = MutableStateFlow(0L)
    val usedStorageBytes: StateFlow<Long> = _usedStorageBytes.asStateFlow()

    private val _freeStorageBytes = MutableStateFlow(0L)
    val freeStorageBytes: StateFlow<Long> = _freeStorageBytes.asStateFlow()

    init {
        refreshStorageInfo()
    }

    fun selectTab(tab: DownloadTab) {
        _selectedTab.value = tab
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun setSortOption(sort: SortOption) {
        _sortOption.value = sort
    }

    fun pauseDownload(id: Long) = mediaRepository.pauseDownload(id)

    fun resumeDownload(id: Long) = mediaRepository.resumeDownload(id)

    fun cancelDownload(id: Long) = mediaRepository.cancelDownload(id)

    fun deleteDownload(item: DownloadItem) {
        viewModelScope.launch {
            mediaRepository.deleteDownload(item)
            refreshStorageInfo()
        }
    }

    fun renameDownload(item: DownloadItem, newTitle: String) {
        viewModelScope.launch {
            mediaRepository.renameDownload(item, newTitle)
        }
    }

    fun clearCompleted() {
        viewModelScope.launch {
            mediaRepository.clearCompletedDownloads()
            refreshStorageInfo()
        }
    }

    fun refreshStorageInfo() {
        _usedStorageBytes.value = FileUtils.getUsedStorageBytes(app)
        _freeStorageBytes.value = FileUtils.getFreeSpaceBytes(app)
    }
}
