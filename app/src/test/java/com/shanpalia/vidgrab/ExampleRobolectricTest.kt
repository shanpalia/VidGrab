package com.shanpalia.vidgrab

import android.app.Application
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.shanpalia.vidgrab.ui.home.AnalysisUiState
import com.shanpalia.vidgrab.ui.home.HomeViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("VidGrab", appName)
    }

    @Test
    fun `paste url updates urlInput state`() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = HomeViewModel(app)

        viewModel.onPasteFromClipboard("https://example.com/video/123")
        assertEquals("https://example.com/video/123", viewModel.urlInput.value)

        viewModel.clearUrl()
        assertEquals("", viewModel.urlInput.value)
    }

    @Test
    fun `paste empty clipboard produces error`() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = HomeViewModel(app)

        viewModel.onPasteFromClipboard(null)
        val state = viewModel.analysisState.value
        assertTrue(state is AnalysisUiState.Error)
        assertEquals("Clipboard is empty.", (state as AnalysisUiState.Error).message)
    }

    @Test
    fun `url validation correctly identifies valid and invalid urls`() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val viewModel = HomeViewModel(app)

        assertTrue(viewModel.isValidUrl("https://youtube.com/watch?v=123"))
        assertTrue(viewModel.isValidUrl("http://instagram.com/reel/abc"))
        assertTrue(viewModel.isValidUrl("tiktok.com/@user/video/123"))
        assertFalse(viewModel.isValidUrl(""))
        assertFalse(viewModel.isValidUrl("not a url"))
    }
}
