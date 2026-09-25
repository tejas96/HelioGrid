module.exports = {
  project: {
    ios: {},
    android: {},
  },
  // Static font instances, one per weight, named `<Family>-<Weight>.ttf` —
  // `pnpm check:languages` refuses a sans-stack family missing one here, in
  // Android assets/fonts, or in the iOS font lists. `npx react-native-asset`
  // re-links them; iOS Info.plist UIAppFonts + Android assets/fonts are the
  // checked-in result.
  assets: ['./assets/fonts'],
};
