package com.heliogridmobile

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // The app is light-only (F7-04). Without this a phone in dark mode reports night to every
    // window, and React Native then draws light system buttons on a dark bar under a white page —
    // on the activity and on each dialog it opens.
    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
    // Android finds a font by FILE name, so `fontFamily: 'Geist'` with a weight matches nothing and
    // draws Roboto; each family is registered here under the theme's name, with its weights from
    // res/font/<family>.xml. The invariant language-fonts refuses a family this list does not
    // register.
    ReactFontManager.getInstance().addCustomFont(this, "Geist", R.font.geist)
    ReactFontManager.getInstance().addCustomFont(this, "Geist Mono", R.font.geistmono)
    ReactFontManager.getInstance().addCustomFont(this, "Noto Sans Devanagari", R.font.notosansdevanagari)
    loadReactNative(this)
  }
}
