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

const UpdateInvoiceBill = ({ route, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [upiHolders, setUpiHolders] = useState([]);
  const [selectedUpiHolder, setSelectedUpiHolder] = useState(null);
  const [upiDropdownVisible, setUpiDropdownVisible] = useState(false);
  const [loadingUpi, setLoadingUpi] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollViewRef = useRef();
  const cashInputRef = useRef();
  const upiInputRef = useRef();

  const [paymentDetails, setPaymentDetails] = useState({
    Cash: '',
    UPI: '',
  });

  const { invoiceId, customerDetails, productDetails, invoiceDetails } = route.params;

  const [payableAmount, setPayableAmount] = useState('0.000');

  // Safe helpers
  const safeTrim = str => str && typeof str === 'string' ? str.trim() : '';
  const safeToStringTrim = value => value !== null && value !== undefined ? value.toString().trim() : '';

  useEffect(() => {
    const fetchExistingPayment = async () => {
      if (!invoiceId) {
        setLoadingPayment(false);
        return;
      }
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setLoadingPayment(false);
          return;
        }
        const apiUrl = `https://rajmanijewellers.in/api/salesman/get-invoice-by-id/${invoiceId}`;
        console.log('Fetching existing invoice data...');
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        console.log('Existing invoice API Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.success && response.data.invoice) {
          const invoiceData = response.data.invoice;
          setExistingPayment(invoiceData.paymentDetails || {});
          if (invoiceData.paymentDetails) {
            const paymentData = invoiceData.paymentDetails;
            setPaymentDetails({
              Cash: paymentData.cash ? paymentData.cash.toString() : '',
              UPI: paymentData.upi ? paymentData.upi.toString() : '',
            });
          }
        }
      } catch (error) {
        console.log('Error fetching existing invoice:', error.response?.data || error.message);
      } finally {
        setLoadingPayment(false);
      }
    };
    fetchExistingPayment();
  }, [invoiceId]);

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

  // Calculate totals similar to CreateInvoice
  const calculateTotals = () => {
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;
    const totalPieces = productDetails.reduce((sum, product) =>
      sum + (parseInt(product.piece) || 0), 0
    );
    const totalNetWeight = productDetails.reduce((sum, product) =>
      sum + (parseFloat(product.netWeightInGrams) || 0), 0
    );
    productDetails.forEach(product => {
      const amount = parseInt(product.finalAmount) || 0;
      if (product.type === 'Sales') totalSalesAmount += amount;
      else if (product.type === 'Purchase') totalPurchaseAmount += amount;
    });
    const grandTotal = totalSalesAmount - totalPurchaseAmount;
    return {
      totalSalesAmount: totalSalesAmount.toString(),
      totalPurchaseAmount: totalPurchaseAmount.toString(),
      grandTotal: grandTotal.toString(),
      totalPieces,
      totalNetWeight: totalNetWeight.toFixed(3),
    };
  };

  useEffect(() => {
    const totals = calculateTotals();
    setPayableAmount(Math.abs(parseFloat(totals.grandTotal)).toFixed(3));
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
        if (response.data && response.data.success) setUpiHolders(response.data.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch UPI list');
      } finally {
        setLoadingUpi(false);
      }
    };
    fetchUpiHolders();
  }, []);

  const validateAndSetPayment = (mode, value) => {
    let val = value.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const parts = val.split('.');
      parts[1] = parts[1].substring(0, 3); // three decimals
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
      (sum, val) => sum + parseFloat(val || 0), 0
    );
  };

  // Always returns zero or positive, always 3 decimals, for showing in UI
  const calculateRemainingAmount = () => {
    const paidAmount = totalPayment();
    const payable = parseFloat(payableAmount);
    const remaining = payable - paidAmount;
    if (remaining <= 0) return "0.000";
    return remaining.toFixed(3);
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

  const handlePaymentDone = async () => {
    if (totalPayment() > parseFloat(payableAmount)) {
      Alert.alert('Payment Error', 'Total payment exceeds payable amount.');
      return;
    }
    setIsUpdating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Authentication Error', 'Please login again');
        setIsUpdating(false);
        return;
      }
      const filteredProducts = productDetails.filter(p => {
        const hasData = Object.entries(p).some(([key, value]) => {
          if (key === 'type' && value) return true;
          if (key === 'productName' && value && safeTrim(value) !== '') return true;
          if (key === 'tagNo' && value && safeTrim(value) !== '') return true;
          if (key === 'purity' && value && safeTrim(value) !== '') return true;
          if ((key === 'piece' || key === 'netWeightInGrams') && parseFloat(value) > 0) return true;
          if (key === 'finalAmount' && parseFloat(value) !== 0) return true;
          return false;
        });
        return hasData;
      });

      const totals = calculateTotals();
      const totalPaid = totalPayment();
      const payableAmountNum = parseFloat(payableAmount);
      const pendingAmount = parseFloat(calculateRemainingAmount());

      // Build payload with all fields including labourChargesInRs
      const payload = {
        invoiceDetails: {
          billNo: safeToStringTrim(invoiceDetails.billNo),
          date: invoiceDetails.date || new Date().toISOString(),
          ...includeIfValid('remarks', safeTrim(invoiceDetails.remarks), true),
        },
        customerDetails: {
          ...includeIfValid('customerNameEng', safeTrim(customerDetails.customerNameEng), true),
          ...includeIfValid('customerNameHin', safeTrim(customerDetails.customerNameHin), true),
          ...includeIfValid('address', safeTrim(customerDetails.address), true),
          ...includeIfValid('mobileNumber', customerDetails.mobileNumber ? Number(customerDetails.mobileNumber) : null),
        },
        productDetails: filteredProducts.map(product => {
          // Build each product detail with all fields including labourChargesInRs
          const productPayload = {
            type: product.type || 'Sales',
            productName: safeTrim(product.productName) || 'Unnamed Product',
          };

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
            ...includeIfValid('labourChargesInRs', parseFloat(product.labourChargesInRs)),
            ...includeIfValid('ratePerGram', parseFloat(product.ratePerGram)),
            ...includeIfValid('value', parseFloat(product.value)),
            ...includeIfValid('labourChargeInRupees', parseFloat(product.labourChargeInRupees)),
            ...includeIfValid('finalAmount', parseFloat(product.finalAmount)),
          };
        }),
        paymentDetails: {
          ...includeIfValid('cash', parseFloat(paymentDetails.Cash)),
          ...includeIfValid('upi', parseFloat(paymentDetails.UPI)),
          pending: pendingAmount,
          totalPaid: totalPaid,
          payableAmount: payableAmountNum,
        },
      };

      // Log the request payload
      console.log('Update Invoice Request Payload:', JSON.stringify(payload, null, 2));

      const apiUrl = `https://rajmanijewellers.in/api/salesman/update-invoice-by-id/${invoiceId}`;
      const response = await axios.patch(
        apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'RajmaniJewellers-Mobile-App',
          },
        }
      );

      // Log the API response
      console.log('Update Invoice API Response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Invoice updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              navigation.navigate('get-all-invoices');
            }
          }
        ]);
      } else {
        throw new Error(response.data?.message || 'Update failed - Invalid response');
      }
    } catch (error) {
      let errorMessage = 'Failed to update invoice';
      console.log('Update Invoice Error:', error.response?.data || error.message);
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please login again.'; break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to update this invoice.'; break;
          case 404:
            errorMessage = 'Invoice not found. It may have been deleted.'; break;
          case 422:
            errorMessage = 'Invalid data provided. Please check all fields.'; break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.'; break;
        }
      } else if (error.request) errorMessage = 'No response from server. Please check your internet connection.';
      else errorMessage = `Request setup failed: ${error.message}`;
      Alert.alert('Error', errorMessage);
      setModalVisible(false);
    } finally {
      setIsUpdating(false);
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
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </>
    );
  }

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
              {productDetails.map((p, i) => {
                const amount = parseInt(p.finalAmount) || 0;
                const amountColor = p.type === 'Purchase' ? '#d32f2f' : Colors.BTNGREEN;
                return (
                  <View key={i} style={styles.productRowBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>Product {i + 1}: {p.productName || 'Unnamed Product'}</Text>
                      <Text style={styles.productType}>Type: {p.type}</Text>
                    </View>
                    <Text style={[styles.productAmount, { color: amountColor }]}>
                      {p.type === 'Purchase' ? '-' : ''}₹{amount.toFixed(3)}
                    </Text>
                  </View>
                );
              })}

              {parseInt(totals.totalSalesAmount) > 0 && (
                <View style={styles.totalRowBox}>
                  <Text style={styles.totalLabel}>Total Sales:</Text>
                  <Text style={[styles.totalAmount, { color: Colors.BTNGREEN }]}>₹{totals.totalSalesAmount}</Text>
                </View>
              )}
              {parseInt(totals.totalPurchaseAmount) > 0 && (
                <View style={styles.totalRowBox}>
                  <Text style={styles.totalLabel}>Total Purchase:</Text>
                  <Text style={[styles.totalAmount, { color: '#d32f2f' }]}>-₹{totals.totalPurchaseAmount}</Text>
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
                          ₹{parseFloat(paymentDetails.Cash || 0).toFixed(3)}
                        </Text>
                      </View>
                    )}
                    {parseFloat(paymentDetails.UPI) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>UPI:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          ₹{parseFloat(paymentDetails.UPI || 0).toFixed(3)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={[styles.totalRowBox, {
                  borderTopWidth: 2,
                  borderTopColor: Colors.BTNRED,
                  marginTop: hp('1%'),
                  paddingTop: hp('1%')
                }]}>
                  <Text style={[styles.totalLabel, { fontFamily: 'Poppins-Bold' }]}>Grand Total:</Text>
                  <Text style={[styles.totalAmount, {
                    color: parseInt(totals.grandTotal) >= 0 ? Colors.BTNGREEN : '#d32f2f',
                    fontFamily: 'Poppins-Bold'
                  }]}>
                    {parseInt(totals.grandTotal) < 0 ? '-' : ''}₹{Math.abs(parseInt(totals.grandTotal))}
                  </Text>
                </View>
                <View style={[styles.summaryRow, {
                  borderTopWidth: 2,
                  borderTopColor: Colors.PRIMARY,
                  marginTop: hp('1%'),
                  paddingTop: hp('1%')
                }]}>
                  <Text style={[styles.summaryLabel, { fontFamily: 'Poppins-Bold' }]}>Remaining Amount:</Text>
                  <Text style={[
                    styles.summaryValue,
                    {
                      fontFamily: 'Poppins-Bold',
                      color: remainingAmount === "0.000" ? Colors.BTNGREEN :
                        parseFloat(remainingAmount) > 0 ? Colors.PRIMARY : '#d32f2f'
                    }
                  ]}>
                    {remainingAmount}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: remainingAmount === "0.000" ? Colors.BTNGREEN :
                        parseFloat(remainingAmount) > 0 ? Colors.PRIMARY : '#d32f2f'
                    }
                  ]}>
                  <Text style={styles.statusText}>
                    {remainingAmount === "0.000" ? 'Fully Paid' :
                      parseFloat(remainingAmount) > 0 ? 'Partial Payment' : 'Fully Paid'}
                  </Text>
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
                <TextInput
                  style={[styles.inputField, styles.modeInput]}
                  value="Cash"
                  editable={false}
                />
              </View>
              <View style={styles.paymentColumn}>
                <TextInput
                  ref={cashInputRef}
                  style={styles.inputField}
                  keyboardType="numeric"
                  placeholder="Not filled"
                  placeholderTextColor="#999"
                  value={paymentDetails.Cash}
                  onChangeText={value => validateAndSetPayment('Cash', value)}
                  onFocus={handleCashFocus}
                  maxLength={12}
                />
              </View>
            </View>

            <View style={[styles.paymentRow, { alignItems: 'center' }]}>
              <View style={styles.modeColumn}>
                <TouchableOpacity
                  style={[styles.inputField, styles.modeInput, {
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }]}
                  onPress={() => {
                    dismissKeyboard();
                    setUpiDropdownVisible(prev => !prev);
                  }}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {selectedUpiHolder ? selectedUpiHolder.upiHolder : 'Select UPI Holder'}
                  </Text>
                  <Image
                    source={require('../../assets/down.png')}
                    style={{ width: wp('4%'), height: hp('2%') }}
                  />
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
                  onChangeText={value => validateAndSetPayment('UPI', value)}
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
                    upiHolders.map(item => (
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
          style={[styles.doneButton, (isUpdating || modalVisible) && { opacity: 0.7 }]}
          onPress={() => setModalVisible(true)}
          disabled={isUpdating || modalVisible}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.doneText}>Update Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    )}

    <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => !isUpdating && setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Are you sure you want to update this invoice?</Text>
          <Text style={[styles.modalText, { fontSize: wp('3.5%'), color: '#666', marginTop: -10 }]}>
            Total Payment: ₹{totalPaid.toFixed(3)}
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              disabled={isUpdating}
            >
              <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePaymentDone}
              style={[styles.modalButton, { backgroundColor: Colors.BTNGREEN }]}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold', marginLeft: 8 }}>Updating...</Text>
                </View>
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
    justifyContent: 'center',
    minHeight: hp('5%'),
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

export default UpdateInvoiceBill;