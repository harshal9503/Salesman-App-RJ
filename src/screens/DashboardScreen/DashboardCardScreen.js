// DashboardComponent.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import DatePicker from 'react-native-date-picker';
import { useNavigation } from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://rajmanijewellers.in';

const DashboardComponent = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const fetchDashboardData = async selectedDate => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        alert('User token not found, please login again.');
        setLoading(false);
        return;
      }
      const isoDate = selectedDate.toISOString().split('T')[0];
      const url = `${API_BASE_URL}/api/salesman/salesman-dashboard/${isoDate}`;
      console.log('Fetching dashboard data from:', url);
      console.log('Using token:', token);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      console.log('Dashboard API response:', response.data);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(date);
  }, [date]);

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

  const renderSection = (title, color, cash, upi, pending, total) => {
    return (
      <View style={styles.sectionContainer}>
        <View style={[styles.titleContainer, { backgroundColor: color }]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <View style={styles.totalAmountRow}>
          <Image
            source={require('../../assets/HomeImg/coin.png')}
            style={styles.iconImage}
          />
          <Text style={styles.totalAmount}> {formatAmount(total)}</Text>
        </View>

        <View style={styles.paymentRow}>
          <View style={[styles.paymentBox, { borderColor: color }]}>
            <Text style={styles.paymentTitle}>Cash</Text>
            <Text style={styles.paymentValue}>{formatAmount(cash)}</Text>
          </View>
          <View style={[styles.paymentBox, { borderColor: color }]}>
            <Text style={styles.paymentTitle}>UPI</Text>
            <Text style={styles.paymentValue}>{formatAmount(upi)}</Text>
          </View>
        </View>

        <View style={[styles.pendingBox, { borderColor: color }]}>
          <Text style={styles.pendingLabel}>Pending</Text>
          <Text style={styles.pendingValue}>{formatAmount(pending)}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.statusBarBackground} />
      <View style={styles.backButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        <View style={styles.dateBox}>
          <Text style={styles.dateText}>
            {`${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('default', {
              month: 'long',
            })} ${date.getFullYear()}`}
          </Text>
          <TouchableOpacity onPress={() => setOpen(true)}>
            <Image source={require('../../assets/calendar.png')} style={styles.calendarIcon} />
          </TouchableOpacity>
        </View>

        {loading && <Text style={{ textAlign: 'center', marginVertical: hp('2%') }}>Loading...</Text>}
        {error && <Text style={{ textAlign: 'center', marginVertical: hp('2%'), color: 'red' }}>{error}</Text>}

        {dashboardData && dashboardData.success && (
          <>
            {renderSection(
              'Total Sale',
              Colors.PRIMARY,
              dashboardData.sales.cash,
              dashboardData.sales.upi,
              dashboardData.sales.pending,
              dashboardData.sales.total,
            )}
            {renderSection(
              'Total Repair',
              Colors.BTNRED,
              dashboardData.repairing.cash,
              dashboardData.repairing.upi,
              dashboardData.repairing.pending,
              dashboardData.repairing.total,
            )}
          </>
        )}
      </ScrollView>
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        theme="light"
        onConfirm={selectedDate => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
};

export default DashboardComponent;

const styles = StyleSheet.create({
  container: {
    paddingBottom: hp('10%'),
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#fff',
  },
  statusBarBackground: {
    height: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.PRIMARY,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: 5,
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 3,
  },
  backButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backarrow: {
    width: wp('4%'),
    height: wp('4%'),
    resizeMode: 'contain',
    marginRight: wp('2%'),
  },
  backText: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
    color: '#000',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingBottom: wp('3%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  headerTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
    color: Colors.PRIMARY,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
    height: hp('4%'),
    paddingHorizontal: wp('5%'),
  },
  dateText: {
    fontSize: wp('3%'),
    fontWeight: '500',
    textAlign: 'center',
    color: Colors.BTNGREEN,
    flex: 1,
  },
  calendarIcon: {
    width: wp('4%'),
    height: wp('4%'),
    resizeMode: 'contain',
  },
  sectionContainer: {
    marginBottom: hp('2.5%'),
    paddingHorizontal: wp('5%'),
  },
  titleContainer: {
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  titleText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: wp('4%'),
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1.5%'),
    marginBottom: hp('1.2%'),
    justifyContent: 'center',
  },
  iconImage: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
  },
  totalAmount: {
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-SemiBold',
    marginLeft: wp('2%'),
    color: '#000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp('1.5%'),
    gap: wp('2%'),
  },
  paymentBox: {
    borderWidth: 1,
    borderRadius: wp('2%'),
    width: '48%',
    padding: hp('1.5%'),
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  paymentTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: wp('3.5%'),
    marginBottom: hp('0.5%'),
    color: '#000',
  },
  paymentValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  pendingBox: {
    borderWidth: 1,
    borderRadius: wp('2%'),
    alignItems: 'center',
    padding: hp('1.5%'),
    marginTop: hp('1%'),
  },
  pendingLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: wp('3.5%'),
    marginBottom: hp('0.5%'),
    color: '#000',
  },
  pendingValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: wp('3.5%'),
    color: '#000',
  },
});
