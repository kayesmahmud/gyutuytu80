# Keep the JS bridge interface (accessed via @JavascriptInterface reflection)
-keepclassmembers class com.thulobazaar.editor.MainActivity$WebAppBridge {
    public *;
}
