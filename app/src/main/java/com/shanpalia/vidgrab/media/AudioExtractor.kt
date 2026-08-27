package com.shanpalia.vidgrab.media

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import com.shanpalia.vidgrab.utils.FileUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer

object AudioExtractor {

    suspend fun extractAudio(
        context: Context,
        inputUri: Uri,
        outputFormat: String, // "M4A", "WAV", "MP3"
        outputQualityKbps: Int = 192,
        customOutputName: String? = null,
        onProgress: (Float) -> Unit = {}
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            val extractor = MediaExtractor()
            extractor.setDataSource(context, inputUri, null)

            var audioTrackIndex = -1
            var audioFormat: MediaFormat? = null
            var durationUs = 0L

            for (i in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(i)
                val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
                if (mime.startsWith("audio/")) {
                    audioTrackIndex = i
                    audioFormat = format
                    if (format.containsKey(MediaFormat.KEY_DURATION)) {
                        durationUs = format.getLong(MediaFormat.KEY_DURATION)
                    }
                    break
                }
            }

            if (audioTrackIndex < 0 || audioFormat == null) {
                extractor.release()
                return@withContext Result.failure(Exception("No audio track found in selected media file."))
            }

            val baseName = customOutputName?.takeIf { it.isNotBlank() }
                ?: "Audio_${System.currentTimeMillis()}"
            val ext = if (outputFormat.equals("WAV", ignoreCase = true)) "wav" else if (outputFormat.equals("MP3", ignoreCase = true)) "mp3" else "m4a"
            val outputFile = FileUtils.getTargetFile(context, "$baseName.$ext", "audio")

            if (ext == "wav") {
                // Decode to PCM and write WAV
                extractToWav(extractor, audioTrackIndex, audioFormat, outputFile, durationUs, onProgress)
            } else {
                // Direct Mux to M4A/AAC (Fast & Lossless container extraction)
                extractToM4a(extractor, audioTrackIndex, audioFormat, outputFile, durationUs, onProgress)
            }

            extractor.release()
            onProgress(1.0f)
            Result.success(outputFile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun extractToM4a(
        extractor: MediaExtractor,
        trackIndex: Int,
        format: MediaFormat,
        outputFile: File,
        durationUs: Long,
        onProgress: (Float) -> Unit
    ) {
        extractor.selectTrack(trackIndex)
        val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        val muxerTrackIndex = muxer.addTrack(format)
        muxer.start()

        val maxBufferSize = if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
            format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE).coerceAtLeast(64 * 1024)
        } else {
            64 * 1024
        }
        val buffer = ByteBuffer.allocate(maxBufferSize)
        val bufferInfo = MediaCodec.BufferInfo()

        try {
            while (true) {
                bufferInfo.offset = 0
                bufferInfo.size = extractor.readSampleData(buffer, 0)
                if (bufferInfo.size < 0) {
                    bufferInfo.size = 0
                    break
                }
                bufferInfo.presentationTimeUs = extractor.sampleTime
                bufferInfo.flags = extractor.sampleFlags

                muxer.writeSampleData(muxerTrackIndex, buffer, bufferInfo)

                if (durationUs > 0) {
                    val progress = (bufferInfo.presentationTimeUs.toFloat() / durationUs.toFloat()).coerceIn(0f, 0.99f)
                    onProgress(progress)
                }

                extractor.advance()
            }
        } finally {
            try {
                muxer.stop()
                muxer.release()
            } catch (ignored: Exception) {}
        }
    }

