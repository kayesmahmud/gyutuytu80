package com.thulobazaar.editor

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Full-screen WebView shell for the Thulo Bazaar editor panel.
 * Loads the live editor site, persists the login session (cookies), registers
 * the FCM token with the page, and deep-links notification taps to editor pages.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    companion object {
        private const val BASE_URL = "https://thulobazaar.com.np"
        // Start at the editor login; once authenticated it redirects to the
        // dashboard, and the session cookie persists across launches.
        private const val START_PATH = "/en/editor/login"
        private const val APP_HOST = "thulobazaar.com.np"
        private const val FILE_CHOOSER_REQUEST = 1001
        private const val NOTIF_PERMISSION_REQUEST = 2001
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.addJavascriptInterface(WebAppBridge(), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val host = request.url.host
                // Keep our own site in the WebView; hand off everything else to the browser.
                return if (host != null && (host == APP_HOST || host.endsWith(".$APP_HOST"))) {
                    false
                } else {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String?) {
                injectFcmToken()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?,
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                val intent = params?.createIntent()
                return try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST)
                    true
                } catch (e: Exception) {
                    filePathCallback = null
                    false
                }
            }
        }

        requestNotificationPermissionIfNeeded()
        TokenStore.attach(this)

        if (savedInstanceState == null) {
            webView.loadUrl(routeUrlFromIntent(intent) ?: (BASE_URL + START_PATH))
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        routeUrlFromIntent(intent)?.let { webView.loadUrl(it) }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    /** Build a deep-link URL from a notification's "route" extra (e.g. /editor/ad-management). */
    private fun routeUrlFromIntent(intent: Intent?): String? {
        val route = intent?.getStringExtra("route")?.takeIf { it.isNotBlank() } ?: return null
        var path = if (route.startsWith("/")) route else "/$route"
        // Chat pushes come from the shared consumer payload (route "/chat" is a
        // Flutter-app route); on the web that conversation lives on /messages.
        if (path == "/chat") {
            val conversationId = intent.getStringExtra("conversationId")?.takeIf { it.isNotBlank() }
            path = if (conversationId != null) "/messages?conversation=$conversationId" else "/messages"
        }
        return "$BASE_URL/en$path"
    }

    /** Push the current FCM token into the page so NativeFcmBridge can register it. */
    fun injectFcmToken() {
        val token = TokenStore.token ?: return
        val js = "window.__FCM_TOKEN__=${jsString(token)};" +
            "window.dispatchEvent(new Event('fcm-token'));"
        webView.evaluateJavascript(js, null)
    }

    private fun jsString(s: String): String =
        "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIF_PERMISSION_REQUEST)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST) {
            val result = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            filePathCallback?.onReceiveValue(result ?: arrayOf())
            filePathCallback = null
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    inner class WebAppBridge {
        @JavascriptInterface
        fun getFcmToken(): String? = TokenStore.token
    }
}
