module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // The worklets plugin turns `'worklet'` functions into UI-thread code for Reanimated and the
  // keyboard controller; it must stay the last plugin.
  plugins: ['@babel/plugin-transform-class-static-block', 'react-native-worklets/plugin'],
};
