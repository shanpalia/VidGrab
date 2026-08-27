package com.shanpalia.vidgrab

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.ui.audio.AudioScreen
import com.shanpalia.vidgrab.ui.audio.AudioViewModel
import com.shanpalia.vidgrab.ui.browser.BrowserScreen
import com.shanpalia.vidgrab.ui.components.MiniAudioPlayer
import com.shanpalia.vidgrab.ui.downloads.DownloadsScreen
import com.shanpalia.vidgrab.ui.downloads.DownloadsViewModel
import com.shanpalia.vidgrab.ui.history.HistoryScreen
import com.shanpalia.vidgrab.ui.history.HistoryViewModel
import com.shanpalia.vidgrab.ui.home.HomeScreen
import com.shanpalia.vidgrab.ui.home.HomeViewModel
import com.shanpalia.vidgrab.ui.navigation.AppRoutes
import com.shanpalia.vidgrab.ui.navigation.Screen
import com.shanpalia.vidgrab.ui.navigation.VidGrabBottomNavBar
import com.shanpalia.vidgrab.ui.player.AudioPlayerSheet
import com.shanpalia.vidgrab.ui.player.VideoPlayerScreen
import com.shanpalia.vidgrab.ui.settings.SettingsScreen
import com.shanpalia.vidgrab.ui.settings.SettingsViewModel
import com.shanpalia.vidgrab.ui.theme.VidGrabTheme
import java.net.URLDecoder

class MainActivity : ComponentActivity() {

    private val homeViewModel: HomeViewModel by viewModels()
    private val downloadsViewModel: DownloadsViewModel by viewModels()
    private val audioViewModel: AudioViewModel by viewModels()
    private val historyViewModel: HistoryViewModel by viewModels()
    private val settingsViewModel: SettingsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as VidGrabApplication
        val playbackController = app.mediaPlaybackController

