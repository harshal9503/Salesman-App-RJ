import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { baseUrl } from '../../api/baseurl';

const SecondInvoicePayment = ({ route, navigation }) => {
  const [showQR, setShowQR] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Initialize paymentDetails with empty strings instead of '0.000'
  const [paymentDetails, setPaymentDetails] = useState({
    Cash: '',
    UPI: '',
  });

  const { customerDetails, productDetails, invoiceDetails, salesmanContactNumber } = route.params;

  const [payableAmount, setPayableAmount] = useState('0.000');

  useEffect(() => {
    let total = 0;
    productDetails.forEach(item => {
      total += parseFloat(item.finalAmount) || 0;
    });
    setPayableAmount(total.toFixed(3));

    // Reset payment details to empty strings when payable amount changes
    setPaymentDetails({ Cash: '', UPI: '' });
  }, [productDetails]);

  const validateAndSetPayment = (mode, value) => {
    let val = value.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const parts = val.split('.');
      parts[1] = parts[1].substring(0, 3);
      val = parts[0] + '.' + parts[1];
    }

    if (val.startsWith('-')) {
      val = val.replace('-', '');
    }

    // Calculate sum of other payment modes
    const currentOtherAmount = Object.keys(paymentDetails)
      .filter(k => k !== mode)
      .reduce((sum, k) => sum + parseFloat(paymentDetails[k] || 0), 0);

    if (parseFloat(val || 0) + currentOtherAmount > parseFloat(payableAmount)) {
      Alert.alert(
        'Invalid Amount',
        `Total payment cannot exceed payable amount ₹${payableAmount}`
      );
      val = (parseFloat(payableAmount) - currentOtherAmount).toFixed(3);
      if (parseFloat(val) < 0) {
        val = '';
      }
    }

    setPaymentDetails(prev => ({ ...prev, [mode]: val }));
  };

  const totalPayment = () => {
    return Object.values(paymentDetails).reduce(
      (sum, val) => sum + parseFloat(val || 0),
      0
    );
  };

  const handlePaymentDone = async () => {
    if (totalPayment() === 0) {
      Alert.alert('Payment Required', 'Please enter payment amounts before proceeding.');
      return;
    }
    if (totalPayment() > parseFloat(payableAmount)) {
      Alert.alert('Payment Error', 'Total payment exceeds payable amount.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await axios.post(
        `${baseUrl}/salesman/create-repair-invoice`,
        {
          invoiceDetails,
          customerDetails,
          productDetails,
          paymentDetails,
          salesmanContactNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert('Success', 'Invoice created successfully!');
      setModalVisible(false);
      navigation.navigate('get-all-invoices');
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Server error');
      } else if (error.request) {
        Alert.alert('Error', 'No response from server. Check your connection.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      <View style={styles.backButton}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonTouch}
        >
          <Image
            source={require('../../assets/backarrow.png')}
            style={styles.backarrow}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: hp('20%') }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Make Payment</Text>
          <Text style={styles.amount}>Payable amount = ₹{payableAmount}</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Mode of payment</Text>
            <Text style={styles.paymentLabel}>Payment</Text>
          </View>

          {['Cash', 'UPI'].map((mode, index) => (
            <View key={index} style={styles.paymentRow}>
              <TextInput
                style={styles.modeInput}
                value={mode}
                editable={false}
              />
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="Not filled"
                placeholderTextColor="#999"
                value={paymentDetails[mode]}
                onChangeText={value => validateAndSetPayment(mode, value)}
              />
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{totalPayment().toFixed(3)}</Text>
          </View>

          <TouchableOpacity
            style={styles.qrToggle}
            onPress={() => setShowQR(!showQR)}
          >
            <Text style={styles.qrToggleText}>
              {showQR ? 'Close QR code' : 'Open QR code'}
            </Text>
            <Image
              source={require('../../assets/greendrop.png')}
              style={styles.qrToggleIcon}
            />
          </TouchableOpacity>

          {showQR && (
            <View style={styles.qrContainer}>
              <Image
                source={require('../../assets/barcode.jpg')}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottonBox}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.doneText}>Payment Done</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Are you sure payment is completed?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              >
                <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePaymentDone}
                style={[
                  styles.modalButton,
                  { backgroundColor: Colors.BTNGREEN },
                ]}
              >
                <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
  },
  header: {
    textAlign: 'center',
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-Bold',
    color: 'red',
    marginBottom: hp('1.5%'),
  },
  amount: {
    textAlign: 'center',
    fontSize: wp('4%'),
    fontFamily: 'Poppins-SemiBold',
    marginBottom: hp('2%'),
    color: '#000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  paymentLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  modeInput: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#aaa',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2%'),
    fontFamily: 'Poppins-Regular',
    fontSize: wp('3.5%'),
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  amountInput: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#aaa',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Regular',
    textAlign: 'right',
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1.5%'),
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  totalLabel: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  totalAmount: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  qrToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('2%'),
  },
  qrToggleText: {
    fontSize: wp('4%'),
    color: Colors.BTNGREEN,
    fontFamily: 'Poppins-SemiBold',
  },
  qrToggleIcon: {
    width: wp('4.6%'),
    height: hp('1.2%'),
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  qrImage: {
    width: wp('70%'),
    height: wp('70%'),
  },
  doneButton: {
    backgroundColor: Colors.BTNGREEN,
    paddingVertical: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    elevation: 5,
  },
  doneText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('4%'),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: 5,
    paddingHorizontal: 10,
  },
  backButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backarrow: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    resizeMode: 'contain',
    marginRight: wp('2%'),
  },
  backText: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Bold',
    marginTop: 5,
    color: '#000',
  },
  bottonBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp('80%'),
    backgroundColor: '#fff',
    padding: wp('5%'),
    borderRadius: wp('2%'),
    elevation: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: wp('4%'),
    marginBottom: hp('2%'),
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: hp('1.5%'),
    marginHorizontal: wp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
});

export default SecondInvoicePayment;
