package com.shanpalia.vidgrab.source

import com.shanpalia.vidgrab.data.model.MediaAnalysisResult

interface SourceAdapter {
    val name: String
    fun canHandle(url: String, domain: String): Boolean
    suspend fun analyze(url: String, domain: String): MediaAnalysisResult
}
