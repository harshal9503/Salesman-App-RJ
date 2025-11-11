import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  DrawerItemList,
} from '@react-navigation/drawer';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomDrawer = (props) => {
  const navigation = useNavigation();

  const [salesmanData, setSalesmanData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalesmanDetails = async () => {
    try {
      const response = await fetch('https://rajmanijewellers.in/api/salesman/get-salesman-details');
      const json = await response.json();
      if (json.success && json.data) {
        setSalesmanData(json.data);
        console.log('Salesman Details:', json);
      } else {
        console.warn('Failed to fetch salesman details:', json.message);
      }
    } catch (error) {
      console.error('Error fetching salesman details:', error);
    }
  };

  useEffect(() => {
    fetchSalesmanDetails();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSalesmanDetails().finally(() => setRefreshing(false));
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.replace('Login'); // Go back to login
  };

  // Get profile image source
  const getProfileImageSource = () => {
    if (salesmanData?.image?.fileLocation) {
      return { uri: salesmanData.image.fileLocation };
    }
    return require('../../assets/DrawerImg/profile.jpg');
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.PRIMARY]}
          tintColor={Colors.PRIMARY}
        />
      }
      style={{ flex: 1 }}
    >
      <View>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <Image
            source={getProfileImageSource()}
            style={styles.profilePic}
            defaultSource={require('../../assets/DrawerImg/profile.jpg')}
            onError={(e) => {
              console.log('Error loading profile image:', e.nativeEvent.error);
              // Fallback to default image if there's an error loading the remote image
            }}
          />
          <Text style={styles.profileName}>
            {salesmanData?.salesmanName || 'Loading...'}
          </Text>
          <Text style={styles.profileEmail}>
            {salesmanData?.email || 'Loading...'}
          </Text>
          {/* <Text style={styles.profileContact}>
            {salesmanData?.contactNumber ? `+91 ${salesmanData.contactNumber}` : ''}
          </Text> */}
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
    </ScrollView>
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
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  profileEmail: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  profileContact: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
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
    fontFamily: 'Poppins-SemiBold',
  },
  logoutIcon: {
    width: 25,
    height: 25,
    tintColor: Colors.PRIMARY,
  }
});