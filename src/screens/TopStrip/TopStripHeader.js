import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TopStripHeader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.blueStrip} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#211C84',
    width: '100%',
  },
  blueStrip: {
    height: 20, // Visible height of the strip below the status bar
    width: '100%',
  },
});

export default TopStripHeader;
