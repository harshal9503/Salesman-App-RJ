import React, { useRef, useEffect, useState } from 'react';
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
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import ViewShot from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const RepairShowBill = ({ navigation, route }) => {
  const viewShotRef = useRef();
  const [salesmanContact, setSalesmanContact] = useState(null);
  
  // Get data from navigation params
  const { billData } = route.params || {};
  
  // Fetch Salesman contact on component mount
  useEffect(() => {
    const fetchSalesmanContact = async () => {
      try {
        const response = await fetch('https://rajmanijewellers.in/api/salesman/get-salesman-details');
        const json = await response.json();
        if (json.success && json.data && json.data.contactNumber) {
          setSalesmanContact(json.data.contactNumber);
          console.log('Salesman contact number:', json.data.contactNumber);
        } else {
          console.log('Failed to fetch salesman contact');
        }
      } catch (error) {
        console.log('Error fetching salesman contact:', error);
      }
    };
    fetchSalesmanContact();
  }, []);
  
  // Use dynamic data if available, otherwise fallback to static data
  const invoice = billData ? {
    invoiceDetails: {
      billNo: billData.invoiceDetails?.billNo || 'RB001',
      voucherNo: billData.invoiceDetails?.voucherNo || 'RB-2025-001',
      date: billData.invoiceDetails?.date || new Date().toISOString(),
    },
    customerDetails: {
      customerNameEng: billData.customerDetails?.customerNameEng || 'Cash',
      mobileNumber: billData.customerDetails?.mobileNumber || '',
      address: billData.customerDetails?.address || '',
    },
    productDetails: billData.productDetails?.map(item => ({
      productName: item.productName || 'Product',
      metal: item.metal || 'Gold',
      expectedWeight: item.netWeightInGrams || item.expectedWeight || 0,
      expectedAmount: item.finalAmount || item.expectedAmount || 0,
      description: item.description || '',
    })) || [],
    paymentDetails: billData.paymentDetails || {
      cash: 0,
      upi: 0,
      totalAmount: 0
    },
    totals: billData.totals || {
      paymentType: 'PENDING',
      paymentAmount: '₹0.000',
      grandTotal: '0.000'
    }
  } : {
    invoiceDetails: {
      billNo: 'RB123',
      voucherNo: 'RB-2025-001',
      date: '2025-10-07T12:00:00.000Z',
    },
    customerDetails: {
      customerNameEng: 'Cash',
      mobileNumber: '',
      address: '',
    },
    productDetails: [
      {
        productName: 'Gold Pendant Repair',
        metal: 'Gold',
        expectedWeight: 7.5,
        expectedAmount: 1200,
        description: 'Refitting the clasp & polishing service.',
      },
      {
        productName: 'Silver Chain Weld',
        metal: 'Silver',
        expectedWeight: 5,
        expectedAmount: 400,
        description: 'Repairing broken chain links.',
      },
    ],
    paymentDetails: {
      cash: 0,
      upi: 0,
      totalAmount: 1600
    },
    totals: {
      paymentType: 'PENDING',
      paymentAmount: '₹0.000',
      grandTotal: '1600.000'
    }
  };

  // Calculate amounts
  const totalAmount = invoice.productDetails.reduce((total, item) => total + (parseFloat(item.expectedAmount) || 0), 0);
  const paidAmount = (parseFloat(invoice.paymentDetails?.cash) || 0) + (parseFloat(invoice.paymentDetails?.upi) || 0);
  const remainingAmount = totalAmount - paidAmount;

  // Format date to DD-MM-YYYY - Fixed version
  const formatDate = (dateString) => {
    try {
      let date;
      
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          date = new Date(`${year}-${month}-${day}`);
        } else {
          date = new Date();
        }
      } else {
        date = new Date();
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.log('Date formatting error:', error);
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      return `${day}-${month}-${year}`;
    }
  };

  // Storage permission
  async function requestStoragePermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        if (
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Storage permissions granted');
        } else {
          console.log('Storage permissions denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  // PDF Download logic
  const handleDownloadPDF = async () => {
    try {
      await requestStoragePermission();

      const html = generateRepairInvoiceHTML(invoice, totalAmount, paidAmount, remainingAmount);

      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `repair_invoice_${Date.now()}`,
        directory: 'Download',
      });

      if (Platform.OS === 'android') {
        RNFetchBlob.android.addCompleteDownload({
          title: 'Repair Invoice Downloaded',
          description: 'Repair Invoice saved successfully',
          mime: 'application/pdf',
          path: file.filePath,
          showNotification: true,
        });
      }
      Alert.alert('Success', 'PDF Downloaded Successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      <View style={styles.container}>
        <View style={styles.backButton}>
          <TouchableOpacity
            onPress={() => navigation.goBack?.()}
            style={styles.backButtonTouch}
          >
            <Image
              source={require('../../assets/backarrow.png')}
              style={styles.backarrow}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            {/* Bill Content Preview */}
            <View style={styles.innercontainer}>
              <View style={styles.rowSpaceBetween}>
                <Text style={styles.label}>
                  Bill no.{' '}
                  <Text style={styles.billId}>
                    {invoice.invoiceDetails.billNo}
                  </Text>
                </Text>
                <Text style={styles.label}>
                  Date:{' '}
                  <Text style={styles.normalText}>
                    {formatDate(invoice.invoiceDetails.date)}
                  </Text>
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>
                  Name:{' '}
                  <Text style={styles.normalText}>
                    {invoice.customerDetails.customerNameEng}
                  </Text>
                </Text>
                
                {invoice.customerDetails.mobileNumber ? (
                  <Text style={styles.label}>
                    Number:{' '}
                    <Text style={styles.normalText}>
                      +91 {invoice.customerDetails.mobileNumber}
                    </Text>
                  </Text>
                ) : null}
                
                {invoice.customerDetails.address ? (
                  <Text style={styles.label}>
                    Address:
                    <Text style={styles.normalText}>
                      {invoice.customerDetails.address}
                    </Text>
                  </Text>
                ) : null}

                {/* New Salesman Contact Number Display */}
                {salesmanContact && (
                  <Text style={styles.label}>
                    Salesman Contact Number:{' '}
                    <Text style={styles.normalText}>
                      +91 {salesmanContact}
                    </Text>
                  </Text>
                )}
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.snCol, styles.bold]}>
                  S No.
                </Text>
                <Text style={[styles.headerCell, styles.productCol, styles.bold]}>
                  Product
                </Text>
                <Text style={[styles.headerCell, styles.metalCol, styles.bold]}>
                  Metal
                </Text>
                <Text style={[styles.headerCell, styles.weightCol, styles.bold]}>
                  Weight
                </Text>
                <Text style={[styles.headerCell, styles.amountCol, styles.bold]}>
                  Amount
                </Text>
              </View>

              {/* Product Items */}
              {invoice.productDetails.map((item, index) => (
                <View key={index} style={[
                  styles.tableRow,
                  index === invoice.productDetails.length - 1 && styles.lastTableRow
                ]}>
                  <Text style={[styles.cell, styles.snCol]}>{index + 1}</Text>
                  <Text style={[styles.cell, styles.productCol]}>
                    {item.productName}
                  </Text>
                  <Text style={[styles.cell, styles.metalCol]}>
                    {item.metal}
                  </Text>
                  <Text style={[styles.cell, styles.weightCol]}>
                    {item.expectedWeight} gm
                  </Text>
                  <Text style={[styles.cell, styles.amountCol]}>
                    ₹{parseFloat(item.expectedAmount || 0).toFixed(3)}
                  </Text>
                </View>
              ))}

              {/* Description Section - Common for all products (before total amount) */}
              {invoice.productDetails.some(item => item.description) && (
                <View style={styles.descriptionSection}>
                  <Text style={[styles.label, styles.descriptionTitle]}>Description</Text>
                  {invoice.productDetails.map((item, index) => (
                    item.description ? (
                      <View key={index} style={styles.productDescription}>
                        <Text style={styles.descriptionLine}>
                          <Text style={styles.productNameLabel}>{item.productName}: </Text>
                          <Text style={styles.descriptionText}>{item.description}</Text>
                        </Text>
                        {index < invoice.productDetails.length - 1 && invoice.productDetails.slice(index + 1).some(p => p.description) && (
                          <View style={styles.descriptionDivider} />
                        )}
                      </View>
                    ) : null
                  ))}
                </View>
              )}

              {/* Payment Summary */}
              <View style={styles.paymentSummary}>
               
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Total Amount:</Text>
                  <Text style={styles.paymentValue}>₹{totalAmount.toFixed(3)}</Text>
                </View>

                {/* Paid Amount */}
                {paidAmount > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Paid Amount:</Text>
                    <Text style={[styles.paymentValue, { color: Colors.BTNGREEN }]}>
                      ₹{paidAmount.toFixed(3)}
                    </Text>
                  </View>
                )}

                {/* Payment Breakdown */}
                {(parseFloat(invoice.paymentDetails?.cash) > 0 || parseFloat(invoice.paymentDetails?.upi) > 0) && (
                  <View style={styles.breakdownContainer}>
                    {parseFloat(invoice.paymentDetails?.cash) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Cash:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          ₹{parseFloat(invoice.paymentDetails.cash || 0).toFixed(3)}
                        </Text>
                      </View>
                    )}
                    {parseFloat(invoice.paymentDetails?.upi) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>UPI:</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.BTNGREEN }]}>
                          ₹{parseFloat(invoice.paymentDetails.upi || 0).toFixed(3)}
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
                     remainingAmount > 0 ? `₹${remainingAmount.toFixed(3)}` : 
                     `-₹${Math.abs(remainingAmount).toFixed(3)}`}
                  </Text>
                </View>

                {/* Status Indicator */}
                {/* <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    { 
                      backgroundColor: remainingAmount === 0 ? Colors.BTNGREEN : 
                                      remainingAmount > 0 ? Colors.PRIMARY : '#d32f2f'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {remainingAmount === 0 ? 'Fully Paid' : 
                       remainingAmount > 0 ? 'Partial Payment' : 'Overpaid'}
                    </Text>
                  </View>
                </View> */}
              </View>
            </View>
          </ViewShot>
        </ScrollView>

        {/* <View style={styles.bottonBox}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.doneText}>Download PDF</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </>
  );
};

// Function OUTSIDE component for PDF HTML
const generateRepairInvoiceHTML = (invoice, totalAmount, paidAmount, remainingAmount) => {
  const formatDateForPDF = (dateString) => {
    try {
      let date;
      
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          date = new Date(`${year}-${month}-${day}`);
        } else {
          date = new Date();
        }
      } else {
        date = new Date();
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      return `${day}-${month}-${year}`;
    }
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
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: #fff; 
            padding: 20px; 
            color: #000; 
            font-size: 12px;
            margin: 0;
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
            margin-bottom: 10px; 
          }
          .section { 
            margin-bottom: 10px; 
            padding: 5px;
          }
          .label { 
            font-size: 12px; 
            font-weight: bold; 
            margin-bottom: 3px; 
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
            margin-top: 8px;
            font-size: 11px;
            border: 1px solid #000;
          }
          .table th, .table td { 
            border: 1px solid #000; 
            padding: 5px; 
            text-align: left;
          }
          .table th { 
            background: #f2f2f2; 
            font-weight: bold; 
            font-size: 11px;
          }
          .description-section {
            margin-top: 15px;
            padding: 10px;
            border-top: 1px solid #000;
          }
          .description-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #000;
          }
          .product-description {
            margin-bottom: 8px;
          }
          .description-line {
            font-size: 11px;
            line-height: 1.4;
          }
          .description-divider {
            height: 1px;
            background-color: #ddd;
            margin: 5px 0;
          }
          .payment-summary {
            margin-top: 15px;
            padding: 10px 5px;
            border-top: 2px solid #000;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
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
            margin: 5px 0 10px 15px;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 3px;
          }
          .breakdown-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 3px;
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
            padding-top: 8px;
            margin-top: 8px;
          }
          .remaining-label {
            font-size: 13px;
          }
          .remaining-value {
            font-size: 13px;
          }
          .status-container {
            text-align: center;
            margin-top: 10px;
          }
          .status-indicator {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 15px;
            color: white;
            font-weight: bold;
            font-size: 11px;
          }
          .bill-id {
            color: #0D6EFD;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>Bill No: <span class="bill-id">${invoice.invoiceDetails.voucherNo}</span></div>
            <div>Date: ${formatDateForPDF(invoice.invoiceDetails.date)}</div>
          </div>
          
          <div class="section">
            <div class="label">Name: <span class="value">${invoice.customerDetails.customerNameEng}</span></div>
            ${invoice.customerDetails.mobileNumber ? `
            <div class="label">Number: <span class="value">+91 ${invoice.customerDetails.mobileNumber}</span></div>
            ` : ''}
            ${invoice.customerDetails.address ? `
            <div class="label">Address: <span class="value">${invoice.customerDetails.address}</span></div>
            ` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>S No.</th>
                <th>Product</th>
                <th>Metal</th>
                <th>Weight</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.productDetails
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.productName}</td>
                  <td>${item.metal}</td>
                  <td>${item.expectedWeight} gm</td>
                  <td>₹${parseFloat(item.expectedAmount || 0).toFixed(3)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          ${invoice.productDetails.some(item => item.description) ? `
          <div class="description-section">
            <div class="description-title">Description</div>
            ${invoice.productDetails
              .map(
                (item, idx) => `
                ${item.description ? `
                <div class="product-description">
                  <div class="description-line">
                    <span class="product-name-label">${item.productName}: </span>
                    <span class="description-text">${item.description}</span>
                  </div>
                  ${idx < invoice.productDetails.length - 1 && invoice.productDetails.slice(idx + 1).some(p => p.description) ? `
                  <div class="description-divider"></div>
                  ` : ''}
                </div>
                ` : ''}
              `
              )
              .join('')}
          </div>
          ` : ''}
          
          <div class="payment-summary">
            <div class="payment-row">
              <div class="payment-label">Total Amount:</div>
              <div class="payment-value">₹${totalAmount.toFixed(3)}</div>
            </div>
            
            ${paidAmount > 0 ? `
            <div class="payment-row">
              <div class="payment-label">Paid Amount:</div>
              <div class="payment-value" style="color: #28a745;">₹${paidAmount.toFixed(3)}</div>
            </div>
            ` : ''}
            
            ${(parseFloat(invoice.paymentDetails?.cash) > 0 || parseFloat(invoice.paymentDetails?.upi) > 0) ? `
            <div class="breakdown-container">
              ${parseFloat(invoice.paymentDetails?.cash) > 0 ? `
              <div class="breakdown-row">
                <div class="breakdown-label">Cash:</div>
                <div class="breakdown-value">₹${parseFloat(invoice.paymentDetails.cash || 0).toFixed(3)}</div>
              </div>
              ` : ''}
              ${parseFloat(invoice.paymentDetails?.upi) > 0 ? `
              <div class="breakdown-row">
                <div class="breakdown-label">UPI:</div>
                <div class="breakdown-value">₹${parseFloat(invoice.paymentDetails.upi || 0).toFixed(3)}</div>
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
                 remainingAmount > 0 ? `₹${remainingAmount.toFixed(3)}` : 
                 `-₹${Math.abs(remainingAmount).toFixed(3)}`}
              </div>
            </div>
            
            <div class="status-container">
              <div class="status-indicator" style="background-color: ${statusInfo.color};">
                ${statusInfo.text}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default RepairShowBill;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContainer: {
    paddingBottom: hp('20%'),
    flexGrow: 1,
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: '#000',
    padding: 5,
  },
  innercontainer: {
    borderWidth: 0.5,
    margin: 10,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 8,
  },
  section: { 
    marginBottom: 10, 
    padding: 5 
  },
  label: { 
    fontSize: 12, 
    color: '#000', 
    marginBottom: 3,
    fontWeight: 'bold',
  },
  normalText: { 
    fontWeight: '400', 
    color: '#555', 
    fontSize: 11 
  },
  descriptionText: {
    fontWeight: '400',
    color: '#666',
    fontSize: 10,
    lineHeight: 13,
  },
  billId: { 
    color: '#0D6EFD',
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f2f2f2',
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
    padding: 5,
    borderRightWidth: 0.3,
    borderColor: '#000',
    fontSize: 11,
  },
  cell: {
    padding: 5,
    borderRightWidth: 0.3,
    borderColor: '#000',
    fontSize: 11,
    color: '#555',
  },
  snCol: { 
    flex: 0.6,
    textAlign: 'center',
  },
  productCol: { 
    flex: 2 
  },
  metalCol: { 
    flex: 1 
  },
  weightCol: { 
    flex: 1,
  },
  amountCol: { 
    flex: 1.2, 
    borderRightWidth: 0,
    textAlign: 'right',
  },
  bold: { 
    fontWeight: 'bold', 
    color: '#000' 
  },
  descriptionSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  descriptionTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  productDescription: {
    marginBottom: 8,
  },
  descriptionLine: {
    fontSize: 11,
    lineHeight: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productNameLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  descriptionDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
  paymentSummary: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  breakdownContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    marginVertical: 5,
    marginLeft: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  remainingAmountRow: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 8,
    paddingTop: 8,
  },
  remainingLabel: {
    fontSize: 13,
  },
  remainingValue: {
    fontSize: 13,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  statusIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: wp('40%'),
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    paddingBottom: hp('3%'),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  doneButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    elevation: 5,
  },
  doneText: { 
    color: '#fff', 
    fontFamily: 'Poppins-Bold', 
    fontSize: wp('4.5%') 
  },
});