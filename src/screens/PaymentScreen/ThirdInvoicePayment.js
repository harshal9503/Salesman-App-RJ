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
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThirdInvoicePayment = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [upiHolders, setUpiHolders] = useState([]);
  const [selectedUpiHolder, setSelectedUpiHolder] = useState(null);
  const [upiDropdownVisible, setUpiDropdownVisible] = useState(false);
  const [loadingUpi, setLoadingUpi] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    Cash: '',
    UPI: '',
    advanceAmount: '',
  });

  const {
    productDetails,
    customerDetails,
    invoiceDetails,
    isUpdate,
    id,
  } = route.params;

  const rawPayableAmount = Number(productDetails?.[0]?.expectedAmount || 0);
  const payableAmount = parseFloat(rawPayableAmount.toFixed(3));

  useEffect(() => {
    const fetchUpiHolders = async () => {
      setLoadingUpi(true);
      try {
        const response = await axios.get('https://rajmanijewellers.in/api/salesman/get-all-upi');
        console.log('UPI Holders API Response:', response.data);
        if (response.data && response.data.success) {
          setUpiHolders(response.data.data);
        }
      } catch (error) {
        console.log('Error fetching UPI holders', error);
      } finally {
        setLoadingUpi(false);
      }
    };

    fetchUpiHolders();
  }, []);

  // Function to convert DD-MM-YYYY to ISO format (YYYY-MM-DD)
  const convertToISODate = (dateString) => {
    if (!dateString) {
      const today = new Date();
      return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
    
    try {
      // If date is already in ISO format (YYYY-MM-DD)
      if (dateString.includes('T')) {
        return dateString.split('T')[0]; // Extract date part only
      }
      
      // If date is in DD-MM-YYYY format
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          
          // Validate date components
          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);
          
          if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
            return `${year}-${month}-${day}`; // YYYY-MM-DD format
          }
        }
      }
      
      // Fallback: return today's date in ISO format
      const today = new Date();
      return today.toISOString().split('T')[0];
    } catch (error) {
      console.log('Date conversion error', error);
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
  };

  // Helper function to safely parse numeric values
  const safeParseNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return defaultValue;
    }
    
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to safely parse integer values
  const safeParseInt = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return defaultValue;
    }
    
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function for string values
  const safeString = (value, defaultValue = '') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return String(value);
  };

  const validateAndSetPayment = (mode, value) => {
    let val = value.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const parts = val.split('.');
      parts[1] = parts[1].substring(0, 3);
      val = parts[0] + '.' + parts[1];
    }
    if (val.startsWith('-')) val = val.replace(/-/g, '');

    const currentOtherAmount = Object.keys(paymentDetails)
      .filter(k => k !== mode && k !== 'advanceAmount')
      .reduce((sum, k) => sum + parseFloat(paymentDetails[k] || 0), 0);

    if (parseFloat(val) > payableAmount) {
      Alert.alert('Invalid Amount', 'Total payment cannot exceed payable amount');
      val = (parseFloat(payableAmount) - currentOtherAmount).toFixed(3);
    }
    if (parseFloat(val) < 0) val = '0';

    setPaymentDetails(prev => {
      const updated = { ...prev, [mode]: val };
      // Calculate advance amount as sum of cash and UPI (without flooring)
      const cashAmount = parseFloat(updated.Cash || 0);
      const upiAmount = parseFloat(updated.UPI || 0);
      const advance = cashAmount + upiAmount;
      updated.advanceAmount = advance.toFixed(3);
      return updated;
    });
  };

  // Calculate total payment (cash + UPI)
  const totalPayment = () => {
    const cashAmount = parseFloat(paymentDetails.Cash || 0);
    const upiAmount = parseFloat(paymentDetails.UPI || 0);
    return cashAmount + upiAmount;
  };

  // Calculate advance amount (same as total payment)
  const advanceAmount = totalPayment();

  // Calculate remaining amount properly
  const calculateRemainingAmount = () => {
    const paidAmount = totalPayment();
    const payable = parseFloat(payableAmount);
    const remaining = payable - paidAmount;
    
    // If remaining is very close to zero (due to floating point precision), treat it as zero
    if (Math.abs(remaining) < 0.001) {
      return 0;
    }
    
    // If remaining is negative (overpayment), show as zero for remaining
    if (remaining < 0) {
      return 0;
    }
    
    return parseFloat(remaining.toFixed(3));
  };

  const remainingAmount = calculateRemainingAmount();

  // Calculate pending amount (same as remaining amount)
  const pendingAmount = calculateRemainingAmount();

  const handlePaymentDone = async () => {
    const cashAmount = parseFloat(paymentDetails.Cash || 0);
    const upiAmount = parseFloat(paymentDetails.UPI || 0);

    if (cashAmount === 0 && upiAmount === 0) {
      Alert.alert(
        'Zero Payment',
        'No payment amount entered. Do you want to proceed with zero payment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: createInvoice },
        ]
      );
    } else {
      createInvoice();
    }
  };

  const createInvoice = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      // Convert dates to ISO format for backend
      const convertedDate = convertToISODate(invoiceDetails.date);
      const convertedDeliveryDate = convertToISODate(productDetails[0]?.expectedDeliveryDate);

      console.log('Original Invoice Date:', invoiceDetails.date);
      console.log('Converted Invoice Date (ISO):', convertedDate);
      console.log('Original Delivery Date:', productDetails[0]?.expectedDeliveryDate);
      console.log('Converted Delivery Date (ISO):', convertedDeliveryDate);

      // Prepare product details with safe parsing for numeric values
      const formattedProductDetails = productDetails.map(product => ({
        productName: safeString(product.productName, ''),
        description: safeString(product.description, ''),
        purity: safeParseInt(product.purity, 0),
        weightFrom: safeParseNumber(product.weightFrom, 0),
        weightTo: safeParseNumber(product.weightTo, 0),
        size: safeParseNumber(product.size, 0),
        width: safeParseNumber(product.width, 0),
        stoneWeight: safeParseNumber(product.stoneWeight, 0),
        expectedWeight: safeParseNumber(product.expectedWeight, 0),
        ratePerGram: safeParseNumber(product.ratePerGram, 0),
        rateCut: product.rateCut === 'Yes' ? true : false,
        expectedDeliveryDate: convertedDeliveryDate,
        expectedAmount: safeParseNumber(product.expectedAmount, 0),
        craftsmanName: safeString(product.craftsmanName, ''),
        piece: safeParseInt(product.piece, 1),
        netWeightInGrams: safeParseNumber(product.netWeightInGrams, 0),
        metal: safeString(product.metal, ''),
        // Additional fields with safe parsing
        stoneRate: safeParseNumber(product.stoneRate, 0),
        labourChargesInPercentage: safeParseNumber(product.labourChargesInPercentage, 0),
        labourChargesInGram: safeParseNumber(product.labourChargesInGram, 0),
        additionalAmount: safeParseNumber(product.additionalAmount, 0),
        discountAmount: safeParseNumber(product.discountAmount, 0),
      }));

      const payload = {
        customerDetails: {
          customerNameEng: safeString(customerDetails.customerNameEng, ''),
          customerNameHin: safeString(customerDetails.customerNameHin, ''),
          mobileNumber: safeParseInt(customerDetails.mobileNumber, 0),
          address: safeString(customerDetails.address, ''),
        },
        paymentDetails: {
          upi: safeParseNumber(paymentDetails.UPI, 0),
          cash: safeParseNumber(paymentDetails.Cash, 0),
          advanceAmount: safeParseNumber(advanceAmount.toFixed(3), 0),
        },
        invoiceDetails: {
          voucherNo: safeString(invoiceDetails.voucherNo, ''),
          date: convertedDate,
          remarks: safeString(invoiceDetails.remarks, ''),
        },
        productDetails: formattedProductDetails,
      };

      // Use direct URLs
      const createUrl = 'https://rajmanijewellers.in/api/salesman/create-custom-order';
      const updateUrl = `https://rajmanijewellers.in/api/salesman/update-custom-order-by-id/${id}`;

      console.log('API Payload:', JSON.stringify(payload, null, 2));
      console.log('API URL:', isUpdate ? updateUrl : createUrl);
      console.log('Request Method:', isUpdate ? 'PATCH' : 'POST');
      console.log('Token:', token ? 'Token present' : 'No token');

      let response;
      if (isUpdate) {
        response = await axios.patch(
          updateUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );
      } else {
        response = await axios.post(
          createUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );
      }

      console.log('API Response Status:', response.status);
      console.log('API Response Data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        const message = isUpdate ? 'Custom order updated successfully!' : 'Custom order created successfully!';
        Alert.alert('Success', message, [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              // Navigate to custom-order-invoice after successful payment
              handleNavigateToInvoice(response.data);
            }
          }
        ]);
      } else {
        console.log('API Error Response:', response.data);
        Alert.alert('Error', response.data.message || 'Failed to create/update custom order');
      }
    } catch (error) {
      console.log('API Error Details:', error);
      
      if (error.response) {
        console.log('Error Response Status:', error.response.status);
        console.log('Error Response Data:', error.response.data);
        console.log('Error Response Headers:', error.response.headers);
        
        if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Please login again.');
        } else if (error.response.status === 500) {
          Alert.alert('Server Error', 'Internal server error. Please try again later.');
        } else {
          const errorMessage = error.response.data.message || error.response.data.error || 'Server error occurred';
          Alert.alert('Server Error', errorMessage);
        }
      } else if (error.request) {
        console.log('Error Request:', error.request);
        Alert.alert('Network Error', 'No response from server. Please check your internet connection and try again.');
      } else {
        console.log('Error Message:', error.message);
        Alert.alert('Unexpected Error', error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToInvoice = (responseData) => {
    // Prepare data for custom-order-invoice screen
    const invoiceData = {
      // Basic order info
      orderId: responseData.data?._id || id,
      voucherNo: safeString(invoiceDetails.voucherNo, ''),
      date: safeString(invoiceDetails.date, new Date().toISOString().split('T')[0]),
      
      // Customer details
      customerDetails: {
        customerNameEng: safeString(customerDetails.customerNameEng, ''),
        customerNameHin: safeString(customerDetails.customerNameHin, ''),
        mobileNumber: safeString(customerDetails.mobileNumber, ''),
        address: safeString(customerDetails.address, ''),
      },
      
      // Product details
      productDetails: productDetails.map(product => ({
        productName: safeString(product.productName, ''),
        description: safeString(product.description, ''),
        expectedWeight: safeString(product.expectedWeight, '0.000'),
        expectedAmount: safeString(product.expectedAmount, '0.00'),
        netWeightInGrams: safeString(product.netWeightInGrams || product.expectedWeight, '0.000'),
        purity: safeString(product.purity, ''),
        metal: safeString(product.metal, ''),
        craftsmanName: safeString(product.craftsmanName, ''),
        piece: safeString(product.piece, '1'),
      })),
      
      // Payment details
      paymentDetails: {
        totalAmount: payableAmount,
        cash: safeParseNumber(paymentDetails.Cash, 0),
        upi: safeParseNumber(paymentDetails.UPI, 0),
        advanceAmount: advanceAmount,
        remainingAmount: remainingAmount,
        pendingAmount: pendingAmount,
      },
      
      // Additional info
      isCustomOrder: true,
      orderType: 'custom',
      createdDate: new Date().toISOString(),
    };
    
    console.log('Navigating to Custom Order Invoice with data:', invoiceData);
    
    // Navigate to custom-order-invoice screen
    navigation.navigate('custom-order-invoice', { 
      invoiceData: invoiceData,
      isUpdate: isUpdate 
    });
  };

  const handleShowBill = () => {
    const billData = {
      invoiceDetails: {
        voucherNo: safeString(invoiceDetails.voucherNo, ''),
        date: safeString(invoiceDetails.date, new Date().toISOString().split('T')[0]),
      },
      customerDetails: {
        customerNameEng: safeString(customerDetails.customerNameEng, ''),
        mobileNumber: safeString(customerDetails.mobileNumber, ''),
        address: safeString(customerDetails.address, ''),
      },
      productDetails: productDetails.map(product => ({
        productName: safeString(product.productName, ''),
        description: safeString(product.description, ''),
        expectedWeight: safeString(product.expectedWeight, '0.000'),
        expectedAmount: safeString(product.expectedAmount, '0.00'),
        netWeightInGrams: safeString(product.netWeightInGrams || product.expectedWeight, '0.000'),
      })),
      paymentDetails: {
        totalAmount: payableAmount,
        cash: safeParseNumber(paymentDetails.Cash, 0),
        upi: safeParseNumber(paymentDetails.UPI, 0),
        advanceAmount: advanceAmount,
      },
      totals: {
        paymentType: 'RECEIPT',
        CASH: safeString(paymentDetails.Cash, '0'),
        paymentAmount: safeString(advanceAmount.toString(), '0'),
      },
    };
    
    console.log('Navigating to Show Bill with data:', billData);
    navigation.navigate('custom-first-show-bill', { billData });
  };

  return (
    <View style={styles.mainContainer}>
      {/* PRIMARY Color Strip at Top */}
      <View style={styles.primaryStrip} />
      
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShowBill} style={styles.showBillTouchable}>
          <Text style={styles.showBillText}>Show Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Make Payment Section */}
          <View style={styles.sectionBox}>
            <Text style={styles.header}>Make Payment</Text>
            <Text style={styles.amountPayable}>Payable amount = ₹{payableAmount.toFixed(3)}</Text>
          </View>

          {/* Product Details Section */}
          <View style={styles.sectionBox}>
            <Text style={[styles.header, { color: '#000' }]}>Product Details</Text>
            {productDetails.map((p, i) => (
              <View key={i} style={styles.productDetailsContainer}>
                {/* Basic Product Info */}
                <View style={styles.productRowBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>Product {i + 1}: {safeString(p.productName, 'Unnamed Product')}</Text>
                    <Text style={styles.productType}>Type: Custom Order</Text>
                    {p.craftsmanName && (
                      <Text style={styles.productType}>Karigar: {safeString(p.craftsmanName)}</Text>
                    )}
                  </View>
                  <Text style={[styles.productAmount, { color: Colors.BTNGREEN }]}>
                    ₹{safeParseNumber(p.expectedAmount, 0).toFixed(3)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Payment Summary Integrated Here */}
            <View style={[styles.paymentSummaryContainer, { marginTop: hp('2%') }]}>
              {/* Total Paid Amount */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Paid:</Text>
                <Text style={[styles.summaryValue, { color: Colors.BTNGREEN }]}>
                  ₹{totalPayment().toFixed(3)}
                </Text>
              </View>

              {/* Payment Breakdown */}
              {(safeParseNumber(paymentDetails.Cash) > 0 || safeParseNumber(paymentDetails.UPI) > 0) && (
                <View style={styles.breakdownContainer}>
                  {safeParseNumber(paymentDetails.Cash) > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Cash:</Text>
                      <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                        ₹{safeParseNumber(paymentDetails.Cash, 0).toFixed(3)}
                      </Text>
                    </View>
                  )}
                  {safeParseNumber(paymentDetails.UPI) > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>UPI:</Text>
                      <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                        ₹{safeParseNumber(paymentDetails.UPI, 0).toFixed(3)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Grand Total */}
              <View style={[styles.totalRowBox, { 
                borderTopWidth: 2, 
                borderTopColor: Colors.BTNRED, 
                marginTop: hp('1%'), 
                paddingTop: hp('1%') 
              }]}>
                <Text style={[styles.totalLabel, { fontFamily: 'Poppins-Bold' }]}>Grand Total:</Text>
                <Text style={[styles.totalAmount, { 
                  color: Colors.BTNGREEN,
                  fontFamily: 'Poppins-Bold'
                }]}>
                  ₹{payableAmount.toFixed(3)}
                </Text>
              </View>

              {/* Remaining Amount */}
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
                    color: remainingAmount === 0 ? Colors.BTNGREEN : Colors.PRIMARY
                  }
                ]}>
                  {remainingAmount === 0 ? '₹0.000' : `₹${remainingAmount.toFixed(3)}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Mode of Payment Section */}
          <View style={styles.sectionBox}>
            <Text style={styles.header}>Mode of Payment</Text>
            
            {/* Payment Header */}
            <View style={styles.paymentHeaderRow}>
              <View style={styles.modeColumn}>
                <Text style={styles.paymentLabel}>Mode</Text>
              </View>
              <View style={styles.paymentColumn}>
                <Text style={styles.paymentLabel}>Payment</Text>
              </View>
            </View>

            {/* Cash Payment Row */}
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

            {/* UPI Payment Row */}
            <View style={[styles.paymentRow, { alignItems: 'center' }]}>
              <View style={styles.modeColumn}>
                <TouchableOpacity
                  style={[styles.inputField, styles.modeInput, styles.upiSelector]}
                  onPress={() => setUpiDropdownVisible((prev) => !prev)}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.upiSelectorText}
                  >
                    {selectedUpiHolder ? safeString(selectedUpiHolder.upiHolder) : 'Select UPI Holder'}
                  </Text>
                  <Image 
                    source={require('../../assets/down.png')} 
                    style={styles.dropdownIcon} 
                  />
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

            {/* UPI Dropdown List */}
            {upiDropdownVisible && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                  {loadingUpi ? (
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                  ) : (
                    upiHolders.map((item) => (
                      <TouchableOpacity
                        key={item._id || item.id}
                        onPress={() => {
                          setSelectedUpiHolder(item);
                          setUpiDropdownVisible(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.dropdownItemText}>{safeString(item.upiHolder)}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* UPI Holder QR Code */}
            {selectedUpiHolder && (
              <View style={styles.qrContainer}>
                {imageLoading && <ActivityIndicator size="large" color={Colors.PRIMARY} />}
                <Image
                  key={selectedUpiHolder._id || selectedUpiHolder.id}
                  source={{ uri: safeString(selectedUpiHolder.image?.fileLocation) }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
              </View>
            )}

            {/* Advance Amount Row */}
            <View style={[styles.paymentRow, { marginTop: hp(2) }]}>
              <View style={styles.modeColumn}>
                <Text style={[styles.paymentLabel, styles.centeredText]}>Advance Amount</Text>
              </View>
              <View style={styles.paymentColumn}>
                <TextInput
                  style={[styles.inputField, styles.disabledInput]}
                  value={advanceAmount.toFixed(3)}
                  editable={false}
                  placeholder="Auto-calculated"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Pending Amount Row */}
            <View style={styles.paymentRow}>
              <View style={styles.modeColumn}>
                <Text style={[styles.paymentLabel, styles.centeredText]}>Pending Amount</Text>
              </View>
              <View style={styles.paymentColumn}>
                <TextInput
                  style={[styles.inputField, styles.disabledInput]}
                  value={pendingAmount.toFixed(3)}
                  editable={false}
                  placeholder="Auto-calculated"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Extra spacing at bottom for better scrolling */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.doneButton, loading && { opacity: 0.7 }]}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.doneText}>Payment Done</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure payment is completed?</Text>
            <Text style={styles.modalSubText}>
              Total Payment: ₹{totalPayment().toFixed(3)}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handlePaymentDone} 
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  primaryStrip: {
    height: hp(5),
    backgroundColor: Colors.PRIMARY,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: hp(6),
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backarrow: {
    width: wp(4.5),
    height: wp(4.5),
    resizeMode: 'contain',
    marginRight: wp(2),
  },
  backText: {
    fontSize: wp(4),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  showBillTouchable: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    backgroundColor: Colors.PRIMARY,
    borderRadius: wp(2),
  },
  showBillText: {
    fontSize: wp(3.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(12),
  },
  sectionBox: {
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderWidth: 1,
    borderRadius: wp(2),
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  header: {
    textAlign: 'center',
    fontSize: wp(4.5),
    fontFamily: 'Poppins-Bold',
    color: 'red',
    marginBottom: hp(1),
  },
  amountPayable: {
    textAlign: 'center',
    fontSize: wp(4),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  // Product Details Styles
  productDetailsContainer: {
    marginBottom: hp(2),
  },
  productRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productName: {
    fontSize: wp(3.7),
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  productType: {
    fontSize: wp(3.2),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: hp(0.2),
  },
  productAmount: {
    fontSize: wp(3.7),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  totalRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderColor: '#bbb',
  },
  totalLabel: {
    fontSize: wp(4),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  totalAmount: {
    fontSize: wp(4),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    marginBottom: hp(1.5),
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: hp(1.5),
    alignItems: 'center',
  },
  modeColumn: {
    flex: 0.45,
    marginRight: wp(2),
  },
  paymentColumn: {
    flex: 0.55,
  },
  paymentLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp(3.5),
    color: '#000',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#aaa',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    fontSize: wp(3.5),
    backgroundColor: '#f9f9f9',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  modeInput: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiSelectorText: {
    flex: 1,
    fontSize: wp(3.5),
    fontFamily: 'Poppins-Regular',
  },
  dropdownIcon: {
    width: wp(4),
    height: hp(2),
  },
  dropdownList: {
    maxHeight: hp(20),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp(2),
    backgroundColor: '#fff',
    marginTop: hp(1),
    zIndex: 1000,
  },
  dropdownScroll: {
    flexGrow: 0,
  },
  dropdownItem: {
    padding: wp(3),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropdownItemText: {
    fontSize: wp(3.5),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  qrImage: {
    width: wp(70),
    height: wp(70),
    borderRadius: wp(2),
  },
  centeredText: {
    textAlign: 'center',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  bottomSpacing: {
    height: hp(2),
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  doneButton: {
    backgroundColor: Colors.BTNGREEN,
    paddingVertical: hp(1.8),
    borderRadius: wp(2),
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  doneText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  modalContent: {
    width: '100%',
    maxWidth: wp(85),
    backgroundColor: '#fff',
    padding: wp(5),
    borderRadius: wp(3),
    elevation: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: wp(4.2),
    marginBottom: hp(1),
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  modalSubText: {
    fontSize: wp(3.8),
    color: '#666',
    marginBottom: hp(2),
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(1),
  },
  modalButton: {
    flex: 1,
    padding: hp(1.5),
    marginHorizontal: wp(1.5),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: Colors.BTNGREEN,
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp(3.8),
  },
  paymentSummaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: wp(3),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },
  summaryLabel: {
    fontSize: wp(3.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  summaryValue: {
    fontSize: wp(3.8),
    fontFamily: 'Poppins-SemiBold',
  },
  breakdownContainer: {
    backgroundColor: '#fff',
    padding: wp(2.5),
    borderRadius: wp(1.5),
    marginVertical: hp(0.8),
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(0.3),
  },
  breakdownLabel: {
    fontSize: wp(3.3),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  breakdownValue: {
    fontSize: wp(3.3),
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ThirdInvoicePayment;