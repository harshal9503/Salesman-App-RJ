import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const { width } = Dimensions.get('window');

const formatDateDDMMYYYY = (dateObj) => {
  return moment(dateObj).format('DD-MM-YYYY');
};

const UpdateCustomOrder = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([
    {
      productName: '',
      weightFrom: '',
      weightTo: '',
      purity: '',
      size: '',
      width: '',
      stoneWeight: '',
      expectedWeight: '',
      rateCut: '',
      ratePerGram: '',
      expectedDeliveryDate: '',
      description: '',
      expectedAmount: '',
      craftsmanName: '',
      piece: '',
      netWeightInGrams: '',
      metal: '',
      customOrderStatus: '',
    },
  ]);
  const [customerDetails, setCustomerDetails] = useState({
    customerNameEng: '',
    customerNameHin: '',
    mobileNumber: '',
    address: '',
  });
  const [invoiceDetails, setInvoiceDetails] = useState({
    voucherNo: '',
    date: '',
  });
  const [purityDrop, setPurityDrop] = useState(false);
  const [inputClearPurity, setInputClearPurity] = useState(true);
  const [valuePurity, setValuePurity] = useState('');
  const [rateCutDrop, setRateCutDrop] = useState(false);
  const [inputClearRateCut, setInputClearRateCut] = useState(true);
  const [valueRateCut, setValueRateCut] = useState('');
  const [liveGoldRate, setLiveGoldRate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showPicker2, setShowPicker2] = useState(false);
  const [dateDelivery, setDateDelivery] = useState(new Date());
  const [voucherNo, setVoucherNo] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [errors, setErrors] = useState({});

  let lastIndex = products.length - 1;
  const handlePurityDropOpen = () => setPurityDrop(!purityDrop);
  const handleRateCutDropOpen = () => setRateCutDrop(!rateCutDrop);

  const { id } = route.params || {};
  const customOrderId = id;
  const isEditMode = !!customOrderId;

  useEffect(() => {
    if (customOrderId) {
      fetchCustomOrderData(customOrderId);
    } else {
      fetchVoucherNo();
      const todayStr = formatDateDDMMYYYY(new Date());
      setInvoiceDetails((prev) => ({ ...prev, date: todayStr }));
      setDate(new Date());
      setDateDelivery(new Date());
      setProducts((prev) => {
        const updatedProducts = [...prev];
        if (updatedProducts.length > 0) {
          updatedProducts[0].expectedDeliveryDate = '';
        }
        return updatedProducts;
      });
      setLoading(false);
    }
    getLiveGoldRate();
  }, [customOrderId]);

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  };

  const fetchCustomOrderData = async (id) => {
    try {
      console.log('Fetching custom order data for ID:', id);
      setLoading(true);
      
      const token = await getAuthToken();

      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://rajmanijewellers.in/api/salesman/get-custom-order-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Fetched custom order data:', response.data);

      const customOrder = response.data.customInvoice || response.data;

      if (!customOrder) {
        throw new Error('No custom order data found');
      }

      // Auto-fill product details
      const updatedProducts = customOrder.productDetails && customOrder.productDetails.length > 0
        ? customOrder.productDetails.map((p) => ({
            productName: p.productName || '',
            weightFrom: p.weightFrom ? p.weightFrom.toString() : '',
            weightTo: p.weightTo ? p.weightTo.toString() : '',
            purity: p.purity ? p.purity.toString() : '',
            size: p.size ? p.size.toString() : '',
            width: p.width ? p.width.toString() : '',
            stoneWeight: p.stoneWeight ? p.stoneWeight.toString() : '',
            expectedWeight: p.expectedWeight ? p.expectedWeight.toString() : '',
            rateCut: p.rateCut !== undefined && p.rateCut !== null 
              ? (p.rateCut === true || p.rateCut === 'true' || p.rateCut === 'Yes' ? 'Yes' : 'No')
              : '',
            ratePerGram: p.ratePerGram ? p.ratePerGram.toString() : '',
            expectedDeliveryDate: p.expectedDeliveryDate ? formatDateDDMMYYYY(new Date(p.expectedDeliveryDate)) : '',
            description: p.description || '',
            expectedAmount: p.expectedAmount ? p.expectedAmount.toString() : '',
            craftsmanName: p.craftsmanName || '',
            piece: p.piece ? p.piece.toString() : '',
            netWeightInGrams: p.netWeightInGrams ? p.netWeightInGrams.toString() : '',
            metal: p.metal || '',
            customOrderStatus: p.customOrderStatus || '',
          }))
        : [
            {
              productName: '',
              weightFrom: '',
              weightTo: '',
              purity: '',
              size: '',
              width: '',
              stoneWeight: '',
              expectedWeight: '',
              rateCut: '',
              ratePerGram: '',
              expectedDeliveryDate: '',
              description: '',
              expectedAmount: '',
              craftsmanName: '',
              piece: '',
              netWeightInGrams: '',
              metal: '',
              customOrderStatus: '',
            },
          ];

      // Auto-fill customer details
      const updatedCustomer = customOrder.customerDetails
        ? {
            customerNameEng: customOrder.customerDetails.customerNameEng || '',
            customerNameHin: customOrder.customerDetails.customerNameHin || '',
            mobileNumber: customOrder.customerDetails.mobileNumber 
              ? customOrder.customerDetails.mobileNumber.toString()
              : '',
            address: customOrder.customerDetails.address || '',
          }
        : { customerNameEng: '', customerNameHin: '', mobileNumber: '', address: '' };

      // Auto-fill invoice details
      const updatedInvoice = customOrder.invoiceDetails 
        ? {
            voucherNo: customOrder.invoiceDetails.voucherNo || '',
            date: customOrder.invoiceDetails.date ? formatDateDDMMYYYY(new Date(customOrder.invoiceDetails.date)) : '',
          }
        : { voucherNo: '', date: '' };

      setProducts(updatedProducts);
      setCustomerDetails(updatedCustomer);
      setInvoiceDetails(updatedInvoice);
      setVoucherNo(updatedInvoice.voucherNo || '');
      setIsUpdate(true);

      // Set purity and rate cut values for dropdowns
      if (updatedProducts.length > 0) {
        const product = updatedProducts[0];
        if (product.purity) {
          setValuePurity(`${product.purity}k`);
          setInputClearPurity(false);
        }
        if (product.rateCut) {
          setValueRateCut(product.rateCut);
          setInputClearRateCut(false);
        }
      }

      // Set dates
      if (updatedInvoice.date) {
        const parsedDate = moment(updatedInvoice.date, 'DD-MM-YYYY').isValid()
          ? moment(updatedInvoice.date, 'DD-MM-YYYY').toDate()
          : new Date();
        setDate(parsedDate);
      }

      if (updatedProducts.length > 0 && updatedProducts[0].expectedDeliveryDate) {
        const parsedDeliveryDate = moment(updatedProducts[0].expectedDeliveryDate, 'DD-MM-YYYY').isValid()
          ? moment(updatedProducts[0].expectedDeliveryDate, 'DD-MM-YYYY').toDate()
          : new Date();
        setDateDelivery(parsedDeliveryDate);
      }

      console.log('Data populated successfully');

    } catch (error) {
      console.error('Error fetching custom order data:', error.response?.data || error.message || error);
      Alert.alert('Error', `Failed to load custom order data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherNo = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`https://rajmanijewellers.in/api/salesman/get-unique-voucher-number`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const voucher = response.data.data;
      if (voucher) {
        setVoucherNo(voucher);
        setInvoiceDetails((prev) => ({ ...prev, voucherNo: voucher }));
      }
    } catch (error) {
      console.error('Error fetching voucher:', error);
    }
  };

  const getLiveGoldRate = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No token found for gold rate fetch');
        return;
      }
      const response = await axios.get(
        `https://rajmanijewellers.in/api/salesman/get-latest-gold-price`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLiveGoldRate(response.data);
    } catch (error) {
      if (error?.response) {
        console.error('Error fetching gold rate:', error.response.data);
      } else {
        console.error('Error fetching gold rate:', error.message);
      }
    }
  };

  const handleChange = (index, key, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][key] = value;
    setProducts(updatedProducts);
    
    // Clear error when user starts typing
    if (errors[`product_${key}`]) {
      setErrors(prev => ({ ...prev, [`product_${key}`]: '' }));
    }
  };

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = formatDateDDMMYYYY(selectedDate);
      handleInvoiceChange('date', formattedDate);
    }
  };

  const onChangeSecond = (event, selectedDateSecond) => {
    setShowPicker2(false);
    if (selectedDateSecond) {
      setDateDelivery(selectedDateSecond);
      const formattedDate = formatDateDDMMYYYY(selectedDateSecond);
      handleChange(lastIndex, 'expectedDeliveryDate', formattedDate);
      
      // Clear error when date is selected
      if (errors.product_expectedDeliveryDate) {
        setErrors(prev => ({ ...prev, product_expectedDeliveryDate: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!products[lastIndex].productName) newErrors.product_productName = 'Product Name is required';
    if (!products[lastIndex].expectedAmount) newErrors.product_expectedAmount = 'Expected Amount is required';
    
    // Validate mobile number as required
    if (!customerDetails.mobileNumber) {
      newErrors.mobileNumber = 'Mobile Number is required';
    } else if (!/^\d{10}$/.test(customerDetails.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile Number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigateToPayment = () => {
    setInputClearPurity(false);
    
    if (!validateForm()) {
      Alert.alert('Required', 'Please fill all required fields');
      return;
    }
    
    // Prepare data with N/A for empty optional fields
    const processedProducts = products.map(product => ({
      ...product,
      weightFrom: product.weightFrom || 'N/A',
      weightTo: product.weightTo || 'N/A',
      purity: product.purity || 'N/A',
      size: product.size || 'N/A',
      width: product.width || 'N/A',
      stoneWeight: product.stoneWeight || 'N/A',
      expectedWeight: product.expectedWeight || 'N/A',
      rateCut: product.rateCut || 'N/A',
      ratePerGram: product.ratePerGram || 'N/A',
      expectedDeliveryDate: product.expectedDeliveryDate || 'N/A',
      description: product.description || 'N/A',
      craftsmanName: product.craftsmanName || 'N/A',
      piece: product.piece || 'N/A',
      netWeightInGrams: product.netWeightInGrams || 'N/A',
      metal: product.metal || 'N/A',
    }));

    const processedCustomerDetails = {
      customerNameEng: customerDetails.customerNameEng || 'N/A',
      customerNameHin: customerDetails.customerNameHin || 'N/A',
      mobileNumber: customerDetails.mobileNumber || 'N/A',
      address: customerDetails.address || 'N/A',
    };

    navigation.navigate('update-third-bill', {
      productDetails: processedProducts,
      customerDetails: processedCustomerDetails,
      invoiceDetails,
      isUpdate,
      id: customOrderId,
    });
  };

  const toggleDropdownPurity = item => {
    const numericPurity = parseInt(item.replace('k', ''));
    setValuePurity(item);
    handleChange(lastIndex, 'purity', numericPurity);
    setPurityDrop(false);
    setInputClearPurity(false);

    // Clear error when purity is selected
    if (errors.product_purity) {
      setErrors(prev => ({ ...prev, product_purity: '' }));
    }

    if (liveGoldRate && liveGoldRate.data) {
      let rate = 0;
      switch (item) {
        case '18k':
          rate = liveGoldRate.data.price18k || 0;
          break;
        case '20k':
          rate = liveGoldRate.data.price20k || 0;
          break;
        case '22k':
          rate = liveGoldRate.data.price22k || 0;
          break;
        case '24k':
          rate = liveGoldRate.data.price24k || 0;
          break;
        default:
          rate = 0;
      }
      handleChange(lastIndex, 'ratePerGram', rate);
    }
  };

  const toggleDropdownRateCut = item => {
    // Store the string value directly instead of converting to boolean
    setValueRateCut(item);
    handleChange(lastIndex, 'rateCut', item);
    setRateCutDrop(false);
    setInputClearRateCut(false);

    // Clear error when rate cut is selected
    if (errors.product_rateCut) {
      setErrors(prev => ({ ...prev, product_rateCut: '' }));
    }
  };

  const handleCustomerChange = (key, value) => {
    const updated = { ...customerDetails, [key]: value };
    setCustomerDetails(updated);
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleInvoiceChange = (key, value) => {
    const updated = { ...invoiceDetails, [key]: value };
    setInvoiceDetails(updated);
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // Helper to get rates or fallback values
  const getRate = key => {
    if (liveGoldRate && liveGoldRate.data && liveGoldRate.data[key]) {
      return `₹${liveGoldRate.data[key]}`;
    }
    if (key === 'price18k') return '₹2000';
    if (key === 'price20k') return '₹5000';
    if (key === 'price22k') return '₹7000';
    if (key === 'price24k') return '₹8000';
    return '₹0';
  };

  // Format weight inputs to allow only decimal numbers with max 3 decimal places
  const formatWeightInput = (value) => {
    // Allow only numbers and decimal point
    const formattedValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = formattedValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 3 decimal places
    if (parts[1] && parts[1].length > 3) {
      return parts[0] + '.' + parts[1].substring(0, 3);
    }
    
    return formattedValue;
  };

  // Format amount input to allow only whole numbers
  const formatAmountInput = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  // Format product name to uppercase
  const formatProductName = (value) => {
    return value.toUpperCase();
  };

  // Format mobile number to allow only numbers and limit to 10 digits
  const formatMobileNumber = (value) => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    return numbersOnly.slice(0, 10);
  };

  // Get minimum date for date pickers (today)
  const getMinimumDate = () => {
    return new Date();
  };

  // Helper function to get input style based on errors
  const getInputStyle = (fieldName) => {
    return errors[fieldName] ? [styles.input, styles.inputError] : styles.input;
  };

  // Helper function to get dropdown style based on errors
  const getDropdownStyle = (fieldName) => {
    return errors[fieldName] ? [styles.input, styles.inputError] : styles.input;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.statusBarBackground} />
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Custom Order</Text>
        <View style={styles.placeholder} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Today's Gold Rate</Text>
          <View style={styles.boxRow}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>18k</Text>
              <Text style={styles.boxValue}>{getRate('price18k')}</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>20k</Text>
              <Text style={styles.boxValue}>{getRate('price20k')}</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>22k</Text>
              <Text style={styles.boxValue}>{getRate('price22k')}</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>24k</Text>
              <Text style={styles.boxValue}>{getRate('price24k')}</Text>
            </View>
          </View>
        
          <View style={styles.sectionFirst}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Voucher No.</Text>
              <TextInput
                style={styles.input}
                value={voucherNo}
                editable={false}
              />
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={invoiceDetails.date}
                editable={false}
              />
              <TouchableOpacity
                style={styles.dateContainer}
                onPress={() => setShowPicker(true)}
              >
                <Image
                  source={require('../../assets/dateicon.png')}
                  style={styles.datePickerBtn}
                />
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChange}
                  minimumDate={getMinimumDate()}
                />
              )}
            </View>
          </View>
          
          <View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={customerDetails.customerNameEng}
                onChangeText={value =>
                  handleCustomerChange('customerNameEng', value)
                }
              />
            </View>
            
            {customerDetails.customerNameHin && (
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Name (Hindi)</Text>
                <TextInput
                  style={styles.input}
                  value={customerDetails.customerNameHin}
                  editable={false}
                />
              </View>
            )}
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={getInputStyle('mobileNumber')}
                keyboardType="numeric"
                maxLength={10}
                value={String(customerDetails.mobileNumber)}
                onChangeText={value =>
                  handleCustomerChange('mobileNumber', formatMobileNumber(value))
                }
              />
              {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={String(customerDetails.address)}
                onChangeText={value => handleCustomerChange('address', value)}
              />
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={getInputStyle('product_productName')}
                value={products[lastIndex].productName}
                onChangeText={value =>
                  handleChange(lastIndex, 'productName', formatProductName(value))
                }
                autoCapitalize="characters"
              />
              {errors.product_productName && <Text style={styles.errorText}>{errors.product_productName}</Text>}
            </View>
          </View>
          
          <View style={styles.sectionFirst}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Weight From</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(products[lastIndex].weightFrom)}
                onChangeText={value =>
                  handleChange(lastIndex, 'weightFrom', formatWeightInput(value))
                }
              />
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Weight To</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(products[lastIndex].weightTo)}
                onChangeText={value => handleChange(lastIndex, 'weightTo', formatWeightInput(value))}
              />
            </View>
          </View>
          
          <View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Purity</Text>
              <View>
                <TouchableOpacity onPress={handlePurityDropOpen}>
                  <Image
                    source={require('../../assets/down.png')}
                    style={styles.dropdownArrow}
                  />
                  <View style={styles.input}>
                    <Text style={styles.dropdownText}>
                      {inputClearPurity ? 'Select Purity' : valuePurity}
                    </Text>
                  </View>
                </TouchableOpacity>
                {purityDrop && (
                  <View style={styles.dropdownContainer}>
                    {['18k', '20k', '22k', '24k'].map((purity, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => toggleDropdownPurity(purity)}
                      >
                        <Text style={styles.dropdownOption}>{purity}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Size/Length</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(products[lastIndex].size)}
                onChangeText={value => handleChange(lastIndex, 'size', value)}
              />
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Expected Weight</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(products[lastIndex].expectedWeight)}
                onChangeText={value =>
                  handleChange(lastIndex, 'expectedWeight', formatWeightInput(value))
                }
              />
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Width</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(products[lastIndex].width)}
                onChangeText={value => handleChange(lastIndex, 'width', value)}
              />
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Stone Weight</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(products[lastIndex].stoneWeight)}
                onChangeText={value =>
                  handleChange(lastIndex, 'stoneWeight', formatWeightInput(value))
                }
              />
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Rate Cut</Text>
              <View>
                <TouchableOpacity onPress={handleRateCutDropOpen}>
                  <Image
                    source={require('../../assets/down.png')}
                    style={styles.dropdownArrow}
                  />
                  <View style={styles.input}>
                    <Text style={styles.dropdownText}>
                      {inputClearRateCut ? 'Select Ratecut' : valueRateCut}
                    </Text>
                  </View>
                </TouchableOpacity>
                {rateCutDrop && (
                  <View style={styles.dropdownContainer}>
                    {['Yes', 'No'].map((rateCut, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => toggleDropdownRateCut(rateCut)}
                      >
                        <Text style={styles.dropdownOption}>{rateCut}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Rate</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(products[lastIndex].ratePerGram)}
                onChangeText={value =>
                  handleChange(lastIndex, 'ratePerGram', value)
                }
              />
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Expected Delivery Date</Text>
              <TextInput
                style={styles.input}
                value={products[lastIndex].expectedDeliveryDate}
                editable={false}
              />
              <TouchableOpacity
                style={styles.dateContainer}
                onPress={() => setShowPicker2(true)}
              >
                <Image
                  source={require('../../assets/dateicon.png')}
                  style={styles.datePickerBtn}
                />
              </TouchableOpacity>
              {showPicker2 && (
                <DateTimePicker
                  value={dateDelivery}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeSecond}
                  minimumDate={getMinimumDate()}
                />
              )}
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.description}
                multiline
                value={products[lastIndex].description}
                onChangeText={value =>
                  handleChange(lastIndex, 'description', value)
                }
              />
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Expected Amount *</Text>
              <TextInput
                style={getInputStyle('product_expectedAmount')}
                keyboardType="numeric"
                value={String(products[lastIndex].expectedAmount)}
                onChangeText={value =>
                  handleChange(lastIndex, 'expectedAmount', formatAmountInput(value))
                }
              />
              {errors.product_expectedAmount && <Text style={styles.errorText}>{errors.product_expectedAmount}</Text>}
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Karigar Name</Text>
              <TextInput
                style={styles.input}
                value={products[lastIndex].craftsmanName}
                onChangeText={value =>
                  handleChange(lastIndex, 'craftsmanName', value)
                }
              />
            </View>

            {/* Additional fields from API response */}
            {products[lastIndex]?.metal && (
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Metal</Text>
                <TextInput
                  style={styles.input}
                  value={products[lastIndex].metal}
                  onChangeText={(value) => handleChange(lastIndex, 'metal', value)}
                />
              </View>
            )}

            {products[lastIndex]?.piece && (
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Piece</Text>
                <TextInput
                  style={styles.input}
                  value={products[lastIndex].piece}
                  keyboardType="numeric"
                  onChangeText={(value) => handleChange(lastIndex, 'piece', value)}
                />
              </View>
            )}

            {products[lastIndex]?.netWeightInGrams && (
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Net Weight (grams)</Text>
                <TextInput
                  style={styles.input}
                  value={products[lastIndex].netWeightInGrams}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => handleChange(lastIndex, 'netWeightInGrams', formatWeightInput(value))}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={navigateToPayment}>
          <Text style={styles.payText}>{isUpdate ? "Update" : "Save"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Medium',
    color: Colors.PRIMARY,
  },
  keyboardAvoid: {
    flex: 1,
  },
  statusBarBackground: {
    height: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.PRIMARY,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: 5,
    paddingHorizontal: wp('4%'),
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
    marginTop: 0,
    fontWeight:'bold'
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    fontWeight:'bold'
  },
  placeholder: {
    width: wp('15%'),
  },
  scrollContent: {
    padding: wp('4%'),
    paddingBottom: hp('18%'),
    paddingTop: hp('1%'),
  },
  heading: {
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#222',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    padding: wp('3%'),
    backgroundColor: '#f8f9fa',
    borderRadius: wp('2%'),
  },
  orderInfoText: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  orderStatus: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-SemiBold',
  },
  sectionFirst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  input: {
    height: hp('5%'),
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: 0,
    borderRadius: wp('1.5%'),
    marginBottom: hp('0.5%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  errorText: {
    color: 'red',
    fontSize: wp('2.8%'),
    fontFamily: 'Poppins-Regular',
    marginBottom: hp('1%'),
    marginLeft: wp('1%'),
  },
  inputContainerHalf: { 
    flex: 1,
    marginBottom: hp('0.5%'),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: Colors.BTNGREEN,
    paddingVertical: hp('1.6%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    height: hp('6%'),
    justifyContent: 'center',
  },
  payText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
  },
  description: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    textAlignVertical: 'top',
    color: '#000',
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  box: {
    backgroundColor: '#fff',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    width: (width - wp('15%')) / 4,
    height: hp('6%'),
    elevation: 9,
  },
  boxTitle: {
    fontSize: wp('3%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  boxValue: {
    fontSize: wp('3%'),
    fontFamily: 'Poppins-Medium',
    color: '#555',
  },
  dropdownContainer: {
    position: 'absolute',
    top: hp('5%'),
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: wp('1.5%'),
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownOption: {
    fontSize: wp('3.5%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownArrow: {
    width: 14,
    height: 7,
    position: 'absolute',
    top: hp('2%'),
    right: wp('5%'),
    tintColor: '#888',
    zIndex: 1,
  },
  dropdownText: {
    marginTop: hp('1.2%'),
    color: '#000',
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  datePickerBtn: {
    width: 25,
    height: 25,
  },
  dateContainer: {
    position: 'absolute',
    top: hp('3%'),
    right: hp('1%'),
  },
});

export default UpdateCustomOrder;