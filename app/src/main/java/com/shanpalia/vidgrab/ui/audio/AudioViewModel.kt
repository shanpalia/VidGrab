package com.shanpalia.vidgrab.ui.audio

import android.app.Application
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shanpalia.vidgrab.VidGrabApplication
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.media.AudioExtractor
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface ExtractionState {
    data object Idle : ExtractionState
    data class Selected(val uri: Uri, val name: String, val size: Long) : ExtractionState
    data class Processing(val progress: Float, val name: String) : ExtractionState
    data class Success(val item: DownloadItem) : ExtractionState
    data class Error(val message: String) : ExtractionState
}

class AudioViewModel(application: Application) : AndroidViewModel(application) {

    private val app = getApplication<VidGrabApplication>()
    private val mediaRepository = app.mediaRepository

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _extractionState = MutableStateFlow<ExtractionState>(ExtractionState.Idle)
    val extractionState: StateFlow<ExtractionState> = _extractionState.asStateFlow()

    val audioTracks: StateFlow<List<DownloadItem>> = combine(
        mediaRepository.audioLibrary,
        _searchQuery
    ) { tracks, query ->
        if (query.isBlank()) {
            tracks
        } else {
            val q = query.trim().lowercase()
            tracks.filter { it.title.lowercase().contains(q) || it.format.lowercase().contains(q) }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onVideoFileSelected(uri: Uri) {
        val context = app.applicationContext
        var fileName = "Video_${System.currentTimeMillis()}"
        var fileSize = 0L

        try {
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    val sizeIndex = it.getColumnIndex(OpenableColumns.SIZE)
                    if (nameIndex >= 0) fileName = it.getString(nameIndex) ?: fileName
                    if (sizeIndex >= 0) fileSize = it.getLong(sizeIndex)
                }
            }
        } catch (ignored: Exception) {}

        _extractionState.value = ExtractionState.Selected(uri, fileName, fileSize)
    }

    fun cancelSelection() {
        _extractionState.value = ExtractionState.Idle
    }

    fun startExtraction(
        uri: Uri,
        videoName: String,
        format: String, // "M4A", "MP3", "WAV"
        qualityKbps: Int
    ) {
        val baseName = videoName.substringBeforeLast(".")
        _extractionState.value = ExtractionState.Processing(0f, videoName)

        viewModelScope.launch {
            val result = AudioExtractor.extractAudio(
                context = app,
                inputUri = uri,
                outputFormat = format,
                outputQualityKbps = qualityKbps,
                customOutputName = baseName,
                onProgress = { prog ->
                    _extractionState.value = ExtractionState.Processing(prog, videoName)
                }
            )

            if (result.isSuccess) {
                val file = result.getOrThrow()
                val id = mediaRepository.saveExtractedAudioItem(
                    file = file,
                    title = baseName,
                    format = format,
                    quality = "$qualityKbps kbps"
                )
                val newItem = DownloadItem(
                    id = id,
                    url = "file://${file.absolutePath}",
                    title = baseName,
                    filePath = file.absolutePath,
                    mediaType = "audio",
                    format = format,
                    quality = "$qualityKbps kbps",
                    size = file.length(),
                    status = com.shanpalia.vidgrab.data.model.DownloadStatus.COMPLETED
                )
                _extractionState.value = ExtractionState.Success(newItem)
            } else {
                _extractionState.value = ExtractionState.Error(
                    result.exceptionOrNull()?.localizedMessage ?: "Audio extraction failed."
                )
            }
        }
    }

    fun resetExtractionState() {
        _extractionState.value = ExtractionState.Idle
    }

    fun deleteAudioTrack(item: DownloadItem) {
        viewModelScope.launch {
            mediaRepository.deleteDownload(item)
        }
    }

    fun renameAudioTrack(item: DownloadItem, newTitle: String) {
        viewModelScope.launch {
            mediaRepository.renameDownload(item, newTitle)
        }
    }
}
