import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const InvoicePaymentScreen = ({ route, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [upiHolders, setUpiHolders] = useState([]);
  const [selectedUpiHolder, setSelectedUpiHolder] = useState(null);
  const [upiDropdownVisible, setUpiDropdownVisible] = useState(false);
  const [loadingUpi, setLoadingUpi] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollViewRef = useRef();
  const cashInputRef = useRef();
  const upiInputRef = useRef();

  const [paymentDetails, setPaymentDetails] = useState({
    Cash: '',
    UPI: '',
  });

  const { customerDetails, productDetails, invoiceDetails } = route.params;
  const [payableAmount, setPayableAmount] = useState('0.000');

  // Calculate totals similar to CreateInvoice screen
  const calculateTotals = () => {
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;

    const totalPieces = productDetails.reduce((sum, product) => {
      return sum + (parseInt(product.piece) || 0);
    }, 0);

    const totalNetWeight = productDetails.reduce((sum, product) => {
      return sum + (parseFloat(product.netWeightInGrams) || 0);
    }, 0);

    // Separate sales and purchase amounts
    productDetails.forEach(product => {
      const amount = parseFloat(product.finalAmount) || 0;
      if (product.type === 'Sales') {
        totalSalesAmount += amount;
      } else if (product.type === 'Purchase') {
        totalPurchaseAmount += amount;
      }
    });

    // Grand total = Sales - Purchase
    const grandTotal = totalSalesAmount - totalPurchaseAmount;

    return {
      totalSalesAmount: totalSalesAmount.toFixed(3),
      totalPurchaseAmount: totalPurchaseAmount.toFixed(3),
      grandTotal: grandTotal.toFixed(3),
      totalPieces,
      totalNetWeight: totalNetWeight.toFixed(3),
    };
  };

  useEffect(() => {
    const totals = calculateTotals();
    setPayableAmount(Math.abs(parseFloat(totals.grandTotal)).toFixed(3));
    setPaymentDetails({ Cash: '', UPI: '' });
    setSelectedUpiHolder(null);
  }, [productDetails]);

  useEffect(() => {
    const fetchUpiHolders = async () => {
      setLoadingUpi(true);
      try {
        const response = await axios.get('https://rajmanijewellers.in/api/salesman/get-all-upi');
        if (response.data && response.data.success) {
          setUpiHolders(response.data.data);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch UPI list');
      } finally {
        setLoadingUpi(false);
      }
    };
    fetchUpiHolders();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateAndSetPayment = (mode, value) => {
    let val = value.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const parts = val.split('.');
      parts[1] = parts[1].substring(0, 3);
      val = parts[0] + '.' + parts[1];
    }
    if (val.startsWith('-')) val = val.replace('-', '');

    const currentOtherAmount = Object.keys(paymentDetails)
      .filter(k => k !== mode)
      .reduce((sum, k) => sum + parseFloat(paymentDetails[k] || 0), 0);

    if (parseFloat(val || 0) + currentOtherAmount > parseFloat(payableAmount)) {
      Alert.alert(
        'Invalid Amount',
        `Total payment cannot exceed payable amount ₹${payableAmount}`
      );
      val = (parseFloat(payableAmount) - currentOtherAmount).toFixed(3);
      if (parseFloat(val) < 0) val = '';
    }
    setPaymentDetails(prev => ({ ...prev, [mode]: val }));
  };

  const totalPayment = () => {
    return Object.values(paymentDetails).reduce(
      (sum, val) => sum + parseFloat(val || 0),
      0
    );
  };

  const calculateRemainingAmount = () => {
    const paidAmount = totalPayment();
    const payable = parseFloat(payableAmount);
    const remaining = payable - paidAmount;
    return remaining > 0 ? remaining : 0;
  };

  const safeTrim = (str) => {
    return str && typeof str === 'string' ? str.trim() : '';
  };
  const safeToStringTrim = (value) => {
    return value !== null && value !== undefined ? value.toString().trim() : '';
  };

  // Helper to conditionally include key if value is valid & non-empty
  const includeIfValid = (key, value, isString = false) => {
    if (isString) {
      if (value && value.trim() !== '') return { [key]: value.trim() };
      else return {};
    } else {
      if (value !== null && value !== undefined && !isNaN(value) && value !== 0) return { [key]: value };
      else return {};
    }
  };

  const handlePaymentDone = async () => {
    if (submitting) return;

    if (totalPayment() > parseFloat(payableAmount)) {
      Alert.alert('Payment Error', 'Total payment exceeds payable amount.');
      return;
    }

    setSubmitting(true);
    setModalVisible(false);

    try {
      // Filter products with meaningful data
      const filteredProducts = productDetails.filter(p => {
        const hasData = Object.entries(p).some(([key, value]) => {
          if (key === 'type' && value) return true;
          if (key === 'productName' && value && safeTrim(value) !== '') return true;
          if (key === 'tagNo' && value && safeTrim(value) !== '') return true;
          if (key === 'purity' && value !== null && value !== undefined) return true;
          if (key === 'piece' && parseFloat(value) > 0) return true;
          if (key === 'netWeightInGrams' && parseFloat(value) > 0) return true;
          if (key === 'finalAmount' && parseFloat(value) !== 0) return true;
          return false;
        });
        return hasData;
      });

      if (!invoiceDetails.billNo || !invoiceDetails.date) {
        Alert.alert('Error', 'Bill number and date are required');
        setSubmitting(false);
        return;
      }

      if (!customerDetails.customerNameEng && !customerDetails.customerNameHin) {
        Alert.alert('Error', 'Customer name is required');
        setSubmitting(false);
        return;
      }

      if (filteredProducts.length === 0) {
        Alert.alert('Error', 'At least one product with valid data is required');
        setSubmitting(false);
        return;
      }

      // Build payload conforming to your backend model with no 0 or 'N/A' values
      const payload = {
        invoiceDetails: {
          billNo: safeToStringTrim(invoiceDetails.billNo),
          date: invoiceDetails.date || new Date().toISOString().split('T')[0],
          // No remarks field in backend? If present, only include if not empty
          ...includeIfValid('remarks', safeTrim(invoiceDetails.remarks), true),
        },
        customerDetails: {
          // If absent, use empty string; default in backend "Cash" or "नकदी ग्राहक" will apply
          ...includeIfValid('customerNameEng', safeTrim(customerDetails.customerNameEng), true),
          ...includeIfValid('customerNameHin', safeTrim(customerDetails.customerNameHin), true),
          ...includeIfValid('address', safeTrim(customerDetails.address), true),
          // mobileNumber is number type, convert string to number or omit if invalid
          ...includeIfValid(
            'mobileNumber', 
            customerDetails.mobileNumber ? Number(customerDetails.mobileNumber) : null
          ),
        },
        productDetails: filteredProducts.map(product => {
          // Build each product detail only with valid keys except required ones
          const productPayload = {
            type: product.type || 'Sales',
            productName: safeTrim(product.productName) || 'Unnamed Product',
          };

          // Conditionally add other keys if valid
          return {
            ...productPayload,
            ...includeIfValid('remark', safeTrim(product.remark), true),
            ...includeIfValid('piece', parseInt(product.piece)),
            ...includeIfValid('purity', product.purity !== null && product.purity !== undefined ? parseFloat(product.purity) : null),
            ...includeIfValid('grossWeightInGrams', parseFloat(product.grossWeightInGrams)),
            ...includeIfValid('netWeightInGrams', parseFloat(product.netWeightInGrams)),
            ...includeIfValid('lessWeightInGrams', product.lessWeightInGrams !== null && product.lessWeightInGrams !== undefined ? parseFloat(product.lessWeightInGrams) : null),
            ...includeIfValid('stoneRate', parseFloat(product.stoneRate)),
            ...includeIfValid('additionalAmount', parseFloat(product.additionalAmount)),
            ...includeIfValid('discountAmount', parseFloat(product.discountAmount)),
            ...includeIfValid('tagNo', safeToStringTrim(product.tagNo), true),
            ...includeIfValid('labourChargesInGram', parseFloat(product.labourChargesInGram)),
            ...includeIfValid('labourChargesInPercentage', parseFloat(product.labourChargesInPercentage)),
            ...includeIfValid('ratePerGram', parseFloat(product.ratePerGram)),
            ...includeIfValid('labourChargesInRs', parseFloat(product.labourChargesInRs)),
            ...includeIfValid('finalAmount', parseFloat(product.finalAmount)),
          };
        }),
        paymentDetails: {
          // If empty or zero, omit key so backend can treat as null/undefined
          ...includeIfValid('cash', parseFloat(paymentDetails.Cash)),
          ...includeIfValid('upi', parseFloat(paymentDetails.UPI)),
          // pending, totalPaid, payableAmount are not sent, calculated backend side
        },
        totalAmount: parseFloat(payableAmount) || 0,
      };

      // Log request payload
      console.log('Request Payload:', JSON.stringify(payload, null, 2));

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        setSubmitting(false);
        return;
      }

      const response = await axios.post(
        'https://rajmanijewellers.in/api/salesman/create-invoice',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      // Log API response
      console.log('API Response:', response.data);

      if (response.data && response.data.success) {
        await AsyncStorage.setItem('lastBillNo', safeToStringTrim(invoiceDetails.billNo));
        Alert.alert(
          'Success',
          'Invoice created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('get-all-invoices'),
            },
          ]
        );
      } else {
        throw new Error(response.data?.message || 'Failed to create invoice');
      }
    } catch (error) {
      let errorMessage = 'Failed to create invoice. Please try again.';
      if (error.response) {
        const serverError = error.response.data;
        errorMessage =
          serverError.message || serverError.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      console.log('Error:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowBill = () => {
    const totals = calculateTotals();
    const totalPaid = totalPayment();
    const remainingAmount = calculateRemainingAmount();

    const billData = {
      invoiceDetails,
      customerDetails,
      productDetails,
      paymentDetails: {
        cash: parseFloat(paymentDetails.Cash) || 0,
        upi: parseFloat(paymentDetails.UPI) || 0,
        totalAmount: payableAmount,
      },
      totals: {
        paymentType: totalPaid > 0 ? 'RECEIPT/CASH' : 'PENDING',
        paymentAmount: `₹${totalPaid.toFixed(3)}`,
        totalSalesAmount: totals.totalSalesAmount,
        totalPurchaseAmount: totals.totalPurchaseAmount,
        grandTotal: totals.grandTotal,
        remainingAmount: remainingAmount,
      },
    };
    navigation.navigate('show-bill', { billData });
  };

  const totals = calculateTotals();
  const totalPaid = totalPayment();
  const remainingAmount = calculateRemainingAmount();

  const getRemainingAmountDisplay = () => {
    if (remainingAmount === 0) {
      return { text: 'Paid', color: Colors.BTNGREEN };
    } else {
      return { text: `₹${remainingAmount.toFixed(3)}`, color: Colors.PRIMARY };
    }
  };

  const remainingDisplay = getRemainingAmountDisplay();

  const getStatusInfo = () => {
    if (remainingAmount === 0) {
      return { text: 'Fully Paid', color: Colors.BTNGREEN };
    } else {
      return { text: 'Partial Payment', color: Colors.PRIMARY };
    }
  };

  const statusInfo = getStatusInfo();

  const focusOnInput = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current?.scrollTo({
          y: pageY - hp('15%'),
          animated: true
        });
      });
    }, 100);
  };

  const handleCashFocus = () => {
    focusOnInput(cashInputRef);
  };

  const handleUpiFocus = () => {
    focusOnInput(upiInputRef);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setUpiDropdownVisible(false);
  };

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

      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp('2%') : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.container}
            contentContainerStyle={{ 
              paddingBottom: isKeyboardVisible ? hp('25%') : hp('20%'),
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sectionBox}>
              <Text style={styles.header}>Make Payment</Text>
              <Text style={styles.amount}>Payable amount = ₹{payableAmount}</Text>
            </View>

            <View style={styles.sectionBox}>
              <Text style={[styles.header, { color: '#000' }]}>Product Details</Text>
              {productDetails.map((p, i) => {
                const amount = parseFloat(p.finalAmount) || 0;
                const amountColor = p.type === 'Purchase' ? '#d32f2f' : Colors.BTNGREEN;
                return (
                  <View key={i} style={styles.productRowBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>
                        Product {i + 1}: {p.productName || 'Unnamed Product'}
                      </Text>
                      <Text style={styles.productType}>Type: {p.type}</Text>
                    </View>
                    <Text style={[styles.productAmount, { color: amountColor }]}>
                      {p.type === 'Purchase' ? '-' : ''}₹{amount.toFixed(3)}
                    </Text>
                  </View>
                );
              })}

              {parseFloat(totals.totalSalesAmount) > 0 && (
                <View style={styles.totalRowBox}>
                  <Text style={styles.totalLabel}>Total Sales:</Text>
                  <Text style={[styles.totalAmount, { color: Colors.BTNGREEN }]}>
                    ₹{totals.totalSalesAmount}
                  </Text>
                </View>
              )}

              {parseFloat(totals.totalPurchaseAmount) > 0 && (
                <View style={styles.totalRowBox}>
                  <Text style={styles.totalLabel}>Total Purchase:</Text>
                  <Text style={[styles.totalAmount, { color: '#d32f2f' }]}>
                    -₹{totals.totalPurchaseAmount}
                  </Text>
                </View>
              )}

              <View style={[styles.paymentSummaryContainer, { marginTop: hp('2%') }]}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Paid:</Text>
                  <Text style={[styles.summaryValue, { color: Colors.BTNGREEN }]}>
                    ₹{totalPaid.toFixed(3)}
                  </Text>
                </View>

                {(parseFloat(paymentDetails.Cash) > 0 || parseFloat(paymentDetails.UPI) > 0) && (
                  <View style={styles.breakdownContainer}>
                    {parseFloat(paymentDetails.Cash) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Cash:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          ₹{parseFloat(paymentDetails.Cash).toFixed(3)}
                        </Text>
                      </View>
                    )}
                    {parseFloat(paymentDetails.UPI) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>UPI:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          ₹{parseFloat(paymentDetails.UPI).toFixed(3)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View
                  style={[
                    styles.totalRowBox,
                    {
                      borderTopWidth: 2,
                      borderTopColor: Colors.BTNRED,
                      marginTop: hp('1%'),
                      paddingTop: hp('1%'),
                    },
                  ]}
                >
                  <Text style={[styles.totalLabel, { fontFamily: 'Poppins-Bold' }]}>Grand Total:</Text>
                  <Text
                    style={[
                      styles.totalAmount,
                      {
                        color: parseFloat(totals.grandTotal) >= 0 ? Colors.BTNGREEN : '#d32f2f',
                        fontFamily: 'Poppins-Bold',
                      },
                    ]}
                  >
                    {parseFloat(totals.grandTotal) < 0 ? '-' : ''}₹{Math.abs(parseFloat(totals.grandTotal))}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryRow,
                    {
                      borderTopWidth: 2,
                      borderTopColor: Colors.PRIMARY,
                      marginTop: hp('1%'),
                      paddingTop: hp('1%'),
                    },
                  ]}
                >
                  <Text style={[styles.summaryLabel, { fontFamily: 'Poppins-Bold' }]}>Remaining Amount:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        fontFamily: 'Poppins-Bold',
                        color: remainingDisplay.color,
                      },
                    ]}
                  >
                    {remainingDisplay.text}
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: statusInfo.color,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>{statusInfo.text}</Text>
                  </View>
                </View>
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
                    ref={cashInputRef}
                    style={styles.inputField}
                    keyboardType="numeric"
                    placeholder="Not filled"
                    placeholderTextColor="#999"
                    value={paymentDetails.Cash}
                    onChangeText={(value) => validateAndSetPayment('Cash', value)}
                    onFocus={handleCashFocus}
                    maxLength={12}
                  />
                </View>
              </View>

              <View style={[styles.paymentRow, { alignItems: 'center' }]}>
                <View style={styles.modeColumn}>
                  <TouchableOpacity
                    style={[
                      styles.inputField,
                      styles.modeInput,
                      {
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                    ]}
                    onPress={() => {
                      dismissKeyboard();
                      setUpiDropdownVisible((prev) => !prev);
                    }}
                  >
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {selectedUpiHolder ? selectedUpiHolder.upiHolder : 'Select UPI Holder'}
                    </Text>
                    <Image source={require('../../assets/down.png')} style={{ width: wp('4%'), height: hp('2%') }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.paymentColumn}>
                  <TextInput
                    ref={upiInputRef}
                    style={styles.inputField}
                    keyboardType="numeric"
                    placeholder="Not filled"
                    placeholderTextColor="#999"
                    value={paymentDetails.UPI}
                    onChangeText={(value) => validateAndSetPayment('UPI', value)}
                    onFocus={handleUpiFocus}
                    maxLength={12}
                  />
                </View>
              </View>

              {upiDropdownVisible && (
                <View style={[styles.dropdownList, { marginHorizontal: wp('5%') }]}>
                  <ScrollView nestedScrollEnabled>
                    {loadingUpi ? (
                      <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    ) : (
                      upiHolders.map((item) => (
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
                      ))
                    )}
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {!isKeyboardVisible && (
        <View style={styles.bottonBox}>
          <TouchableOpacity
            style={[styles.doneButton, submitting && { backgroundColor: '#ccc' }]}
            onPress={() => setModalVisible(true)}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.doneText}>Payment Done</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure payment is completed?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                disabled={submitting}
              >
                <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePaymentDone}
                style={[styles.modalButton, { backgroundColor: Colors.BTNGREEN }]}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Confirm</Text>
                )}
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
    alignItems: 'center',
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
  productType: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: hp('0.2%'),
  },
  productAmount: {
    fontSize: wp('3.7%'),
    fontFamily: 'Poppins-SemiBold',
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
  paymentSummaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
  },
  summaryLabel: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  summaryValue: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins-SemiBold',
  },
  breakdownContainer: {
    backgroundColor: '#fff',
    padding: wp('2.5%'),
    borderRadius: wp('1.5%'),
    marginVertical: hp('0.8%'),
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('0.3%'),
  },
  breakdownLabel: {
    fontSize: wp('3.3%'),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  breakdownValue: {
    fontSize: wp('3.3%'),
    fontFamily: 'Poppins-SemiBold',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  statusIndicator: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    minWidth: wp('40%'),
  },
  statusText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    textAlign: 'center',
  },
});

export default InvoicePaymentScreen;