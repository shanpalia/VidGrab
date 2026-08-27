package com.shanpalia.vidgrab.media

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.shanpalia.vidgrab.data.model.DownloadItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File

class MediaPlaybackController(private val context: Context) {

    private val player: ExoPlayer by lazy {
        ExoPlayer.Builder(context).build().apply {
            addListener(playerListener)
        }
    }

    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private var progressJob: Job? = null

    private val _currentTrack = MutableStateFlow<DownloadItem?>(null)
    val currentTrack: StateFlow<DownloadItem?> = _currentTrack.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _currentPositionMs = MutableStateFlow(0L)
    val currentPositionMs: StateFlow<Long> = _currentPositionMs.asStateFlow()

    private val _durationMs = MutableStateFlow(0L)
    val durationMs: StateFlow<Long> = _durationMs.asStateFlow()

    private val _playbackSpeed = MutableStateFlow(1.0f)
    val playbackSpeed: StateFlow<Float> = _playbackSpeed.asStateFlow()

    private val _repeatMode = MutableStateFlow(Player.REPEAT_MODE_OFF)
    val repeatMode: StateFlow<Int> = _repeatMode.asStateFlow()

    private val _playlist = MutableStateFlow<List<DownloadItem>>(emptyList())
    val playlist: StateFlow<List<DownloadItem>> = _playlist.asStateFlow()

    private val playerListener = object : Player.Listener {
        override fun onIsPlayingChanged(playing: Boolean) {
            _isPlaying.value = playing
            if (playing) {
                startProgressTracker()
            } else {
                progressJob?.cancel()
            }
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            if (playbackState == Player.STATE_READY) {
                _durationMs.value = player.duration.coerceAtLeast(0L)
            } else if (playbackState == Player.STATE_ENDED) {
                _isPlaying.value = false
                _currentPositionMs.value = _durationMs.value
                playNextTrack()
            }
        }
    }

    fun playTrack(item: DownloadItem, playlistItems: List<DownloadItem> = emptyList()) {
        val file = File(item.filePath)
        if (!file.exists()) return

        _currentTrack.value = item
        if (playlistItems.isNotEmpty()) {
            _playlist.value = playlistItems
        } else if (_playlist.value.isEmpty() || !_playlist.value.contains(item)) {
            _playlist.value = listOf(item)
        }

        val mediaMetadata = MediaMetadata.Builder()
            .setTitle(item.title)
            .setArtist("VidGrab Audio")
            .build()

        val mediaItem = MediaItem.Builder()
            .setUri(Uri.fromFile(file))
            .setMediaMetadata(mediaMetadata)
            .build()

        player.setMediaItem(mediaItem)
        player.prepare()
        player.play()
    }

    fun togglePlayPause() {
        if (player.isPlaying) {
            player.pause()
        } else {
            if (player.playbackState == Player.STATE_ENDED) {
                player.seekTo(0)
            }
            player.play()
        }
    }

    fun seekTo(positionMs: Long) {
        player.seekTo(positionMs)
        _currentPositionMs.value = positionMs
    }

    fun setPlaybackSpeed(speed: Float) {
        _playbackSpeed.value = speed
        player.playbackParameters = PlaybackParameters(speed)
    }

    fun toggleRepeat() {
        val nextMode = when (_repeatMode.value) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ONE
            Player.REPEAT_MODE_ONE -> Player.REPEAT_MODE_ALL
            else -> Player.REPEAT_MODE_OFF
        }
        _repeatMode.value = nextMode
        player.repeatMode = nextMode
    }

    fun playNextTrack() {
        val current = _currentTrack.value ?: return
        val list = _playlist.value
        if (list.isEmpty()) return

        val currentIndex = list.indexOfFirst { it.id == current.id }
        if (currentIndex in 0 until list.size - 1) {
            playTrack(list[currentIndex + 1], list)
        } else if (_repeatMode.value == Player.REPEAT_MODE_ALL && list.isNotEmpty()) {
            playTrack(list.first(), list)
        }
    }

    fun playPreviousTrack() {
        val current = _currentTrack.value ?: return
        val list = _playlist.value
        if (list.isEmpty()) return

        val currentIndex = list.indexOfFirst { it.id == current.id }
        if (currentIndex > 0) {
            playTrack(list[currentIndex - 1], list)
        } else if (list.isNotEmpty()) {
            playTrack(list.last(), list)
        }
    }

    fun stop() {
        player.stop()
        _currentTrack.value = null
        _isPlaying.value = false
        progressJob?.cancel()
    }

    fun release() {
        player.removeListener(playerListener)
        player.release()
        progressJob?.cancel()
    }

    private fun startProgressTracker() {
        progressJob?.cancel()
        progressJob = scope.launch {
            while (isActive) {
                if (player.isPlaying) {
                    _currentPositionMs.value = player.currentPosition.coerceAtLeast(0L)
                    _durationMs.value = player.duration.coerceAtLeast(0L)
                }
                delay(300)
            }
        }
    }

    fun getExoPlayer(): ExoPlayer = player
}
