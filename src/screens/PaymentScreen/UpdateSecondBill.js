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
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const UpdateSecondBill = ({ route, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [upiHolders, setUpiHolders] = useState([]);
  const [selectedUpiHolder, setSelectedUpiHolder] = useState(null);
  const [upiDropdownVisible, setUpiDropdownVisible] = useState(false);
  const [loadingUpi, setLoadingUpi] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(true);

  const [paymentDetails, setPaymentDetails] = useState({
    Cash: '',
    UPI: '',
  });

  const {
    customerDetails,
    productDetails,
    invoiceDetails,
    salesmanContactNumber,
    repairInvoiceId,
  } = route.params;
  const [payableAmount, setPayableAmount] = useState('0.000');

  // Fetch existing payment details
  useEffect(() => {
    const fetchExistingPayment = async () => {
      if (!repairInvoiceId) {
        setLoadingPayment(false);
        return;
      }
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setLoadingPayment(false);
          return;
        }
        const apiUrl = `https://rajmanijewellers.in/api/salesman/get-repair-invoice-by-id/${repairInvoiceId}`;
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        if (response.data && response.data.success && response.data.repairInvoice) {
          const invoiceData = response.data.repairInvoice;
          setExistingPayment(invoiceData.paymentDetails || {});
          if (invoiceData.paymentDetails) {
            const paymentData = invoiceData.paymentDetails;
            setPaymentDetails({
              Cash: paymentData.cash ? paymentData.cash.toString() : '',
              UPI: paymentData.upi ? paymentData.upi.toString() : '',
            });
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoadingPayment(false);
      }
    };
    fetchExistingPayment();
  }, [repairInvoiceId]);

  useEffect(() => {
    let total = 0;
    productDetails.forEach(item => {
      total += parseFloat(item.finalAmount) || 0;
    });
    setPayableAmount(total.toFixed(3));
    if (!existingPayment) {
      setPaymentDetails({ Cash: '', UPI: '' });
      setSelectedUpiHolder(null);
    }
  }, [productDetails, existingPayment]);

  useEffect(() => {
    const fetchUpiHolders = async () => {
      setLoadingUpi(true);
      try {
        const response = await axios.get('https://rajmanijewellers.in/api/salesman/get-all-upi');
        if (response.data && response.data.success) {
          setUpiHolders(response.data.data);
        }
      } catch (_) {
        // silent fail
      } finally {
        setLoadingUpi(false);
      }
    };
    fetchUpiHolders();
  }, []);

  const convertToISODate = (dateString) => {
    if (!dateString) return new Date().toISOString();
    try {
      if (dateString.includes('T')) return dateString;
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
      }
      return new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const validateAndSetPayment = (mode, value) => {
    let val = value.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const parts = val.split('.');
      parts[1] = parts[1].substring(0, 3);
      val = parts[0] + '.' + parts[1];
    }
    if (val.startsWith('-')) val = val.replace('-', '');

    const otherAmount = Object.keys(paymentDetails)
      .filter(k => k !== mode)
      .reduce((sum, k) => sum + parseFloat(paymentDetails[k] || 0), 0);

    if (parseFloat(val || 0) + otherAmount > parseFloat(payableAmount)) {
      Alert.alert(
        'Invalid Amount',
        `Total payment cannot exceed payable amount ₹${payableAmount}`
      );
      val = (parseFloat(payableAmount) - otherAmount).toFixed(3);
      if (parseFloat(val) < 0) val = '';
    }
    setPaymentDetails(prev => ({ ...prev, [mode]: val }));
  };

  const totalPayment = () =>
    Object.values(paymentDetails).reduce((sum, val) => sum + parseFloat(val || 0), 0);

  // FIX: Always return string "0.000" for fully paid or overpaid; else remaining as fixed 3 decimals
  const calculateRemainingAmount = () => {
    const paidAmount = totalPayment();
    const payable = parseFloat(payableAmount);
    const remaining = payable - paidAmount;
    if (remaining <= 0) return "0.000";
    return remaining.toFixed(3);
  };

  const handlePaymentDone = async () => {
    const cashAmount = parseFloat(paymentDetails.Cash) || 0;
    const upiAmount = parseFloat(paymentDetails.UPI) || 0;
    if (cashAmount === 0 && upiAmount === 0) {
      Alert.alert(
        'Zero Payment',
        'No payment amount entered. Do you want to proceed with zero payment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => updateInvoice() },
        ]
      );
    } else {
      updateInvoice();
    }
  };

  const updateInvoice = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const convertedDate = convertToISODate(invoiceDetails.date);
      const payload = {
        customerDetails: {
          customerNameEng: customerDetails.customerNameEng || '',
          customerNameHin: customerDetails.customerNameHin || '',
          mobileNumber: customerDetails.mobileNumber || '',
          address: customerDetails.address || '',
        },
        invoiceDetails: {
          date: convertedDate,
        },
        paymentDetails: {
          cash: parseFloat(paymentDetails.Cash) || 0,
          upi: parseFloat(paymentDetails.UPI) || 0,
        },
        salesmanContactNumber: salesmanContactNumber || '',
        productDetails: productDetails.map(product => ({
          productName: product.productName || '',
          piece: parseInt(product.piece) || 1,
          netWeightInGrams: parseFloat(product.netWeightInGrams) || 0,
          finalAmount: parseFloat(product.finalAmount) || 0,
          description: product.description || '',
          metal: product.metal || 'gold',
        })),
      };

      const patchUrl = `https://rajmanijewellers.in/api/salesman/update-repair-invoice-by-id/${repairInvoiceId}`;
      const response = await axios.patch(patchUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      if (response.data.success) {
        Alert.alert(
          'Success', 
          'Repair invoice updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setModalVisible(false);
                navigation.navigate('get-all-invoices', { 
                  refresh: true,
                  showRepairTab: true 
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update invoice');
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.message ||
          error.response.data.error ||
          `Server error: ${error.response.status}`;
        Alert.alert('Server Error', errorMessage);
      } else if (error.request) {
        Alert.alert('Network Error', 'No response from server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Unexpected Error', error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowBill = () => {
    const grandTotal = productDetails.reduce((total, item) => total + (parseFloat(item.finalAmount) || 0), 0);
    const cashAmount = parseFloat(paymentDetails.Cash) || 0;
    const upiAmount = parseFloat(paymentDetails.UPI) || 0;
    const totalPaymentAmount = cashAmount + upiAmount;

    const billData = {
      invoiceDetails: {
        ...invoiceDetails,
        billNo: invoiceDetails.billNo || 'REPAIR-001',
        date: invoiceDetails.date || new Date().toISOString(),
      },
      customerDetails,
      productDetails: productDetails.map(item => ({
        ...item,
        type: 'Sales',
        purity: item.purity || '22K',
        grossWeightInGrams: item.grossWeightInGrams || item.netWeightInGrams,
        rate: item.ratePerGram || '0',
        value: ((parseFloat(item.netWeightInGrams) || 0) * (parseFloat(item.ratePerGram) || 0)).toFixed(2),
        dia: item.dia || '-',
        stn: item.stn || '-',
        diaStnValue: item.diaStnValue || '-',
        additionalAmount: item.additionalAmount || '0',
      })),
      paymentDetails: {
        cash: cashAmount,
        upi: upiAmount,
        totalAmount: payableAmount,
      },
      totals: {
        paymentType: totalPaymentAmount > 0 ? 'RECEIPT/CASH' : 'PENDING',
        paymentAmount: `₹${totalPaymentAmount.toFixed(3)}`,
        grandTotal: grandTotal.toFixed(3),
      },
    };

    navigation.navigate('repair-show-bill', { billData });
  };

  if (loadingPayment) {
    return (
      <>
        <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
            <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        </View>
      </>
    );
  }

  const remainingAmount = calculateRemainingAmount();

  return (
    <>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      <View style={styles.backButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShowBill} style={styles.showBillTouchable}>
          <Text style={styles.showBillText}>Show Bill</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: hp('20%') }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionBox}>
            <Text style={styles.header}>Update Payment</Text>
            <Text style={styles.amount}>Payable amount = ₹{payableAmount}</Text>

            {existingPayment && (
              <View style={styles.existingPaymentContainer}>
                <Text style={styles.existingPaymentTitle}>Existing Payment:</Text>
                <View style={styles.existingPaymentRow}>
                  <Text style={styles.existingPaymentLabel}>Cash:</Text>
                  <Text style={styles.existingPaymentValue}>₹{parseFloat(existingPayment.cash || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.existingPaymentRow}>
                  <Text style={styles.existingPaymentLabel}>UPI:</Text>
                  <Text style={styles.existingPaymentValue}>₹{parseFloat(existingPayment.upi || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.existingPaymentRow}>
                  <Text style={styles.existingPaymentLabel}>Total Paid:</Text>
                  <Text style={styles.existingPaymentValue}>₹{parseFloat(existingPayment.totalPaid || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.existingPaymentRow}>
                  <Text style={styles.existingPaymentLabel}>Pending:</Text>
                  <Text style={styles.existingPaymentValue}>₹{parseFloat(existingPayment.pending || 0).toFixed(3)}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.sectionBox}>
            <Text style={[styles.header, { color: '#000' }]}>Product Details</Text>
            {productDetails.map((p, i) => (
              <View key={i} style={styles.productRowBox}>
                <Text style={[styles.productName, { flex: 1 }]}>Product {i + 1}</Text>
                <Text style={[styles.productAmount, { flex: 1, textAlign: 'right' }]}>
                  ₹{parseFloat(p.finalAmount ?? (p.ratePerGram * p.netWeightInGrams)).toFixed(3)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRowBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{parseFloat(payableAmount).toFixed(3)}</Text>
            </View>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.header}>Mode of payment</Text>
            <View style={styles.paymentHeaderRow}>
              <View style={styles.modeColumn}>
                <Text style={styles.paymentLabel}>Mode</Text>
              </View>
              <View style={styles.paymentColumn}>
                <Text style={styles.paymentLabel}>Payment</Text>
              </View>
            </View>

            <View style={styles.paymentRow}>
              <View style={styles.modeColumn}>
                <TextInput style={[styles.inputField, styles.modeInput]} value="Cash" editable={false} />
              </View>
              <View style={styles.paymentColumn}>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={paymentDetails.Cash}
                  onChangeText={(value) => validateAndSetPayment('Cash', value)}
                  maxLength={12}
                />
              </View>
            </View>

            <View style={[styles.paymentRow, { alignItems: 'center' }]}>
              <View style={styles.modeColumn}>
                <TouchableOpacity
                  style={[styles.inputField, styles.modeInput, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => setUpiDropdownVisible((prev) => !prev)}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {selectedUpiHolder ? selectedUpiHolder.upiHolder : 'Select UPI Holder'}
                  </Text>
                  <Image source={require('../../assets/down.png')} style={{ width: wp('4%'), height: hp('2%') }} />
                </TouchableOpacity>
              </View>
              <View style={styles.paymentColumn}>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={paymentDetails.UPI}
                  onChangeText={(value) => validateAndSetPayment('UPI', value)}
                  maxLength={12}
                />
              </View>
            </View>

            {upiDropdownVisible && (
              <View style={[styles.dropdownList, { marginHorizontal: wp('5%') }]}>
                <ScrollView nestedScrollEnabled>
                  {loadingUpi
                    ? <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    : upiHolders.map((item) => (
                        <TouchableOpacity
                          key={item._id}
                          onPress={() => {
                            setSelectedUpiHolder(item);
                            setUpiDropdownVisible(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <Text>{item.upiHolder}</Text>
                        </TouchableOpacity>
                      ))}
                </ScrollView>
              </View>
            )}

            {selectedUpiHolder && (
              <View style={{ alignItems: 'center', marginTop: hp('2%') }}>
                {imageLoading && <ActivityIndicator size="large" color={Colors.PRIMARY} />}
                <Image
                  key={selectedUpiHolder._id}
                  source={{ uri: selectedUpiHolder.image.fileLocation }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
              </View>
            )}

            <View style={[styles.totalRowBox, { marginTop: hp('2%') }]}>
              <Text style={styles.totalLabel}>Total Payment</Text>
              <Text style={styles.totalAmount}>₹{totalPayment().toFixed(3)}</Text>
            </View>
            <View style={[styles.totalRowBox, { marginTop: hp('1%') }]}>
              <Text style={styles.totalLabel}>Pending Amount</Text>
              <Text style={[styles.totalAmount, { color: Colors.PRIMARY }]}>
                ₹{remainingAmount}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottonBox}>
        <TouchableOpacity
          style={[styles.doneButton, loading && { opacity: 0.7 }]}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.doneText}>Update Payment</Text>}
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure payment is completed?</Text>
            <Text style={[styles.modalText, { fontSize: wp('3.5%'), color: '#666', marginTop: -10 }]}>
              Total Payment: ₹{totalPayment().toFixed(3)}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}>
                <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePaymentDone} style={[styles.modalButton, { backgroundColor: Colors.BTNGREEN }]}>
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
  sectionBox: {
    marginBottom: hp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderRadius: wp('2%'),
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
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
    marginBottom: hp('0'),
    color: '#000',
  },
  productRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productName: {
    fontSize: wp('3.7%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  productAmount: {
    fontSize: wp('3.7%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  totalRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderColor: '#bbb',
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
  paymentHeaderRow: {
    flexDirection: 'row',
    marginBottom: hp('1.5%'),
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: hp('1.5%'),
    alignItems: 'center',
  },
  modeColumn: {
    flex: 0.45,
    marginRight: wp('2%'),
  },
  paymentColumn: {
    flex: 0.55,
  },
  paymentLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  inputField: {
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
  modeInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownList: {
    maxHeight: hp('20%'),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('2%'),
    backgroundColor: '#fff',
    marginTop: hp('1%'),
    marginHorizontal: 0,
    zIndex: 100,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
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
    justifyContent: 'space-between',
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
  showBillTouchable: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    elevation: 3,
  },
  showBillText: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  bottonBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
  },
  doneButton: {
    backgroundColor: Colors.BTNGREEN,
    paddingVertical: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    width: '100%',
    elevation: 5,
  },
  doneText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('4%'),
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
  existingPaymentContainer: {
    backgroundColor: '#fff',
    padding: wp('3%'),
    borderRadius: wp('1.5%'),
    marginTop: hp('1%'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  existingPaymentTitle: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins-SemiBold',
    color: Colors.PRIMARY,
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  existingPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  existingPaymentLabel: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  existingPaymentValue: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp('0%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Medium',
    color: Colors.PRIMARY,
  },
});

export default UpdateSecondBill;
