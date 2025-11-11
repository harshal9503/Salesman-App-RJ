import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  PermissionsAndroid,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import ViewShot from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const CustomOrderShowBill = ({ navigation, route }) => {
  const viewShotRef = useRef();
  
  // Get data from navigation params
  const { billData } = route.params || {};

  // Extract data from billData with proper fallbacks
  const invoiceDetails = billData?.invoiceDetails || {};
  const customerDetails = billData?.customerDetails || {};
  const productDetails = billData?.productDetails || [];
  const paymentDetails = billData?.paymentDetails || {};
  const totals = billData?.totals || {};

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    
    try {
      // If date is in ISO format (2024-01-15T00:00:00.000Z)
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      
      // If date is already in DD-MM-YYYY format
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
        }
      }
      
      return new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    } catch (error) {
      console.log('Date formatting error', error);
      return new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    }
  };

  // Calculate amounts with proper null checks
  const totalAmount = paymentDetails?.totalAmount || productDetails?.reduce((total, item) => total + (parseFloat(item.expectedAmount) || 0), 0) || 0;
  const cashAmount = parseFloat(paymentDetails?.cash) || 0;
  const upiAmount = parseFloat(paymentDetails?.upi) || 0;
  const advanceAmount = parseFloat(paymentDetails?.advanceAmount) || 0;
  const paidAmount = cashAmount + upiAmount;
  const remainingAmount = totalAmount - paidAmount;

  // Format currency display - show empty if amount is 0 or not available
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    return `₹${amount.toFixed(2)}`;
  };

  // Get product weight - using netWeightInGrams if available, otherwise expectedWeight
  const getProductWeight = (product) => {
    return product.netWeightInGrams || product.expectedWeight || '';
  };

  // Helper function to check if value is 'N/A' or empty and return appropriate value
  const getDisplayValue = (value, defaultValue = '') => {
    if (!value || value === 'N/A' || value === 'null' || value === 'undefined' || value === '0.000') {
      return defaultValue;
    }
    return value;
  };

  // Helper function to get customer name - show "Cash" when null/empty
  const getCustomerName = () => {
    const name = customerDetails.customerNameEng;
    if (!name || name === 'N/A' || name === 'null' || name === 'undefined') {
      return 'Cash';
    }
    return name;
  };

  // Static fallback data if no params passed
  const invoice = {
    invoiceDetails: {
      voucherNo: getDisplayValue(invoiceDetails.voucherNo, "CO-2024-001"),
      date: formatDate(invoiceDetails.date),
    },
    customerDetails: {
      customerNameEng: getCustomerName(),
      mobileNumber: getDisplayValue(customerDetails.mobileNumber),
      address: getDisplayValue(customerDetails.address)
    },
    productDetails: productDetails.length > 0 ? productDetails.map(item => ({
      productName: getDisplayValue(item.productName, "Custom Order Product"),
      expectedWeight: getDisplayValue(item.expectedWeight),
      netWeightInGrams: getDisplayValue(item.netWeightInGrams),
      description: getDisplayValue(item.description),
      expectedAmount: getDisplayValue(item.expectedAmount, "0.00")
    })) : [{
      productName: "Custom Order Product",
      expectedWeight: "",
      description: "",
      expectedAmount: "0.00"
    }],
    paymentDetails: {
      advanceAmount: advanceAmount.toString(),
      pending: remainingAmount.toString(),
      cash: cashAmount.toString(),
      upi: upiAmount.toString()
    }
  };

  async function requestStoragePermission() {
    if (Platform.OS === 'android') {
      try {
        // For Android API level 33+
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          ]);

          if (
            granted['android.permission.READ_MEDIA_IMAGES'] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.READ_MEDIA_VIDEO'] ===
              PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('Storage permissions granted for API 33+');
            return true;
          }
        } else {
          // For older Android versions
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ]);

          if (
            granted['android.permission.READ_EXTERNAL_STORAGE'] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
              PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('Storage permissions granted');
            return true;
          }
        }
        
        console.log('Storage permissions denied');
        return false;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  }

  // PDF Download logic - Updated with better error handling
  const handleDownloadPDF = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download PDF');
        return;
      }

      const html = generateInvoiceHTML(invoice, totalAmount, paidAmount, remainingAmount, cashAmount, upiAmount, advanceAmount);

      const options = {
        html: html,
        fileName: `Custom_Order_${invoice.invoiceDetails.voucherNo}_${Date.now()}`,
        directory: 'Download',
      };

      console.log('Generating PDF...');
      const file = await RNHTMLtoPDF.convert(options);

      if (file.filePath) {
        console.log('PDF generated at:', file.filePath);
        
        if (Platform.OS === 'android') {
          RNFetchBlob.android.addCompleteDownload({
            title: 'Custom Order Invoice',
            description: 'Custom Order Invoice saved successfully',
            mime: 'application/pdf',
            path: file.filePath,
            showNotification: true,
          });
        }
        
        Alert.alert('Success', 'PDF Downloaded Successfully!\nFile saved in Downloads folder');
      } else {
        throw new Error('PDF file path not available');
      }
    } catch (err) {
      console.log('PDF Generation Error:', err);
      Alert.alert('Error', err.message || 'Failed to download PDF. Please try again.');
    }
  };

  // Handle ViewShot capture
  const handleCapture = (uri) => {
    console.log('ViewShot captured:', uri);
  };

  return (
    <>
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
      
      {/* PRIMARY Color Strip */}
      <View style={styles.primaryStrip} />
      
      <View style={styles.container}>
        {/* Header with Back Button */}
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

        {/* Scrollable Bill Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Bill Content to be captured for PDF */}
          <ViewShot 
            ref={viewShotRef} 
            options={{ 
              format: 'png', 
              quality: 1,
              result: 'base64'
            }}
            captureMode="mount"
            onCapture={handleCapture}
          >
            <View style={styles.innercontainer}>
              {/* Header Row */}
              <View style={styles.rowSpaceBetween}>
                <Text style={styles.label}>
                  Bill no.{' '}
                  <Text style={styles.billId}>
                    {invoice.invoiceDetails.voucherNo}
                  </Text>
                </Text>
                <Text style={styles.label}>
                  Date:{' '}
                  <Text style={styles.normalText}>
                    {formatDate(invoice.invoiceDetails.date)}
                  </Text>
                </Text>
              </View>

              {/* Customer Details Section */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  Name:{' '}
                  <Text style={styles.normalText}>
                    {getCustomerName()}
                  </Text>
                </Text>
                
                {getDisplayValue(invoice.customerDetails.mobileNumber) ? (
                  <Text style={styles.label}>
                    Number:{' '}
                    <Text style={styles.normalText}>
                      +91 {invoice.customerDetails.mobileNumber}
                    </Text>
                  </Text>
                ) : null}
                
                {getDisplayValue(invoice.customerDetails.address) ? (
                  <Text style={styles.label}>
                    Address:{' '}
                    <Text style={styles.normalText}>
                      {invoice.customerDetails.address}
                    </Text>
                  </Text>
                ) : null}
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.snCol, styles.bold]}>
                  S No.
                </Text>
                <Text style={[styles.headerCell, styles.productCol, styles.bold]}>
                  Product
                </Text>
                <Text style={[styles.headerCell, styles.weightCol, styles.bold]}>
                  Exp. Weight
                </Text>
                <Text style={[styles.headerCell, styles.advanceCol, styles.bold]}>
                  Advance
                </Text>
                <Text style={[styles.headerCell, styles.pendingCol, styles.bold]}>
                  Pending Amount
                </Text>
              </View>

              {/* Table Rows */}
              {invoice.productDetails.map((item, index) => (
                <View key={index} style={[
                  styles.tableRow,
                  index === invoice.productDetails.length - 1 && styles.lastTableRow
                ]}>
                  <Text style={[styles.cell, styles.snCol]}>{index + 1}</Text>
                  <Text style={[styles.cell, styles.productCol]}>
                    {getDisplayValue(item.productName)}
                  </Text>
                  <Text style={[styles.cell, styles.weightCol]}>
                    {getProductWeight(item) ? `${getProductWeight(item)} gm` : ''}
                  </Text>
                  <Text style={[styles.cell, styles.advanceCol]}>
                    {formatCurrency(advanceAmount)}
                  </Text>
                  <Text style={[styles.cell, styles.pendingCol]}>
                    {formatCurrency(remainingAmount)}
                  </Text>
                </View>
              ))}

              {/* Description Box */}
              {invoice.productDetails.map((item, index) => (
                getDisplayValue(item.description) ? (
                  <View key={index} style={styles.descriptionBox}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.normalText}>
                      {item.description}
                    </Text>
                  </View>
                ) : null
              ))}

              {/* Payment Summary Section */}
              <View style={styles.paymentSummary}>
                {/* Total Amount */}
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Total Amount:</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(totalAmount)}</Text>
                </View>

                {/* Paid Amount */}
                {paidAmount > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Paid Amount:</Text>
                    <Text style={[styles.paymentValue, { color: Colors.BTNGREEN }]}>
                      {formatCurrency(paidAmount)}
                    </Text>
                  </View>
                )}

                {/* Payment Breakdown - Cash & UPI */}
                {(cashAmount > 0 || upiAmount > 0) && (
                  <View style={styles.breakdownContainer}>
                    {cashAmount > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Cash:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          {formatCurrency(cashAmount)}
                        </Text>
                      </View>
                    )}
                    {upiAmount > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>UPI:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          {formatCurrency(upiAmount)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Remaining Amount */}
                <View style={[styles.paymentRow, styles.remainingAmountRow]}>
                  <Text style={[styles.paymentLabel, styles.remainingLabel]}>
                    {remainingAmount === 0 ? 'Status:' : 'Remaining Amount:'}
                  </Text>
                  <Text style={[
                    styles.paymentValue, 
                    styles.remainingValue,
                    { 
                      color: remainingAmount === 0 ? Colors.BTNGREEN : 
                             remainingAmount > 0 ? Colors.PRIMARY : '#d32f2f'
                    }
                  ]}>
                    {remainingAmount === 0 ? 'Paid' : 
                     remainingAmount > 0 ? formatCurrency(remainingAmount) : 
                     `-${formatCurrency(Math.abs(remainingAmount))}`}
                  </Text>
                </View>

                {/* Final Amount Row */}
                <View style={[styles.paymentRow, styles.finalAmountRow]}>
                  <Text style={[styles.paymentLabel, styles.finalLabel]}>Amount:</Text>
                  <Text style={[styles.paymentValue, styles.finalValue]}>
                    {formatCurrency(parseFloat(invoice.productDetails[0]?.expectedAmount) || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </ScrollView>

        {/* Download Button - Outside ViewShot so not included in PDF */}
        <View style={styles.bottonBox}>
          {/* <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.doneText}>Download PDF</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </>
  );
};

// HTML generation function for PDF - Updated with better styling and empty field handling
const generateInvoiceHTML = (invoice, totalAmount, paidAmount, remainingAmount, cashAmount, upiAmount, advanceAmount) => {
  const formatDateForHTML = (dateString) => {
    try {
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return dateString;
    } catch (error) {
      return new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    }
  };

  // Format currency for HTML - show empty if amount is 0 or not available
  const formatCurrencyHTML = (amount) => {
    if (!amount || amount === 0) return '';
    return `₹${amount.toFixed(2)}`;
  };

  // Helper function to check if value is 'N/A' or empty and return appropriate value
  const getDisplayValueHTML = (value, defaultValue = '') => {
    if (!value || value === 'N/A' || value === 'null' || value === 'undefined' || value === '0.000') {
      return defaultValue;
    }
    return value;
  };

  // Helper function to get customer name for HTML
  const getCustomerNameHTML = () => {
    const name = invoice.customerDetails.customerNameEng;
    if (!name || name === 'N/A' || name === 'null' || name === 'undefined') {
      return 'Cash';
    }
    return name;
  };

  // Determine status text and color
  const getStatusInfo = () => {
    if (remainingAmount === 0) {
      return { text: 'Fully Paid', color: '#28a745' };
    } else if (remainingAmount > 0) {
      return { text: 'Partial Payment', color: '#007bff' };
    } else {
      return { text: 'Overpaid', color: '#dc3545' };
    }
  };

  const statusInfo = getStatusInfo();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Custom Order Invoice - ${invoice.invoiceDetails.voucherNo}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: #fff; 
            padding: 20px; 
            color: #000; 
            font-size: 12px;
            margin: 0;
            line-height: 1.4;
          }
          .invoice-container {
            border: 1px solid #000;
            padding: 15px;
            margin: 10px;
            background: #fff;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 1px solid #000; 
            padding: 8px 0; 
            margin-bottom: 15px; 
          }
          .section { 
            margin-bottom: 12px; 
            padding: 5px;
          }
          .label { 
            font-size: 12px; 
            font-weight: bold; 
            margin-bottom: 4px; 
            color: #000;
          }
          .value { 
            font-size: 11px; 
            color: #555; 
            font-weight: normal;
          }
          .description-text {
            font-size: 10px;
            color: #666;
            line-height: 1.3;
          }
          .product-name-label {
            font-weight: bold;
            color: #000;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 12px;
            font-size: 11px;
            border: 1px solid #000;
          }
          .table th, .table td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: center;
          }
          .table th { 
            background: #f2f2f2; 
            font-weight: bold; 
            font-size: 11px;
          }
          .description { 
            margin-top: 12px; 
            font-size: 10px; 
            color: #666; 
            padding: 10px;
            border: 1px solid #ddd;
            background: #f9f9f9;
          }
          .payment-summary {
            margin-top: 20px;
            padding: 12px 5px;
            border-top: 2px solid #000;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 12px;
          }
          .payment-label {
            font-weight: bold;
            font-size: 12px;
            color: #000;
          }
          .payment-value {
            font-weight: bold;
            font-size: 12px;
          }
          .breakdown-container {
            margin: 8px 0 12px 15px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
          }
          .breakdown-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .breakdown-label {
            color: #666;
          }
          .breakdown-value {
            color: #28a745;
            font-weight: bold;
          }
          .remaining-amount-row {
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 10px;
          }
          .remaining-label {
            font-size: 13px;
          }
          .remaining-value {
            font-size: 13px;
          }
          .final-amount-row {
            border-top: 2px solid #000;
            padding-top: 12px;
            margin-top: 12px;
          }
          .final-label {
            font-size: 14px;
          }
          .final-value {
            font-size: 14px;
            color: #000;
          }
          .status-container {
            text-align: center;
            margin-top: 12px;
          }
          .status-indicator {
            display: inline-block;
            padding: 6px 18px;
            border-radius: 15px;
            color: white;
            font-weight: bold;
            font-size: 11px;
          }
          .bill-id {
            color: #0D6EFD;
            font-weight: bold;
          }
          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .empty-cell {
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="label">Bill No: <span class="bill-id">${invoice.invoiceDetails.voucherNo}</span></div>
            <div class="label">Date: <span class="value">${formatDateForHTML(invoice.invoiceDetails.date)}</span></div>
          </div>
          
          <div class="section">
            <div class="label">Name: <span class="value">${getCustomerNameHTML()}</span></div>
            ${getDisplayValueHTML(invoice.customerDetails.mobileNumber) ? `
            <div class="label">Number: <span class="value">+91 ${invoice.customerDetails.mobileNumber}</span></div>
            ` : ''}
            ${getDisplayValueHTML(invoice.customerDetails.address) ? `
            <div class="label">Address: <span class="value">${invoice.customerDetails.address}</span></div>
            ` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>S No.</th>
                <th>Product</th>
                <th>Exp. Weight</th>
                <th>Advance</th>
                <th>Remaining Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.productDetails.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${getDisplayValueHTML(item.productName)}</td>
                  <td>${getDisplayValueHTML(item.expectedWeight) ? `${getDisplayValueHTML(item.expectedWeight)} gm` : ''}</td>
                  <td>${formatCurrencyHTML(advanceAmount)}</td>
                  <td>${formatCurrencyHTML(remainingAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${invoice.productDetails.map((item, index) => `
            ${getDisplayValueHTML(item.description) ? `
            <div class="description">
              <div class="label">Description</div>
              <p class="description-text">${item.description}</p>
            </div>
            ` : ''}
          `).join('')}
          
          <div class="payment-summary">
            <div class="payment-row">
              <div class="payment-label">Total Amount:</div>
              <div class="payment-value">${formatCurrencyHTML(totalAmount)}</div>
            </div>
            
            ${paidAmount > 0 ? `
            <div class="payment-row">
              <div class="payment-label">Paid Amount:</div>
              <div class="payment-value" style="color: #28a745;">${formatCurrencyHTML(paidAmount)}</div>
            </div>
            ` : ''}
            
            ${(cashAmount > 0 || upiAmount > 0) ? `
            <div class="breakdown-container">
              ${cashAmount > 0 ? `
              <div class="breakdown-row">
                <div class="breakdown-label">Cash:</div>
                <div class="breakdown-value">${formatCurrencyHTML(cashAmount)}</div>
              </div>
              ` : ''}
              ${upiAmount > 0 ? `
              <div class="breakdown-row">
                <div class="breakdown-label">UPI:</div>
                <div class="breakdown-value">${formatCurrencyHTML(upiAmount)}</div>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <div class="payment-row remaining-amount-row">
              <div class="payment-label remaining-label">
                ${remainingAmount === 0 ? 'Status:' : 'Remaining Amount:'}
              </div>
              <div class="payment-value remaining-value" style="color: ${statusInfo.color};">
                ${remainingAmount === 0 ? 'Paid' : 
                 remainingAmount > 0 ? formatCurrencyHTML(remainingAmount) : 
                 `-${formatCurrencyHTML(Math.abs(remainingAmount))}`}
              </div>
            </div>
            
            <div class="payment-row final-amount-row">
              <div class="payment-label final-label">Amount:</div>
              <div class="payment-value final-value">${formatCurrencyHTML(parseFloat(invoice.productDetails[0]?.expectedAmount) || 0)}</div>
            </div>
            
            <div class="status-container">
              <div class="status-indicator" style="background-color: ${statusInfo.color};">
                ${statusInfo.text}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer generated invoice</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const styles = StyleSheet.create({
  primaryStrip: {
    height: hp('5%'),
    width: '100%',
    backgroundColor: Colors.PRIMARY,
  },
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: hp('15%'),
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
    borderBottomWidth: 0.5,
    borderColor: '#000',
    padding: wp('1.5%'),
  },
  innercontainer: {
    borderWidth: 0.5,
    margin: wp('3%'),
    marginTop: hp('1%'),
    backgroundColor: '#fff',
    padding: wp('2%'),
  },
  section: { 
    marginBottom: hp('1.5%'), 
    padding: wp('1%'),
  },
  label: { 
    fontSize: wp('3.2%'), 
    color: '#000', 
    marginBottom: hp('0.3%'),
    fontFamily: 'Poppins-SemiBold',
  },
  normalText: { 
    fontWeight: '400', 
    color: '#666', 
    fontSize: wp('2.8%'),
    fontFamily: 'Poppins-Regular',
  },
  billId: { 
    color: '#0D6EFD',
    fontFamily: 'Poppins-SemiBold',
  },
  tableHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f2f2f2',
    marginTop: hp('1%'),
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.3,
    borderColor: '#000',
  },
  lastTableRow: {
    borderBottomWidth: 1,
  },
  headerCell: {
    padding: wp('1%'),
    borderRightWidth: 0.3,
    borderColor: '#000',
    fontSize: wp('2.8%'),
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  cell: {
    padding: wp('1%'),
    borderRightWidth: 0.3,
    borderColor: '#000',
    fontSize: wp('2.7%'),
    color: '#666',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  snCol: { 
    flex: 0.6,
  },
  productCol: { 
    flex: 2.5,
    textAlign: 'left',
  },
  weightCol: { 
    flex: 1.2,
  },
  advanceCol: { 
    flex: 1.2,
  },
  pendingCol: { 
    flex: 1.5, 
    borderRightWidth: 0 
  },
  descriptionBox: { 
    padding: wp('2%'), 
    marginTop: hp('1.5%'), 
    marginBottom: hp('1.5%'),
    backgroundColor: '#f9f9f9',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: wp('0.5%'),
  },
  bold: { 
    fontWeight: 'bold', 
    color: '#000' 
  },
  paymentSummary: {
    marginTop: hp('2%'),
    paddingTop: hp('1%'),
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('0.3%'),
  },
  paymentLabel: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  paymentValue: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-SemiBold',
  },
  breakdownContainer: {
    backgroundColor: '#f8f9fa',
    padding: wp('2%'),
    borderRadius: wp('1%'),
    marginVertical: hp('0.5%'),
    marginLeft: wp('3%'),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('0.2%'),
  },
  breakdownLabel: {
    fontSize: wp('2.8%'),
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  breakdownValue: {
    fontSize: wp('2.8%'),
    fontFamily: 'Poppins-SemiBold',
  },
  remainingAmountRow: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: hp('0.8%'),
    paddingTop: hp('0.8%'),
  },
  remainingLabel: {
    fontSize: wp('3.4%'),
  },
  remainingValue: {
    fontSize: wp('3.4%'),
  },
  finalAmountRow: {
    borderTopWidth: 2,
    borderTopColor: '#000',
    marginTop: hp('0.8%'),
    paddingTop: hp('0.8%'),
  },
  finalLabel: {
    fontSize: wp('3.6%'),
  },
  finalValue: {
    fontSize: wp('3.6%'),
    color: '#000',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: wp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButtonTouch: { 
    flexDirection: 'row', 
    alignItems: 'center' 
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
    color: '#000' 
  },
  bottonBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
    paddingBottom: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  doneButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  doneText: { 
    color: '#fff', 
    fontFamily: 'Poppins-Bold', 
    fontSize: wp('4.5%') 
  },
});

export default CustomOrderShowBill;