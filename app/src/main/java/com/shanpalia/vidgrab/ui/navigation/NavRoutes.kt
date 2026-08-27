package com.shanpalia.vidgrab.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.MusicNote
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    data object Home : Screen("home", "Home", Icons.Filled.Home, Icons.Outlined.Home)
    data object Downloads : Screen("downloads", "Downloads", Icons.Filled.Download, Icons.Outlined.Download)
    data object Audio : Screen("audio", "Audio", Icons.Filled.MusicNote, Icons.Outlined.MusicNote)
    data object History : Screen("history", "History", Icons.Filled.History, Icons.Outlined.History)
    data object Settings : Screen("settings", "Settings", Icons.Filled.Settings, Icons.Outlined.Settings)

    companion object {
        val bottomNavItems = listOf(Home, Downloads, Audio, History, Settings)
    }
}

object AppRoutes {
    const val VIDEO_PLAYER = "video_player?filePath={filePath}&title={title}"
    const val BROWSER = "browser?url={url}&title={title}"
    
    fun createVideoPlayerRoute(filePath: String, title: String): String {
        val encodedPath = java.net.URLEncoder.encode(filePath, "UTF-8")
        val encodedTitle = java.net.URLEncoder.encode(title, "UTF-8")
        return "video_player?filePath=$encodedPath&title=$encodedTitle"
    }

    fun createBrowserRoute(url: String, title: String = ""): String {
        val encodedUrl = java.net.URLEncoder.encode(url, "UTF-8")
        val encodedTitle = java.net.URLEncoder.encode(title, "UTF-8")
        return "browser?url=$encodedUrl&title=$encodedTitle"
    }
}