    private fun extractToWav(
        extractor: MediaExtractor,
        trackIndex: Int,
        format: MediaFormat,
        outputFile: File,
        durationUs: Long,
        onProgress: (Float) -> Unit
    ) {
        extractor.selectTrack(trackIndex)
        val mime = format.getString(MediaFormat.KEY_MIME) ?: "audio/mp4a-latm"
        val decoder = MediaCodec.createDecoderByType(mime)
        decoder.configure(format, null, null, 0)
        decoder.start()

        val sampleRate = if (format.containsKey(MediaFormat.KEY_SAMPLE_RATE)) format.getInteger(MediaFormat.KEY_SAMPLE_RATE) else 44100
        val channelCount = if (format.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) format.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 2

        val fos = FileOutputStream(outputFile)
        // Write 44-byte blank WAV header to be back-filled later
        fos.write(ByteArray(44))

        var totalAudioLen = 0L
        val bufferInfo = MediaCodec.BufferInfo()
        var isExtractorDone = false
        var isDecoderDone = false

        try {
            while (!isDecoderDone) {
                if (!isExtractorDone) {
                    val inputBufferIndex = decoder.dequeueInputBuffer(10000)
                    if (inputBufferIndex >= 0) {
                        val inputBuffer = decoder.getInputBuffer(inputBufferIndex)
                        if (inputBuffer != null) {
                            val sampleSize = extractor.readSampleData(inputBuffer, 0)
                            if (sampleSize < 0) {
                                decoder.queueInputBuffer(inputBufferIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                                isExtractorDone = true
                            } else {
                                decoder.queueInputBuffer(inputBufferIndex, 0, sampleSize, extractor.sampleTime, 0)
                                extractor.advance()
                            }
                        }
                    }
                }

                val outputBufferIndex = decoder.dequeueOutputBuffer(bufferInfo, 10000)
                if (outputBufferIndex >= 0) {
                    if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                        isDecoderDone = true
                    }
                    val outputBuffer = decoder.getOutputBuffer(outputBufferIndex)
                    if (outputBuffer != null && bufferInfo.size > 0) {
                        outputBuffer.position(bufferInfo.offset)
                        outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                        val chunk = ByteArray(bufferInfo.size)
                        outputBuffer.get(chunk)
                        fos.write(chunk)
                        totalAudioLen += chunk.size

                        if (durationUs > 0) {
                            val progress = (bufferInfo.presentationTimeUs.toFloat() / durationUs.toFloat()).coerceIn(0f, 0.99f)
                            onProgress(progress)
                        }
                    }
                    decoder.releaseOutputBuffer(outputBufferIndex, false)
                }
            }
        } finally {
            fos.close()
            decoder.stop()
            decoder.release()
        }

        // Fill valid WAV header
        writeWavHeader(outputFile, totalAudioLen, totalAudioLen + 36, sampleRate.toLong(), channelCount, (16L * sampleRate * channelCount) / 8L)
    }

    private fun writeWavHeader(
        file: File,
        totalAudioLen: Long,
        totalDataLen: Long,
        longSampleRate: Long,
        channels: Int,
        byteRate: Long
    ) {
        val header = ByteArray(44)
        header[0] = 'R'.code.toByte()
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        header[4] = (totalDataLen and 0xff).toByte()
        header[5] = (totalDataLen shr 8 and 0xff).toByte()
        header[6] = (totalDataLen shr 16 and 0xff).toByte()
        header[7] = (totalDataLen shr 24 and 0xff).toByte()
        header[8] = 'W'.code.toByte()
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        header[12] = 'f'.code.toByte()
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16 // 16 for PCM
        header[17] = 0
        header[18] = 0
        header[19] = 0
        header[20] = 1 // PCM format = 1
        header[21] = 0
        header[22] = channels.toByte()
        header[23] = 0
        header[24] = (longSampleRate and 0xff).toByte()
        header[25] = (longSampleRate shr 8 and 0xff).toByte()
        header[26] = (longSampleRate shr 16 and 0xff).toByte()
        header[27] = (longSampleRate shr 24 and 0xff).toByte()
        header[28] = (byteRate and 0xff).toByte()
        header[29] = (byteRate shr 8 and 0xff).toByte()
        header[30] = (byteRate shr 16 and 0xff).toByte()
        header[31] = (byteRate shr 24 and 0xff).toByte()
        header[32] = (channels * 16 / 8).toByte() // block align
        header[33] = 0
        header[34] = 16 // bits per sample
        header[35] = 0
        header[36] = 'd'.code.toByte()
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        header[40] = (totalAudioLen and 0xff).toByte()
        header[41] = (totalAudioLen shr 8 and 0xff).toByte()
        header[42] = (totalAudioLen shr 16 and 0xff).toByte()
        header[43] = (totalAudioLen shr 24 and 0xff).toByte()

        val raf = RandomAccessFile(file, "rw")
        raf.seek(0)
        raf.write(header)
        raf.close()
    }
}
