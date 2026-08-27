package com.shanpalia.vidgrab.ui.downloads

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.DownloadStatus
import com.shanpalia.vidgrab.ui.components.DeleteConfirmDialog
import com.shanpalia.vidgrab.ui.components.RenameDialog
import com.shanpalia.vidgrab.ui.components.StorageSummaryCard
import com.shanpalia.vidgrab.ui.components.VidGrabTopBar
import com.shanpalia.vidgrab.ui.navigation.Screen
import com.shanpalia.vidgrab.ui.theme.AmberWarning
import com.shanpalia.vidgrab.ui.theme.CyanPrimary
import com.shanpalia.vidgrab.ui.theme.EmeraldSuccess
import com.shanpalia.vidgrab.ui.theme.IndigoPrimary
import com.shanpalia.vidgrab.ui.theme.RoseError
import com.shanpalia.vidgrab.utils.FileUtils
import com.shanpalia.vidgrab.utils.ShareUtils
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DownloadsScreen(
    viewModel: DownloadsViewModel,
    onNavigate: (Screen) -> Unit,
    onPlayVideo: (filePath: String, title: String) -> Unit,
    onPlayAudio: (DownloadItem) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val selectedTab by viewModel.selectedTab.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val sortOption by viewModel.sortOption.collectAsState()
    val activeDownloads by viewModel.activeDownloads.collectAsState()
    val completedDownloads by viewModel.completedDownloads.collectAsState()
    val usedStorage by viewModel.usedStorageBytes.collectAsState()
    val freeStorage by viewModel.freeStorageBytes.collectAsState()

    var itemToRename by remember { mutableStateOf<DownloadItem?>(null) }
    var itemToDelete by remember { mutableStateOf<DownloadItem?>(null) }
    var showSortMenu by remember { mutableStateOf(false) }

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .testTag("downloads_screen_list"),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 120.dp)
        ) {
            // App Top Bar
            item {
                VidGrabTopBar(onSettingsClick = { onNavigate(Screen.Settings) })
            }

            // Tab Bar
            item {
                PrimaryTabRow(
                    selectedTabIndex = selectedTab.ordinal,
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = CyanPrimary,
                    modifier = Modifier.padding(horizontal = 16.dp).clip(RoundedCornerShape(12.dp))
                ) {
                    DownloadTab.values().forEach { tab ->
                        Tab(
                            selected = selectedTab == tab,
                            onClick = { viewModel.selectTab(tab) },
                            text = {
                                Text(
                                    text = when (tab) {
                                        DownloadTab.ALL -> "All"
                                        DownloadTab.VIDEOS -> "Videos"
                                        DownloadTab.AUDIO -> "Audio"
                                    },
                                    fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 13.sp
                                )
                            },
                            modifier = Modifier.testTag("tab_${tab.name.lowercase()}")
                        )
                    }
                }
            }

            // Storage Summary Card
            item {
                StorageSummaryCard(
                    usedBytes = usedStorage,
                    freeBytes = freeStorage,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                )
            }

            // Search and Sort Bar
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { viewModel.onSearchQueryChanged(it) },
                        placeholder = { Text("Search downloads...", fontSize = 13.sp) },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        },
                        trailingIcon = {
                            if (searchQuery.isNotBlank()) {
                                IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp)
                            .testTag("search_downloads_input")
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    Box {
                        IconButton(
                            onClick = { showSortMenu = true },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.surfaceContainer)
                                .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .testTag("sort_downloads_button")
                        ) {
                            Icon(Icons.Default.Sort, contentDescription = "Sort", tint = CyanPrimary)
                        }

                        DropdownMenu(
                            expanded = showSortMenu,
                            onDismissRequest = { showSortMenu = false },
                            containerColor = MaterialTheme.colorScheme.surfaceContainer
                        ) {
                            DropdownMenuItem(
                                text = { Text("Newest first", fontWeight = if (sortOption == SortOption.NEWEST) FontWeight.Bold else FontWeight.Normal) },
                                onClick = { viewModel.setSortOption(SortOption.NEWEST); showSortMenu = false }
                            )
                            DropdownMenuItem(
                                text = { Text("Oldest first", fontWeight = if (sortOption == SortOption.OLDEST) FontWeight.Bold else FontWeight.Normal) },
                                onClick = { viewModel.setSortOption(SortOption.OLDEST); showSortMenu = false }
                            )
                            DropdownMenuItem(
                                text = { Text("Largest size", fontWeight = if (sortOption == SortOption.LARGEST) FontWeight.Bold else FontWeight.Normal) },
                                onClick = { viewModel.setSortOption(SortOption.LARGEST); showSortMenu = false }
                            )
                            DropdownMenuItem(
                                text = { Text("Smallest size", fontWeight = if (sortOption == SortOption.SMALLEST) FontWeight.Bold else FontWeight.Normal) },
                                onClick = { viewModel.setSortOption(SortOption.SMALLEST); showSortMenu = false }
                            )
                            DropdownMenuItem(
                                text = { Text("Name (A-Z)", fontWeight = if (sortOption == SortOption.NAME) FontWeight.Bold else FontWeight.Normal) },
                                onClick = { viewModel.setSortOption(SortOption.NAME); showSortMenu = false }
                            )
                        }
                    }
                }
            }

            // ACTIVE DOWNLOADS SECTION
            if (activeDownloads.isNotEmpty()) {
                item {
                    Text(
                        text = "ACTIVE DOWNLOADS (${activeDownloads.size})",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        ),
                        color = CyanPrimary,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                    )
                }

                items(activeDownloads) { item ->
                    ActiveDownloadCard(
                        item = item,
                        onPause = { viewModel.pauseDownload(item.id) },
                        onResume = { viewModel.resumeDownload(item.id) },
                        onCancel = { viewModel.cancelDownload(item.id) },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }

            // COMPLETED DOWNLOADS SECTION
            item {
                Text(
                    text = "DOWNLOADED MEDIA (${completedDownloads.size})",
                    style = MaterialTheme.typography.labelLarge.copy(
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                )
            }

            if (completedDownloads.isEmpty()) {
                item {
                    EmptyDownloadsState(
                        onGoToGrabber = { onNavigate(Screen.Home) },
                        modifier = Modifier.padding(16.dp)
                    )
                }
            } else {
                items(completedDownloads) { item ->
                    CompletedDownloadCard(
                        item = item,
                        onPlay = {
                            if (item.mediaType == "audio") {
                                onPlayAudio(item)
                            } else {
                                onPlayVideo(item.filePath, item.title)
                            }
                        },
                        onShare = { ShareUtils.shareMediaFile(context, item.filePath, item.title) },
                        onOpenExternal = { ShareUtils.openWithExternalApp(context, item.filePath) },
                        onRename = { itemToRename = item },
                        onDelete = { itemToDelete = item },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }

    // Dialogs
    itemToRename?.let { item ->
        RenameDialog(
            currentTitle = item.title,
            onConfirm = { newTitle ->
                viewModel.renameDownload(item, newTitle)
                itemToRename = null
            },
            onDismiss = { itemToRename = null }
        )
    }

    itemToDelete?.let { item ->
        DeleteConfirmDialog(
            title = item.title,
            onConfirm = {
                viewModel.deleteDownload(item)
                itemToDelete = null
            },
            onDismiss = { itemToDelete = null }
        )
    }
}

@Composable
fun ActiveDownloadCard(
    item: DownloadItem,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CyanPrimary.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
            .testTag("active_download_${item.id}"),
        color = MaterialTheme.colorScheme.surfaceContainer
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(CyanPrimary.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (item.mediaType == "audio") Icons.Default.MusicNote else Icons.Default.Movie,
                        contentDescription = null,
                        tint = CyanPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${item.format} · ${item.status.name}",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (item.status == DownloadStatus.PAUSED) AmberWarning else CyanPrimary,
                        fontSize = 11.sp
                    )
                }

                // Action Controls: Pause / Resume / Cancel
                if (item.status == DownloadStatus.DOWNLOADING) {
                    IconButton(onClick = onPause, modifier = Modifier.size(34.dp).testTag("pause_download_${item.id}")) {
                        Icon(Icons.Default.Pause, contentDescription = "Pause", tint = CyanPrimary)
                    }
                } else if (item.status == DownloadStatus.PAUSED || item.status == DownloadStatus.FAILED) {
                    IconButton(onClick = onResume, modifier = Modifier.size(34.dp).testTag("resume_download_${item.id}")) {
                        Icon(Icons.Default.PlayArrow, contentDescription = "Resume", tint = EmeraldSuccess)
                    }
                }

                IconButton(onClick = onCancel, modifier = Modifier.size(34.dp).testTag("cancel_download_${item.id}")) {
                    Icon(Icons.Default.Close, contentDescription = "Cancel", tint = RoseError)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Progress Bar
            LinearProgressIndicator(
                progress = { item.progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = if (item.status == DownloadStatus.PAUSED) AmberWarning else CyanPrimary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Live telemetry (Speed, ETA, Bytes)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${(item.progress * 100).toInt()}% · ${FileUtils.formatFileSize(item.downloadedBytes)} / ${if (item.size > 0) FileUtils.formatFileSize(item.size) else "Unknown"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp
                )
                Text(
                    text = if (item.status == DownloadStatus.DOWNLOADING)
                        "${FileUtils.formatSpeed(item.downloadSpeed)} · ${FileUtils.formatEta(item.etaSeconds)}"
                    else
                        item.status.name,
                    style = MaterialTheme.typography.bodySmall,
                    color = CyanPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun CompletedDownloadCard(
    item: DownloadItem,
    onPlay: () -> Unit,
    onShare: () -> Unit,
    onOpenExternal: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showMenu by remember { mutableStateOf(false) }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
            .clickable { onPlay() }
            .testTag("completed_download_${item.id}"),
        color = MaterialTheme.colorScheme.surfaceContainer
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Media Icon
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (item.mediaType == "audio") IndigoPrimary.copy(alpha = 0.15f)
                        else CyanPrimary.copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (item.mediaType == "audio") Icons.Default.MusicNote else Icons.Default.Movie,
                    contentDescription = null,
                    tint = if (item.mediaType == "audio") IndigoPrimary else CyanPrimary,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = item.format,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    if (!item.resolution.isNullOrBlank()) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(CyanPrimary.copy(alpha = 0.12f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = item.resolution,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = CyanPrimary
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = FileUtils.formatFileSize(item.size),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                }
            }

            // Play Action
            IconButton(
                onClick = onPlay,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(CyanPrimary.copy(alpha = 0.15f))
                    .testTag("play_media_${item.id}")
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = CyanPrimary, modifier = Modifier.size(20.dp))
            }

            // More Options Menu
            Box {
                IconButton(
                    onClick = { showMenu = true },
                    modifier = Modifier.size(36.dp).testTag("more_options_${item.id}")
                ) {
                    Icon(Icons.Default.MoreVert, contentDescription = "More", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false },
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                ) {
                    DropdownMenuItem(
                        leadingIcon = { Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp)) },
                        text = { Text("Share") },
                        onClick = { showMenu = false; onShare() }
                    )
                    DropdownMenuItem(
                        leadingIcon = { Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(18.dp)) },
                        text = { Text("Open in External App") },
                        onClick = { showMenu = false; onOpenExternal() }
                    )
                    DropdownMenuItem(
                        leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(18.dp)) },
                        text = { Text("Rename") },
                        onClick = { showMenu = false; onRename() }
                    )
                    DropdownMenuItem(
                        leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = RoseError, modifier = Modifier.size(18.dp)) },
                        text = { Text("Delete", color = RoseError) },
                        onClick = { showMenu = false; onDelete() }
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyDownloadsState(
    onGoToGrabber: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(20.dp)),
        color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(CyanPrimary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = null,
                    tint = CyanPrimary,
                    modifier = Modifier.size(32.dp)
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = "No Downloads Found",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Grab public video and audio links to build your offline library.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Spacer(modifier = Modifier.height(18.dp))
            Button(
                onClick = onGoToGrabber,
                colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("empty_go_to_grabber_button")
            ) {
                Text("Go to Grabber", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Bold)
            }
        }
    }
}
