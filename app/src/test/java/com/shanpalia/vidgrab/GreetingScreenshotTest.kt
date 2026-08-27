package com.shanpalia.vidgrab

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.shanpalia.vidgrab.ui.home.AnalysisUiState
import com.shanpalia.vidgrab.ui.home.GrabMediaCard
import com.shanpalia.vidgrab.ui.theme.VidGrabTheme
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [36])
class GreetingScreenshotTest {

    @get:Rule val composeTestRule = createComposeRule()

    @Test
    fun grabMediaCard_screenshot() {
        composeTestRule.setContent {
            VidGrabTheme {
                GrabMediaCard(
                    url = "https://example.com/video/123",
                    analysisState = AnalysisUiState.Idle,
                    onUrlChange = {},
                    onClear = {},
                    onPaste = {},
                    onPasteAndAnalyze = {},
                    onGrab = {}
                )
            }
        }

        composeTestRule.onRoot().captureRoboImage(filePath = "src/test/screenshots/greeting.png")
    }
}
