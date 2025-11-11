import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';

import HomeScreen from '../../screens/HomeScreen/HomeScreen';
import DashboardScreen from '../../screens/DashboardScreen/DashboardScreen';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

const isLandscape = width > height;

const BottomTabNavigator = () => {
  const [activeTab, setActiveTab] = useState('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Dashboard':
        return <DashboardScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>

      <View style={styles.curveBackground}>
        <View style={styles.curveOne}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('Home')}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              {activeTab === 'Home' ? (
                <Image
                  source={require('../../assets/HomeImg/shadowcircle.png')}
                  style={styles.circleShadow}
                />
              ) : (
                <View style={styles.circleFallback} />
              )}
              <Image
                source={require('../../assets/homeicon.png')}
                style={[styles.icon, activeTab === 'Home' && styles.activeIcon]}
              />
              <Text
                style={[
                  styles.label,
                  activeTab === 'Home' && styles.visibleLabel,
                ]}
              >
                Home
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.curveTwo}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('Dashboard')}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              {activeTab === 'Dashboard' ? (
                <Image
                  source={require('../../assets/HomeImg/shadowcircle.png')}
                  style={styles.circleShadow1}
                />
              ) : (
                <View style={styles.circleFallback1} />
              )}
              <Image
                source={require('../../assets/boxicon.png')}
                style={[
                  styles.icon1,
                  activeTab === 'Dashboard' && styles.activeIcon1,
                ]}
              />
              <Text
                style={[
                  styles.label1,
                  activeTab === 'Dashboard' && styles.visibleLabel,
                ]}
              >
                Dashboard
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenContainer: {
    flex: 1,
  },
  curveBackground: {
    position: 'absolute',
    bottom: 0,
    width:'100%',
    height: hp('11%'),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 20,
    overflow: 'visible',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: wp('20%'),
    height: wp('20%'),
    backgroundColor:'transparent'
  },
  circleShadow: {
    width: wp('28%'),
    height: wp('28%'),
    resizeMode: 'contain',
    position: 'absolute',
    top: '-23%',
    left: '-21%',
  },
  circleFallback: {
    width: wp('17%'),
    height: wp('17%'),
    backgroundColor: '#f0f0f0',
    borderRadius: wp('8.5%'),
    position: 'absolute',
    top: '7%',
    left: '7%',
  },
  icon: {
    width: wp('7%'),
    height: wp('7%'),
    tintColor: '#999',
    top: hp('1.3%'),
    left: wp('0%'),
  },
  activeIcon: {
    tintColor: '#2d0073',
    position: 'absolute',
    top: hp('2.8%'),
    left: wp('6.5%'),
  },
  activeIcon1: {
    tintColor: '#2d0073',
    position: 'absolute',
    top: hp('3%'),
    left: wp('6.5%'),
  },
  label: {
    fontSize: wp('3.3%'),
    color: '#2d0073',
    fontFamily: 'Poppins-SemiBold',
    opacity: 0,
    marginTop: hp('0.5%'),
    top: hp('5.5%'),
    left: wp('0.2%'),
  },
  visibleLabel: {
    opacity: 1,
  },
  circleShadow1: {
    width: wp('28%'),
    height: wp('28%'),
    resizeMode: 'contain',
    position: 'absolute',
    top: '-23%',
    left: '-21%',
  },
  circleFallback1: {
    width: wp('17%'),
    height: wp('17%'),
    backgroundColor: '#f0f0f0',
    borderRadius: wp('8.5%'),
    position: 'absolute',
    top: '7%',
    left: '7%',
  },
  icon1: {
    width: wp('7%'),
    height: wp('7%'),
    tintColor: '#999',
    top: '15%',
    left: '0%',
  },
  label1: {
    fontSize: wp('3.3%'),
    color: '#2d0073',
    fontFamily: 'Poppins-SemiBold',
    opacity: 0,
    marginTop: hp('0.5%'),
    top: hp('5.5%'),
    left: wp('0.2%'),
  },
  curveOne: {
    position: 'absolute',
    width: wp('21%'),
    height: wp('21%'),
    backgroundColor: 'transparent',
    borderRadius: wp('10.5%'),
    left: wp('12%'),
    top: -hp('4.5%'),
  },
  curveTwo: {
    position: 'absolute',
    width: wp('21%'),
    height: wp('21%'),
    backgroundColor: 'transparent',
    borderRadius: wp('10.5%'),
    right: wp('12%'),
    top: -hp('4.5%'),
  },
});
