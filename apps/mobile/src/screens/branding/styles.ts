import { StyleSheet } from 'react-native';

/* The full-size cover (`SCR-M01-18` m18-f): the sheet's body holds the sheet at its column width and
   never scrolls sideways past it. */
export const styles = StyleSheet.create({
  fullSize: {
    flex: 1,
    overflow: 'hidden',
  },
});
