import React, { useEffect, useState } from 'react';
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
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../../api/baseurl';

const ThirdInvoicePayment = ({ navigation, route }) => {
  const [showQR, setShowQR] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [AdvanceAmount, setAdvanceAmount] = useState();
  const [cashData, setCashData] = useState(0);
  const [upiData, setUpiData] = useState(0);
  const [pandingAmount, setPandingAmount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState({
    upi: '',
    cash: '',
    advanceAmount: '',
  });
  const { productDetails, customerDetails, invoiceDetails, isUpdate, id } =
    route.params;

  useEffect(() => {
    const cash = Number(cashData) || 0;
    const upi = Number(upiData) || 0;
    setAdvanceAmount(cash + upi);
    setPaymentDetails(prev => ({
      ...prev,
      advanceAmount: AdvanceAmount,
    }));
  }, [cashData, upiData]);

  useEffect(() => {
    const expected = Number(productDetails?.[0]?.expectedAmount) || 0;
    const advance = Number(AdvanceAmount) || 0;

    const pendingData = expected - advance;
    setPandingAmount(pendingData);
  }, [AdvanceAmount, productDetails]);

  const handlePaymentDone = async () => {
    // console.log('check date od data', paymentDetails);
    try {
      const token = await AsyncStorage.getItem('userToken');
      let response;

      console.log('Payload:', {
        paymentDetails,
        productDetails,
        customerDetails,
        invoiceDetails,
        isUpdate,
        id,
      });

      if (isUpdate) {
        response = await axios.patch(
          `${baseUrl}/salesman/update-custom-order-by-id/${id}`,
          {
            productDetails,
            customerDetails,
            invoiceDetails,
            paymentDetails,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        Alert.alert('Success', 'Invoice Updated successfully!');
      setModalVisible(false);
      } else {
        response = await axios.post(
          `${baseUrl}/salesman/create-custom-order`,
          {
            productDetails,
            customerDetails,
            invoiceDetails,
            paymentDetails,
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
      }
      // console.log('Server response:', response.data);

      
      navigation.navigate('custom-order-invoice');
    } catch (error) {
      console.error('Error submitting invoice:', error);

      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data); // real backend error
        Alert.alert('Error', error.response.data.message || 'Server error');
      } else if (error.request) {
        console.log('No response:', error.request);
        Alert.alert('Error', 'No response from server. Check your connection.');
      } else {
        console.log('Error message:', error.message);
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      {/* Back Button */}
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

      {/* Scrollable Content */}
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
          <Text style={styles.amount}>
            Payable amount = ₹{productDetails[0].expectedAmount}
          </Text>

          <View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Advance Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="₹8000.00"
                value={String(AdvanceAmount)}
                editable={false}
                onChangeText={value =>
                  setPaymentDetails('advanceAmount', AdvanceAmount)
                }
              />
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Panding Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="₹8000.00"
                value={String(pandingAmount)}
                onChangeText={value => setPaymentDetails({ pending: value })}
              />
            </View>
          </View>

          {/* Labels */}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Mode of payment</Text>
            <Text style={styles.paymentLabel}>Payment</Text>
          </View>

          {/* Payment Fields */}
          {['Cash', 'UPI'].map((mode, index) => (
            <View key={index} style={styles.paymentRow}>
              {/* Mode Name */}
              <TextInput
                style={styles.modeInput}
                value={mode}
                editable={false}
              />

              {/* Amount Input */}
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={
                  mode === 'Cash' ? paymentDetails.cash : paymentDetails.upi
                }
                onChangeText={value => {
                  setPaymentDetails(prev => ({
                    ...prev,
                    [mode.toLowerCase()]: value,
                  }));

                  if (mode === 'Cash') {
                    setCashData(value); // ✅ pass value to cash
                  } else if (mode === 'UPI') {
                    setUpiData(value); // ✅ pass value to upi
                  }
                }}
              />
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ₹{productDetails[0].expectedAmount}
            </Text>
          </View>

          {/* Toggle QR */}
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

          {/* QR Image */}
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

      {/* Done Button */}
      <View style={styles.bottonBox}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.doneText}>Payment Done</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm Modal */}
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
                <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePaymentDone}
                style={[
                  styles.modalButton,
                  { backgroundColor: Colors.BTNGREEN },
                ]}
              >
                <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ThirdInvoicePayment;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
  },
  header: {
    textAlign: 'center',
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-SemiBold',
    marginBottom: hp('1.5%'),
    color: '#000',
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
    fontSize: wp('3.5%'),
    backgroundColor: '#f9f9f9',
    fontFamily: 'Poppins-Regular',
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
    textAlign: 'right',
    fontFamily: 'Poppins-Regular',
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
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    elevation: 5,
  },
  doneText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: wp('4%'),
    marginTop: 3,
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
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
});
