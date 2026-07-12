package com.thulobazaar.editor

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.google.firebase.messaging.FirebaseMessaging
import java.lang.ref.WeakReference

/**
 * Holds the current FCM device token, persists it, and re-injects it into a
 * live WebView when it refreshes. MainActivity reads it (via the JS bridge and
 * on every page load); the web NativeFcmBridge registers it with the backend.
 */
object TokenStore {
    private const val PREFS = "editor_prefs"
    private const val KEY = "fcm_token"

    @Volatile
    var token: String? = null
        private set

    private var activityRef: WeakReference<MainActivity>? = null

    /** Called from MainActivity.onCreate — loads the cached token and refreshes it. */
    fun attach(activity: MainActivity) {
        activityRef = WeakReference(activity)
        token = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)

        FirebaseMessaging.getInstance().token.addOnSuccessListener { fresh ->
            update(activity.applicationContext, fresh)
        }
    }

    /** Called on token refresh (service) or initial fetch. */
    fun update(context: Context, newToken: String) {
        if (newToken == token) return
        token = newToken
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY, newToken)
            .apply()

        val activity = activityRef?.get() ?: return
        Handler(Looper.getMainLooper()).post { activity.injectFcmToken() }
    }
}
