package com.heliogridmobile

import android.app.Application
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
    // Android finds a font by FILE name, so `fontFamily: 'Geist'` with a weight matches nothing and
    // draws Roboto; each family is registered here under the theme's name, with its weights from
    // res/font/<family>.xml. `check:languages` refuses a family this list does not register.
    ReactFontManager.getInstance().addCustomFont(this, "Geist", R.font.geist)
    ReactFontManager.getInstance().addCustomFont(this, "Geist Mono", R.font.geistmono)
    ReactFontManager.getInstance().addCustomFont(this, "Noto Sans Devanagari", R.font.notosansdevanagari)
    loadReactNative(this)
  }
}
