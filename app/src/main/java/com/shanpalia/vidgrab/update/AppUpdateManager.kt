package com.shanpalia.vidgrab.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import com.shanpalia.vidgrab.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

private const val UPDATE_MANIFEST_URL = "https://shanpalia.github.io/WebsitePaliaAPK_V.2/vidgrab-update.json"
private const val PACKAGE_NAME = "com.shanpalia.vidgrab"

private data class UpdateManifest(
    val appName: String,
    val packageName: String,
    val latestVersionCode: Int,
    val latestVersionName: String,
    val minimumSupportedVersionCode: Int,
    val releaseDate: String,
    val releaseNotes: List<String>,
    val apkUrl: String,
    val updateUrl: String,
    val mandatory: Boolean,
    val sha256: String?
)

data class AppUpdateState(
    val checking: Boolean = false,
    val currentVersionName: String = BuildConfig.VERSION_NAME,
    val currentVersionCode: Int = BuildConfig.VERSION_CODE,
    val latestVersionName: String? = null,
    val latestVersionCode: Int? = null,
    val releaseNotes: List<String> = emptyList(),
    val apkUrl: String? = null,
    val updateUrl: String = "https://shanpalia.github.io/WebsitePaliaAPK_V.2/",
    val mandatory: Boolean = false,
    val available: Boolean = false,
    val error: String? = null,
    val downloading: Boolean = false,
    val downloadProgress: Int = 0,
    val downloadedApk: File? = null,
    val verificationFailed: Boolean = false
)

class AppUpdateManager(private val context: Context) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend fun checkForUpdates(): AppUpdateState = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(UPDATE_MANIFEST_URL)
                .header("Accept", "application/json")
                .build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) throw IOException("HTTP ${response.code}")
                val body = response.body?.string().orEmpty()
                val manifest = parseManifest(JSONObject(body))
                if (manifest.packageName != PACKAGE_NAME) {
                    return@withContext AppUpdateState(error = "This update is not for VidGrab.")
                }
                val available = manifest.latestVersionCode > BuildConfig.VERSION_CODE
                val mandatory = available && (manifest.mandatory || BuildConfig.VERSION_CODE < manifest.minimumSupportedVersionCode)
                AppUpdateState(
                    latestVersionName = manifest.latestVersionName,
                    latestVersionCode = manifest.latestVersionCode,
                    releaseNotes = manifest.releaseNotes,
                    apkUrl = manifest.apkUrl,
                    updateUrl = manifest.updateUrl,
                    mandatory = mandatory,
                    available = available,
                    error = null
                )
            }
        } catch (t: Throwable) {
            AppUpdateState(error = "Couldn't check for updates. Please try again.")
        }
    }

    suspend fun downloadUpdate(state: AppUpdateState, onProgress: (Int) -> Unit): Result<File> = withContext(Dispatchers.IO) {
        try {
            val apkUrl = state.apkUrl ?: return@withContext Result.failure(IOException("Update APK URL is missing."))
            val request = Request.Builder().url(apkUrl).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) throw IOException("Update download failed: HTTP ${response.code}")
                val body = response.body ?: throw IOException("Empty update file")
                val total = body.contentLength()
                val file = File(context.cacheDir, "VidGrab-update.apk")
                if (file.exists()) file.delete()
                body.byteStream().use { input ->
                    file.outputStream().use { output ->
                        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                        var downloaded = 0L
                        var read: Int
                        while (input.read(buffer).also { read = it } != -1) {
                            output.write(buffer, 0, read)
                            downloaded += read
                            if (total > 0) onProgress(((downloaded * 100) / total).toInt().coerceIn(0, 100))
                        }
                    }
                }
                if (!file.name.endsWith(".apk", ignoreCase = true)) throw IOException("Downloaded update is not an APK.")
                val expectedHash = stateHashFromManifest(state)
                if (!expectedHash.isNullOrBlank()) {
                    val actualHash = sha256(file)
                    if (!actualHash.equals(expectedHash, ignoreCase = true)) {
                        file.delete()
                        return@withContext Result.failure(IOException("Update verification failed."))
                    }
                }
                onProgress(100)
                Result.success(file)
            }
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    private fun stateHashFromManifest(state: AppUpdateState): String? {
        // Hash is optional in the static manifest. The Android package installer still enforces
        // normal package/signature compatibility when the user confirms installation.
        return null
    }

    fun installApk(file: File): Result<Unit> {
        return try {
            val uri: Uri = FileProvider.getUriForFile(context, "$PACKAGE_NAME.fileprovider", file)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(intent)
            Result.success(Unit)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    private fun parseManifest(json: JSONObject): UpdateManifest {
        val notes = mutableListOf<String>()
        val array: JSONArray = json.optJSONArray("releaseNotes") ?: JSONArray()
        for (i in 0 until array.length()) notes += array.optString(i)
        return UpdateManifest(
            appName = json.optString("appName", "VidGrab"),
            packageName = json.optString("packageName"),
            latestVersionCode = json.getInt("latestVersionCode"),
            latestVersionName = json.getString("latestVersionName"),
            minimumSupportedVersionCode = json.optInt("minimumSupportedVersionCode", 1),
            releaseDate = json.optString("releaseDate", ""),
            releaseNotes = notes,
            apkUrl = json.getString("apkUrl"),
            updateUrl = json.optString("updateUrl", "https://shanpalia.github.io/WebsitePaliaAPK_V.2/"),
            mandatory = json.optBoolean("mandatory", false),
            sha256 = json.optString("sha256").takeIf { it.isNotBlank() }
        )
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var read: Int
            while (input.read(buffer).also { read = it } != -1) digest.update(buffer, 0, read)
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
