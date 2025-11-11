import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeCards from '../../components/HomeComponets/HomeCards';
import { Colors } from '../../constants/Colors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://rajmanijewellers.in';

const HomeScreen = () => {
  const navigation = useNavigation();

  const [salesData, setSalesData] = useState({ cash: 0, upi: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getTodayFormattedDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchSalesData = async () => {
    if (!refreshing) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Fetched token:', token);
      if (!token) {
        Alert.alert('Authentication', 'User token not found, please login again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const formattedDate = getTodayFormattedDate();
      const url = `${API_BASE_URL}/api/salesman/salesman-dashboard/${formattedDate}`;
      console.log('Fetching sales data from:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      console.log('Sales data API response:', response.data);

      if (response.data.success && response.data.sales && response.data.repairing) {
        // Add cash and upi from both sales and repairing
        const totalCash =
          (response.data.sales.cash ?? 0) + (response.data.repairing.cash ?? 0);
        const totalUpi =
          (response.data.sales.upi ?? 0) + (response.data.repairing.upi ?? 0);

        setSalesData({
          cash: totalCash,
          upi: totalUpi,
        });
      } else {
        Alert.alert('Error', 'Failed to fetch sales data');
      }
    } catch (error) {
      console.log(
        'Error fetching sales data:',
        error.response?.status,
        error.message,
        error.response?.data
      );
      if (error.response?.status === 404) {
        Alert.alert('Error 404', 'API endpoint not found. Please verify the API URL.');
      } else {
        Alert.alert('Error', 'An error occurred while fetching sales data');
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSalesData();
  }, []);

  const formatAmount = amount => {
    if (amount == null) return '₹0.00';

    const amountStr = parseFloat(amount).toFixed(2);
    const parts = amountStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formatted =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + decimalPart;

    return `₹${formatted}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuIconImg}
        >
          <Image
            source={require('../../assets/menu.png')}
            style={styles.IconImg}
          />
        </TouchableOpacity>

        <Image
          source={require('../../assets/homelogo.png')}
          style={styles.logo}
        />
        <Text style={styles.appTitle}>Rajmani Jewellers</Text>
      </View>

      {/* White Curve Section */}
      <View style={styles.curveContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <HomeCards />
        </ScrollView>
      </View>

      <View style={styles.containerbox}>
        <View style={styles.innerBox}>
          <Text style={styles.title}>Cash</Text>
          <Text style={styles.amount}>
            {loading && !refreshing ? 'Loading...' : formatAmount(salesData.cash)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.innerBox}>
          <Text style={styles.title}>UPI</Text>
          <Text style={styles.amount}>
            {loading && !refreshing ? 'Loading...' : formatAmount(salesData.upi)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    paddingTop: hp('2%'),
  },
  topStatusBar: {
    height: hp('1%'),
    width: '100%',
    backgroundColor: Colors.PRIMARY,
  },
  header: {
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  IconImg: {
    width: wp('7.5%'),
    height: wp('7.1%'),
  },
  menuIconImg: {
    tintColor: '#fff',
    position: 'absolute',
    left: wp('5%'),
    top: hp('0%'),
  },
  logo: {
    width: wp('15%'),
    height: wp('15%'),
    resizeMode: 'contain',
    marginBottom: hp('1%'),
  },
  appTitle: {
    fontSize: wp('5%'),
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: hp('2%'),
  },
  curveContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: wp('10%'),
    borderTopRightRadius: wp('10%'),
    padding: wp('5%'),
    marginTop: hp('5%'),
  },
  containerbox: {
    flexDirection: 'row',
    position: 'absolute',
    top: '17%',
    left: '13%',
    width: '75%',
    height: hp('12%'),
    backgroundColor: '#ffffff',
    borderRadius: wp('4%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
  },
  innerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: Colors.PRIMARY,
    marginHorizontal: wp('3%'),
  },
  title: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-SemiBold',
    color: Colors.PRIMARY,
  },
  amount: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
});
