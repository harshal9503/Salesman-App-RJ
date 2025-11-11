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
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const RepairingInvoiceScreen = ({ navigation }) => {
  const [expandedCustomer, setExpandedCustomer] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [products, setProducts] = useState([]);
  const [metalDropdowns, setMetalDropdowns] = useState({});
  const [metalValues, setMetalValues] = useState({});
  const [inputClearMetal, setInputClearMetal] = useState({});
  const [customerDetails, setCustomerDetails] = useState({
    customerNameEng: '',
    customerNameHin: '',
    mobileNumber: '',
    address: '',
  });
  const [invoiceDetails, setInvoiceDetails] = useState({ date: '' });
  const [salesmanContactNumber, setSalesmanContactNumber] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const [errorsCustomer, setErrorsCustomer] = useState({});
  const [errorsInvoice, setErrorsInvoice] = useState({});
  const [errorsProduct, setErrorsProduct] = useState({});

  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});

  useEffect(() => {
    const today = new Date();
    const formattedDate = moment(today).format('DD-MM-YYYY');
    setInvoiceDetails({ date: formattedDate });
    setDate(today);
    
    // Fetch salesman details
    fetchSalesmanDetails();
  }, []);

  const fetchSalesmanDetails = async () => {
    try {
      const response = await fetch('https://rajmanijewellers.in/api/salesman/get-salesman-details');
      const result = await response.json();
      
      if (result.success && result.data) {
        setSalesmanContactNumber(result.data.contactNumber.toString());
      }
    } catch (error) {
      console.log('Error fetching salesman details:', error);
    }
  };

  const isValidIndianMobile = number => {
    const regExp = /^[6-9]\d{9}$/;
    return regExp.test(number);
  };

  const handleChange = (index, key, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][key] = value;
    setProducts(updatedProducts);

    if (errorsProduct[index]?.[key]) {
      const updatedErrors = { ...errorsProduct };
      if (updatedErrors[index]) {
        delete updatedErrors[index][key];
        if (Object.keys(updatedErrors[index]).length === 0) {
          delete updatedErrors[index];
        }
        setErrorsProduct(updatedErrors);
      }
    }
  };

  const handleInvoiceDetailsChange = (key, value) => {
    setInvoiceDetails(prev => ({ ...prev, [key]: value }));
    if (errorsInvoice[key]) {
      const newErrors = { ...errorsInvoice };
      delete newErrors[key];
      setErrorsInvoice(newErrors);
    }
  };

  const handleCustomerDetailsChange = (key, value) => {
    setCustomerDetails(prev => ({ ...prev, [key]: value }));
    if (errorsCustomer[key]) {
      const newErrors = { ...errorsCustomer };
      delete newErrors[key];
      setErrorsCustomer(newErrors);
    }
  };

  const handleAddProduct = () => {
    const newProduct = {
      productName: '',
      netWeightInGrams: '',
      piece: '',
      metal: '',
      description: '',
      finalAmount: '',
    };

    const newIndex = products.length;
    setProducts(prev => [...prev, newProduct]);

    // Auto-collapse customer details when adding product
    if (expandedCustomer) setExpandedCustomer(false);

    // Initialize states for new product
    setInputClearMetal(prev => ({ ...prev, [newIndex]: true }));
    setExpandedProducts(prev => ({ ...prev, [newIndex]: true }));

    // Auto-scroll to the new product after a short delay
    setTimeout(() => {
      scrollToProduct(newIndex);
    }, 100);

    setTimeout(() => {
      focusOnProductName(newIndex);
    }, 300);
  };

  const scrollToProduct = (index) => {
    const inputKey = `product_${index}_productName`;
    if (inputRefs.current[inputKey] && scrollViewRef.current) {
      inputRefs.current[inputKey].measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current.scrollTo({
            y: Math.max(0, y - hp('10%')),
            animated: true,
          });
        },
        () => {}
      );
    }
  };

  const focusOnProductName = (index) => {
    const inputKey = `product_${index}_productName`;
    if (inputRefs.current[inputKey]) {
      inputRefs.current[inputKey].focus();
    }
  };

  const handleInputFocus = (inputKey) => {
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

  const toggleDropdownCustomer = () => {
    setExpandedCustomer(prev => !prev);
    // Close all product dropdowns when opening customer
    if (!expandedCustomer) {
      setExpandedProducts({});
    }
  };

  const toggleDropdownProduct = (index) => {
    setExpandedProducts(prev => {
      const newState = { ...prev };
      newState[index] = !newState[index];
      
      // If opening this product, close customer details
      if (newState[index] && expandedCustomer) {
        setExpandedCustomer(false);
      }
      
      return newState;
    });
  };

  const handleTypeDropOpen = (index) => {
    setMetalDropdowns(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleDropdownMetal = (item, index) => {
    setMetalValues(prev => ({ ...prev, [index]: item }));
    handleChange(index, 'metal', item);
    setMetalDropdowns(prev => ({ ...prev, [index]: false }));
    setInputClearMetal(prev => ({ ...prev, [index]: false }));

    if (errorsProduct[index]?.metal) {
      const updatedErrors = { ...errorsProduct };
      delete updatedErrors[index].metal;
      if (Object.keys(updatedErrors[index]).length === 0) {
        delete updatedErrors[index];
      }
      setErrorsProduct(updatedErrors);
    }
  };

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = moment(selectedDate).format('DD-MM-YYYY');
      setInvoiceDetails(prev => ({
        ...prev,
        date: formattedDate,
      }));

      if (errorsInvoice.date) {
        const newErrors = { ...errorsInvoice };
        delete newErrors.date;
        setErrorsInvoice(newErrors);
      }
    }
  };

  // Format weight fields to 3 decimal places
  const formatWeightInput = (value) => {
    if (!value) return '';
    let val = value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (val.startsWith('.')) val = '0' + val;
    if (val === '.' || val === '') return '';
    const decimalParts = val.split('.');
    if (decimalParts.length === 2) {
      decimalParts[1] = decimalParts[1].slice(0, 3);
      val = decimalParts[0] + '.' + decimalParts[1];
    }
    return val;
  };

  // Helper to format weights anywhere else (for display, totals)
  const formatWeightDisplay = (val) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    return num.toFixed(3);
  };

  const calculateTotals = () => {
    const totalAmount = products.reduce(
      (sum, product) => sum + parseFloat(product.finalAmount || 0),
      0,
    );
    const totalPieces = products.reduce(
      (sum, product) => sum + parseInt(product.piece || 0, 10),
      0,
    );
    const totalNetWeight = products.reduce(
      (sum, product) => sum + parseFloat(product.netWeightInGrams || 0),
      0,
    );
    return {
      totalAmount: totalAmount.toFixed(3),
      totalPieces,
      totalNetWeight: formatWeightDisplay(totalNetWeight),
    };
  };

  const navigateToPayment = () => {
    let newErrorsProduct = {};
    let valid = true;
    let missingFields = [];

    let customerNameEngFinal = customerDetails.customerNameEng?.trim() || 'Cash';

    if (products.length === 0) {
      Alert.alert('Required', 'Please add at least one product');
      valid = false;
    } else {
      products.forEach((product, index) => {
        if (!product.productName || product.productName.trim() === '') {
          if (!newErrorsProduct[index]) newErrorsProduct[index] = {};
          newErrorsProduct[index].productName = true;
          missingFields.push(`Product ${index + 1} Name`);
          valid = false;
        }
      });
    }

    setErrorsProduct(newErrorsProduct);

    if (!valid) {
      const uniqueMissing = Array.from(new Set(missingFields));
      Alert.alert('Required Fields Missing', `Please enter valid values for:\n${uniqueMissing.join('\n')}`);
      return;
    }

    const filteredProducts = products.filter(p => p.productName && p.productName.trim() !== '');

    navigation.navigate('payment-second', {
      invoiceDetails,
      customerDetails: { ...customerDetails, customerNameEng: customerNameEngFinal },
      productDetails: filteredProducts,
      salesmanContactNumber,
    });
  };

  const removeProduct = (indexToRemove) => {
    if (products.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one product is required');
      return;
    }

    Alert.alert(
      'Remove Product',
      `Are you sure you want to remove Product ${indexToRemove + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProducts(prev => prev.filter((_, index) => index !== indexToRemove));
            
            // Clean up states for removed product
            setExpandedProducts(prev => {
              const newState = { ...prev };
              delete newState[indexToRemove];
              // Shift indices down for remaining products
              const updatedState = {};
              Object.keys(newState).forEach(key => {
                const index = parseInt(key);
                if (index > indexToRemove) {
                  updatedState[index - 1] = newState[key];
                } else if (index < indexToRemove) {
                  updatedState[index] = newState[key];
                }
              });
              return updatedState;
            });

            setMetalDropdowns(prev => {
              const newState = { ...prev };
              delete newState[indexToRemove];
              const updatedState = {};
              Object.keys(newState).forEach(key => {
                const index = parseInt(key);
                if (index > indexToRemove) {
                  updatedState[index - 1] = newState[key];
                } else if (index < indexToRemove) {
                  updatedState[index] = newState[key];
                }
              });
              return updatedState;
            });

            setMetalValues(prev => {
              const newState = { ...prev };
              delete newState[indexToRemove];
              const updatedState = {};
              Object.keys(newState).forEach(key => {
                const index = parseInt(key);
                if (index > indexToRemove) {
                  updatedState[index - 1] = newState[key];
                } else if (index < indexToRemove) {
                  updatedState[index] = newState[key];
                }
              });
              return updatedState;
            });

            setInputClearMetal(prev => {
              const newState = { ...prev };
              delete newState[indexToRemove];
              const updatedState = {};
              Object.keys(newState).forEach(key => {
                const index = parseInt(key);
                if (index > indexToRemove) {
                  updatedState[index - 1] = newState[key];
                } else if (index < indexToRemove) {
                  updatedState[index] = newState[key];
                }
              });
              return updatedState;
            });
          },
        },
      ]
    );
  };

  const totals = calculateTotals();

  const getInputStyle = (field, errorState, index = null) => {
    if (index !== null && errorState[index]?.[field]) {
      return [styles.input, { borderColor: 'red', borderWidth: 2 }];
    } else if (index === null && errorState[field]) {
      return [styles.input, { borderColor: 'red', borderWidth: 2 }];
    }
    return styles.input;
  };

  // Get product display name with serialization
  const getProductDisplayName = (index, productName) => {
    if (!productName) return `Product ${index + 1}`;
    return `Product ${index + 1}: ${productName}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.statusBarBackground} />

      <View style={styles.header} />

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

          <Text style={styles.heading}>Repairing</Text>

          <View style={styles.placeholderView} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={getInputStyle('date', errorsInvoice)}
            value={invoiceDetails.date}
            placeholder="DD-MM-YYYY"
            placeholderTextColor="#777"
            editable={false}
          />
          <TouchableOpacity style={styles.dateContainer} onPress={() => setShowPicker(true)}>
            <Image source={require('../../assets/dateicon.png')} style={styles.datePickerBtn} />
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <TouchableOpacity style={styles.sectionHeaderRow} onPress={toggleDropdownCustomer}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <Image
            source={require('../../assets/dropdownicon.png')}
            style={{
              width: wp('4.5%'),
              height: hp('1.2%'),
              tintColor: Colors.BTNRED,
              transform: [{ rotate: expandedCustomer ? '0deg' : '180deg' }],
            }}
          />
        </TouchableOpacity>

        {expandedCustomer && (
          <>
            <View style={styles.rowNameContainer}>
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Name (In Eng)</Text>
                <TextInput
                  ref={ref => inputRefs.current['customerNameEng'] = ref}
                  style={getInputStyle('customerNameEng', errorsCustomer)}
                  placeholder=""
                  placeholderTextColor="#777"
                  value={customerDetails.customerNameEng}
                  onChangeText={text =>
                    handleCustomerDetailsChange('customerNameEng', text)
                  }
                  onFocus={() => handleInputFocus('customerNameEng')}
                />
              </View>

              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Name (In Hindi)</Text>
                <TextInput
                  ref={ref => inputRefs.current['customerNameHin'] = ref}
                  style={styles.input}
                  placeholder=""
                  placeholderTextColor="#777"
                  value={customerDetails.customerNameHin}
                  onChangeText={text =>
                    handleCustomerDetailsChange('customerNameHin', text)
                  }
                  onFocus={() => handleInputFocus('customerNameHin')}
                />
              </View>
            </View>

            <View style={styles.fullInputContainer}>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                ref={ref => inputRefs.current['mobileNumber'] = ref}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder=""
                placeholderTextColor="#777"
                value={customerDetails.mobileNumber}
                onChangeText={text =>
                  handleCustomerDetailsChange('mobileNumber', text)
                }
                maxLength={10}
                onFocus={() => handleInputFocus('mobileNumber')}
              />
            </View>

            <View style={styles.fullInputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                ref={ref => inputRefs.current['address'] = ref}
                style={styles.input}
                placeholder=""
                placeholderTextColor="#777"
                value={customerDetails.address}
                onChangeText={text =>
                  handleCustomerDetailsChange('address', text)
                }
                onFocus={() => handleInputFocus('address')}
              />
            </View>

            <View style={styles.divider} />
          </>
        )}

        {/* Products Section */}
        {products.map((product, index) => (
          <View key={index}>
            <TouchableOpacity 
              style={[styles.sectionHeaderRow, { marginTop: index === 0 ? hp('2%') : hp('1%') }]} 
              onPress={() => toggleDropdownProduct(index)}
            >
              <Text style={styles.sectionTitle}>Product {index + 1}</Text>
              <View style={styles.productHeaderRight}>
                {products.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeProduct(index)}
                    style={styles.removeProductBtn}
                  >
                    <Text style={styles.removeProductText}>Remove</Text>
                  </TouchableOpacity>
                )}
                <Image
                  source={require('../../assets/dropdownicon.png')}
                  style={{
                    width: wp('4.5%'),
                    height: hp('1.2%'),
                    tintColor: Colors.BTNRED,
                    transform: [{ rotate: expandedProducts[index] ? '0deg' : '180deg' }],
                    marginLeft: wp('2%'),
                  }}
                />
              </View>
            </TouchableOpacity>

            {expandedProducts[index] && (
              <View style={styles.productContainer}>
                <View style={styles.inputContainerFull}>
                  <Text style={styles.label}>Product name <Text style={styles.red}>*</Text></Text>
                  <TextInput
                    ref={ref => inputRefs.current[`product_${index}_productName`] = ref}
                    style={getInputStyle('productName', errorsProduct, index)}
                    placeholder=""
                    placeholderTextColor="#777"
                    value={product.productName}
                    onChangeText={value => handleChange(index, 'productName', value)}
                    onFocus={() => handleInputFocus(`product_${index}_productName`)}
                  />
                </View>

                <View style={styles.rowWeightPiece}>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>Weight</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${index}_weight`] = ref}
                      style={styles.input}
                      placeholder=""
                      keyboardType="numeric"
                      placeholderTextColor="#777"
                      value={product.netWeightInGrams}
                      onChangeText={value => {
                        const formattedVal = formatWeightInput(value);
                        handleChange(index, 'netWeightInGrams', formattedVal);
                      }}
                      onFocus={() => handleInputFocus(`product_${index}_weight`)}
                    />
                  </View>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>Piece</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${index}_piece`] = ref}
                      style={styles.input}
                      placeholder=""
                      keyboardType="numeric"
                      placeholderTextColor="#777"
                      value={product.piece}
                      onChangeText={value => {
                        let val = value.replace(/[^0-9]/g, '');
                        handleChange(index, 'piece', val);
                      }}
                      onFocus={() => handleInputFocus(`product_${index}_piece`)}
                    />
                  </View>
                </View>

                <View style={styles.marginTopBeforeMetal}>
                  <View style={[styles.inputContainer, { width: '100%' }]}>
                    <Text style={styles.label}>Metal</Text>
                    <View>
                      <TouchableOpacity onPress={() => handleTypeDropOpen(index)} activeOpacity={0.8} style={styles.metalDropdownButtonFull}>
                        <Text style={[styles.dropdownText, { flex: 1, color: inputClearMetal[index] ? '#aaa' : '#000' }]}>
                          {inputClearMetal[index] ? 'Select metal' : metalValues[index]}
                        </Text>
                        <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                      </TouchableOpacity>
                      {metalDropdowns[index] && (
                        <View style={styles.dropdownContainer}>
                          <TouchableOpacity onPress={() => toggleDropdownMetal('Gold', index)}>
                            <Text style={styles.dropdownOption}>Gold</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => toggleDropdownMetal('Silver', index)}>
                            <Text style={styles.dropdownOption}>Silver</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.row, styles.marginTopBeforeDescription]}>
                  <View style={styles.inputContainerFullWidth}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${index}_description`] = ref}
                      style={styles.inputDescriptionFullWidth}
                      multiline
                      placeholder=""
                      placeholderTextColor="#777"
                      textAlignVertical="top"
                      value={product.description}
                      onChangeText={value => handleChange(index, 'description', value)}
                      onFocus={() => handleInputFocus(`product_${index}_description`)}
                    />
                  </View>
                </View>

                <View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                      ref={ref => inputRefs.current[`product_${index}_amount`] = ref}
                      style={styles.input}
                      placeholder=""
                      keyboardType="numeric"
                      placeholderTextColor="#777"
                      value={product.finalAmount}
                      onChangeText={value => {
                        let val = value.replace(/[^0-9.]/g, '');
                        const dotIndex = val.indexOf('.');
                        if (dotIndex !== -1) {
                          const parts = val.split('.');
                          parts[1] = parts[1].substring(0, 3);
                          val = parts[0] + '.' + parts[1];
                        }
                        handleChange(index, 'finalAmount', val);
                      }}
                      onFocus={() => handleInputFocus(`product_${index}_amount`)}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={handleAddProduct}>
          <Text style={styles.addProduct}>+ Add more products</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Contact number (salesman)
          </Text>
          <TextInput
            ref={ref => inputRefs.current['salesmanContact'] = ref}
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            keyboardType="numeric"
            maxLength={10}
            value={salesmanContactNumber}
            onChangeText={value => {
              let val = value.replace(/[^0-9]/g, '');
              setSalesmanContactNumber(val);
            }}
            onFocus={() => handleInputFocus('salesmanContact')}
          />
        </View>

        {products.length > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalTitle}>Invoice Summary</Text>

            <View style={styles.totalContainer}>
              {products.map((product, index) => {
                if (!product.productName) return null;
                return (
                  <View key={index} style={styles.productRow}>
                    <Text style={styles.productName}>
                      {getProductDisplayName(index, product.productName)}
                    </Text>
                    <Text style={styles.productAmount}>₹{product.finalAmount || '0.000'}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Products</Text>
              <Text style={styles.totalValue}>{products.length}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Pieces</Text>
              <Text style={styles.totalValue}>{totals.totalPieces}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Net Weight</Text>
              <Text style={styles.totalValue}>{totals.totalNetWeight} gm</Text>
            </View>

            <View style={styles.finalTotalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.finalTotalLabel}>Grand Total</Text>
              <Text style={styles.totalAmountValue}>₹{totals.totalAmount}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={navigateToPayment}>
          <Text style={styles.payText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  scrollContent: {
    padding: wp('4%'),
    paddingBottom: hp('18%'),
    paddingTop: hp('1%'),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    marginTop: hp('6%'),
  },
  backButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('1%'),
  },
  backarrow: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    resizeMode: 'contain',
    marginRight: wp('1%'),
  },
  backText: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  heading: {
    fontSize: wp('5%'),
    fontFamily: 'Poppins-Bold',
    color: '#222',
    textAlign: 'center',
    flex: 1,
    fontWeight: 'bold',
  },
  placeholderView: { width: wp('15%') },
  rowNameContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  inputContainerHalf: { width: '48%', marginBottom: hp('1%') },
  inputContainerFull: { marginBottom: hp('2%'), width: '100%' },
  inputContainerFullWidth: { marginBottom: hp('2%'), width: '100%' },
  fullInputContainer: { marginBottom: hp('2%') },
  inputContainer: { marginBottom: hp('2%') },
  input: {
    height: hp('5%'),
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: wp('2.5%'),
    borderRadius: wp('1.5%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
    textAlignVertical: 'center',
  },
  inputDescriptionFullWidth: {
    height: hp('10%'),
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: wp('2%'),
    borderRadius: wp('1.5%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
    width: '100%',
    textAlignVertical: 'top',
  },
  rowWeightPiece: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  marginTopBeforeMetal: {
    marginTop: hp('0%'),
    marginBottom: hp('1%'),
  },
  marginTopBeforeDescription: {
    marginTop: hp('1.5%'),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  red: { color: 'red' },
  addProduct: {
    color: Colors.BTNRED,
    fontFamily: 'Poppins-Medium',
    fontSize: wp('4%'),
    marginBottom: hp('2%'),
    marginTop: hp('1%'),
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
    marginTop: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Medium',
    color: Colors.BTNRED,
  },
  productHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeProductBtn: {
    backgroundColor: '#ff4444',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('1%'),
  },
  removeProductText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontFamily: 'Poppins-Medium',
  },
  productContainer: {
    backgroundColor: '#f8f9fa',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
  },
  dropdownArrow: {
    width: 14,
    height: 7,
    tintColor: '#888',
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
  datePickerBtn: {
    width: 25,
    height: 25,
  },
  dateContainer: {
    position: 'absolute',
    top: hp('3.5%'),
    right: hp('1%'),
  },
  divider: {
    height: 1,
    backgroundColor: Colors.BTNRED,
    marginVertical: hp('2%'),
  },
  totalSection: {
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
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
    color: '#666',
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
    color: Colors.BTNGREEN,
  },
  dropdownText: {
    color: '#000',
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  metalDropdownButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: wp('2.5%'),
    borderRadius: wp('1.5%'),
    height: hp('5%'),
    width: '100%',
  },
});

export default RepairingInvoiceScreen;
