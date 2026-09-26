module.exports = {
  project: {
    ios: {},
    android: {},
  },
  // Static font instances, one per weight, named `<Family>-<Weight>.ttf` —
  // `pnpm check:languages` refuses a sans-stack family missing one here or in
  // the iOS font lists. `npx react-native-asset` links iOS (Info.plist
  // UIAppFonts). Android is NOT linked from here: it finds a font by file name,
  // so its faces live in android/app/src/main/res/font as `<family>_<weight>`,
  // lowercase, one `<family>.xml` per family, registered in MainApplication.kt;
  // move any copy the linker drops into android/.../assets/fonts there.
  assets: ['./assets/fonts'],
};