        setContent {
            val themeMode by settingsViewModel.themeMode.collectAsState()

            VidGrabTheme(themeMode = themeMode) {
                VidGrabApp(
                    homeViewModel = homeViewModel,
                    downloadsViewModel = downloadsViewModel,
                    audioViewModel = audioViewModel,
                    historyViewModel = historyViewModel,
                    settingsViewModel = settingsViewModel,
                    playbackController = playbackController,
                    initialIntent = intent
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VidGrabApp(
    homeViewModel: HomeViewModel,
    downloadsViewModel: DownloadsViewModel,
    audioViewModel: AudioViewModel,
    historyViewModel: HistoryViewModel,
    settingsViewModel: SettingsViewModel,
    playbackController: com.shanpalia.vidgrab.media.MediaPlaybackController,
    initialIntent: Intent?
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val activeDownloadsCount by homeViewModel.activeDownloadsCount.collectAsState()
    val currentTrack by playbackController.currentTrack.collectAsState()
    val isPlaying by playbackController.isPlaying.collectAsState()
    val positionMs by playbackController.currentPositionMs.collectAsState()
    val durationMs by playbackController.durationMs.collectAsState()

    var showExpandedAudioPlayer by remember { mutableStateOf(false) }
    val audioSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val isVideoPlayerScreen = currentRoute?.startsWith("video_player") == true
    val isBrowserScreen = currentRoute?.startsWith("browser") == true
    val hideBottomBar = isVideoPlayerScreen || isBrowserScreen

    LaunchedEffect(initialIntent) {
        val navigateTo = initialIntent?.getStringExtra("navigate_to")
        if (navigateTo == "downloads") {
            navController.navigate(Screen.Downloads.route) {
                popUpTo(Screen.Home.route)
            }
        }
    }

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            if (!hideBottomBar) {
                Column(modifier = Modifier.background(MaterialTheme.colorScheme.surface)) {
                    MiniAudioPlayer(
                        currentTrack = currentTrack,
                        isPlaying = isPlaying,
                        positionMs = positionMs,
                        durationMs = durationMs,
                        onTogglePlayPause = { playbackController.togglePlayPause() },
                        onNextTrack = { playbackController.playNextTrack() },
                        onClose = { playbackController.stop() },
                        onClick = { showExpandedAudioPlayer = true }
                    )

                    VidGrabBottomNavBar(
                        currentRoute = currentRoute,
                        activeDownloadsCount = activeDownloadsCount,
                        onNavigate = { screen ->
                            if (currentRoute != screen.route) {
                                navController.navigate(screen.route) {
                                    popUpTo(Screen.Home.route) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Home Destination
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = homeViewModel,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onOpenBrowser = { url, title ->
                        navController.navigate(AppRoutes.createBrowserRoute(url, title))
                    },
                    onPlayVideo = { filePath, title ->
                        navController.navigate(AppRoutes.createVideoPlayerRoute(filePath, title))
                    },
                    onPlayAudio = { track ->
                        playbackController.playTrack(track)
                        showExpandedAudioPlayer = true
                    }
                )
            }

            // Downloads Destination
            composable(Screen.Downloads.route) {
                DownloadsScreen(
                    viewModel = downloadsViewModel,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onPlayVideo = { filePath, title ->
                        navController.navigate(AppRoutes.createVideoPlayerRoute(filePath, title))
                    },
                    onPlayAudio = { track ->
                        playbackController.playTrack(track)
                        showExpandedAudioPlayer = true
                    }
                )
            }

            // Audio Destination
            composable(Screen.Audio.route) {
                AudioScreen(
                    viewModel = audioViewModel,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onPlayAudio = { track ->
                        playbackController.playTrack(track)
                        showExpandedAudioPlayer = true
                    }
                )
            }

            // History Destination
            composable(Screen.History.route) {
                HistoryScreen(
                    viewModel = historyViewModel,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onDownloadAgain = { url ->
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                        }
                        homeViewModel.onUrlChanged(url)
                        homeViewModel.analyzeUrl(url)
                    }
                )
            }

            // Settings Destination
            composable(Screen.Settings.route) {
                SettingsScreen(
                    viewModel = settingsViewModel
                )
            }

            // Video Player Destination
            composable(
                route = AppRoutes.VIDEO_PLAYER,
                arguments = listOf(
                    navArgument("filePath") { type = NavType.StringType },
                    navArgument("title") { type = NavType.StringType }
                )
            ) { backStackEntry ->
                val rawPath = backStackEntry.arguments?.getString("filePath") ?: ""
                val rawTitle = backStackEntry.arguments?.getString("title") ?: "Video"
                val filePath = URLDecoder.decode(rawPath, "UTF-8")
                val title = URLDecoder.decode(rawTitle, "UTF-8")

                VideoPlayerScreen(
                    filePath = filePath,
                    title = title,
                    onBack = { navController.popBackStack() }
                )
            }

            // In-App Browser Destination
            composable(
                route = AppRoutes.BROWSER,
                arguments = listOf(
                    navArgument("url") { type = NavType.StringType },
                    navArgument("title") { type = NavType.StringType }
                )
            ) { backStackEntry ->
                val rawUrl = backStackEntry.arguments?.getString("url") ?: "https://www.google.com"
                val rawTitle = backStackEntry.arguments?.getString("title") ?: "Browser"
                val url = URLDecoder.decode(rawUrl, "UTF-8")
                val title = URLDecoder.decode(rawTitle, "UTF-8")

                BrowserScreen(
                    initialUrl = url,
                    initialTitle = title,
                    homeViewModel = homeViewModel,
                    onBack = { navController.popBackStack() }
                )
            }
        }

        // Expanded Audio Player Sheet
        if (showExpandedAudioPlayer && currentTrack != null) {
            AudioPlayerSheet(
                playbackController = playbackController,
                sheetState = audioSheetState,
                onDismiss = { showExpandedAudioPlayer = false }
            )
        }
    }
}
