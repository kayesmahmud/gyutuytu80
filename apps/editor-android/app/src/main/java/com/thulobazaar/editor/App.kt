package com.thulobazaar.editor

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager

class App : Application() {

    companion object {
        // Must match the channelId the backend sends (notification.service.ts).
        const val CHANNEL_ID = "thulobazaar_notifications"
    }

    override fun onCreate() {
        super.onCreate()

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Editor alerts",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "New ads, verification requests and support messages"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}
