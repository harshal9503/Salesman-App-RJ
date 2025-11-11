import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CreateInvoiceScreen = ({ navigation }) => {
  const [expanded, setExpanded] = useState(true);
  const [productForm, setProductForm] = useState(false);
  const [mini, setMini] = useState(false);
  const [typeDrop, setTypeDrop] = useState(false);
  const [purityDrop, setPurityDrop] = useState(false);
  const [labourTypeDrop, setLabourTypeDrop] = useState(false);
  const [showData, setShowData] = useState(false);
  const [valueType, setValueType] = useState('Sales'); // Default to Sales
  const [valuePurity, setValuePurity] = useState('');
  const [labourType, setLabourType] = useState('');
  const [inputClearType, setInputClearType] = useState(false); // Set to false since we have default
  const [inputClearPurity, setInputClearPurity] = useState(true);
  const [inputClearLabourType, setInputClearLabourType] = useState(true);

  // State for handling payment loading
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // To track invalid input fields for styling
  const [errorsInvoice, setErrorsInvoice] = useState({});
  const [errorsCustomer, setErrorsCustomer] = useState({});
  const [errorsProduct, setErrorsProduct] = useState({}); // { index: { field: true } }

  const [invoiceDetails, setInvoiceDetails] = useState({
    billNo: '',
    date: moment().format('YYYY-MM-DD'),
  });
  const [customerDetails, setCustomerDetails] = useState({
    customerNameEng: '',
    customerNameHin: '',
    mobileNumber: '',
    address: '',
  });
  const [products, setProducts] = useState([]);
  const [expandedProductIndices, setExpandedProductIndices] = useState([]);
  const [liveRate, setLiveRate] = useState();
  const [piece, setPiece] = useState(0);
  const [netValue, setNetValue] = useState(0);
  const [netWeight, setNetWeight] = useState(0);

  const [liveGoldRate, setLiveGoldRate] = useState(null);
  const [goldRateLoading, setGoldRateLoading] = useState(true);

  // Refs for auto-focus and keyboard handling
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});

  // Product name suggestions
  const [productNameSuggestions, setProductNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);

  const lastIndex = products.length - 1;

  useEffect(() => {
    generateDefaultBillNo();
  }, []);

  useEffect(() => {
    getLiveGoldRate();
  }, []);

  useEffect(() => {
    fetchBillNo();
  }, []);

  // Auto-close other products when adding new one
  useEffect(() => {
    if (products.length > 0) {
      setExpandedProductIndices([]);
    }
  }, [products.length]);

  const generateDefaultBillNo = async () => {
    try {
      const lastBillNo = await AsyncStorage.getItem('lastBillNo');
      if (lastBillNo) {
        const nextNumber = parseInt(lastBillNo.split('-')[1]) + 1;
        setInvoiceDetails(prev => ({
          ...prev,
          billNo: `RJ-${nextNumber.toString().padStart(3, '0')}`,
        }));
      }
    } catch (error) {
      console.error('Error generating bill number:', error);
    }
  };

  // Function to fetch live gold rate
  const getLiveGoldRate = async () => {
    setGoldRateLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        setLiveGoldRate(null);
        setGoldRateLoading(false);
        Alert.alert('Authentication Error', 'Please login again to fetch gold rates');
        return;
      }

      const fullApiUrl = 'https://rajmanijewellers.in/api/salesman/get-latest-gold-price';

      const config = {
        method: 'GET',
        url: fullApiUrl,
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'RajmaniJewellers-Mobile-App',
        },
        timeout: 20000,
      };

      const response = await axios(config);

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        setLiveGoldRate(null);
        setGoldRateLoading(false);
        Alert.alert('API Error', 'Server returned invalid response format. Please try again later.');
        return;
      }

      if (response.data && typeof response.data === 'object') {
        if (response.data.status === true && response.data.data) {
          const goldData = response.data.data;
          const requiredFields = ['price18k', 'price20k', 'price22k', 'price24k'];
          const missingFields = requiredFields.filter(field => !goldData[field]);

          if (missingFields.length === 0) {
            setLiveGoldRate(response.data);
          } else {
            setLiveGoldRate(null);
            Alert.alert('Data Error', `Missing gold rate data for: ${missingFields.join(', ')}`);
          }
        } else {
          setLiveGoldRate(null);
          Alert.alert('API Error', 'Invalid gold rate data format received from server');
        }
      } else {
        setLiveGoldRate(null);
        Alert.alert('API Error', 'Invalid response format received from server');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Timeout Error', 'Request timed out. Please check your internet connection and try again.');
      } else if (error?.response) {
        switch (error.response.status) {
          case 401:
            Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
            break;
          case 403:
            Alert.alert('Permission Error', 'You do not have permission to access gold rates.');
            break;
          case 404:
            Alert.alert('Service Error', 'Gold rate service endpoint not found.');
            break;
          case 500:
            Alert.alert('Server Error', 'Internal server error occurred. Please try again later.');
            break;
          default:
            Alert.alert('HTTP Error', `Server responded with status ${error.response.status}. Please try again.`);
        }
      } else if (error?.request) {
        Alert.alert('Network Error', 'No response from server. Please check your internet connection.');
      } else {
        Alert.alert('Request Error', `Failed to setup request: ${error.message}`);
      }
      setLiveGoldRate(null);
    } finally {
      setGoldRateLoading(false);
    }
  };

  const fetchBillNo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('https://rajmanijewellers.in/api/salesman/get-unique-voucher-number', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const billNo = response.data.data;
      if (billNo) setInvoiceDetails(prev => ({ ...prev, billNo }));
    } catch (error) {
      console.error('Error fetching voucher:', error);
    }
  };

  const toggleDropdownCustom = () => {
    setExpanded(prev => !prev);
    // Close all products when opening customer details
    setExpandedProductIndices([]);
  };

  const toggleProductExpansion = index => {
    setExpandedProductIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
    // Close customer details when opening any product
    setExpanded(false);
  };

  const handleTypeDropOpen = () => setTypeDrop(!typeDrop);
  const handlePurityDropOpen = () => setPurityDrop(!purityDrop);
  const handleLabourTypeDropOpen = () => setLabourTypeDrop(!labourTypeDrop);

  // Close all dropdowns when tapping outside
  const handleTapOutside = () => {
    setTypeDrop(false);
    setPurityDrop(false);
    setLabourTypeDrop(false);
    setShowSuggestions(false);
  };

  const removeProduct = index => {
    const updatedProducts = [...products];
    updatedProducts.splice(index, 1);
    setProducts(updatedProducts);

    setExpandedProductIndices(prev =>
      prev.map(i => i > index ? i - 1 : i).filter(i => i !== index)
    );

    setErrorsProduct(prevErrors => {
      const newErrors = {};
      Object.keys(prevErrors).forEach(key => {
        const idx = parseInt(key);
        if (idx < index) {
          newErrors[idx] = prevErrors[idx];
        } else if (idx > index) {
          newErrors[idx - 1] = prevErrors[idx];
        }
      });
      return newErrors;
    });
  };

  const discardCurrentProduct = () => {
    Alert.alert(
      'Discard Product',
      'Are you sure you want to discard this product? All entered data will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (lastIndex >= 0) {
              const updatedProducts = [...products];
              updatedProducts.splice(lastIndex, 1);
              setProducts(updatedProducts);

              setProductForm(updatedProducts.length > 0 && !hasCompleteProduct(updatedProducts[updatedProducts.length - 1]));
              setInputClearType(false); // Keep default as Sales
              setInputClearPurity(true);
              setInputClearLabourType(true);
              setValueType('Sales'); // Reset to default
              setValuePurity('');
              setLabourType('');

              setErrorsProduct(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[lastIndex];
                return newErrors;
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Product name suggestion handler
  const handleProductNameInput = (value, index = lastIndex) => {
    // Convert to uppercase for product name
    const upperValue = value.toUpperCase();
    handleChange(index, 'productName', upperValue);
    
    if (upperValue && upperValue.length > 0) {
      const suggestions = ['OLD GOLD', 'OLD SILVER'].filter(item =>
        item.toLowerCase().includes(upperValue.toLowerCase())
      );
      setProductNameSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSuggestionIndex(index);
    } else {
      setShowSuggestions(false);
      setProductNameSuggestions([]);
    }
  };

  const selectProductSuggestion = (suggestion, index = lastIndex) => {
    handleChange(index, 'productName', suggestion);
    setShowSuggestions(false);
    setProductNameSuggestions([]);
  };

  // Updated to consider only required fields for "complete product"
  const hasCompleteProduct = (product) => {
    // Product is considered complete if productName and type are filled
    return product && product.type && product.productName && product.productName.trim() !== '';
  };

  // Helper function to check if product has any data entered
  const hasAnyProductData = (product) => {
    if (!product) return false;
    return (
      product.type ||
      (product.productName && product.productName.trim() !== '') ||
      product.tagNo ||
      product.remark ||
      product.purity ||
      product.piece ||
      product.grossWeightInGrams ||
      product.netWeightInGrams ||
      product.lessWeightInGrams ||
      product.ratePerGram ||
      product.stoneRate ||
      product.labourChargesInPercentage ||
      product.labourChargesInGram ||
      product.additionalAmount ||
      product.discountAmount
    );
  };

  // Updated helper function to format decimal numbers with 3 digits after decimal for weight fields
  const formatDecimalDisplay = (value, isWeight = false) => {
    if (value == null || value === undefined || value === '') {
      return '';
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '';
    }
    
    // Format to show exactly 3 decimal places for weight fields, 2 for others
    return numValue.toFixed(isWeight ? 3 : 2);
  };

  // UPDATED: Modified helper functions for input sanitizing to allow decimals for ratePerGram, labour charges, and labourChargesInRs
  const ensureProperDecimal = (value, isWeight = false, allowMoreDecimals = false) => {
    if (value == null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    
    // Allow only numbers and decimal point
    let cleanValue = stringValue.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Handle leading decimal point
    if (cleanValue.startsWith('.')) {
      cleanValue = '0' + cleanValue;
    }
    
    // Handle empty or just decimal point
    if (cleanValue === '.' || cleanValue === '') {
      return '';
    }
    
    // Limit decimal places based on field type
    let maxDecimals;
    if (isWeight) {
      maxDecimals = 3; // Weight fields: 3 decimal places
    } else if (allowMoreDecimals) {
      maxDecimals = 6; // Rate per gram and labour charges: up to 6 decimal places
    } else {
      maxDecimals = 2; // Other decimal fields: 2 decimal places
    }
    
    const decimalParts = cleanValue.split('.');
    if (decimalParts.length === 2 && decimalParts[1].length > maxDecimals) {
      cleanValue = decimalParts[0] + '.' + decimalParts[1].substring(0, maxDecimals);
    }
    
    return cleanValue;
  };

  const ensureNonNegativeInteger = (value) => {
    if (value == null || value === undefined) {
      return '0';
    }
    const stringValue = String(value);
    const cleanValue = stringValue.replace(/[^0-9]/g, '');
    const numValue = parseInt(cleanValue) || 0;
    return Math.max(0, numValue).toString();
  };

  const handleChange = (index, key, value) => {
    const updatedProducts = [...products];

    const weightFields = ['grossWeightInGrams', 'netWeightInGrams', 'lessWeightInGrams'];
    const decimalFields = ['labourChargesInPercentage'];
    const integerFields = ['piece', 'stoneRate', 'additionalAmount', 'discountAmount', 'value', 'finalAmount'];
    
    // UPDATED: Special decimal fields that allow more decimal places - now includes labourChargesInRs
    const extendedDecimalFields = ['ratePerGram', 'labourChargesInGram', 'labourChargesInRs'];

    // For productName, tagNo, and remark, convert to uppercase
    if (key === 'productName' || key === 'tagNo' || key === 'remark') {
      value = value.toUpperCase();
    }

    if (weightFields.includes(key)) {
      value = ensureProperDecimal(value, true); // 3 decimals for weight
    } else if (decimalFields.includes(key)) {
      value = ensureProperDecimal(value, false); // 2 decimals for other decimal fields
    } else if (extendedDecimalFields.includes(key)) {
      value = ensureProperDecimal(value, false, true); // Up to 6 decimals for rate per gram and labour charges
    } else if (integerFields.includes(key)) {
      value = ensureNonNegativeInteger(value);
    }

    updatedProducts[index][key] = value;

    // Auto-calculation logic only triggers if not directly editing calculated fields
    if (key !== 'netWeightInGrams' && key !== 'value' && key !== 'finalAmount' && key !== 'labourChargesInRs') {
      // MODIFIED: New calculation logic - Gross Weight - Less Weight = Net Weight
      if (key === 'grossWeightInGrams' || key === 'lessWeightInGrams') {
        const gross = parseFloat(updatedProducts[index].grossWeightInGrams) || 0;
        const less = parseFloat(updatedProducts[index].lessWeightInGrams) || 0;
        // Calculate net weight: Gross - Less = Net
        const netCalculated = (gross - less).toFixed(3);
        updatedProducts[index].netWeightInGrams = netCalculated;
      }

      // Use net weight for calculations (which is now the calculated field)
      const net = parseFloat(updatedProducts[index].netWeightInGrams) || 0;
      const rate = parseFloat(updatedProducts[index].ratePerGram) || 0; // CHANGED: Now parseFloat for decimal rates
      const stoneRate = parseInt(updatedProducts[index].stoneRate) || 0;
      const labourPercentage = parseFloat(updatedProducts[index].labourChargesInPercentage) || 0;
      const labourGram = parseFloat(updatedProducts[index].labourChargesInGram) || 0; // CHANGED: Now parseFloat for decimal labour charges
      const labourRupees = parseFloat(updatedProducts[index].labourChargesInRs) || 0; // FIXED: Now using labourChargesInRs
      const addl = parseInt(updatedProducts[index].additionalAmount) || 0;
      const disc = parseInt(updatedProducts[index].discountAmount) || 0;

      // CHANGED: Use parseFloat for value calculation to handle decimal rates
      updatedProducts[index].value = Math.floor(net * rate).toString();

      // Handle labour charges calculation
      const currentLabourType = updatedProducts[index].labourType || labourType;
      
      if (currentLabourType === 'percentage' && key === 'labourChargesInPercentage') {
        updatedProducts[index].labourChargesInGram = '';
        const labourAmount = Math.floor((labourPercentage / 100) * parseInt(updatedProducts[index].value || 0));
        // UPDATED: Set to empty string instead of '0' when no value
        updatedProducts[index].labourChargesInRs = labourAmount > 0 ? labourAmount.toString() : '';
      } else if (currentLabourType === 'gram' && key === 'labourChargesInGram') {
        updatedProducts[index].labourChargesInPercentage = '';
        // CHANGED: Use parseFloat for labour amount calculation to handle decimal labour charges
        const labourAmount = Math.floor(labourGram * net);
        // UPDATED: Set to empty string instead of '0' when no value
        updatedProducts[index].labourChargesInRs = labourAmount > 0 ? labourAmount.toString() : '';
      } else if (!value && (key === 'labourChargesInPercentage' || key === 'labourChargesInGram')) {
        if (key === 'labourChargesInPercentage' && labourGram) {
          const labourAmount = Math.floor(labourGram * net);
          // UPDATED: Set to empty string instead of '0' when no value
          updatedProducts[index].labourChargesInRs = labourAmount > 0 ? labourAmount.toString() : '';
        } else if (key === 'labourChargesInGram' && labourPercentage) {
          const labourAmount = Math.floor((labourPercentage / 100) * parseInt(updatedProducts[index].value || 0));
          // UPDATED: Set to empty string instead of '0' when no value
          updatedProducts[index].labourChargesInRs = labourAmount > 0 ? labourAmount.toString() : '';
        } else {
          // UPDATED: Set to empty string instead of '0' when no value
          updatedProducts[index].labourChargesInRs = '';
        }
      } else if (currentLabourType === 'percentage' && labourPercentage && key !== 'labourChargesInGram') {
        const labourAmount = Math.floor((labourPercentage / 100) * parseInt(updatedProducts[index].value || 0));
        // UPDATED: Set to empty string instead of '0' when no value
        updatedProducts[index].labourChargesInRs = labourAmount > 0 ? labourAmount.toString() : '';
      } else if (currentLabourType === 'gram' && labourGram && key !== 'labourChargesInPercentage') {
        const labourAmount = Math.floor(labourGram * net);
        // UPDATED: Set to empty string instead of '0' when no value
        updatedProducts[index].labourChargesInRs = labourAmount > 0 ? labourAmount.toString() : '';
      }

      const val = parseInt(updatedProducts[index].value) || 0;
      const lab = parseFloat(updatedProducts[index].labourChargesInRs) || 0; // FIXED: Now using labourChargesInRs

      const finalAmount = Math.max(0, val + stoneRate + lab + addl - disc);
      updatedProducts[index].finalAmount = finalAmount.toString();
    }

    setProducts(updatedProducts);

    setErrorsProduct(prevErrors => {
      const productErrors = { ...(prevErrors[index] || {}) };
      if (productErrors[key]) {
        delete productErrors[key];
      }
      return { ...prevErrors, [index]: productErrors };
    });
  };

  const handleInvoiceDetailsChange = (key, value) => {
    setInvoiceDetails(prev => ({ ...prev, [key]: value }));

    setErrorsInvoice(prev => {
      if (prev[key]) {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      }
      return prev;
    });
  };

  const handleCustomerDetailsChange = (key, value) => {
    setCustomerDetails(prev => ({ ...prev, [key]: value }));

    setErrorsCustomer(prev => {
      if (prev[key]) {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      }
      return prev;
    });
  };

  const toggleDropdownType = (item, index = lastIndex) => {
    if (index === lastIndex) {
      setValueType(item);
      setInputClearType(false);
    }
    handleChange(index, 'type', item);
    setTypeDrop(false);
  };

  const toggleDropdownPurity = (item, index = lastIndex) => {
    if (index === lastIndex) {
      setValuePurity(item);
      setInputClearPurity(false);
    }

    let rateValue = '';
    let purityValue = item;

    if (item === 'Silver') {
      purityValue = 'Silver';
      rateValue = '';
    } else {
      const numericPurity = parseInt(item.replace('k', ''));
      purityValue = numericPurity;

      if (liveGoldRate && liveGoldRate.data) {
        switch (item) {
          case '18k':
            rateValue = (liveGoldRate.data.price18k / 10).toString(); // CHANGED: Keep as string to preserve decimals
            break;
          case '20k':
            rateValue = (liveGoldRate.data.price20k / 10).toString();
            break;
          case '22k':
            rateValue = (liveGoldRate.data.price22k / 10).toString();
            break;
          case '24k':
            rateValue = (liveGoldRate.data.price24k / 10).toString();
            break;
          default:
            rateValue = '';
        }
      }
    }

    handleChange(index, 'purity', purityValue);
    handleChange(index, 'ratePerGram', rateValue);
    setPurityDrop(false);
  };

  const toggleDropdownLabourType = (item, index = lastIndex) => {
    if (index === lastIndex) {
      setLabourType(item);
      setInputClearLabourType(false);
    }
    
    // Store labour type for the specific product
    const updatedProducts = [...products];
    updatedProducts[index].labourType = item;
    setProducts(updatedProducts);
    
    setLabourTypeDrop(false);

    handleChange(index, 'labourChargesInPercentage', '');
    handleChange(index, 'labourChargesInGram', '');
    // UPDATED: Set to empty string instead of '0' when clearing labour type
    handleChange(index, 'labourChargesInRs', '');
  };

  // Updated calculateTotals function to properly calculate grand total
  const calculateTotals = () => {
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;
    let grandTotal = 0; // This will be the final calculation
    
    const totalPieces = products.reduce((sum, product) => {
      return sum + (parseInt(product.piece) || 0);
    }, 0);

    const totalNetWeight = products.reduce((sum, product) => {
      return sum + (parseFloat(product.netWeightInGrams) || 0);
    }, 0);

    // Calculate totals for all products (including incomplete ones with finalAmount)
    products.forEach(product => {
      const amount = parseInt(product.finalAmount) || 0;
      if (amount > 0) { // Only count products with actual amounts
        if (product.type === 'Sales') {
          totalSalesAmount += amount;
          grandTotal += amount; // Add sales to grand total
        } else if (product.type === 'Purchase') {
          totalPurchaseAmount += amount;
          grandTotal -= amount; // Subtract purchase from grand total
        }
      }
    });

    return {
      totalSalesAmount: totalSalesAmount.toString(),
      totalPurchaseAmount: totalPurchaseAmount.toString(),
      grandTotal: grandTotal.toString(),
      totalPieces,
      totalNetWeight: formatDecimalDisplay(totalNetWeight.toString(), true),
    };
  };

  const formatInvoiceData = () => {
    // Process customer names - set defaults if empty
    const processedCustomerDetails = {
      customerNameEng: customerDetails.customerNameEng.trim() || 'Cash',
      customerNameHin: customerDetails.customerNameHin.trim() || 'नगदी ग्राहक',
      address: customerDetails.address || '',
      mobileNumber: customerDetails.mobileNumber || ''
    };

    const formattedData = {
      invoiceDetails: {
        billNo: invoiceDetails.billNo,
        date: new Date(invoiceDetails.date).toISOString(),
        remarks: invoiceDetails.remarks || "Invoice created from mobile app"
      },
      customerDetails: processedCustomerDetails,
      productDetails: products.map(product => ({
        type: product.type,
        tagNo: product.tagNo || '',
        productName: product.productName,
        remark: product.remark || '',
        purity: product.purity ? product.purity.toString() : '',
        piece: parseInt(product.piece) || 0,
        grossWeightInGrams: parseFloat(product.grossWeightInGrams) || 0,
        netWeightInGrams: parseFloat(product.netWeightInGrams) || 0,
        lessWeightInGrams: parseFloat(product.lessWeightInGrams) || 0,
        stoneRate: parseInt(product.stoneRate) || 0,
        labourChargesInPercentage: parseFloat(product.labourChargesInPercentage) || 0,
        labourChargesInGram: parseFloat(product.labourChargesInGram) || 0, // CHANGED: Now parseFloat for decimal values
        ratePerGram: parseFloat(product.ratePerGram) || 0, // CHANGED: Now parseFloat for decimal values
        additionalAmount: parseInt(product.additionalAmount) || 0,
        discountAmount: parseInt(product.discountAmount) || 0,
        labourChargesInRs: parseFloat(product.labourChargesInRs) || 0 // FIXED: Changed to labourChargesInRs
      }))
    };

    return formattedData;
  };

  const hasPurchaseProduct = () => {
    return products.some(product => product.type === 'Purchase');
  };

  // NEW: Function to scroll to specific input
  const scrollToInput = (inputKey) => {
    setTimeout(() => {
      if (inputRefs.current[inputKey] && scrollViewRef.current) {
        inputRefs.current[inputKey].measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current.scrollTo({
              y: Math.max(0, y - hp('20%')),
              animated: true,
            });
          },
          () => {}
        );
      }
    }, 100);
  };

  // NEW: Handle input focus with proper scrolling
  const handleInputFocus = (inputKey) => {
    scrollToInput(inputKey);
  };

  // NEW: Focus on specific product field
  const focusOnProductField = (index, fieldName) => {
    const inputKey = `product_${index}_${fieldName}`;
    if (inputRefs.current[inputKey]) {
      inputRefs.current[inputKey].focus();
    }
  };

  const navigateToPayment = async () => {
    let valid = true;
    let invoiceErrors = {};
    let customerErrors = {};
    let productErrors = {};

    const isPurchaseInvoice = hasPurchaseProduct();

    // Customer validation skipped for purchase invoices
    // For sales invoices, all customer details optional (no validation)

    if (valid) {
      if (!invoiceDetails.billNo.trim()) {
        invoiceErrors.billNo = true;
        valid = false;
        Alert.alert('Attention', 'Please enter the bill number');
      } else if (!invoiceDetails.date.trim()) {
        invoiceErrors.date = true;
        valid = false;
        Alert.alert('Attention', 'Please select the invoice date');
      }
    }

    if (valid) {
      const validProducts = products.filter(p => hasCompleteProduct(p));
      if (validProducts.length === 0) {
        valid = false;
        Alert.alert('Attention', 'Please add at least one complete product');
      } else {
        for (let i = 0; i < validProducts.length; i++) {
          const p = validProducts[i];
          let prodError = {};
          // Only productName and type are required fields:
          if (!p.type) prodError.type = true;
          if (!p.productName || p.productName.trim() === '') prodError.productName = true;
          // Other fields like purity, piece, weights etc. are optional and do not trigger errors

          if (Object.keys(prodError).length > 0) {
            valid = false;
            productErrors[i] = prodError;

            if (Object.keys(prodError).includes('type')) {
              Alert.alert('Attention', `Please select the type for product ${i + 1}`);
              break;
            }
            if (Object.keys(prodError).includes('productName')) {
              Alert.alert('Attention', `Please enter the product name for product ${i + 1}`);
              break;
            }
          }
        }
      }
    }

    setErrorsInvoice(invoiceErrors);
    setErrorsCustomer(customerErrors);
    setErrorsProduct(productErrors);

    if (!valid) {
      return;
    }

    setIsPaymentLoading(true);

    // Process customer names with defaults
    const processedCustomerDetails = { ...customerDetails };
    if (!processedCustomerDetails.customerNameEng.trim()) {
      processedCustomerDetails.customerNameEng = 'Cash';
    }
    if (!processedCustomerDetails.customerNameHin.trim()) {
      processedCustomerDetails.customerNameHin = 'नगदी ग्राहक';
    }

    const formattedData = formatInvoiceData();

    const filteredProducts = products.filter(p => hasCompleteProduct(p));

    // Log all stored data
    console.log('=== ALL STORED INVOICE DATA ===');
    console.log('Invoice Details:', invoiceDetails);
    console.log('Customer Details:', processedCustomerDetails);
    console.log('All Products (including incomplete):', products);
    console.log('Filtered Products (complete only):', filteredProducts);
    console.log('Formatted Data for API:', formattedData);
    console.log('=== END STORED DATA ===');

    // Remove the timeout and navigate immediately
    setIsPaymentLoading(false);
    navigation.navigate('invoice-payment', {
      invoiceDetails,
      customerDetails: processedCustomerDetails,
      productDetails: filteredProducts,
      formattedInvoiceData: formattedData
    });
  };

  // UPDATED: handleAddProduct with proper scrolling and focus
  const handleAddProduct = () => {
    if (expanded) {
      setExpanded(false);
    }

    setProductForm(true);
    setShowData(true);
    const newProduct = {
      type: 'Sales', // Set default type to Sales
      tagNo: '',
      productName: '',
      remark: '',
      purity: '',
      piece: '',
      grossWeightInGrams: '',
      netWeightInGrams: '',
      lessWeightInGrams: '',
      ratePerGram: '',
      stoneRate: '',
      value: '',
      labourChargesInPercentage: '',
      labourChargesInGram: '',
      labourChargesInRs: '', // FIXED: Changed to labourChargesInRs
      finalAmount: '',
      additionalAmount: '',
      discountAmount: '',
      labourType: '',
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    setInputClearType(false); // Keep default as Sales
    setInputClearPurity(true);
    setInputClearLabourType(true);
    setValueType('Sales'); // Set default
    setLabourType('');

    // Auto-close other products
    setExpandedProductIndices([]);

    const newIndex = updatedProducts.length - 1;

    // Scroll to the new product after a short delay
    setTimeout(() => {
      scrollToInput(`product_${newIndex}_tagNo`);
    }, 100);

    // Focus on tag number field
    setTimeout(() => {
      focusOnProductField(newIndex, 'tagNo');
    }, 300);
  };

  const getRate = (key) => {
    if (goldRateLoading) {
      return 'Loading...';
    }

    if (liveGoldRate && liveGoldRate.data && liveGoldRate.data[key]) {
      const rate = Math.floor(liveGoldRate.data[key]);
      return `₹${rate}`;
    }

    return 'N/A';
  };

  const inputStyleWithError = (hasError) => [
    styles.input,
    hasError && { borderColor: 'red', borderWidth: 2 },
  ];

  const totals = calculateTotals();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.statusBarBackground} />
        <View style={styles.header} />

        <TouchableWithoutFeedback onPress={handleTapOutside}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
                <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <Text style={styles.heading}>Today's Gold Rate</Text>

              <View style={styles.placeholderView} />
            </View>

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

            <Text style={styles.infoText}>
             Create New Invoice
            </Text>

            {/* Invoice details */}
            <View style={styles.sectionFirst}>
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Bill No.</Text>
                <TextInput
                  ref={ref => inputRefs.current['billNo'] = ref}
                  style={inputStyleWithError(errorsInvoice.billNo)}
                  placeholder="RJ-001"
                  placeholderTextColor="#777"
                  value={invoiceDetails.billNo}
                  onChangeText={value => handleInvoiceDetailsChange('billNo', value)}
                  onFocus={() => handleInputFocus('billNo')}
                  editable={true}
                />
              </View>
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={inputStyleWithError(errorsInvoice.date)}
                  value={moment().format('DD/MM/YYYY')}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#777"
                  editable={false}
                />
                <TouchableOpacity style={styles.dateContainer}>
                  <Image source={require('../../assets/dateicon.png')} style={styles.datePickerBtn} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Customer Details */}
            <TouchableOpacity style={styles.headerRow1} onPress={toggleDropdownCustom}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <Image 
                source={require('../../assets/dropdownicon.png')} 
                style={[styles.dropdownIcon, { transform: [{ rotate: expanded ? '0deg' : '180deg' }] }]} 
              />
            </TouchableOpacity>
            {expanded && (
              <>
                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name (In Eng)</Text>
                    <TextInput
                      ref={ref => inputRefs.current['customerNameEng'] = ref}
                      style={inputStyleWithError(errorsCustomer.customerNameEng)}
                      value={customerDetails.customerNameEng}
                      onChangeText={text => handleCustomerDetailsChange('customerNameEng', text)}
                      autoCapitalize="words"
                      onFocus={() => handleInputFocus('customerNameEng')}
                      editable={true}
                    />
                  </View>
                  <View style={[styles.inputContainer, { marginLeft: 10 }]}>
                    <Text style={styles.label}>Name (In Hindi)</Text>
                    <TextInput
                      ref={ref => inputRefs.current['customerNameHin'] = ref}
                      style={styles.input}
                      value={customerDetails.customerNameHin}
                      onChangeText={text => handleCustomerDetailsChange('customerNameHin', text)}
                      onFocus={() => handleInputFocus('customerNameHin')}
                      editable={true}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.label}>Mobile number</Text>
                  <TextInput
                    ref={ref => inputRefs.current['mobileNumber'] = ref}
                    style={inputStyleWithError(errorsCustomer.mobileNumber)}
                    keyboardType="phone-pad"
                    value={customerDetails.mobileNumber}
                    onChangeText={text => handleCustomerDetailsChange('mobileNumber', text)}
                    maxLength={10}
                    onFocus={() => handleInputFocus('mobileNumber')}
                    editable={true}
                  />
                </View>
                <View>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    ref={ref => inputRefs.current['address'] = ref}
                    style={inputStyleWithError(errorsCustomer.address)}
                    value={customerDetails.address}
                    onChangeText={text => handleCustomerDetailsChange('address', text)}
                    autoCapitalize="sentences"
                    onFocus={() => handleInputFocus('address')}
                    editable={true}
                  />
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* Product Details Section - Show all products (including incomplete ones) */}
            {showData && products.map((item, index) => {
              // Show all products, not just complete ones, but skip current product being added
              if (index === products.length - 1 && productForm) return null;
              
              const isExpanded = expandedProductIndices.includes(index);
              const hasData = hasAnyProductData(item); // Changed to check any data instead of complete
              
              // Show product even if empty (but with some indication)
              const productErr = errorsProduct[index] || {};

              return (
                <View style={styles.section} key={index}>
                  <TouchableOpacity
                    style={styles.productHeader}
                    onPress={() => toggleProductExpansion(index)}
                  >
                    <Text style={styles.sectionTitle}>
                      Product {index + 1} {!hasData && <Text style={styles.emptyIndicator}>(Empty)</Text>}
                    </Text>
                    <Image
                      source={require('../../assets/dropdownicon.png')}
                      style={[
                        styles.dropdownIcon,
                        { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] },
                      ]}
                    />
                  </TouchableOpacity>

                  {!isExpanded && hasData && (
                    <View style={styles.productBox}>
                      {item.type ? <Text style={styles.topLeft}>Type: {item.type}</Text> : null}
                      {item.productName ? <Text style={styles.topRight}>Name: {item.productName}</Text> : null}
                      {item.purity ? (
                        <Text style={styles.bottomLeft}>
                          Purity: {item.purity === 'Silver' ? 'Silver' : `${item.purity}k`}
                        </Text>
                      ) : null}
                      {item.finalAmount ? <Text style={styles.bottomRight}>Amount: ₹{item.finalAmount}</Text> : null}
                    </View>
                  )}

                  {!isExpanded && !hasData && (
                    <View style={styles.emptyProductBox}>
                      <Text style={styles.emptyProductText}>No data entered for this product</Text>
                    </View>
                  )}

                  {isExpanded && (
                    <>
                      <TouchableOpacity style={styles.crossIcon} onPress={() => removeProduct(index)}>
                        <Image source={require('../../assets/crosscircle.png')} style={styles.crossImage} />
                      </TouchableOpacity>

                      <View style={styles.expandedProductContent}>
                        <View style={styles.row}>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                              Type <Text style={styles.red}>*</Text>
                            </Text>
                            <View>
                              <TouchableOpacity onPress={() => setTypeDrop(!typeDrop)}>
                                <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                                <View style={inputStyleWithError(productErr.type)}>
                                  <Text style={styles.dropdownText}>{item.type || 'Select type'}</Text>
                                </View>
                              </TouchableOpacity>
                              {typeDrop && (
                                <View style={styles.dropdownContainer}>
                                  {['Sales', 'Purchase'].map((type, i) => (
                                    <TouchableOpacity key={i} onPress={() => toggleDropdownType(type, index)}>
                                      <Text style={styles.dropdownOption}>{type}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Tag number</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_tagNo`] = ref}
                              style={styles.input}
                              value={item.tagNo}
                              onChangeText={value => handleChange(index, 'tagNo', value)}
                              autoCapitalize="characters"
                              onFocus={() => handleInputFocus(`product_${index}_tagNo`)}
                              editable={true}
                            />
                          </View>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>
                            Product name <Text style={styles.red}>*</Text>
                          </Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_productName`] = ref}
                            style={inputStyleWithError(productErr.productName)}
                            value={item.productName}
                            onChangeText={value => handleProductNameInput(value, index)}
                            autoCapitalize="characters"
                            onFocus={() => handleInputFocus(`product_${index}_productName`)}
                            editable={true}
                          />
                          {showSuggestions && suggestionIndex === index && productNameSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                              {productNameSuggestions.map((suggestion, i) => (
                                <TouchableOpacity 
                                  key={i} 
                                  style={styles.suggestionItem}
                                  onPress={() => selectProductSuggestion(suggestion, index)}
                                >
                                  <Text style={styles.suggestionText}>{suggestion}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Remark (Optional)</Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_remark`] = ref}
                            style={styles.input}
                            value={item.remark || ''}
                            onChangeText={value => handleChange(index, 'remark', value)}
                            autoCapitalize="characters"
                            onFocus={() => handleInputFocus(`product_${index}_remark`)}
                            editable={true}
                          />
                        </View>

                        <View style={styles.row}>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Purity</Text>
                            <View>
                              <TouchableOpacity onPress={() => setPurityDrop(!purityDrop)}>
                                <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                                <View style={inputStyleWithError(productErr.purity)}>
                                  <Text style={styles.dropdownText}>
                                    {item.purity === 'Silver' ? 'Silver' : (item.purity ? `${item.purity}k` : 'Select purity')}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                              {purityDrop && (
                                <View style={styles.dropdownContainer}>
                                  {['18k', '20k', '22k', '24k', 'Silver'].map((purity, i) => (
                                    <TouchableOpacity key={i} onPress={() => toggleDropdownPurity(purity, index)}>
                                      <Text style={styles.dropdownOption}>{purity}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Piece</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_piece`] = ref}
                              style={styles.input}
                              value={item.piece}
                              onChangeText={value => handleChange(index, 'piece', value)}
                              keyboardType="numeric"
                              onFocus={() => handleInputFocus(`product_${index}_piece`)}
                              editable={true}
                            />
                          </View>
                        </View>

                        {/* MODIFIED: Field positions swapped and labels changed */}
                        <View style={styles.row}>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Gross Wt. (In Gm)</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_grossWeight`] = ref}
                              style={styles.input}
                              value={item.grossWeightInGrams}
                              onChangeText={value => handleChange(index, 'grossWeightInGrams', value)}
                              keyboardType="decimal-pad"
                              onFocus={() => handleInputFocus(`product_${index}_grossWeight`)}
                              editable={true}
                            />
                          </View>

                          {/* SWAPPED: Less Wt field shown in Net Wt position */}
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Less Wt. (In Gm)</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_lessWeight`] = ref}
                              style={styles.input}
                              value={item.lessWeightInGrams}
                              onChangeText={value => handleChange(index, 'lessWeightInGrams', value)}
                              keyboardType="decimal-pad"
                              onFocus={() => handleInputFocus(`product_${index}_lessWeight`)}
                              editable={true}
                            />
                          </View>
                        </View>

                        {/* SWAPPED: Net Wt field shown in Less Wt position - NOW EDITABLE */}
                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Net Wt. (In Gm)</Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_netWeight`] = ref}
                            style={styles.input}
                            value={item.netWeightInGrams}
                            onChangeText={value => handleChange(index, 'netWeightInGrams', value)}
                            keyboardType="decimal-pad"
                            onFocus={() => handleInputFocus(`product_${index}_netWeight`)}
                            editable={true}
                          />
                        </View>

                        {/* UPDATED: Rate per gram now accepts decimal values */}
                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Rate (per Gm)</Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_rate`] = ref}
                            style={inputStyleWithError(productErr.ratePerGram)}
                            value={item.ratePerGram}
                            onChangeText={value => handleChange(index, 'ratePerGram', value)}
                            keyboardType="decimal-pad"
                            onFocus={() => handleInputFocus(`product_${index}_rate`)}
                            editable={true}
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Value (Net Wt. * Rate)</Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_value`] = ref}
                            style={styles.input}
                            value={item.value || '0'}
                            onChangeText={value => handleChange(index, 'value', value)}
                            keyboardType="numeric"
                            onFocus={() => handleInputFocus(`product_${index}_value`)}
                            editable={true}
                          />
                        </View>

                        <View style={styles.row}>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Stone rate</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_stoneRate`] = ref}
                              style={styles.input}
                              value={item.stoneRate}
                              onChangeText={value => handleChange(index, 'stoneRate', value)}
                              keyboardType="numeric"
                              onFocus={() => handleInputFocus(`product_${index}_stoneRate`)}
                              editable={true}
                            />
                          </View>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Labour charge type</Text>
                            <View>
                              <TouchableOpacity onPress={() => setLabourTypeDrop(!labourTypeDrop)}>
                                <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                                <View style={styles.input}>
                                  <Text style={styles.dropdownText}>
                                    {item.labourType === 'percentage' ? 'Percentage' : 
                                    item.labourType === 'gram' ? 'Per Gram' : 'Select type'}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                              {labourTypeDrop && (
                                <View style={styles.dropdownContainer}>
                                  <TouchableOpacity onPress={() => toggleDropdownLabourType('percentage', index)}>
                                    <Text style={styles.dropdownOption}>Percentage</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => toggleDropdownLabourType('gram', index)}>
                                    <Text style={styles.dropdownOption}>Per Gram</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        {item.labourType === 'percentage' && (
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Labour charge (%)</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_labourPercentage`] = ref}
                              style={styles.input}
                              value={item.labourChargesInPercentage}
                              onChangeText={value => handleChange(index, 'labourChargesInPercentage', value)}
                              keyboardType="decimal-pad"
                              onFocus={() => handleInputFocus(`product_${index}_labourPercentage`)}
                              editable={true}
                            />
                          </View>
                        )}

                        {/* UPDATED: Labour charge per gram now accepts decimal values */}
                        {item.labourType === 'gram' && (
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Labour charge (In Gm)</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_labourGram`] = ref}
                              style={styles.input}
                              value={item.labourChargesInGram}
                              onChangeText={value => handleChange(index, 'labourChargesInGram', value)}
                              keyboardType="decimal-pad"
                              onFocus={() => handleInputFocus(`product_${index}_labourGram`)}
                              editable={true}
                            />
                          </View>
                        )}

                        {/* FIXED: Labour charge in rupees now uses labourChargesInRs */}
                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Labour charge (In ₹)</Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_labourRupees`] = ref}
                            style={styles.input}
                            value={item.labourChargesInRs || ''} // FIXED: Changed to labourChargesInRs
                            onChangeText={value => handleChange(index, 'labourChargesInRs', value)}
                            keyboardType="decimal-pad"
                            onFocus={() => handleInputFocus(`product_${index}_labourRupees`)}
                            editable={true}
                          />
                        </View>

                        <View style={styles.row}>
                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Addition (₹)</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_addition`] = ref}
                              style={styles.input}
                              value={item.additionalAmount}
                              onChangeText={value => handleChange(index, 'additionalAmount', value)}
                              keyboardType="numeric"
                              onFocus={() => handleInputFocus(`product_${index}_addition`)}
                              editable={true}
                            />
                          </View>

                          <View style={styles.inputContainer}>
                            <Text style={styles.label}>Discount (₹)</Text>
                            <TextInput
                              ref={ref => inputRefs.current[`product_${index}_discount`] = ref}
                              style={styles.input}
                              value={item.discountAmount}
                              onChangeText={value => handleChange(index, 'discountAmount', value)}
                              keyboardType="numeric"
                              onFocus={() => handleInputFocus(`product_${index}_discount`)}
                              editable={true}
                            />
                          </View>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Final Amount</Text>
                          <TextInput
                            ref={ref => inputRefs.current[`product_${index}_finalAmount`] = ref}
                            style={styles.input}
                            value={item.finalAmount || '0'}
                            onChangeText={value => handleChange(index, 'finalAmount', value)}
                            keyboardType="numeric"
                            onFocus={() => handleInputFocus(`product_${index}_finalAmount`)}
                            editable={true}
                          />
                        </View>
                      </View>
                    </>
                  )}

                  <View style={styles.divider} />
                </View>
              );
            })}

            {/* Current Product Form */}
            {productForm && lastIndex >= 0 && (
              <View>
                <View style={styles.productFormHeader}>
                  <Text style={styles.productFormTitle}>Add Product {lastIndex + 1}</Text>
                  <TouchableOpacity style={styles.discardButton} onPress={discardCurrentProduct}>
                    <Image source={require('../../assets/crosscircle.png')} style={styles.discardIcon} />
                    <Text style={styles.discardText}>Discard</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Type <Text style={styles.red}>*</Text></Text>
                    <View>
                      <TouchableOpacity onPress={handleTypeDropOpen}>
                        <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                        <View style={inputStyleWithError(errorsProduct[lastIndex]?.type)}>
                          <Text style={styles.dropdownText}>{inputClearType ? 'Select type' : valueType}</Text>
                        </View>
                      </TouchableOpacity>
                      {typeDrop && (
                        <View style={styles.dropdownContainer}>
                          {['Sales', 'Purchase'].map((type, i) => (
                            <TouchableOpacity key={i} onPress={() => toggleDropdownType(type)}>
                              <Text style={styles.dropdownOption}>{type}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tag number</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_tagNo`] = ref}
                      style={styles.input}
                      value={products[lastIndex].tagNo}
                      onChangeText={value => handleChange(lastIndex, 'tagNo', value)}
                      autoCapitalize="characters"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_tagNo`)}
                      editable={true}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Product name <Text style={styles.red}>*</Text></Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_productName`] = ref}
                    style={inputStyleWithError(errorsProduct[lastIndex]?.productName)}
                    value={products[lastIndex].productName}
                    onChangeText={value => handleProductNameInput(value)}
                    autoCapitalize="characters"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_productName`)}
                    editable={true}
                  />
                  {showSuggestions && suggestionIndex === lastIndex && productNameSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {productNameSuggestions.map((suggestion, i) => (
                        <TouchableOpacity 
                          key={i} 
                          style={styles.suggestionItem}
                          onPress={() => selectProductSuggestion(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Remark (Optional)</Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_remark`] = ref}
                    style={styles.input}
                    value={products[lastIndex].remark || ''}
                    onChangeText={value => handleChange(lastIndex, 'remark', value)}
                    autoCapitalize="characters"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_remark`)}
                    editable={true}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Purity</Text>
                    <View>
                      <TouchableOpacity onPress={handlePurityDropOpen}>
                        <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                        <View style={inputStyleWithError(errorsProduct[lastIndex]?.purity)}>
                          <Text style={styles.dropdownText}>{inputClearPurity ? 'Select purity' : valuePurity}</Text>
                        </View>
                      </TouchableOpacity>
                      {purityDrop && (
                        <View style={styles.dropdownContainer}>
                          {['18k', '20k', '22k', '24k', 'Silver'].map((purity, i) => (
                            <TouchableOpacity key={i} onPress={() => toggleDropdownPurity(purity)}>
                              <Text style={styles.dropdownOption}>{purity}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Piece</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_piece`] = ref}
                      style={inputStyleWithError(errorsProduct[lastIndex]?.piece)}
                      value={products[lastIndex].piece}
                      onChangeText={value => {
                        setPiece(value);
                        handleChange(lastIndex, 'piece', value);
                      }}
                      keyboardType="numeric"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_piece`)}
                      editable={true}
                    />
                  </View>
                </View>

                {/* MODIFIED: Field positions swapped in current product form too */}
                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Gross Wt. (In Gm)</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_grossWeight`] = ref}
                      style={inputStyleWithError(errorsProduct[lastIndex]?.grossWeightInGrams)}
                      value={products[lastIndex].grossWeightInGrams}
                      onChangeText={value => handleChange(lastIndex, 'grossWeightInGrams', value)}
                      keyboardType="decimal-pad"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_grossWeight`)}
                      editable={true}
                    />
                  </View>

                  {/* SWAPPED: Less Wt field shown in Net Wt position */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Less Wt. (In Gm)</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_lessWeight`] = ref}
                      style={styles.input}
                      value={products[lastIndex].lessWeightInGrams}
                      onChangeText={value => handleChange(lastIndex, 'lessWeightInGrams', value)}
                      keyboardType="decimal-pad"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_lessWeight`)}
                      editable={true}
                    />
                  </View>
                </View>

                {/* SWAPPED: Net Wt field shown in Less Wt position - NOW EDITABLE */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Net Wt. (In Gm)</Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_netWeight`] = ref}
                    style={styles.input}
                    value={products[lastIndex].netWeightInGrams}
                    onChangeText={value => handleChange(lastIndex, 'netWeightInGrams', value)}
                    keyboardType="decimal-pad"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_netWeight`)}
                    editable={true}
                  />
                </View>

                {/* UPDATED: Rate per gram now accepts decimal values in current product form */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Rate (per Gm)</Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_rate`] = ref}
                    style={inputStyleWithError(errorsProduct[lastIndex]?.ratePerGram)}
                    value={
                      products[lastIndex]?.ratePerGram === '' || products[lastIndex]?.ratePerGram === undefined
                        ? ''
                        : String(products[lastIndex].ratePerGram)
                    }
                    onChangeText={value => handleChange(lastIndex, 'ratePerGram', value)}
                    keyboardType="decimal-pad"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_rate`)}
                    editable={true}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Value (Net Wt. * Rate)</Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_value`] = ref}
                    style={styles.input}
                    value={products[lastIndex].value || '0'}
                    onChangeText={value => handleChange(lastIndex, 'value', value)}
                    keyboardType="numeric"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_value`)}
                    editable={true}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Stone rate</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_stoneRate`] = ref}
                      style={styles.input}
                      value={products[lastIndex].stoneRate}
                      onChangeText={value => handleChange(lastIndex, 'stoneRate', value)}
                      keyboardType="numeric"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_stoneRate`)}
                      editable={true}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Labour charge type</Text>
                    <View>
                      <TouchableOpacity onPress={handleLabourTypeDropOpen}>
                        <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                        <View style={styles.input}>
                          <Text style={styles.dropdownText}>
                            {inputClearLabourType ? 'Select type' : labourType === 'percentage' ? 'Percentage' : 'Per Gram'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {labourTypeDrop && (
                        <View style={styles.dropdownContainer}>
                          <TouchableOpacity onPress={() => toggleDropdownLabourType('percentage')}>
                            <Text style={styles.dropdownOption}>Percentage</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => toggleDropdownLabourType('gram')}>
                            <Text style={styles.dropdownOption}>Per Gram</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {labourType === 'percentage' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Labour charge (%)</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_labourPercentage`] = ref}
                      style={styles.input}
                      value={products[lastIndex].labourChargesInPercentage}
                      onChangeText={value => handleChange(lastIndex, 'labourChargesInPercentage', value)}
                      keyboardType="decimal-pad"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_labourPercentage`)}
                      editable={true}
                    />
                  </View>
                )}

                {/* UPDATED: Labour charge per gram now accepts decimal values in current product form */}
                {labourType === 'gram' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Labour charge (In Gm)</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_labourGram`] = ref}
                      style={styles.input}
                      value={products[lastIndex].labourChargesInGram}
                      onChangeText={value => handleChange(lastIndex, 'labourChargesInGram', value)}
                      keyboardType="decimal-pad"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_labourGram`)}
                      editable={true}
                    />
                  </View>
                )}

                {/* FIXED: Labour charge in rupees now uses labourChargesInRs in current product form */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Labour charge (In ₹)</Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_labourRupees`] = ref}
                    style={styles.input}
                    value={products[lastIndex].labourChargesInRs || ''} // FIXED: Changed to labourChargesInRs
                    onChangeText={value => handleChange(lastIndex, 'labourChargesInRs', value)}
                    keyboardType="decimal-pad"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_labourRupees`)}
                    editable={true}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Addition (₹)</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_addition`] = ref}
                      style={styles.input}
                      value={products[lastIndex].additionalAmount}
                      onChangeText={value => handleChange(lastIndex, 'additionalAmount', value)}
                      keyboardType="numeric"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_addition`)}
                      editable={true}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Discount (₹)</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${lastIndex}_discount`] = ref}
                      style={styles.input}
                      value={products[lastIndex].discountAmount}
                      onChangeText={value => handleChange(lastIndex, 'discountAmount', value)}
                      keyboardType="numeric"
                      onFocus={() => handleInputFocus(`product_${lastIndex}_discount`)}
                      editable={true}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Final Amount</Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${lastIndex}_finalAmount`] = ref}
                    style={styles.input}
                    value={products[lastIndex].finalAmount || '0'}
                    onChangeText={value => handleChange(lastIndex, 'finalAmount', value)}
                    keyboardType="numeric"
                    onFocus={() => handleInputFocus(`product_${lastIndex}_finalAmount`)}
                    editable={true}
                  />
                </View>

                <View style={styles.separator} />
              </View>
            )}

            <TouchableOpacity onPress={handleAddProduct} style={styles.addProductButton}>
              <Text style={styles.addProductText}>+ Add more products</Text>
            </TouchableOpacity>

            {/* Updated Invoice Summary Section with correct Grand Total calculation */}
            {products.length > 0 && (
              <View style={styles.totalSection}>
                <Text style={styles.totalTitle}>Invoice Summary</Text>
                <View style={styles.totalContainer}>
                  <Text style={styles.productListTitle}>Products:</Text>
                  {products.map((product, index) => {
                    const hasValidAmount = product.finalAmount && parseInt(product.finalAmount) > 0;
                    if (!hasValidAmount) return null;

                    const amount = parseInt(product.finalAmount) || 0;
                    const amountColor = product.type === 'Purchase' ? '#d32f2f' : Colors.BTNGREEN;

                    return (
                      <View key={index} style={styles.productRow}>
                        <Text style={styles.productName}>
                          Product {index + 1}: {product.productName || 'Unnamed Product'} ({product.type})
                        </Text>
                        <Text style={[styles.productAmount, { color: amountColor }]}>
                          {product.type === 'Purchase' ? '-' : ''}₹{amount}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={styles.summaryDivider} />

                  {/* Sales and Purchase Totals */}
                  {parseInt(totals.totalSalesAmount) > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Sales:</Text>
                      <Text style={[styles.totalValue, { color: Colors.BTNGREEN }]}>₹{totals.totalSalesAmount}</Text>
                    </View>
                  )}

                  {parseInt(totals.totalPurchaseAmount) > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Purchase:</Text>
                      <Text style={[styles.totalValue, { color: '#d32f2f' }]}>₹{totals.totalPurchaseAmount}</Text>
                    </View>
                  )}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Products:</Text>
                    <Text style={styles.totalValue}>{products.filter(p => hasCompleteProduct(p)).length}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Pieces:</Text>
                    <Text style={styles.totalValue}>{totals.totalPieces}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Net Weight:</Text>
                    <Text style={styles.totalValue}>{totals.totalNetWeight} gm</Text>
                  </View>

                  <View style={styles.finalTotalDivider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.finalTotalLabel}>Grand Total (Sales - Purchase):</Text>
                    <Text style={[styles.totalAmountValue, { color: parseInt(totals.grandTotal) >= 0 ? Colors.BTNGREEN : '#d32f2f' }]}>
                      {parseInt(totals.grandTotal) < 0 ? '-' : ''}₹{Math.abs(parseInt(totals.grandTotal))}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payButton, isPaymentLoading && styles.payButtonDisabled]} 
            onPress={navigateToPayment}
            disabled={isPaymentLoading}
          >
            {isPaymentLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" style={styles.loadingIndicator} />
                <Text style={styles.payText}>Processing...</Text>
            </View>
            ) : (
              <Text style={styles.payText}>Make Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  header: {
    height: hp('6%'),
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'ios' ? 30 : (StatusBar.currentHeight || 24),
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  scrollContent: { padding: wp('4%'), paddingBottom: hp('18%'), paddingTop: hp('1%') },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    marginTop: hp('6%'),
  },
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    marginTop: hp('0.1%'),
  },
  backButtonTouch: { flexDirection: 'row', alignItems: 'center', padding: wp('1%') },
  backarrow: { width: wp('4.5%'), height: wp('4.5%'), resizeMode: 'contain', marginRight: wp('1%') },
  backText: { fontSize: wp('4%'), fontFamily: 'Poppins-Bold', color: '#000' },
  heading: {
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    fontWeight: 'bold',
  },
  placeholderView: { width: wp('15%') },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp('2%') },
  box: {
    backgroundColor: '#fff',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    width: wp('21%'),
    height: hp('6%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  boxTitle: { fontSize: wp('3%'), fontFamily: 'Poppins-SemiBold', color: '#333' },
  boxValue: { fontSize: wp('3%'), fontFamily: 'Poppins-Medium', color: '#777' },
  infoText: {
    fontSize: wp('4.5%'),
    color: '#000',
    marginBottom: hp('2%'),
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sectionFirst: { flexDirection: 'row', justifyContent: 'space-between', gap: wp('4%'), marginBottom: hp('2%') },
  sectionTitle: { fontSize: wp('4.2%'), fontFamily: 'Poppins-Medium', color: Colors.BTNRED },
  label: { fontSize: wp('3.2%'), fontFamily: 'Poppins-Medium', color: '#666', marginBottom: hp('0.5%') },
  input: {
    height: hp('5%'),
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: 0,
    borderRadius: wp('1.5%'),
    marginBottom: hp('1%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
    textAlignVertical: 'center',
  },
  inputContainer: { flex: 1 },
  inputContainerHalf: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: wp('4%') },
  requiredLabel: { fontFamily: 'Poppins-Medium' },
  red: { color: 'red' },
  addProductButton: { 
    marginTop: hp('2%'), 
    marginBottom: hp('1%'),
    alignItems: 'center',
    paddingVertical: hp('1%'),
  },
  addProductText: { 
    color: Colors.BTNRED, 
    fontFamily: 'Poppins-Medium', 
    fontSize: wp('4%') 
  },
  productFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productFormTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-SemiBold',
    color: Colors.BTNRED,
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('1.5%'),
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  discardIcon: {
    width: wp('4%'),
    height: wp('4%'),
    marginRight: wp('1%'),
    tintColor: '#d32f2f',
  },
  discardText: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Medium',
    color: '#d32f2f',
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
    marginBottom: hp('1%'),
    height: hp('6%'),
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: wp('2%'),
  },
  payText: { color: '#fff', fontSize: wp('4.2%'), fontFamily: 'Poppins-Bold' },
  dropdownIcon: { width: wp('4.5%'), height: hp('1.2%'), tintColor: Colors.BTNRED },
  divider: { height: 1, backgroundColor: Colors.BTNRED, marginVertical: hp('2%') },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('1%') },
  productBox: {
    padding: wp('2.5%'),
    marginTop: hp('1%'),
    backgroundColor: '#f9f9f9',
    borderRadius: wp('1.5%'),
    height: hp('8%'),
  },
  // Styles for empty products
  emptyProductBox: {
    padding: wp('2.5%'),
    marginTop: hp('1%'),
    backgroundColor: '#f0f0f0',
    borderRadius: wp('1.5%'),
    height: hp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProductText: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Medium',
    color: '#999',
    fontStyle: 'italic',
  },
  emptyIndicator: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Medium',
    color: '#999',
    fontStyle: 'italic',
  },
  topLeft: { position: 'absolute', top: hp('1%'), left: wp('2.5%'), fontSize: wp('3.5%'), fontFamily: 'Poppins-Medium' },
  topRight: { position: 'absolute', top: hp('1%'), right: wp('2.5%'), fontSize: wp('3.5%'), fontFamily: 'Poppins-Medium' },
  bottomLeft: { position: 'absolute', bottom: hp('1%'), left: wp('2.5%'), fontSize: wp('3.5%'), fontFamily: 'Poppins-Medium' },
  bottomRight: {
    position: 'absolute',
    bottom: hp('1%'),
    right: wp('2.5%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#777',
  },
  crossIcon: { padding: wp('1%') },
  crossImage: { width: wp('5%'), height: wp('5%') },
  section: { marginBottom: hp('2%') },
  expandedProductContent: {
    backgroundColor: '#f8f9fa',
    padding: wp('3%'),
    borderRadius: wp('1.5%'),
    marginTop: hp('1%'),
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
  dropdownText: { marginTop: hp('1.2%'), color: '#000', fontSize: wp('3.5%'), fontFamily: 'Poppins-Medium' },
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
  separator: { height: 1, backgroundColor: '#eee', marginVertical: hp('2%') },
  datePickerBtn: { width: 25, height: 25 },
  dateContainer: { position: 'absolute', top: hp('3.5%'), right: hp('1%') },

  totalSection: {
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
    backgroundColor: '#f8f9fa',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  totalTitle: {
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-SemiBold',
    color: Colors.BTNRED, 
    marginBottom: hp('1.5%'),
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: '#fff',
    borderRadius: wp('1.5%'),
    padding: wp('3%'),
  },
  productListTitle: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('2%'),
    backgroundColor: '#f8f9fa',
    borderRadius: wp('1%'),
    marginVertical: hp('0.2%'),
  },
  productName: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#555',
    flex: 1,
    marginRight: wp('2%'),
  },
  productAmount: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-SemiBold',
    color: Colors.BTNGREEN,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: hp('1.5%'),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins-Medium',
    color: '#555',
  },
  totalValue: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  finalTotalDivider: {
    height: 2,
    backgroundColor: Colors.BTNRED,
    marginVertical: hp('1%'),
  },
  finalTotalLabel: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  totalAmountValue: {
    fontSize: wp('4.5%'),
    fontFamily: 'Poppins-Bold',
  },
  // Suggestions styles
  suggestionsContainer: {
    position: 'absolute',
    top: hp('5%'),
    left: 0,
    right: 0,
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
    maxHeight: hp('15%'),
  },
  suggestionItem: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
});

export default CreateInvoiceScreen;