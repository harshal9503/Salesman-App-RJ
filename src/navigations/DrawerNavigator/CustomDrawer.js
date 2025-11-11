import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerItemList,
} from '@react-navigation/drawer';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomDrawer = (props) => {
  const navigation = useNavigation();

  const handleLogout = async () => {
  await AsyncStorage.removeItem('userToken');
  navigation.replace('Login'); // Go back to login
};

  return (
    <View>
      <View>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <Image
            source={require('../../assets/DrawerImg/profile.jpg')} // replace with actual profile pic
            style={styles.profilePic}
          />
          <Text style={styles.profileName}>Kshitij Jain</Text>
          <Text style={styles.profileEmail}>kshitijain@gmail.com</Text>
        </View>

        <View style={styles.divider} />

        {/* Menu Items */}
        <DrawerItemList {...props} />
      </View>

      {/* Logout */}
      <View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Image source={require('../../assets/DrawerImg/logout.png')} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'flex-start',
    marginTop: 70,
    paddingBottom: 15,
    paddingLeft: 20,
  },
  profilePic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  profileName: {
    marginTop: 10,
    fontSize: 16,
    fontFamily:'Poppins-Bold',
    color: '#000',
  },
  profileEmail: {
    fontSize: 12,
    color: '#555',
    fontFamily:'Poppins-Regular',
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: Colors.PRIMARY,
    marginHorizontal: 15,
    marginVertical: 2,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 23,
    marginLeft: 10,
    color: Colors.PRIMARY,
    fontFamily:'Poppins-SemiBold',
  },
  logoutIcon:{
    width: 25,
    height: 25,
    tintColor: Colors.PRIMARY,
  }
});
