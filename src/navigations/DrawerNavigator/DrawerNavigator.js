import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Image, StyleSheet } from 'react-native';

import ContactScreen from '../../screens/ContactScreen/ContactScreen';
import AboutScreen from '../../screens/AboutScreen/AboutScreen';
import BottomTabNavigator from '../BottomNavigator/BottomTabNavigator';
import CustomDrawer from './CustomDrawer';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawer {...props} />}
      swipeEnabled={false}
      screenOptions={({ route }) => ({
        drawerActiveBackgroundColor: '#fff',
        drawerActiveTintColor: '#000',
        drawerInactiveTintColor: '#555',
        drawerLabelStyle: {
          marginLeft: 6,
          fontSize: 16,
          fontFamily:'Poppins-SemiBold'
        },
        drawerStyle: {
          width: wp('65%'),
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
        },
        headerShown: false,
        drawerIcon: ({ focused, size, color }) => {
          const icons = {
            Home: require('../../assets/DrawerImg/homeoutline.png'),
            Contact: require('../../assets/DrawerImg/contact.png'),
            'About Us': require('../../assets/DrawerImg/info.png'),
          };
          return (
            <Image
              source={icons[route.name]}
              style={[styles.icon, { tintColor: color }]}
            />
          );
        },
      })}
    >
      <Drawer.Screen name="Home" component={BottomTabNavigator} />
      <Drawer.Screen name="Contact" component={ContactScreen} />
      <Drawer.Screen name="About Us" component={AboutScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
