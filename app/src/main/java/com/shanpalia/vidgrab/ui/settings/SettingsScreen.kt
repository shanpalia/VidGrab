package com.shanpalia.vidgrab.ui.settings

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Policy
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import com.shanpalia.vidgrab.R
import com.shanpalia.vidgrab.ui.components.InfoContentDialog
import com.shanpalia.vidgrab.ui.theme.CyanPrimary
import com.shanpalia.vidgrab.ui.theme.IndigoPrimary
import com.shanpalia.vidgrab.ui.theme.RoseError
import com.shanpalia.vidgrab.utils.FileUtils

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    modifier: Modifier = Modifier
) {
    val themeMode by viewModel.themeMode.collectAsState()
    val defaultAudioFormat by viewModel.defaultAudioFormat.collectAsState()
    val defaultAudioQuality by viewModel.defaultAudioQuality.collectAsState()
    val notificationsEnabled by viewModel.notificationsEnabled.collectAsState()
    val maxDownloads by viewModel.maxDownloads.collectAsState()
    val usedStorage by viewModel.usedStorageBytes.collectAsState()
    val cacheBytes by viewModel.cacheBytes.collectAsState()
    val updateState by viewModel.updateState.collectAsState()

    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    var showLicensesDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (!updateState.checking && updateState.latestVersionCode == null && updateState.error == null) {
            viewModel.checkForUpdates()
        }
    }

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .testTag("settings_screen_list"),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 120.dp, top = 16.dp)
        ) {
            // Header
            item {
                Text(
                    text = "SETTINGS",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.2.sp
                    ),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // APP UPDATE SECTION
            item {
                SettingsSectionHeader("APP UPDATE")
                SettingsCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.SystemUpdate, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("App Update", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("Current version ${updateState.currentVersionName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        when {
                            updateState.checking -> {
                                LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = CyanPrimary)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Checking for updates...", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            updateState.downloading -> {
                                LinearProgressIndicator(progress = { updateState.downloadProgress / 100f }, modifier = Modifier.fillMaxWidth(), color = CyanPrimary)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Downloading update... ${updateState.downloadProgress}%", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            updateState.downloadedApk != null -> {
                                Text("Update downloaded", fontWeight = FontWeight.Bold, color = CyanPrimary)
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(onClick = { viewModel.installDownloadedUpdate() }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary), shape = RoundedCornerShape(10.dp)) {
                                    Text("INSTALL UPDATE", fontWeight = FontWeight.Bold)
                                }
                            }
                            updateState.available -> {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.SystemUpdate, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("New version ${updateState.latestVersionName} available", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Latest version: ${updateState.latestVersionName ?: "—"}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                if (updateState.releaseNotes.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    updateState.releaseNotes.take(4).forEach { note ->
                                        Text("• $note", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Button(onClick = { viewModel.downloadUpdate() }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary), shape = RoundedCornerShape(10.dp)) {
                                    Text(if (updateState.mandatory) "UPDATE NOW" else "UPDATE NOW", fontWeight = FontWeight.Bold)
                                }
                            }
                            updateState.error != null -> {
                                Text(updateState.error ?: "Couldn't check for updates.", fontSize = 12.sp, color = RoseError)
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedButton(onClick = { viewModel.checkForUpdates() }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp)) {
                                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(17.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("TRY AGAIN")
                                }
                            }
                            updateState.latestVersionCode != null -> {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("You're already using the latest version", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Current: ${updateState.currentVersionName}   •   Latest: ${updateState.latestVersionName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(10.dp))
                                OutlinedButton(onClick = { viewModel.checkForUpdates() }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp)) {
                                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(17.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("CHECK AGAIN")
                                }
                            }
                            else -> {
                                Text("Check the official VidGrab release page for updates.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(onClick = { viewModel.checkForUpdates() }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary), shape = RoundedCornerShape(10.dp)) {
                                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(17.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("CHECK FOR UPDATES", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // APPEARANCE SECTION
            item {
                SettingsSectionHeader("APPEARANCE")
                SettingsCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.DarkMode, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Theme Mode", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("dark" to "Dark (AMOLED)", "light" to "Light", "system" to "System").forEach { (mode, label) ->
                                val isSelected = themeMode == mode
                                OutlinedButton(
                                    onClick = { viewModel.setThemeMode(mode) },
                                    modifier = Modifier.weight(1f).height(40.dp).testTag("theme_btn_$mode"),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        containerColor = if (isSelected) CyanPrimary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface
                                    ),
                                    border = androidx.compose.foundation.BorderStroke(
                                        1.dp,
                                        if (isSelected) CyanPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                                    )
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) CyanPrimary else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // DOWNLOADS & NOTIFICATIONS SECTION
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader("DOWNLOADS & NOTIFICATIONS")
                SettingsCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Notifications, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(22.dp))
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Download Notifications", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                    Text("Show speed and ETA in notification bar", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            Switch(
                                checked = notificationsEnabled,
                                onCheckedChange = { viewModel.setNotificationsEnabled(it) },
                                colors = SwitchDefaults.colors(checkedThumbColor = CyanPrimary, checkedTrackColor = CyanPrimary.copy(alpha = 0.4f)),
                                modifier = Modifier.testTag("notifications_switch")
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text("Max Concurrent Downloads", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = CyanPrimary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(1, 2, 3, 5).forEach { count ->
                                val isSelected = maxDownloads == count
                                OutlinedButton(
                                    onClick = { viewModel.setMaxDownloads(count) },
                                    modifier = Modifier.weight(1f).height(38.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        containerColor = if (isSelected) CyanPrimary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface
                                    ),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) CyanPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                                ) {
                                    Text(
                                        text = "$count",
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) CyanPrimary else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // AUDIO CONVERSION SETTINGS
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader("AUDIO EXTRACTION DEFAULTS")
                SettingsCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.MusicNote, contentDescription = null, tint = IndigoPrimary, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Default Audio Format", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("M4A", "MP3", "WAV").forEach { format ->
                                val isSelected = defaultAudioFormat == format
                                OutlinedButton(
                                    onClick = { viewModel.setDefaultAudioFormat(format) },
                                    modifier = Modifier.weight(1f).height(38.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        containerColor = if (isSelected) IndigoPrimary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface
                                    ),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) IndigoPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                                ) {
                                    Text(
                                        text = format,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) IndigoPrimary else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // STORAGE & CLEANUP SECTION
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader("STORAGE & CLEANUP")
                SettingsCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Storage, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("VidGrab Media Used", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("${FileUtils.formatFileSize(usedStorage)} in app storage", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("App Cache", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("${FileUtils.formatFileSize(cacheBytes)} temporary files", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }

                            Button(
                                onClick = { viewModel.clearCache() },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("clear_cache_button")
                            ) {
                                Icon(Icons.Default.CleaningServices, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Clear Cache", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // ABOUT VIDGRAB SECTION
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader("ABOUT VIDGRAB")
                SettingsCard(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(1.dp, CyanPrimary.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.vidgrab_logo),
                                    contentDescription = "VidGrab Logo",
                                    modifier = Modifier.size(48.dp),
                                    contentScale = ContentScale.Crop
                                )
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text("VIDGRAB", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black))
                                Text("Grab. Save. Enjoy.", fontSize = 12.sp, color = CyanPrimary, fontWeight = FontWeight.Bold)
                                Text("By ShanPalia · Version 1.0.0 Pro", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Legal and Info buttons
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showPrivacyDialog = true }
                                .padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Privacy Policy & Public Media Guidelines", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showTermsDialog = true }
                                .padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Policy, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Terms of Service", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showLicensesDialog = true }
                                .padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Info, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Open Source Licenses", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }
        }
    }

    if (showPrivacyDialog) {
        InfoContentDialog(
            title = "Privacy Policy & Guidelines",
            content = """
                VidGrab ("Grab. Save. Enjoy.") by ShanPalia is designed to respect user privacy and adhere to legal streaming standards.
                
                1. Local-First Operation:
                VidGrab processes all media downloads, local audio extraction, and library management directly on your device. We do not transmit your download history or media files to external servers.
                
                2. Legitimate Content Policy:
                VidGrab supports publicly accessible, open media repositories and legitimate downloadable web streams. VidGrab strictly does NOT bypass DRM, encryption, authentication paywalls, or private account protections.
                
                3. Permissions:
                - Internet: Required to fetch publicly accessible media streams.
                - Notifications: Used to display real-time download progress, completion, and playback controls.
                - Foreground Service: Ensures seamless background downloads.
            """.trimIndent(),
            onDismiss = { showPrivacyDialog = false }
        )
    }

    if (showTermsDialog) {
        InfoContentDialog(
            title = "Terms of Service",
            content = """
                VidGrab Application Terms of Use
                
                - VidGrab is a client-side media grabber utility.
                - Users are solely responsible for ensuring they possess the right or authorization to download and store media files for personal offline use.
                - Commercial duplication, distribution of copyright-protected media without license, and misuse of web services are strictly prohibited.
                
                Developed by ShanPalia. All rights reserved.
            """.trimIndent(),
            onDismiss = { showTermsDialog = false }
        )
    }

    if (showLicensesDialog) {
        InfoContentDialog(
            title = "Open Source Licenses",
            content = """
                VidGrab uses the following open-source software:
                
                - Android Jetpack & Jetpack Compose (Apache 2.0)
                - Android Media3 / ExoPlayer (Apache 2.0)
                - Kotlin Coroutines & Flow (Apache 2.0)
                - Room Persistence Library (Apache 2.0)
                - OkHttp 3 (Square, Inc. - Apache 2.0)
                - Coil Image Loading (Apache 2.0)
            """.trimIndent(),
            onDismiss = { showLicensesDialog = false }
        )
    }
}

@Composable
fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge.copy(
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp
        ),
        color = CyanPrimary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
fun SettingsCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(16.dp)),
        color = MaterialTheme.colorScheme.surfaceContainer,
        content = content
    )
}
