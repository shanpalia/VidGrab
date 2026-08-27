package com.shanpalia.vidgrab.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.shanpalia.vidgrab.data.model.AppSetting
import com.shanpalia.vidgrab.data.model.DownloadItem
import com.shanpalia.vidgrab.data.model.DownloadStatus
import com.shanpalia.vidgrab.data.model.HistoryItem

class Converters {
    @TypeConverter
    fun fromDownloadStatus(status: DownloadStatus): String = status.name

    @TypeConverter
    fun toDownloadStatus(value: String): DownloadStatus = try {
        DownloadStatus.valueOf(value)
    } catch (e: Exception) {
        DownloadStatus.WAITING
    }
}

@Database(
    entities = [DownloadItem::class, HistoryItem::class, AppSetting::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun downloadDao(): DownloadDao
    abstract fun historyDao(): HistoryDao
    abstract fun settingDao(): SettingDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "vidgrab.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
