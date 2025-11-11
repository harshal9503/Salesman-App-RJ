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
  Alert,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';



const InvoicePaymentScreen = ({ route, navigation }) => {
  const [showQR, setShowQR] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');
  const [pending, setPending] = useState('0');
  const [paymentDetails, setPaymentDetails] = useState({ cash: 0, upi: 0, pending: 0 });




  const { customerDetails, productDetails, invoiceDetails } = route.params;




  // Calculate total amount rounded to integer
  const totalAmount = Math.round(
    productDetails.reduce((sum, p) => sum + (parseFloat(p.finalAmount ?? (p.ratePerGram * p.netWeightInGrams)) || 0), 0)
  );



  // Format input to integers only - no decimals allowed
  const formatAmountInput = (value) => {
    if (value === '') return '';
    // Remove non-digit characters
    let sanitized = value.replace(/[^0-9]/g, '');
    return sanitized;
  };



  useEffect(() => {
    const c = parseInt(cash) || 0;
    const u = parseInt(upi) || 0;
    let p = totalAmount - (c + u);
    if (p < 0) p = 0;
    setPending(p.toString());
    setPaymentDetails({ cash: c, upi: u, pending: p });
  }, [cash, upi, totalAmount]);



  const handlePaymentDone = async () => {
    try {
      // All fields optional: no required fields validation
      
      // Validate product details only to remove products with all empty or zero fields
      const filteredProducts = [];
      
      productDetails.forEach((p) => {
        // Consider a product valid if it has at least one non-empty/non-zero meaningful value
        const hasData = Object.values(p).some(val => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'string' && val.trim() === '') return false;
          if (typeof val === 'number' && val === 0) return false;
          return true;
        });
        if (hasData) filteredProducts.push(p);
      });
      


      // Prepare payload according to backend structure
      const payload = {
        invoiceDetails: {
          billNo: invoiceDetails.billNo || '',
          date: invoiceDetails.date || '',
          remarks: invoiceDetails.remarks || ''
        },
        customerDetails: {
          customerNameEng: customerDetails.customerNameEng || '',
          customerNameHin: customerDetails.customerNameHin || '',
          address: customerDetails.address || '',
          mobileNumber: customerDetails.mobileNumber || ''
        },
        productDetails: filteredProducts.map(product => ({
          type: product.type || '',
          tagNo: product.tagNo || '',
          productName: product.productName || '',
          remark: product.remark || '',
          purity: product.purity || '',
          piece: product.piece || 0,
          netWeightInGrams: product.netWeightInGrams || 0,
          stoneRate: product.stoneRate || 0,
          labourChargesInPercentage: product.labourChargesInPercentage || 0,
          labourChargesInGram: product.labourChargesInGram || 0,
          additionalAmount: product.additionalAmount || 0,
          discountAmount: product.discountAmount || 0,
          ratePerGram: product.ratePerGram || 0
        })),
        paymentDetails: {
          cash: paymentDetails.cash,
          upi: paymentDetails.upi
          // pending will be calculated by backend
        }
      };



      const token = await AsyncStorage.getItem('userToken');



      // Use the new API endpoint
      await axios.post(
        'https://rajmanijewellers.in/api/salesman/create-invoice',
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          } 
        }
      );



      await AsyncStorage.setItem('lastBillNo', invoiceDetails.billNo || '');



      Alert.alert('Success', 'Invoice created successfully!');
      setModalVisible(false);
      navigation.navigate('get-all-invoices');
    } catch (error) {
      console.error('Invoice creation error:', error);
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Server error');
      } else if (error.request) {
        Alert.alert('Error', 'No response from server. Check your connection.');
      } else {
        Alert.alert('Error', error.message);
      }
      setModalVisible(false);
    }
  };



  return (
    <>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      <View style={styles.backButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>




      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: hp('20%') }} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Make Payment</Text>
          <Text style={styles.amount}>Payable amount = ₹{totalAmount}</Text>




          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Mode of payment</Text>
            <Text style={styles.paymentLabel}>Amount</Text>
          </View>
          <View style={styles.paymentRow}>
            <TextInput style={styles.modeInput} value="Cash" editable={false} />
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={cash}
              onChangeText={v => setCash(formatAmountInput(v))}
              maxLength={12}
            />
          </View>
          <View style={styles.paymentRow}>
            <TextInput style={styles.modeInput} value="UPI" editable={false} />
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={upi}
              onChangeText={v => setUpi(formatAmountInput(v))}
              maxLength={12}
            />
          </View>
          <View style={styles.paymentRow}>
            <TextInput style={styles.modeInput} value="Pending" editable={false} />
            <TextInput style={styles.amountInput} value={pending} editable={false} />
          </View>




          <View>
            {productDetails.map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { flex: 1 }]}>Product {i + 1}</Text>
                <Text style={[styles.paymentLabel, { flex: 1, textAlign: 'right' }]}>
                  ₹{Math.round(Number(p.finalAmount ?? (p.ratePerGram * p.netWeightInGrams)))}
                </Text>
              </View>
            ))}
          </View>




          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{totalAmount}</Text>
          </View>




          <TouchableOpacity style={styles.qrToggle} onPress={() => setShowQR(!showQR)}>
            <Text style={styles.qrToggleText}>{showQR ? 'Close QR code' : 'Open QR code'}</Text>
            <Image source={require('../../assets/greendrop.png')} style={styles.qrToggleIcon} />
          </TouchableOpacity>




          {showQR && (
            <View style={styles.qrContainer}>
              <Image source={require('../../assets/barcode.jpg')} style={styles.qrImage} resizeMode="contain" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>




      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.payText}>Payment Done</Text>
        </TouchableOpacity>
      </View>




      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure payment is completed?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.BTNGREEN }]} onPress={handlePaymentDone}>
                <Text style={{ color: '#fff', fontFamily: 'Poppins-Medium' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};




export default InvoicePaymentScreen;




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
    fontFamily: 'Poppins-Medium',
    marginBottom: hp('1.5%'),
    color: '#000',
  },
  paymentLabel: {
    fontWeight: '600',
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
    backgroundColor: '#fff',
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
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Medium',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
    paddingBottom: hp('5%'),
  },
  payButton: {
    backgroundColor: Colors.BTNGREEN,
    paddingVertical: hp('1.6%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginBottom: hp('1%'),
    height: hp('6%'),
    justifyContent: 'center',
  },
  payText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
  },
});
