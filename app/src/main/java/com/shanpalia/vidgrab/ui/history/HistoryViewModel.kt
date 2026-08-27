package com.shanpalia.vidgrab.ui.history

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shanpalia.vidgrab.VidGrabApplication
import com.shanpalia.vidgrab.data.model.HistoryItem
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HistoryViewModel(application: Application) : AndroidViewModel(application) {

    private val app = getApplication<VidGrabApplication>()
    private val mediaRepository = app.mediaRepository

    val historyItems: StateFlow<List<HistoryItem>> = mediaRepository.historyItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun deleteHistoryItem(item: HistoryItem) {
        viewModelScope.launch {
            mediaRepository.deleteHistory(item)
        }
    }

    fun clearAllHistory() {
        viewModelScope.launch {
            mediaRepository.clearAllHistory()
        }
    }
}
