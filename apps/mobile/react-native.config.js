module.exports = {
  project: {
    ios: {},
    android: {},
  },
  // Static font instances (400/500/600/700) for Geist / Geist Mono / Noto Sans
  // Devanagari — names must match theme.fonts.staticFamilyByWeight in
  // @heliogrid/tokens. `npx react-native-asset` re-links these if native
  // wiring drifts; iOS Info.plist UIAppFonts + Android assets/fonts are the
  // checked-in result.
  assets: ['./assets/fonts'],
};
