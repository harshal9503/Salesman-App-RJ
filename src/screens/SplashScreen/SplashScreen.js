import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  StatusBar,
  ImageBackground,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        navigation.replace('Main'); // replace to avoid going back to splash
      } else {
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(checkLoginStatus, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ImageBackground
        source={require('../../assets/background.jpeg')}
        style={styles.background}
        resizeMode="cover"
        onProgress={() => navigation.replace('Login')}
      >
        <View style={styles.overlay}>
          <Image
            source={require('../../assets/homelogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>
    </>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
});
