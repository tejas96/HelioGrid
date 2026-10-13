package com.heliogridmobile

import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "HelioGridMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // React Native decides edge to edge while the delegate is created, in super.onCreate.
    if (isEdgeToEdgeFeatureFlagOn) keepContentAboveKeyboard()
  }

  /**
   * Edge to edge (React Native turns it on from API 35) makes Android stop resizing the window for
   * the keyboard, so the manifest's `adjustResize` does nothing and a focused field under the
   * keyboard stays under it. The keyboard's height is given back here as the content's bottom
   * padding, less the system bar the keyboard covers, which every screen already keeps clear: each
   * screen and each field rises as before, and none of them knows. Without edge to edge Android
   * resizes the window itself, so the listener is not installed.
   */
  private fun keepContentAboveKeyboard() {
    val content = findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
      val bar = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
      view.setPadding(0, 0, 0, maxOf(keyboard - bar, 0))
      insets
    }
  }
}
