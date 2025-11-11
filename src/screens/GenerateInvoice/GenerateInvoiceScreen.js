import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Dimensions,
  FlatList,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import ViewShot from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const GenerateInvoiceScreen = ({ navigation, route }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(false);
  const viewShotRef = useRef();

  const invoice = route.params.billData || route.params.invoice;

  useEffect(() => {
    console.log('Fetched Invoice Response:', JSON.stringify(invoice, null, 2));
  }, [invoice]);

  if (!invoice) return null;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setIsLandscape(window.width > window.height);
    });
    return () => subscription?.remove();
  }, []);

  const baseWidth = Math.min(dimensions.width, dimensions.height);
  const calculateCellWidth = (percentage) => (baseWidth * 0.95 * percentage) / 100 - 2;

  const isSilverProduct = (purity) => {
    if (!purity) return false;
    const purityStr = purity.toString().toLowerCase();
    return purityStr.includes('silver') || purityStr.includes('999') || purityStr.includes('925');
  };

  const calculateTotals = () => {
    let totalGoldWeight = 0;
    let totalSilverWeight = 0;
    let totalGrossWeight = 0;
    let totalPieces = 0;
    let totalMaking = 0;
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;

    invoice.productDetails.forEach((item) => {
      const grossWeight = parseFloat(item.grossWeightInGrams) || 0;
      totalGrossWeight += grossWeight;
      if (isSilverProduct(item.purity)) {
        totalSilverWeight += grossWeight;
      } else {
        totalGoldWeight += grossWeight;
      }
      totalPieces += parseInt(item.piece) || 0;
      totalMaking += parseFloat(item.labourChargesInRs) || 0;
      const amount = parseFloat(item.finalAmount) || 0;
      if (item.type === 'Sales') {
        totalSalesAmount += amount;
      } else if (item.type === 'Purchase') {
        totalPurchaseAmount += amount;
      }
    });

    const grandTotal = totalSalesAmount - totalPurchaseAmount;

    const totalPaid =
      (parseFloat(invoice.paymentDetails?.cash) || 0) +
      (parseFloat(invoice.paymentDetails?.upi) || 0);

    const netAmount = Math.max(0, grandTotal - totalPaid);

    return {
      totalGoldWeight: totalGoldWeight.toFixed(3),
      totalSilverWeight: totalSilverWeight.toFixed(3),
      totalGrossWeight: totalGrossWeight.toFixed(3),
      totalPieces,
      totalMaking: totalMaking.toFixed(2),
      totalSalesAmount: totalSalesAmount.toFixed(2),
      totalPurchaseAmount: totalPurchaseAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      netAmount: netAmount.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
    };
  };

  const formatPurity = (purity) => {
    if (isSilverProduct(purity)) return '';
    if (!purity || purity === 'N/A' || purity === '-' || purity === '0') return '';
    return purity.toString().includes('K') ? purity : `${purity}K`;
  };

  const formatWeight = (weight, showUnit = true) => {
    if (!weight || weight === 'N/A' || weight === '-' || parseFloat(weight) === 0) return '';
    return showUnit ? `${weight} ` : weight;
  };

  const formatMakingCharge = (item) => {
    if (item.labourChargesInPercentage && parseFloat(item.labourChargesInPercentage) > 0) {
      return `${item.labourChargesInPercentage}%`;
    } else if (item.labourChargesInGram && parseFloat(item.labourChargesInGram) > 0) {
      let suffix = isSilverProduct(item.purity) ? ' Wt' : ' Wt';
      return `${item.labourChargesInGram}${suffix}`;
    }
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format amount to show only whole numbers without decimal points
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '';
    return Math.round(numAmount).toString();
  };

  // ✅ Storage permission
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

  // ✅ PDF Download logic
  const handleDownloadPDF = async () => {
    try {
      await requestStoragePermission();

      const html = generateInvoiceHTML();

      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `Invoice_${invoice.invoiceDetails.billNo}_${Date.now()}`,
        directory: 'Download',
      });

      if (Platform.OS === 'android') {
        RNFetchBlob.android.addCompleteDownload({
          title: 'Invoice Downloaded',
          description: 'Invoice saved successfully',
          mime: 'application/pdf',
          path: file.filePath,
          showNotification: true,
        });
      }

      Alert.alert('Success', 'PDF Downloaded Successfully!');
    } catch (err) {
      console.log('PDF Generation Error:', err);
      Alert.alert('Error', err.message || 'Failed to download PDF. Please try again.');
    }
  };

  // ✅ HTML generation function - Fixed phone number position
  const generateInvoiceHTML = () => {
    const totals = calculateTotals();
    const hasCashPayment = parseFloat(invoice.paymentDetails?.cash) > 0;
    const hasUPIPayment = parseFloat(invoice.paymentDetails?.upi) > 0;
    const isFullyPaid = parseFloat(totals.netAmount) === 0;

    const getCustomerNameHTML = () => {
      const name = invoice.customerDetails.customerNameEng;
      if (!name || name === 'N/A' || name === 'null' || name === 'undefined') {
        return 'Cash';
      }
      return name;
    };

    const productRowsHTML = invoice.productDetails.map((item, index) => {
      let amountColor = item.type === 'Purchase' ? '#d32f2f' : '#000';
      const parseFinalAmount = parseFloat(item.finalAmount);
      const amount = !isNaN(parseFinalAmount) ? parseFinalAmount : 0;
      const showRate = item.type !== 'Purchase';

      const displayAmount = () => {
        if (item.type === 'Purchase') {
          if (!amount || amount === 0) {
            const rateVal = parseFloat(item.ratePerGram) || 0;
            return rateVal > 0 ? `-${formatAmount(rateVal)}` : '';
          } else {
            return amount > 0 ? `-${formatAmount(amount)}` : '';
          }
        }
        return amount > 0 ? formatAmount(amount) : '';
      };

      return `
        <tr class="table-row">
          <td class="table-cell" style="width: 6%">${item.type === 'Sales' ? 'S' : item.type === 'Purchase' ? 'P' : 'S'}</td>
          <td class="table-cell" style="width: 8%">${item.tagNo || ''}</td>
          <td class="table-cell" style="width: 16%; text-align: left; padding-left: 2px;">${item.productName || item.description || ''}</td>
          <td class="table-cell" style="width: 6%">${formatPurity(item.purity)}</td>
          <td class="table-cell" style="width: 7%">${formatWeight(item.grossWeightInGrams)}</td>
          <td class="table-cell" style="width: 6%">${formatWeight(item.netWeightInGrams)}</td>
          <td class="table-cell" style="width: 5%">${item.piece && parseInt(item.piece) > 0 ? item.piece : ''}</td>
          <td class="table-cell" style="width: 6%">${showRate ? (item.ratePerGram || item.rate || '') : ''}</td>
          <td class="table-cell" style="width: 6%">${item.value && parseFloat(item.value) > 0 ? item.value : ''}</td>
          <td class="table-cell" style="width: 4%">${item.dia && parseFloat(item.dia) > 0 ? item.dia : ''}</td>
          <td class="table-cell" style="width: 4%">${item.stn && parseFloat(item.stn) > 0 ? item.stn : ''}</td>
          <td class="table-cell" style="width: 7%">${item.diaStnValue && parseFloat(item.diaStnValue) > 0 ? item.diaStnValue : ''}</td>
          <td class="table-cell" style="width: 9%">${formatMakingCharge(item)}</td>
          <td class="table-cell amount-cell" style="width: 14%; color: ${amountColor}">${displayAmount()}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              font-size: 10px;
              color: #000;
            }
            .invoice-container {
              border: 1px solid #888;
              padding: 5px;
              background-color: #fff;
            }
            .phone-number-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .phone-number {
              font-weight: bold;
              font-size: 11px;
              color: #000;
            }
            .estimate-title-row {
              display: flex;
              align-items: stretch;
              margin-bottom: 0;
              margin-top: 0;
            }
            .estimate-title-box {
              flex: 1;
              border-bottom: 1px solid #888;
              border-right: none;
              border-left: none;
              border-top: none;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 28px;
            }
            .estimate-title {
              font-weight: bold;
              font-size: 14px;
              color: #000;
              text-align: center;
              width: 100%;
            }
            .invoice-header-row {
              display: flex;
              flex-direction: row;
              border-bottom: 1px solid #888;
              align-items: stretch;
              margin-bottom: 0;
            }
            .customer-info-box {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding-left: 8px;
              padding-top: 0;
              padding-bottom: 30px;
              border-right: 1px solid #888;
            }
            .invoice-info-box {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              padding-left: 8px;
              padding-right: 8px;
              min-width: 120px;
              padding-bottom: 30px;
            }
            .bold-text {
              font-weight: bold;
              margin: 2px 0;
              font-size: 10px;
            }
            .table-container {
              width: 100%;
              border-collapse: collapse;
            }
            .table-header {
              background-color: #f5f5f5;
              border-bottom: 1px solid #888;
            }
            .table-header-cell {
              padding: 3px;
              text-align: center;
              border-right: 1px solid #888;
              font-weight: bold;
              font-size: 9px;
            }
            .table-row {
              border-bottom: 1px solid #888;
            }
            .table-cell {
              padding: 3px;
              text-align: center;
              border-right: 1px solid #888;
              font-size: 9px;
              vertical-align: middle;
            }
            .amount-cell {
              font-weight: bold;
            }
            .table-footer {
              border-bottom: 1px solid #888;
            }
            .footer-cell {
              padding: 3px;
              text-align: center;
              border-right: 1px solid #888;
              font-size: 9px;
              font-weight: bold;
            }
            .footer-amount {
              font-weight: bold;
              font-size: 9px;
            }
            .payment-row, .net-amount-row {
              display: flex;
              flex-direction: row;
              width: 100%;
              border-bottom: 1px solid #888;
              align-items: stretch;
              min-height: 24px;
            }
            .payment-label-cell, .net-label-cell {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              padding: 3px 8px;
              border-right: 1px solid #888;
              font-size: 9px;
              width: 86%;
              font-weight: bold;
            }
            .net-label-cell {
              justify-content: flex-start;
              font-weight: normal;
            }
            .payment-amount-cell, .net-amount-cell {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 3px 8px;
              font-size: 9px;
              font-weight: bold;
              width: 14%;
              border-left: 1px solid #888;
            }
            .net-amount-cell {
              color: ${isFullyPaid ? '#4CAF50' : '#000'};
            }
            .net-amount-row-custom {
              display: flex;
              flex-direction: row;
              width: 100%;
              align-items: stretch;
              min-height: 24px;
              border-bottom: 0;
              margin-top: 0;
            }
            .net-label-cell-custom {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 3px 8px;
              font-size: 9px;
              width: 86%;
              font-weight: bold;
              border-right: 0;
            }
            .net-amount-cell-custom {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 3px 8px;
              font-size: 9px;
              font-weight: bold;
              width: 14%;
              border-left: 1px solid #888;
              color: ${isFullyPaid ? '#4CAF50' : '#000'};
            }
            .text-left {
              text-align: left;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .no-border-right {
              border-right: none;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Phone Number at Top Right -->
            <div class="phone-number-container">
              <div class="phone-number">9179097007</div>
            </div>

            <!-- ESTIMATE Title with horizontal line -->
            <div class="estimate-title-row">
              <div class="estimate-title-box">
                <span class="estimate-title">ESTIMATE</span>
              </div>
            </div>

            <!-- Invoice Header with horizontal line joining customer and invoice details -->
            <div class="invoice-header-row">
              <div class="customer-info-box">
                <div class="bold-text">${getCustomerNameHTML()}</div>
                ${invoice.customerDetails.customerNameHin ? `<div class="bold-text">${invoice.customerDetails.customerNameHin}</div>` : ''}
                ${invoice.customerDetails.mobileNumber ? `<div class="bold-text">Ph ${invoice.customerDetails.mobileNumber}</div>` : ''}
              </div>
              <div class="invoice-info-box">
                <div class="bold-text">Bill No. ${invoice.invoiceDetails.billNo}</div>
                <div class="bold-text">Date: ${formatDate(invoice.invoiceDetails.date)}</div>
              </div>
            </div>

            <!-- Table -->
            <table class="table-container">
              <thead>
                <tr class="table-header">
                  <th class="table-header-cell" style="width: 6%">Type</th>
                  <th class="table-header-cell" style="width: 8%">Tag No.</th>
                  <th class="table-header-cell" style="width: 16%">Description</th>
                  <th class="table-header-cell" style="width: 6%">Purity</th>
                  <th class="table-header-cell" style="width: 7%">Gross Wt.</th>
                  <th class="table-header-cell" style="width: 6%">Net Wt.</th>
                  <th class="table-header-cell" style="width: 5%">Pcs.</th>
                  <th class="table-header-cell" style="width: 6%">Rate</th>
                  <th class="table-header-cell" style="width: 6%">Value</th>
                  <th class="table-header-cell" style="width: 4%">Dia</th>
                  <th class="table-header-cell" style="width: 4%">Stn.</th>
                  <th class="table-header-cell" style="width: 7%">Dia/Stn Value</th>
                  <th class="table-header-cell" style="width: 9%">Making Charge</th>
                  <th class="table-header-cell" style="width: 14%">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${productRowsHTML}
                
                <!-- Totals Row -->
                <tr class="table-footer">
                  <td class="footer-cell" style="width: 6%">Total</td>
                  <td class="footer-cell" style="width: 8%"></td>
                  <td class="footer-cell text-left" style="width: 16%">
                    ${parseFloat(totals.totalGoldWeight) > 0 ? `Gold: ${totals.totalGoldWeight}` : ''}
                    ${parseFloat(totals.totalGoldWeight) > 0 && parseFloat(totals.totalSilverWeight) > 0 ? '  ' : ''}
                    ${parseFloat(totals.totalSilverWeight) > 0 ? `Silver: ${totals.totalSilverWeight}` : ''}
                  </td>
                  <td class="footer-cell" style="width: 6%"></td>
                  <td class="footer-cell" style="width: 7%">${parseFloat(totals.totalGrossWeight) > 0 ? totals.totalGrossWeight : ''}</td>
                  <td class="footer-cell" style="width: 6%"></td>
                  <td class="footer-cell" style="width: 5%">${totals.totalPieces > 0 ? totals.totalPieces : ''}</td>
                  <td class="footer-cell" style="width: 6%"></td>
                  <td class="footer-cell" style="width: 6%"></td>
                  <td class="footer-cell" style="width: 4%"></td>
                  <td class="footer-cell" style="width: 4%"></td>
                  <td class="footer-cell" style="width: 7%"></td>
                  <td class="footer-cell" style="width: 9%">${parseFloat(totals.totalMaking) > 0 ? totals.totalMaking : ''}</td>
                  <td class="footer-cell no-border-right footer-amount" style="width: 14%; color: ${parseFloat(totals.grandTotal) >= 0 ? '#000' : '#d32f2f'}">
                    ${parseFloat(totals.grandTotal) < 0 ? '-' : ''}${formatAmount(Math.abs(parseFloat(totals.grandTotal)))}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Payment Rows (styled as table row) -->
            ${hasCashPayment ? `
              <div class="payment-row">
                <div class="payment-label-cell">RECEIPT/CASH</div>
                <div class="payment-amount-cell">${formatAmount(parseFloat(invoice.paymentDetails?.cash) || 0)}</div>
              </div>
            ` : ''}

            ${hasUPIPayment ? `
              <div class="payment-row">
                <div class="payment-label-cell">RECEIPT/UPI</div>
                <div class="payment-amount-cell">${formatAmount(parseFloat(invoice.paymentDetails?.upi) || 0)}</div>
              </div>
            ` : ''}

            <!-- Net Amount Row (custom, Rs.,Only left, Net Amount right, same as screen) -->
            <div class="net-amount-row-custom">
              <div class="net-label-cell-custom">
                <span>Rs.,Only</span>
                <span style="font-weight:bold;">Net Amount</span>
              </div>
              <div class="net-amount-cell-custom">${isFullyPaid ? 'NIL' : `₹${formatAmount(totals.netAmount)}`}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const TableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <TableHeaderCell width={calculateCellWidth(6)}>Type</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(8)}>Tag No.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(16)}>Description</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Purity</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(7)}>Gross Wt.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Net Wt.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(5)}>Pcs.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Rate</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Value</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(4)}>Dia</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(4)}>Stn.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(7)}>Dia/Stn Value</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(9)}>Making Charge</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(14)} last>
        Amount (₹)
      </TableHeaderCell>
    </View>
  );

  const renderItem = ({ item, index }) => {
    let amountColor = item.type === 'Purchase' ? '#d32f2f' : '#000';
    const parseFinalAmount = parseFloat(item.finalAmount);
    const amount = !isNaN(parseFinalAmount) ? parseFinalAmount : 0;
    const showRate = item.type !== 'Purchase';

    const displayAmount = () => {
      if (item.type === 'Purchase') {
        if (!amount || amount === 0) {
          const rateVal = parseFloat(item.ratePerGram) || 0;
          return rateVal > 0 ? `-${formatAmount(rateVal)}` : '';
        } else {
          return amount > 0 ? `-${formatAmount(amount)}` : '';
        }
      }
      return amount > 0 ? formatAmount(amount) : '';
    };

    return (
      <View
        style={[
          styles.tableRowMid,
          styles.tableDataRow,
          index === invoice.productDetails.length - 1 && styles.lastDataRow,
        ]}
        key={index}
      >
        <TableCell width={calculateCellWidth(6)}>
          {item.type === 'Sales' ? 'S' : item.type === 'Purchase' ? 'P' : 'S'}
        </TableCell>
        <TableCell width={calculateCellWidth(8)}>
          <Text style={[styles.tableCellText, { textAlign: 'center' }]}>
            {item.tagNo || ''}
          </Text>
        </TableCell>
        <TableCell width={calculateCellWidth(16)}>
          <Text style={[styles.tableCellText, { textAlign: 'left' }]}>
            {item.productName || item.description || ''}
          </Text>
        </TableCell>
        <TableCell width={calculateCellWidth(6)}>{formatPurity(item.purity)}</TableCell>
        <TableCell width={calculateCellWidth(7)}>{formatWeight(item.grossWeightInGrams)}</TableCell>
        <TableCell width={calculateCellWidth(6)}>{formatWeight(item.netWeightInGrams)}</TableCell>
        <TableCell width={calculateCellWidth(5)}>{item.piece && parseInt(item.piece) > 0 ? item.piece : ''}</TableCell>
        <TableCell width={calculateCellWidth(6)}>
          {showRate ? (item.ratePerGram || item.rate || '') : ''}
        </TableCell>
        <TableCell width={calculateCellWidth(6)}>{item.value && parseFloat(item.value) > 0 ? item.value : ''}</TableCell>
        <TableCell width={calculateCellWidth(4)}>{item.dia && parseFloat(item.dia) > 0 ? item.dia : ''}</TableCell>
        <TableCell width={calculateCellWidth(4)}>{item.stn && parseFloat(item.stn) > 0 ? item.stn : ''}</TableCell>
        <TableCell width={calculateCellWidth(7)}>{item.diaStnValue && parseFloat(item.diaStnValue) > 0 ? item.diaStnValue : ''}</TableCell>
        <TableCell width={calculateCellWidth(9)}>{formatMakingCharge(item)}</TableCell>
        <TableCell width={calculateCellWidth(14)} last amount amountColor={amountColor}>
          {displayAmount()}
        </TableCell>
      </View>
    );
  };

  const totals = calculateTotals();

  const hasCashPayment = parseFloat(invoice.paymentDetails?.cash) > 0;
  const hasUPIPayment = parseFloat(invoice.paymentDetails?.upi) > 0;
  const isFullyPaid = parseFloat(totals.netAmount) === 0;

  return (
    <>
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
      <View style={styles.containerMain}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../../assets/backarrow.png')} style={styles.backarrow} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.phoneContainer}>
            <Text style={styles.phoneText}>9179097007</Text>
          </View>
        </View>
        
        {/* ESTIMATE Header */}
        <View style={styles.estimateContainer}>
          <Text style={styles.estimateText}>ESTIMATE</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View style={[styles.invoiceContainer, { width: baseWidth * 0.97 }]}>
              <View style={styles.invoiceHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.boldTextNoMargin}>{invoice.customerDetails.customerNameEng}</Text>
                  {invoice.customerDetails.customerNameHin && (
                    <Text style={styles.boldTextNoMargin}>{invoice.customerDetails.customerNameHin}</Text>
                  )}
                  {invoice.customerDetails.mobileNumber && (
                    <Text style={styles.boldTextNoMargin}>Ph {invoice.customerDetails.mobileNumber}</Text>
                  )}
                </View>
                <View style={styles.invoiceInfoRow}>
                  <Text style={styles.boldTextNoMargin}>Bill No. {invoice.invoiceDetails.billNo}</Text>
                  <View style={{ width: wp('3%') }} />
                  <Text style={[styles.boldTextNoMargin, styles.dateText]}>
                    Date: {formatDate(invoice.invoiceDetails.date)}
                  </Text>
                </View>
              </View>
              <TableHeader />
              <FlatList
                data={invoice.productDetails}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
              <View style={[styles.tableRow, styles.tableFooter]}>
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(5.8) }]}>
                  <Text style={styles.footerTextSmall}>Total</Text>
                </View>
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(8) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(16) }]}>
                  <Text style={styles.footerTextSmallBold}>
                    {parseFloat(totals.totalGoldWeight) > 0 && `Gold: ${totals.totalGoldWeight}`}
                    {parseFloat(totals.totalGoldWeight) > 0 && parseFloat(totals.totalSilverWeight) > 0 && `  `}
                    {parseFloat(totals.totalSilverWeight) > 0 && `Silver: ${totals.totalSilverWeight}`}
                  </Text>
                </View>
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(6) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(7) }]}>
                  <Text style={styles.footerTextSmallBold}>
                    {parseFloat(totals.totalGrossWeight) > 0 ? totals.totalGrossWeight : ''}
                  </Text>
                </View>
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(6) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(5) }]}>
                  <Text style={styles.footerTextSmallBold}>
                    {totals.totalPieces > 0 ? totals.totalPieces : ''}
                  </Text>
                </View>
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(6) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(6) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(4) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(4) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(7) }]} />
                <View style={[styles.footerCellNoBorder, { width: calculateCellWidth(9) }]}>
                  <Text style={styles.footerTextSmallBold}>
                    {parseFloat(totals.totalMaking) > 0 ? totals.totalMaking : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.footerAmountCellNoBorder,
                    {
                      width: calculateCellWidth(14),
                      borderLeftWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: '#888',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.footerAmountBold,
                      { color: parseFloat(totals.grandTotal) >= 0 ? '#000' : '#d32f2f' },
                    ]}
                  >
                    {parseFloat(totals.grandTotal) < 0 ? '-' : ''}
                    {formatAmount(Math.abs(parseFloat(totals.grandTotal)))}
                  </Text>
                </View>
              </View>
              
              {/* Payment Rows */}
              {hasCashPayment && (
                <View style={[styles.tableRow, styles.paymentRow]}>
                  <View
                    style={[
                      styles.footerCellFullWidthNoLeftBorder,
                      {
                        width: calculateCellWidth(83.66),
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        borderRightWidth: 0,
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text style={styles.footerTextLight}>RECEIPT/CASH</Text>
                  </View>
                  <View
                    style={[
                      styles.footerAmountCellFullBorder,
                      {
                        width: calculateCellWidth(14),
                        borderLeftWidth: 1,
                        borderBottomWidth: 0,
                        borderColor: '#888',
                      },
                    ]}
                  >
                    <Text style={styles.footerAmount}>
                      {formatAmount(parseFloat(invoice.paymentDetails?.cash) || 0)}
                    </Text>
                  </View>
                </View>
              )}
              
              {hasUPIPayment && (
                <View style={[styles.tableRow, styles.paymentRow]}>
                  <View
                    style={[
                      styles.footerCellFullWidthNoLeftBorder,
                      {
                        width: calculateCellWidth(83.66),
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        borderRightWidth: 0,
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text style={styles.footerTextLight}>RECEIPT/UPI</Text>
                  </View>
                  <View
                    style={[
                      styles.footerAmountCellFullBorder,
                      {
                        width: calculateCellWidth(14),
                        borderLeftWidth: 1,
                        borderBottomWidth: 0,
                        borderColor: '#888',
                      },
                    ]}
                  >
                    <Text style={styles.footerAmount}>
                      {formatAmount(parseFloat(invoice.paymentDetails?.upi) || 0)}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Horizontal Line before Net Amount */}
              <View style={styles.horizontalLine} />
              
              {/* Net Amount Row */}
              <View style={[styles.tableRow, styles.netAmountRow]}>
                <View
                  style={[
                    styles.footerCellFullWidthNoLeftBorder,
                    {
                      width: calculateCellWidth(83.66),
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRightWidth: 0,
                      flexDirection: 'row',
                      paddingHorizontal: wp('2%'),
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <Text style={styles.footerTextLight}>Rs.,Only</Text>
                  <Text style={styles.footerTextBold}>Net Amount</Text>
                </View>
                <View
                  style={[
                    styles.footerAmountCellFullBorder,
                    {
                      width: calculateCellWidth(14),
                      borderLeftWidth: 1,
                      borderBottomWidth: 0,
                      borderColor: '#888',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.footerAmountBold,
                      {
                        color: isFullyPaid ? Colors.BTNGREEN : '#000',
                      },
                    ]}
                  >
                    {isFullyPaid ? 'NIL' : `₹${formatAmount(totals.netAmount)}`}
                  </Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </ScrollView>

        {/* Download PDF Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.downloadText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const TableHeaderCell = ({ children, width, last }) => (
  <View style={[styles.tableHeaderCell, { width }, !last && styles.cellWithBorder]}>
    <Text style={styles.tableHeaderText}>{children}</Text>
  </View>
);

const TableCell = ({ children, width, last, amount, amountColor }) => (
  <View style={[styles.tableCell, { width }, !last && styles.cellWithBorder]}>
    <Text
      style={amount ? [styles.amountText, { color: amountColor || '#000' }] : styles.tableCellText}
    >
      {children}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  containerMain: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? hp('6%') : hp('0.5%'),
    paddingBottom: hp('1%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? hp('4.5%') : hp('2%'),
    paddingHorizontal: wp('2%'),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: wp('1%'),
    paddingHorizontal: wp('2.5%'),
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
  phoneContainer: {
    marginRight: wp('1%'),
  },
  phoneText: {
    fontSize: wp('3%'),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  estimateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp('1%'),
    marginBottom: hp('1%'),
  },
  estimateText: {
    fontSize: wp('6%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: hp('15%'),
  },
  invoiceContainer: {
    margin: wp('2.5%'),
    borderWidth: 1,
    borderColor: '#888',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#888',
    paddingVertical: 0,
  },
  customerInfo: {
    flex: 1,
    paddingHorizontal: wp('2%'),
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 40,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderColor: '#888',
    paddingLeft: wp('2%'),
    paddingRight: wp('2%'),
    paddingBottom: 40,
  },
  dateText: {
    marginRight: wp('2%'),
  },
  boldTextNoMargin: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('2%'),
    color: '#000',
    marginVertical: 0,
    paddingVertical: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#888',
  },
  tableRowTop: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#888',
  },
  tableRowMid: {
    flexDirection: 'row',
  },
  lastDataRow: {
    borderBottomWidth: 1,
    borderColor: '#888',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    height: hp('4%'),
  },
  tableHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('0.5%'),
  },
  cellWithBorder: {
    borderRightWidth: 1,
    borderColor: '#888',
  },
  tableHeaderText: {
    fontSize: wp('1.5%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'center',
  },
  tableDataRow: {
    minHeight: hp('3%'),
  },
  tableCell: {
    justifyContent: 'center',
    padding: wp('0.3%'),
    minHeight: hp('3%'),
  },
  tableCellText: {
    fontSize: wp('1.3%'),
    color: '#000',
    textAlign: 'center',
  },
  amountText: {
    fontSize: wp('1.5%'),
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  tableFooter: {
    height: hp('2.5%'),
  },
  paymentRow: {
    height: hp('2.2%'),
    borderBottomWidth: 0,
  },
  netAmountRow: {
    height: hp('2.2%'),
    borderBottomWidth: 0,
  },
  footerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
    borderRightWidth: 1,
    borderColor: '#888',
  },
  footerCellFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
    borderRightWidth: 1,
    borderColor: '#888',
    borderLeftWidth: 1,
  },
  footerCellFullWidthNoLeftBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
    borderRightWidth: 1,
    borderColor: '#888',
    borderLeftWidth: 0,
  },
  footerCellNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
  },
  footerAmountCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
  },
  footerAmountCellNoBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
  },
  footerAmountCellFullBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
    borderRightWidth: 0,
    borderColor: '#888',
  },
  footerText: {
    fontSize: wp('1.6%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  footerTextBold: {
    fontSize: wp('1.6%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  footerTextSmall: {
    fontSize: wp('1.4%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'center',
    width: '100%',
    fontWeight: 'bold',
    marginTop: hp('0.8%'),
  },
  footerTextSmallBold: {
    fontSize: wp('1.4%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
    textAlign: 'center',
    width: '100%',
    fontWeight: 'bold',
  },
  footerTextLight: {
    fontSize: wp('1.6%'),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  footerAmount: {
    fontSize: wp('1.6%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    fontWeight: 'bold',
  },
  footerAmountBold: {
    fontSize: wp('1.6%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
    fontWeight: 'bold',
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderColor: '#888',
    marginVertical: hp('0.2%'),
  },
  bottomContainer: {
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
  downloadButton: {
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
  downloadText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: wp('4.5%'),
  },
});

export default GenerateInvoiceScreen;