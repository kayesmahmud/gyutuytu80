# ============================================================================
# ProGuard / R8 rules for Thulo Bazaar production release
# ============================================================================

# ---------- Flutter ----------
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**

# ---------- Firebase / FCM ----------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Keep FCM notification service
-keep class * extends com.google.firebase.messaging.FirebaseMessagingService { *; }

# ---------- Google Sign-In ----------
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# ---------- Google Mobile Ads (AdMob) ----------
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# ---------- OkHttp / ucrop (image_cropper transitive dep) ----------
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-dontwarn okio.**
-keep class okio.** { *; }
-keep class com.yalantis.ucrop.** { *; }
-dontwarn com.yalantis.ucrop.**

# ---------- flutter_local_notifications ----------
-keep class com.dexterous.** { *; }

# ---------- WebView (webview_flutter) ----------
-keep class * extends android.webkit.WebViewClient
-keep class * extends android.webkit.WebChromeClient
-keepclassmembers class * extends android.webkit.WebViewClient { *; }

# ---------- image_picker / share_plus / path_provider ----------
-keep class androidx.core.** { *; }
-keep class androidx.lifecycle.** { *; }

# ---------- Gson / JSON reflection (used by some plugins) ----------
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keep class com.google.gson.** { *; }
-keep class sun.misc.Unsafe { *; }
-keep class * implements java.io.Serializable { *; }

# ---------- Play Core (deferred components / in-app updates) ----------
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**

# ---------- Generic safety nets ----------
# Keep generic types info for reflection-based JSON libs
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepattributes AnnotationDefault

# Keep source file names & line numbers for Crashlytics stack traces
-keepattributes SourceFile, LineNumberTable
-renamesourcefileattribute SourceFile

# ---------- Kotlin ----------
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
