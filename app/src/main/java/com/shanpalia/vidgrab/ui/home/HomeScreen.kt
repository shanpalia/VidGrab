package com.shanpalia.vidgrab.ui.home

import android.content.ClipboardManager
import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.ContentPasteGo
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Transform
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shanpalia.vidgrab.R
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.DownloadStatus
import com.shanpalia.vidgrab.ui.components.MediaResultBottomSheet
import com.shanpalia.vidgrab.ui.components.VidGrabTopBar
import com.shanpalia.vidgrab.ui.navigation.Screen
import com.shanpalia.vidgrab.ui.theme.CyanPrimary
import com.shanpalia.vidgrab.ui.theme.IndigoPrimary
import com.shanpalia.vidgrab.ui.theme.RoseError
import com.shanpalia.vidgrab.ui.theme.VioletAccent
import com.shanpalia.vidgrab.utils.FileUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigate: (Screen) -> Unit,
    onOpenBrowser: (url: String, title: String) -> Unit,
    onPlayVideo: (filePath: String, title: String) -> Unit,
    onPlayAudio: (DownloadItem) -> Unit,
    modifier: Modifier = Modifier
) {
    val urlInput by viewModel.urlInput.collectAsState()
    val analysisState by viewModel.analysisState.collectAsState()
    val clipboardUrl by viewModel.clipboardDetectedUrl.collectAsState()
    val recentDownloads by viewModel.recentDownloads.collectAsState()

    val context = LocalContext.current

    fun readClipboardText(): String? {
        return try {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                ?: return null
            val clip = clipboard.primaryClip ?: return null
            if (clip.itemCount <= 0) return null
            val item = clip.getItemAt(0)
            val text = item.coerceToText(context)?.toString()?.trim()
            if (!text.isNullOrBlank()) text else item.uri?.toString()?.trim()?.takeIf { it.isNotBlank() }
        } catch (_: SecurityException) {
            null
        } catch (_: Exception) {
            null
        }
    }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(Unit) {
        viewModel.checkClipboardOnResume()
        viewModel.refreshStorageInfo()
    }

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .testTag("home_screen_list"),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 120.dp)
        ) {
            // 1. TOP HEADER: VidGrab | By ShanPalia | Settings (⚙)
            item {
                VidGrabTopBar(
                    onSettingsClick = { onNavigate(Screen.Settings) }
                )
            }

            // 2. BROWSER CARD: Open your favorite sites (Google, Facebook, Instagram, YouTube)
            item {
                BrowserQuickCard(
                    onOpenSite = { url, title -> onOpenBrowser(url, title) },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }

            // Clipboard Detection Banner (if copied URL is present)
            if (!clipboardUrl.isNullOrBlank()) {
                item {
                    ClipboardBanner(
                        url = clipboardUrl!!,
                        onPaste = { viewModel.onPasteAndAnalyze(clipboardUrl) },
                        onDismiss = { viewModel.dismissClipboardBanner() },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                    )
                }
            }

            // 3. GRAB CARD: Grab your media / Paste a video or media link
            item {
                GrabMediaCard(
                    url = urlInput,
                    analysisState = analysisState,
                    onUrlChange = { viewModel.onUrlChanged(it) },
                    onClear = { viewModel.clearUrl() },
                    onPaste = { viewModel.onPasteFromClipboard(readClipboardText()) },
                    onPasteAndAnalyze = { viewModel.onPasteAndAnalyze(readClipboardText()) },
                    onGrab = { viewModel.analyzeUrl(urlInput) },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // 4. QUICK ACTIONS: [ Video Grab ] [ Audio Grab ]
            item {
                QuickActionsSection(
                    onNavigate = onNavigate,
                    onFocusUrl = { viewModel.onPasteFromClipboard(readClipboardText()) },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // 5. RECENT DOWNLOADS
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "RECENT DOWNLOADS",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        ),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (recentDownloads.isNotEmpty()) {
                        Text(
                            text = "View All",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = CyanPrimary,
                            modifier = Modifier
                                .clickable { onNavigate(Screen.Downloads) }
                                .padding(4.dp)
                                .testTag("view_all_downloads_button")
                        )
                    }
                }
            }

            // Recent Downloads List or Clean Empty State
            if (recentDownloads.isEmpty()) {
                item {
                    EmptyRecentCard(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            } else {
                items(recentDownloads.take(5)) { item ->
                    RecentDownloadItemRow(
                        item = item,
                        onClick = {
                            if (item.status == DownloadStatus.COMPLETED) {
                                if (item.mediaType == "audio") {
                                    onPlayAudio(item)
                                } else {
                                    onPlayVideo(item.filePath, item.title)
                                }
                            } else {
                                onNavigate(Screen.Downloads)
                            }
                        },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // Bottom Sheet for Analysis Result
        if (analysisState is AnalysisUiState.Success) {
            val successResult = (analysisState as AnalysisUiState.Success).result
            MediaResultBottomSheet(
                result = successResult,
                sheetState = sheetState,
                onDismiss = { viewModel.dismissAnalysis() },
                onDownloadOption = { option ->
                    viewModel.startDownload(option, successResult)
                }
            )
        }
    }
}

/**
 * Prominent White Browser Card at top of Home screen
 */
@Composable
fun BrowserQuickCard(
    onOpenSite: (url: String, title: String) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
            .testTag("browser_card"),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 3.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Browser",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.3.sp
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Open your favorite sites",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(CyanPrimary.copy(alpha = 0.1f))
                        .clickable { onOpenSite("https://www.google.com", "Browser") },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Language,
                        contentDescription = "Open Web Browser",
                        tint = CyanPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Quick shortcuts grid: 4 equal-width responsive items
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BrowserShortcutItem(
                    name = "Google",
                    url = "https://www.google.com",
                    icon = painterResource(id = R.drawable.ic_brand_google),
                    onClick = { onOpenSite("https://www.google.com", "Google") },
                    modifier = Modifier.weight(1f)
                )

                BrowserShortcutItem(
                    name = "Facebook",
                    url = "https://www.facebook.com",
                    icon = painterResource(id = R.drawable.ic_brand_facebook),
                    onClick = { onOpenSite("https://www.facebook.com", "Facebook") },
                    modifier = Modifier.weight(1f)
                )

                BrowserShortcutItem(
                    name = "Instagram",
                    url = "https://www.instagram.com",
                    icon = painterResource(id = R.drawable.ic_brand_instagram),
                    onClick = { onOpenSite("https://www.instagram.com", "Instagram") },
                    modifier = Modifier.weight(1f)
                )

                BrowserShortcutItem(
                    name = "YouTube",
                    url = "https://www.youtube.com",
                    icon = painterResource(id = R.drawable.ic_brand_youtube),
                    onClick = { onOpenSite("https://www.youtube.com", "YouTube") },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun BrowserShortcutItem(
    name: String,
    url: String,
    icon: Painter,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .testTag("browser_shortcut_${name.lowercase()}"),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = icon,
                    contentDescription = name,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = name,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                textAlign = TextAlign.Center,
                fontSize = 11.sp
            )
        }
    }
}

/**
 * GRAB CARD
 */
@Composable
fun GrabMediaCard(
    url: String,
    analysisState: AnalysisUiState,
    onUrlChange: (String) -> Unit,
    onClear: () -> Unit,
    onPaste: () -> Unit,
    onPasteAndAnalyze: () -> Unit,
    onGrab: () -> Unit,
    modifier: Modifier = Modifier
) {
    val keyboardController = LocalSoftwareKeyboardController.current

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
            .testTag("grab_card"),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 3.dp
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = "Grab your media",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.3.sp
                ),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Paste a video or media link",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = url,
                onValueChange = onUrlChange,
                placeholder = {
                    Text(
                        "Paste video or media link",
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                        fontSize = 13.sp
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Link,
                        contentDescription = null,
                        tint = if (url.isNotBlank()) CyanPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                trailingIcon = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        if (url.isNotBlank()) {
                            IconButton(
                                onClick = onClear,
                                modifier = Modifier
                                    .size(36.dp)
                                    .testTag("clear_url_button")
                            ) {
                                Icon(
                                    Icons.Default.Clear,
                                    contentDescription = "Clear URL",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        IconButton(
                            onClick = onPaste,
                            modifier = Modifier
                                .size(40.dp)
                                .testTag("paste_url_button")
                        ) {
                            Icon(
                                Icons.Default.ContentPaste,
                                contentDescription = "Paste from clipboard",
                                tint = CyanPrimary,
                                modifier = Modifier.size(21.dp)
                            )
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Uri,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        keyboardController?.hide()
                        onGrab()
                    }
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CyanPrimary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.6f),
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("url_text_input")
            )

            // Analysis state feedback
            AnimatedVisibility(
                visible = analysisState is AnalysisUiState.Analyzing,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                if (analysisState is AnalysisUiState.Analyzing) {
                    Column(modifier = Modifier.padding(top = 12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = CyanPrimary,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = analysisState.statusMessage,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                color = CyanPrimary
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        LinearProgressIndicator(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(3.dp)
                                .clip(RoundedCornerShape(2.dp)),
                            color = CyanPrimary,
                            trackColor = CyanPrimary.copy(alpha = 0.15f)
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = analysisState is AnalysisUiState.Error,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                if (analysisState is AnalysisUiState.Error) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp),
                        shape = RoundedCornerShape(10.dp),
                        color = RoseError.copy(alpha = 0.08f),
                        border = BorderStroke(1.dp, RoseError.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Clear, contentDescription = null, tint = RoseError, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = analysisState.message,
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                color = RoseError
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ANALYZE / GRAB Button
            Button(
                onClick = {
                    keyboardController?.hide()
                    onGrab()
                },
                enabled = analysisState !is AnalysisUiState.Analyzing,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = CyanPrimary,
                    disabledContainerColor = CyanPrimary.copy(alpha = 0.5f)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("grab_media_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "ANALYZE / GRAB",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    ),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // PASTE & ANALYZE Button
            OutlinedButton(
                onClick = {
                    keyboardController?.hide()
                    onPasteAndAnalyze()
                },
                enabled = analysisState !is AnalysisUiState.Analyzing,
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, CyanPrimary.copy(alpha = 0.6f)),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = CyanPrimary
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
                    .testTag("paste_and_analyze_button")
            ) {
                Icon(
                    imageVector = Icons.Default.ContentPasteGo,
                    contentDescription = null,
                    tint = CyanPrimary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "PASTE & ANALYZE",
                    style = MaterialTheme.typography.labelLarge.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    ),
                    color = CyanPrimary
                )
            }
        }
    }
}

/**
 * QUICK ACTIONS
 */
@Composable
fun QuickActionsSection(
    onNavigate: (Screen) -> Unit,
    onFocusUrl: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "QUICK ACTIONS",
            style = MaterialTheme.typography.labelLarge.copy(
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            ),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            QuickActionItemCard(
                title = "Video Grab",
                subtitle = "Fast download library",
                icon = Icons.Default.Movie,
                accentColor = CyanPrimary,
                onClick = { onNavigate(Screen.Downloads) },
                modifier = Modifier.weight(1f).testTag("quick_action_video_grab")
            )

            QuickActionItemCard(
                title = "Audio Grab",
                subtitle = "Extract & convert MP3/M4A",
                icon = Icons.Default.MusicNote,
                accentColor = IndigoPrimary,
                onClick = { onNavigate(Screen.Audio) },
                modifier = Modifier.weight(1f).testTag("quick_action_audio_grab")
            )
        }
    }
}

@Composable
fun QuickActionItemCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 13.sp
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun ClipboardBanner(
    url: String,
    onPaste: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, CyanPrimary.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
            .testTag("clipboard_banner"),
        color = CyanPrimary.copy(alpha = 0.08f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Link,
                contentDescription = null,
                tint = CyanPrimary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Link found in clipboard",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = CyanPrimary
                )
                Text(
                    text = url,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onPaste,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                modifier = Modifier
                    .height(34.dp)
                    .testTag("paste_clipboard_button")
            ) {
                Text("Analyze", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Default.Clear, contentDescription = "Dismiss", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun RecentDownloadItemRow(
    item: DownloadItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .testTag("recent_item_${item.id}"),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        if (item.mediaType == "audio") IndigoPrimary.copy(alpha = 0.12f)
                        else CyanPrimary.copy(alpha = 0.12f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (item.mediaType == "audio") Icons.Default.MusicNote else Icons.Default.Movie,
                    contentDescription = null,
                    tint = if (item.mediaType == "audio") IndigoPrimary else CyanPrimary,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${item.format} · ${if (item.size > 0) FileUtils.formatFileSize(item.size) else "Stream"} · ${item.status.name}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp
                )
            }

            if (item.status == DownloadStatus.COMPLETED) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(CyanPrimary.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Play",
                        tint = CyanPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            } else if (item.status == DownloadStatus.DOWNLOADING) {
                CircularProgressIndicator(
                    progress = { item.progress },
                    modifier = Modifier.size(28.dp),
                    color = CyanPrimary,
                    strokeWidth = 3.dp
                )
            }
        }
    }
}

@Composable
fun EmptyRecentCard(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f), RoundedCornerShape(16.dp)),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Download,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                modifier = Modifier.size(36.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "No downloads yet",
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Paste a link above or browse supported sites to start.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
