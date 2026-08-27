package com.shanpalia.vidgrab.ui.browser

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.shanpalia.vidgrab.data.model.MediaAnalysisResult
import com.shanpalia.vidgrab.data.model.MediaOption
import com.shanpalia.vidgrab.ui.components.MediaResultBottomSheet
import com.shanpalia.vidgrab.ui.home.HomeViewModel
import com.shanpalia.vidgrab.ui.theme.CyanPrimary
import com.shanpalia.vidgrab.ui.theme.RoseError
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun BrowserScreen(
    initialUrl: String,
    initialTitle: String = "",
    homeViewModel: HomeViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var currentUrl by remember { mutableStateOf(if (initialUrl.isNotBlank()) initialUrl else "https://www.google.com") }
    var pageTitle by remember { mutableStateOf(initialTitle.ifBlank { "Browser" }) }
    var inputUrlText by remember { mutableStateOf(currentUrl) }
    var isEditingUrl by remember { mutableStateOf(false) }

    var canGoBack by remember { mutableStateOf(false) }
    var canGoForward by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var loadProgress by remember { mutableFloatStateOf(0f) }

    var showMenu by remember { mutableStateOf(false) }

    // Grab analysis state inside browser
    var isAnalyzing by remember { mutableStateOf(false) }
    var analysisStatus by remember { mutableStateOf("") }
    var detectedAnalysisResult by remember { mutableStateOf<MediaAnalysisResult?>(null) }
    var analysisErrorMessage by remember { mutableStateOf<String?>(null) }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Handle back button press
    BackHandler {
        if (isEditingUrl) {
            isEditingUrl = false
            inputUrlText = currentUrl
        } else if (webViewInstance?.canGoBack() == true) {
            webViewInstance?.goBack()
        } else {
            onBack()
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            webViewInstance?.destroy()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Browser Top Bar
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("browser_top_bar"),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Back Navigation
                        IconButton(
                            onClick = {
                                if (webViewInstance?.canGoBack() == true) {
                                    webViewInstance?.goBack()
                                } else {
                                    onBack()
                                }
                            },
                            modifier = Modifier.size(38.dp).testTag("browser_back_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        // Forward Navigation
                        IconButton(
                            onClick = { webViewInstance?.goForward() },
                            enabled = canGoForward,
                            modifier = Modifier.size(38.dp).testTag("browser_forward_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Forward",
                                tint = if (canGoForward) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        // Refresh / Stop Navigation
                        IconButton(
                            onClick = {
                                if (isLoading) {
                                    webViewInstance?.stopLoading()
                                } else {
                                    webViewInstance?.reload()
                                }
                            },
                            modifier = Modifier.size(38.dp).testTag("browser_refresh_button")
                        ) {
                            Icon(
                                imageVector = if (isLoading) Icons.Default.Close else Icons.Default.Refresh,
                                contentDescription = if (isLoading) "Stop" else "Refresh",
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(4.dp))

                        // URL / Search Input Bar
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp)
                                .clip(RoundedCornerShape(20.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                                .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                                .padding(horizontal = 10.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (isEditingUrl) {
                                OutlinedTextField(
                                    value = inputUrlText,
                                    onValueChange = { inputUrlText = it },
                                    modifier = Modifier.fillMaxWidth().testTag("browser_url_input"),
                                    singleLine = true,
                                    textStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                                    keyboardOptions = KeyboardOptions(
                                        keyboardType = KeyboardType.Uri,
                                        imeAction = ImeAction.Go
                                    ),
                                    keyboardActions = KeyboardActions(
                                        onGo = {
                                            isEditingUrl = false
                                            focusManager.clearFocus()
                                            val target = formatNavUrl(inputUrlText)
                                            currentUrl = target
                                            webViewInstance?.loadUrl(target)
                                        }
                                    ),
                                    trailingIcon = {
                                        if (inputUrlText.isNotBlank()) {
                                            IconButton(
                                                onClick = { inputUrlText = "" },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(Icons.Default.Clear, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    },
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color.Transparent,
                                        unfocusedBorderColor = Color.Transparent,
                                        focusedContainerColor = Color.Transparent,
                                        unfocusedContainerColor = Color.Transparent
                                    )
                                )
                            } else {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Secure",
                                        tint = if (currentUrl.startsWith("https://")) CyanPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = displayDomain(currentUrl),
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontWeight = FontWeight.Medium,
                                            fontSize = 13.sp
                                        ),
                                        color = MaterialTheme.colorScheme.onSurface,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .padding(vertical = 4.dp)
                                            .testTag("browser_url_display")
                                    )
                                    IconButton(
                                        onClick = {
                                            inputUrlText = currentUrl
                                            isEditingUrl = true
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Clear,
                                            contentDescription = "Edit URL",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(4.dp))

                        // Open in External Browser
                        IconButton(
                            onClick = {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(currentUrl))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Cannot open browser", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.size(38.dp).testTag("browser_open_external_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                                contentDescription = "Open externally",
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        // More options menu
                        Box {
                            IconButton(
                                onClick = { showMenu = true },
                                modifier = Modifier.size(38.dp).testTag("browser_more_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MoreVert,
                                    contentDescription = "More",
                                    tint = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            DropdownMenu(
                                expanded = showMenu,
                                onDismissRequest = { showMenu = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Copy Link") },
                                    leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp)) },
                                    onClick = {
                                        showMenu = false
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        clipboard.setPrimaryClip(ClipData.newPlainText("URL", currentUrl))
                                        scope.launch { snackbarHostState.showSnackbar("Link copied to clipboard") }
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Share Link") },
                                    leadingIcon = { Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp)) },
                                    onClick = {
                                        showMenu = false
                                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(Intent.EXTRA_TEXT, currentUrl)
                                        }
                                        context.startActivity(Intent.createChooser(shareIntent, "Share URL"))
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Clear Browsing Data") },
                                    leadingIcon = { Icon(Icons.Default.Clear, contentDescription = null, modifier = Modifier.size(18.dp)) },
                                    onClick = {
                                        showMenu = false
                                        webViewInstance?.clearCache(true)
                                        CookieManager.getInstance().removeAllCookies(null)
                                        scope.launch { snackbarHostState.showSnackbar("Browser cache cleared") }
                                    }
                                )
                            }
                        }
                    }

                    // Loading Progress Indicator
                    if (isLoading) {
                        LinearProgressIndicator(
                            progress = { loadProgress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(2.5.dp),
                            color = CyanPrimary,
                            trackColor = Color.Transparent
                        )
                    }
                }
            }

            // In-App WebView
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                AndroidView(
                    modifier = Modifier.fillMaxSize().testTag("browser_webview"),
                    factory = { ctx ->
                        WebView(ctx).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )

                            try {
                                setLayerType(View.LAYER_TYPE_SOFTWARE, null)
                            } catch (_: Exception) {}

                            settings.apply {
                                javaScriptEnabled = true
                                domStorageEnabled = true
                                databaseEnabled = true
                                useWideViewPort = true
                                loadWithOverviewMode = true
                                setSupportZoom(true)
                                builtInZoomControls = true
                                displayZoomControls = false
                                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                                userAgentString = "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 VidGrab/1.0"
                            }

                            webViewClient = object : WebViewClient() {
                                override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                                    try {
                                        view?.let {
                                            val parent = it.parent as? ViewGroup
                                            parent?.removeView(it)
                                            it.destroy()
                                        }
                                    } catch (_: Exception) {}
                                    webViewInstance = null
                                    return true
                                }

                                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                    super.onPageStarted(view, url, favicon)
                                    isLoading = true
                                    url?.let {
                                        currentUrl = it
                                        inputUrlText = it
                                    }
                                    canGoBack = view?.canGoBack() == true
                                    canGoForward = view?.canGoForward() == true
                                }

                                override fun onPageFinished(view: WebView?, url: String?) {
                                    super.onPageFinished(view, url)
                                    isLoading = false
                                    url?.let {
                                        currentUrl = it
                                        inputUrlText = it
                                    }
                                    pageTitle = view?.title ?: "Browser"
                                    canGoBack = view?.canGoBack() == true
                                    canGoForward = view?.canGoForward() == true
                                }

                                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                                    val uri = request?.url ?: return false
                                    val scheme = uri.scheme?.lowercase()
                                    return if (scheme == "http" || scheme == "https") {
                                        false
                                    } else {
                                        try {
                                            val intent = Intent(Intent.ACTION_VIEW, uri)
                                            ctx.startActivity(intent)
                                        } catch (_: Exception) {}
                                        true
                                    }
                                }
                            }

                            webChromeClient = object : WebChromeClient() {
                                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                    loadProgress = newProgress / 100f
                                    isLoading = newProgress < 100
                                }

                                override fun onReceivedTitle(view: WebView?, title: String?) {
                                    super.onReceivedTitle(view, title)
                                    if (!title.isNullOrBlank()) {
                                        pageTitle = title
                                    }
                                }
                            }

                            loadUrl(currentUrl)
                            webViewInstance = this
                        }
                    },
                    update = { view ->
                        webViewInstance = view
                    }
                )

                // Floating "GRAB WITH VIDGRAB" Action Bar at Bottom
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                        .shadow(8.dp, RoundedCornerShape(24.dp))
                        .testTag("grab_with_vidgrab_bar"),
                    shape = RoundedCornerShape(24.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CyanPrimary.copy(alpha = 0.3f))
                ) {
                    Row(
                        modifier = Modifier
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                val urlToGrab = currentUrl
                                isAnalyzing = true
                                analysisStatus = "Analyzing page..."
                                analysisErrorMessage = null

                                scope.launch {
                                    try {
                                        val result = homeViewModel.run {
                                            val app = getApplication<com.shanpalia.vidgrab.VidGrabApplication>()
                                            app.mediaRepository.analyzeUrl(urlToGrab) { status ->
                                                analysisStatus = status
                                            }
                                        }

                                        isAnalyzing = false
                                        val hasOptions = result.videoOptions.isNotEmpty() || result.audioOptions.isNotEmpty() || result.isDirectFile
                                        if (result.isSupported && hasOptions) {
                                            detectedAnalysisResult = result
                                        } else {
                                            val reason = result.unsupportedReason ?: "This source isn't supported for downloading by VidGrab."
                                            analysisErrorMessage = reason
                                            snackbarHostState.showSnackbar(reason)
                                        }
                                    } catch (e: Exception) {
                                        isAnalyzing = false
                                        val err = e.localizedMessage ?: "This source isn't supported for downloading by VidGrab."
                                        analysisErrorMessage = err
                                        snackbarHostState.showSnackbar(err)
                                    }
                                }
                            },
                            enabled = !isAnalyzing,
                            shape = RoundedCornerShape(18.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = CyanPrimary,
                                contentColor = Color.White
                            ),
                            modifier = Modifier.testTag("grab_with_vidgrab_button")
                        ) {
                            if (isAnalyzing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = analysisStatus.ifBlank { "Analyzing..." },
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Download,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Grab with VidGrab",
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 13.sp,
                                    letterSpacing = 0.5.sp
                                )
                            }
                        }
                    }
                }

                // Error / Unsupported Source notification card
                if (analysisErrorMessage != null) {
                    Surface(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .fillMaxWidth()
                            .padding(16.dp)
                            .testTag("browser_error_card"),
                        shape = RoundedCornerShape(12.dp),
                        color = RoseError.copy(alpha = 0.95f),
                        shadowElevation = 6.dp
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Close, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = analysisErrorMessage ?: "",
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                color = Color.White,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(onClick = { analysisErrorMessage = null }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Clear, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }
        }

        // Snackbar Host
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 80.dp)
        )

        // Detected Media Result Bottom Sheet
        if (detectedAnalysisResult != null) {
            val result = detectedAnalysisResult!!
            MediaResultBottomSheet(
                result = result,
                sheetState = sheetState,
                onDismiss = { detectedAnalysisResult = null },
                onDownloadOption = { option ->
                    homeViewModel.startDownload(option, result)
                    detectedAnalysisResult = null
                    scope.launch {
                        snackbarHostState.showSnackbar("Download started: ${result.title}")
                    }
                }
            )
        }
    }
}

private fun formatNavUrl(input: String): String {
    val trimmed = input.trim()
    return if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        trimmed
    } else if (trimmed.contains(".") && !trimmed.contains(" ")) {
        "https://$trimmed"
    } else {
        "https://www.google.com/search?q=" + Uri.encode(trimmed)
    }
}

private fun displayDomain(url: String): String {
    return try {
        val uri = Uri.parse(url)
        val host = uri.host ?: url
        if (host.startsWith("www.")) host.substring(4) else host
    } catch (_: Exception) {
        url
    }
}
