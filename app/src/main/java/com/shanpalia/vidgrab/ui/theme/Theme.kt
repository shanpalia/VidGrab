package com.shanpalia.vidgrab.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val VidGrabLightColorScheme = lightColorScheme(
    primary = VidGrabPrimary,
    onPrimary = Color.White,
    primaryContainer = VidGrabPrimaryContainer,
    onPrimaryContainer = VidGrabOnPrimaryContainer,
    secondary = VidGrabSecondary,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFEEF2FF),
    onSecondaryContainer = Color(0xFF3730A3),
    tertiary = VidGrabTertiary,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFD1FAE5),
    onTertiaryContainer = Color(0xFF047857),
    background = WhiteBg,
    onBackground = WhiteTextPrimary,
    surface = WhiteSurface,
    onSurface = WhiteTextPrimary,
    surfaceVariant = WhiteSurfaceElevated,
    onSurfaceVariant = WhiteTextSecondary,
    surfaceContainer = WhiteSurfaceCard,
    surfaceContainerHigh = Color(0xFFF1F5F9),
    outline = WhiteBorder,
    outlineVariant = WhiteBorderSubtle,
    error = RoseError,
    onError = Color.White
)

private val VidGrabDarkColorScheme = darkColorScheme(
    primary = Color(0xFF38BDF8),
    onPrimary = Color(0xFF0C4A6E),
    primaryContainer = Color(0xFF0369A1),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Color(0xFF818CF8),
    onSecondary = Color(0xFF1E1B4B),
    secondaryContainer = Color(0xFF312E81),
    onSecondaryContainer = Color(0xFFE0E7FF),
    tertiary = Color(0xFF34D399),
    onTertiary = Color(0xFF064E3B),
    tertiaryContainer = Color(0xFF065F46),
    onTertiaryContainer = Color(0xFFA7F3D0),
    background = DarkBg,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkSurfaceElevated,
    onSurfaceVariant = DarkTextSecondary,
    surfaceContainer = DarkSurfaceCard,
    surfaceContainerHigh = DarkSurfaceElevated,
    outline = DarkBorder,
    outlineVariant = DarkBorderSubtle,
    error = RoseError,
    onError = Color.White
)

@Composable
fun VidGrabTheme(
    themeMode: String = "light", // Default is "light" (White theme)
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val systemDark = isSystemInDarkTheme()
    val isDark = when (themeMode.lowercase()) {
        "dark" -> true
        "light" -> false
        "system" -> systemDark
        else -> false // Default to White / Light theme
    }

    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (isDark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        isDark -> VidGrabDarkColorScheme
        else -> VidGrabLightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.surface.toArgb()
            window.navigationBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !isDark
                isAppearanceLightNavigationBars = !isDark
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

// Kept for backward compatibility
@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = false,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    VidGrabTheme(
        themeMode = if (darkTheme) "dark" else "light",
        dynamicColor = dynamicColor,
        content = content
    )
}

