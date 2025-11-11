import React, { useState } from 'react';
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
} from 'react-native';
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
  const [productForm, setProductForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [metalDrop, setMetalDrop] = useState(false);
  const [valueMetal, setValueMetal] = useState();
  const [inputClearMetal, setInputClearMetal] = useState(true);
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

  let lastIndex = products.length - 1;

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
    setProductForm(true);
    if (!expandedProduct) setExpandedProduct(true);

    const newProduct = {
      productName: '',
      netWeightInGrams: '',
      piece: '',
      metal: '',
      description: '',
      finalAmount: '',
    };

    setProducts(prev => [...prev, newProduct]);
  };

  const toggleDropdownCustomer = () => {
    setExpandedCustomer(prev => !prev);
  };

  const toggleDropdownProduct = () => {
    setExpandedProduct(prev => !prev);
  };

  const handleTypeDropOpen = () => {
    setMetalDrop(!metalDrop);
  };

  const toggleDropdownMetal = item => {
    setValueMetal(item);
    handleChange(lastIndex, 'metal', item);
    setMetalDrop(false);
    setInputClearMetal(false);

    if (errorsProduct[lastIndex]?.metal) {
      const updatedErrors = { ...errorsProduct };
      delete updatedErrors[lastIndex].metal;
      if (Object.keys(updatedErrors[lastIndex]).length === 0) {
        delete updatedErrors[lastIndex];
      }
      setErrorsProduct(updatedErrors);
    }
  };

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);

      const formattedDate = selectedDate.toISOString().split('T')[0];
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
      totalNetWeight: totalNetWeight.toFixed(3),
    };
  };

  const navigateToPayment = () => {
    let newErrorsCustomer = {};
    let newErrorsInvoice = {};
    let newErrorsProduct = {};
    let valid = true;
    let missingFields = [];

    if (!invoiceDetails.date || invoiceDetails.date.trim() === '') {
      newErrorsInvoice.date = true;
      missingFields.push('Invoice Date');
      valid = false;
    }

    if (!customerDetails.customerNameEng || customerDetails.customerNameEng.trim() === '') {
      newErrorsCustomer.customerNameEng = true;
      missingFields.push('Customer Name (English)');
      valid = false;
    }
    if (!customerDetails.mobileNumber || customerDetails.mobileNumber.trim() === '') {
      newErrorsCustomer.mobileNumber = true;
      missingFields.push('Customer Mobile Number');
      valid = false;
    } else if (!isValidIndianMobile(customerDetails.mobileNumber.trim())) {
      newErrorsCustomer.mobileNumber = true;
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      setErrorsCustomer(newErrorsCustomer);
      return;
    }
    if (!customerDetails.address || customerDetails.address.trim() === '') {
      newErrorsCustomer.address = true;
      missingFields.push('Customer Address');
      valid = false;
    }

    if (!salesmanContactNumber || salesmanContactNumber.trim() === '') {
      newErrorsCustomer.salesmanContactNumber = true;
      missingFields.push('Salesman Contact Number');
      valid = false;
    } else if (!isValidIndianMobile(salesmanContactNumber.trim())) {
      newErrorsCustomer.salesmanContactNumber = true;
      Alert.alert('Invalid Salesman Number', 'Please enter a valid 10-digit Indian salesman mobile number starting with 6-9.');
      setErrorsCustomer(newErrorsCustomer);
      return;
    }

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
        if (!product.metal || product.metal.trim() === '') {
          if (!newErrorsProduct[index]) newErrorsProduct[index] = {};
          newErrorsProduct[index].metal = true;
          missingFields.push(`Product ${index + 1} Metal`);
          valid = false;
        }
        const pieceVal = parseInt(product.piece, 10);
        if (!product.piece || product.piece.trim() === '' || isNaN(pieceVal) || pieceVal <= 0) {
          if (!newErrorsProduct[index]) newErrorsProduct[index] = {};
          newErrorsProduct[index].piece = true;
          missingFields.push(`Product ${index + 1} Piece`);
          valid = false;
        }
        const weightVal = parseFloat(product.netWeightInGrams);
        if (!product.netWeightInGrams || product.netWeightInGrams.trim() === '' || isNaN(weightVal) || weightVal <= 0) {
          if (!newErrorsProduct[index]) newErrorsProduct[index] = {};
          newErrorsProduct[index].netWeightInGrams = true;
          missingFields.push(`Product ${index + 1} Net Weight`);
          valid = false;
        }
        const amountVal = parseFloat(product.finalAmount);
        if (!product.finalAmount || product.finalAmount.trim() === '' || isNaN(amountVal) || amountVal <= 0) {
          if (!newErrorsProduct[index]) newErrorsProduct[index] = {};
          newErrorsProduct[index].finalAmount = true;
          missingFields.push(`Product ${index + 1} Amount`);
          valid = false;
        }
      });
    }

    setErrorsCustomer(newErrorsCustomer);
    setErrorsInvoice(newErrorsInvoice);
    setErrorsProduct(newErrorsProduct);

    if (!valid) {
      const uniqueMissing = Array.from(new Set(missingFields));
      Alert.alert('Required Fields Missing', `Please enter valid values for:\n${uniqueMissing.join('\n')}`);
      return;
    }

    const filteredProducts = products.filter(p =>
      p.productName &&
      p.metal &&
      p.piece &&
      p.netWeightInGrams &&
      p.finalAmount
    );

    navigation.navigate('payment-second', {
      invoiceDetails,
      customerDetails,
      productDetails: filteredProducts,
      salesmanContactNumber,
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.statusBarBackground} />

      <View style={styles.header} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
            <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Repairing</Text>

          <View style={styles.placeholderView} />
        </View>

        <Text style={styles.infoText}>
          Please fill in all the required details here and generate the invoice
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={getInputStyle('date', errorsInvoice)}
            value={invoiceDetails.date}
            placeholder="YYYY-MM-DD"
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
                  style={getInputStyle('customerNameEng', errorsCustomer)}
                  placeholder="Enter name"
                  placeholderTextColor="#777"
                  value={customerDetails.customerNameEng}
                  onChangeText={text =>
                    handleCustomerDetailsChange('customerNameEng', text)
                  }
                />
              </View>

              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>Name (In Hindi)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="हिंदी नाम"
                  placeholderTextColor="#777"
                  value={customerDetails.customerNameHin}
                  onChangeText={text =>
                    handleCustomerDetailsChange('customerNameHin', text)
                  }
                />
              </View>
            </View>

            <View style={styles.fullInputContainer}>
              <Text style={[styles.label, styles.requiredLabel]}>
                Mobile number <Text style={styles.red}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('mobileNumber', errorsCustomer)}
                keyboardType="phone-pad"
                placeholder="+91 0000000000"
                placeholderTextColor="#777"
                value={customerDetails.mobileNumber}
                onChangeText={text =>
                  handleCustomerDetailsChange('mobileNumber', text)
                }
                maxLength={10}
              />
            </View>

            <View style={styles.fullInputContainer}>
              <Text style={getInputStyle('address', errorsCustomer) ? {...styles.label, color:'red'} : styles.label}>Address</Text>
              <TextInput
                style={getInputStyle('address', errorsCustomer)}
                placeholder="Enter address"
                placeholderTextColor="#777"
                value={customerDetails.address}
                onChangeText={text =>
                  handleCustomerDetailsChange('address', text)
                }
              />
            </View>

            <View style={styles.divider} />
          </>
        )}

        {(productForm || expandedProduct) && (
          <>
            <TouchableOpacity style={styles.sectionHeaderRow} onPress={toggleDropdownProduct}>
              <Text style={styles.sectionTitle}>Product</Text>
              <Image
                source={require('../../assets/dropdownicon.png')}
                style={{
                  width: wp('4.5%'),
                  height: hp('1.2%'),
                  tintColor: Colors.BTNRED,
                  transform: [{ rotate: expandedProduct ? '0deg' : '180deg' }],
                }}
              />
            </TouchableOpacity>

            {expandedProduct && (
              <View>
                <View style={styles.inputContainerFull}>
                  <Text style={styles.label}>Product name <Text style={styles.red}>*</Text></Text>
                  <TextInput
                    style={getInputStyle('productName', errorsProduct, lastIndex)}
                    placeholder="Enter product name"
                    placeholderTextColor="#777"
                    value={products[lastIndex]?.productName}
                    onChangeText={value => handleChange(lastIndex, 'productName', value)}
                  />
                </View>

                <View style={styles.rowWeightPiece}>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>Weight</Text>
                    <TextInput
                      style={getInputStyle('netWeightInGrams', errorsProduct, lastIndex)}
                      placeholder="Enter weight in grams"
                      keyboardType="numeric"
                      placeholderTextColor="#777"
                      value={products[lastIndex]?.netWeightInGrams}
                      onChangeText={value => {
                        // Limit decimal to max 3 digits and no negative
                        let val = value.replace(/[^0-9.]/g, '');
                        const dotIndex = val.indexOf('.');
                        if (dotIndex !== -1) {
                          const parts = val.split('.');
                          parts[1] = parts[1].substring(0, 3);
                          val = parts[0] + '.' + parts[1];
                        }
                        handleChange(lastIndex, 'netWeightInGrams', val);
                      }}
                    />
                  </View>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>Piece</Text>
                    <TextInput
                      style={getInputStyle('piece', errorsProduct, lastIndex)}
                      placeholder="Enter number of pieces"
                      keyboardType="numeric"
                      placeholderTextColor="#777"
                      value={products[lastIndex]?.piece}
                      onChangeText={value => {
                        let val = value.replace(/[^0-9]/g, '');
                        handleChange(lastIndex, 'piece', val);
                      }}
                    />
                  </View>
                </View>

                <View style={styles.marginTopBeforeMetal}>
                  <View style={[styles.inputContainer, { width: '100%' }]}>
                    <Text style={styles.label}>Metal <Text style={styles.red}>*</Text></Text>
                    <View>
                      <TouchableOpacity onPress={handleTypeDropOpen} activeOpacity={0.8} style={styles.metalDropdownButtonFull}>
                        <Text style={[styles.dropdownText, { flex: 1, color: inputClearMetal ? '#aaa' : '#000' }]}>
                          {inputClearMetal ? 'Select metal' : valueMetal}
                        </Text>
                        <Image source={require('../../assets/down.png')} style={styles.dropdownArrow} />
                      </TouchableOpacity>
                      {metalDrop && (
                        <View style={styles.dropdownContainer}>
                          <TouchableOpacity onPress={() => toggleDropdownMetal('Gold')}>
                            <Text style={styles.dropdownOption}>Gold</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => toggleDropdownMetal('Silver')}>
                            <Text style={styles.dropdownOption}>Silver</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    {errorsProduct[lastIndex]?.metal && (
                      <Text style={{ color: 'red', fontSize: wp('3%') }}>Please select metal</Text>
                    )}
                  </View>
                </View>

                <View style={[styles.row, styles.marginTopBeforeDescription]}>
                  <View style={styles.inputContainerFullWidth}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={styles.inputDescriptionFullWidth}
                      multiline
                      placeholder="Enter product description"
                      placeholderTextColor="#777"
                      textAlignVertical="center"
                      value={products[lastIndex]?.description}
                      onChangeText={value => handleChange(lastIndex, 'description', value)}
                    />
                  </View>
                </View>

                <View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Amount <Text style={styles.red}>*</Text></Text>
                    <TextInput
                      style={getInputStyle('finalAmount', errorsProduct, lastIndex)}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      placeholderTextColor="#777"
                      value={products[lastIndex]?.finalAmount}
                      onChangeText={value => {
                        let val = value.replace(/[^0-9.]/g, '');
                        const dotIndex = val.indexOf('.');
                        if (dotIndex !== -1) {
                          const parts = val.split('.');
                          parts[1] = parts[1].substring(0, 3);
                          val = parts[0] + '.' + parts[1];
                        }
                        handleChange(lastIndex, 'finalAmount', val);
                      }}
                    />
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity onPress={handleAddProduct}>
          <Text style={styles.addProduct}>+ Add more products</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, errorsCustomer.salesmanContactNumber ? { color: 'red' } : {}]}>
            Contact number (salesman)
          </Text>
          <TextInput
            style={getInputStyle('salesmanContactNumber', errorsCustomer)}
            placeholder="+91 0000000000"
            placeholderTextColor="#777"
            keyboardType="numeric"
            maxLength={10}
            value={salesmanContactNumber}
            onChangeText={value => {
              let val = value.replace(/[^0-9]/g, '');
              setSalesmanContactNumber(val);
              if (errorsCustomer.salesmanContactNumber) {
                const newErrors = { ...errorsCustomer };
                delete newErrors.salesmanContactNumber;
                setErrorsCustomer(newErrors);
              }
            }}
          />
        </View>

        {products.length > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalTitle}>Invoice Summary</Text>

            <View style={styles.totalContainer}>
              {products.map((product, index) => {
                if (!product.productName && !product.finalAmount) return null;
                return (
                  <View key={index} style={styles.productRow}>
                    <Text style={styles.productName}>
                      Product {index + 1}: {product.productName || 'Unnamed Product'}
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
  // ... all previous styles (same as above) ...
  // Copy the full styles from your original code plus the added ones for error borders and totals
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
    marginTop: hp('5%'),
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
    color: Colors.PRIMARY,
  },
  heading: {
    fontSize: wp('5%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },
  placeholderView: { width: wp('15%') },
  infoText: {
    fontSize: wp('3.5%'),
    color: '#888',
    marginBottom: hp('2%'),
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  rowNameContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  inputContainerHalf: { width: '48%', marginBottom: hp('1%') },
  inputContainerFull: { marginBottom: hp('2%'), width: '100%' },
  inputContainerFullWidth: { marginBottom: hp('2%'), width: '100%' },
  fullInputContainer: { marginBottom: hp('2%') },
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
    borderRadius: wp('1.5%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
    width: '100%',
    textAlignVertical: 'center',
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
  requiredLabel: { fontFamily: 'Poppins-Medium' },
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
    marginBottom: hp('1%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Medium',
    color: Colors.BTNRED,
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
