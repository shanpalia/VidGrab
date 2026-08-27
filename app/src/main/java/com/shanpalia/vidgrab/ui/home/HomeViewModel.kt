package com.shanpalia.vidgrab.ui.home

import android.app.Application
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shanpalia.vidgrab.VidGrabApplication
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.data.model.MediaOption
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface AnalysisUiState {
    data object Idle : AnalysisUiState
    data class Analyzing(val statusMessage: String) : AnalysisUiState
    data class Success(val result: MediaAnalysisResult) : AnalysisUiState
    data class Error(val message: String) : AnalysisUiState
}

class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val app = getApplication<VidGrabApplication>()
    private val mediaRepository = app.mediaRepository

    private val _urlInput = MutableStateFlow("")
    val urlInput: StateFlow<String> = _urlInput.asStateFlow()

    private val _analysisState = MutableStateFlow<AnalysisUiState>(AnalysisUiState.Idle)
    val analysisState: StateFlow<AnalysisUiState> = _analysisState.asStateFlow()

    private val _clipboardDetectedUrl = MutableStateFlow<String?>(null)
    val clipboardDetectedUrl: StateFlow<String?> = _clipboardDetectedUrl.asStateFlow()

    val recentDownloads: StateFlow<List<DownloadItem>> = mediaRepository.allDownloads
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val activeDownloadsCount: StateFlow<Int> = app.downloadEngine.activeDownloadsCount

    private val _usedStorageBytes = MutableStateFlow(0L)
    val usedStorageBytes: StateFlow<Long> = _usedStorageBytes.asStateFlow()

    private val _freeStorageBytes = MutableStateFlow(0L)
    val freeStorageBytes: StateFlow<Long> = _freeStorageBytes.asStateFlow()

    init {
        refreshStorageInfo()
    }

    fun onUrlChanged(newUrl: String) {
        _urlInput.value = newUrl
        if (_analysisState.value is AnalysisUiState.Error) {
            _analysisState.value = AnalysisUiState.Idle
        }
    }

    fun clearUrl() {
        _urlInput.value = ""
        _analysisState.value = AnalysisUiState.Idle
    }

    fun isValidUrl(url: String): Boolean {
        val trimmed = url.trim()
        if (trimmed.isBlank()) return false
        val formatted = if (!trimmed.startsWith("http://", ignoreCase = true) && !trimmed.startsWith("https://", ignoreCase = true)) {
            "https://$trimmed"
        } else {
            trimmed
        }
        return try {
            val uri = java.net.URI(formatted)
            val scheme = uri.scheme?.lowercase()
            (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank() && (uri.host!!.contains(".") || uri.host == "localhost")
        } catch (_: Exception) {
            false
        }
    }

    fun onPasteFromClipboard(pastedText: String?) {
        val text = pastedText?.trim()
        if (text.isNullOrBlank()) {
            _analysisState.value = AnalysisUiState.Error("Clipboard is empty.")
            return
        }
        _urlInput.value = text
        _clipboardDetectedUrl.value = null
        if (_analysisState.value is AnalysisUiState.Error) {
            _analysisState.value = AnalysisUiState.Idle
        }
    }

    fun onPasteAndAnalyze(pastedText: String?) {
        val text = pastedText?.trim()
        if (text.isNullOrBlank()) {
            _analysisState.value = AnalysisUiState.Error("Clipboard is empty.")
            return
        }

        _urlInput.value = text
        _clipboardDetectedUrl.value = null

        if (!isValidUrl(text)) {
            _analysisState.value = AnalysisUiState.Error("Please copy a valid URL first.")
            return
        }

        analyzeUrl(text)
    }

    fun pasteFromClipboard() {
        val clipboard = app.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        if (clipboard != null && clipboard.hasPrimaryClip()) {
            val clipData = clipboard.primaryClip
            if (clipData != null && clipData.itemCount > 0) {
                val item = clipData.getItemAt(0)
                val text = item.coerceToText(app).toString().trim().ifBlank { item.uri?.toString()?.trim().orEmpty() }
                onPasteFromClipboard(text)
            } else {
                _analysisState.value = AnalysisUiState.Error("Clipboard is empty.")
            }
        } else {
            _analysisState.value = AnalysisUiState.Error("Clipboard is empty.")
        }
    }

    fun checkClipboardOnResume() {
        val clipboard = app.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        if (clipboard != null && clipboard.hasPrimaryClip()) {
            val desc = clipboard.primaryClipDescription
            if (desc != null && (desc.hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN) || desc.hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML))) {
                val clipData = clipboard.primaryClip
                if (clipData != null && clipData.itemCount > 0) {
                    val item = clipData.getItemAt(0)
                    val text = item.coerceToText(app).toString().trim().ifBlank { item.uri?.toString()?.trim().orEmpty() }
                    if ((text.startsWith("http://", ignoreCase = true) || text.startsWith("https://", ignoreCase = true)) && text != _urlInput.value) {
                        _clipboardDetectedUrl.value = text
                    }
                }
            }
        }
    }

    fun dismissClipboardBanner() {
        _clipboardDetectedUrl.value = null
    }

    fun analyzeUrl(urlToAnalyze: String = _urlInput.value) {
        val trimmed = urlToAnalyze.trim()
        if (trimmed.isBlank()) {
            _analysisState.value = AnalysisUiState.Error("Please enter a URL.")
            return
        }

        if (!isValidUrl(trimmed)) {
            _analysisState.value = AnalysisUiState.Error("Please enter a valid URL.")
            return
        }

        val finalUrl = if (!trimmed.startsWith("http://", ignoreCase = true) && !trimmed.startsWith("https://", ignoreCase = true)) {
            "https://$trimmed"
        } else {
            trimmed
        }

        viewModelScope.launch {
            _analysisState.value = AnalysisUiState.Analyzing("Checking link...")
            try {
                val result = mediaRepository.analyzeUrl(finalUrl) { status ->
                    _analysisState.value = AnalysisUiState.Analyzing(status)
                }

                if (result.isSupported) {
                    _analysisState.value = AnalysisUiState.Success(result)
                } else {
                    _analysisState.value = AnalysisUiState.Error(
                        result.unsupportedReason ?: "This source isn't supported for downloading by VidGrab."
                    )
                }
            } catch (e: Exception) {
                _analysisState.value = AnalysisUiState.Error(
                    e.localizedMessage ?: "Could not analyze link. Check your connection."
                )
            }
        }
    }

    fun startDownload(option: MediaOption, analysisResult: MediaAnalysisResult) {
        mediaRepository.startDownload(
            url = option.downloadUrl,
            title = analysisResult.title,
            mediaType = option.mediaType,
            format = option.format,
            resolution = option.resolution,
            quality = option.quality,
            thumbnail = analysisResult.thumbnail,
            expectedSizeBytes = option.estimatedSizeBytes,
            isAudioExtractionRequired = !option.isDirectStream && option.mediaType == "audio",
            customBitrateKbps = option.bitrate ?: 192
        )
        _analysisState.value = AnalysisUiState.Idle
        _urlInput.value = ""
        refreshStorageInfo()
    }

    fun refreshStorageInfo() {
        _usedStorageBytes.value = FileUtils.getUsedStorageBytes(app)
        _freeStorageBytes.value = FileUtils.getFreeSpaceBytes(app)
    }

    fun dismissAnalysis() {
        _analysisState.value = AnalysisUiState.Idle
    }
}
