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
  PermissionsAndroid,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import ViewShot from 'react-native-view-shot';
import { Alert } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const GenerateInvoiceScreen = ({ navigation, route }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(false);
  const viewShotRef = useRef();

  const { invoice } = route.params;

  if (!invoice) return null;

  console.log('main bill', invoice.productDetails[0].productName);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setIsLandscape(window.width > window.height);
    });
    return () => subscription?.remove();
  }, []);

  // Sample invoice data
  const [invoiceData] = useState({
    customerName: 'Tukaram Verma Ji तुकाराम जी',
    phoneNumber: '6268885480',
    billNo: 'RJ001',
    date: '21 Jul 2025',
    items: [
      {
        id: 1,
        type: 'S',
        description: 'Jents ring',
        purity: '22k',
        grossWeight: '3.470',
        netWeight: '3.470',
        pieces: '1',
        rate: '9065.00',
        value: '31456',
        dia: '',
        stn: '',
        diaStnValue: '',
        makingCharge: '14%',
        amount: '35860.00',
      },
      {
        id: 2,
        type: 'S',
        description: 'Latkan',
        purity: '22k',
        grossWeight: '2.453',
        netWeight: '2.453',
        pieces: '1',
        rate: '9065.00',
        value: '31456',
        dia: '',
        stn: '',
        diaStnValue: '',
        makingCharge: '14%',
        amount: '35860.00',
      },
    ],
    totals: {
      goldWeight: '5.910',
      totalPieces: '3',
      totalValue: '8334',
      grandTotal: '71720.00',
      paymentType: 'RECEIPT/CASH',
      paymentAmount: '-71720.00',
      netAmount: 'NIL',
    },
  });

  // Fixed width calculation for consistent size
  const baseWidth = Math.min(dimensions.width, dimensions.height);
  const calculateCellWidth = percentage => {
    return (baseWidth * 0.95 * percentage) / 100 - 2;
  };

  // Table Header Component
  const TableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <TableHeaderCell width={calculateCellWidth(6)}>Type</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(19)}>
        Description
      </TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Purity</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Gross Wt.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(5)}>Net Wt.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(5)}>Pcs.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(7)}>Rate</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(6)}>Value</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(5)}>Dia</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(5)}>Stn.</TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(8)}>
        Dia/Stn Value
      </TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(11.9)}>
        Making Charge
      </TableHeaderCell>
      <TableHeaderCell width={calculateCellWidth(16)} last>
        Amount (₹)
      </TableHeaderCell>
    </View>
  );

  // Render each invoice item row
  const renderItem = ({ item }) => {
    console.log('Row item:', item);

    return (
      <View style={[styles.tableRowMid, styles.tableDataRow]}>
        <TableCell width={calculateCellWidth(6)}>S</TableCell>
        <TableCell width={calculateCellWidth(19)}>{item.productName}</TableCell>
        <TableCell width={calculateCellWidth(6)}>{item.purity}</TableCell>
        <TableCell width={calculateCellWidth(6)}>
          {item.grossWeightInGrams}
        </TableCell>
        <TableCell width={calculateCellWidth(5)}>
          {item.netWeightInGrams}
        </TableCell>
        <TableCell width={calculateCellWidth(5)}>{item.piece}</TableCell>
        <TableCell width={calculateCellWidth(7)}>{item.ratePerGram}</TableCell>
        <TableCell width={calculateCellWidth(6)}>{item.value}</TableCell>
        <TableCell width={calculateCellWidth(5)}>{item.dia || '-'}</TableCell>
        <TableCell width={calculateCellWidth(5)}>{item.stn || '-'}</TableCell>
        <TableCell width={calculateCellWidth(8)}>
          {item.diaStnValue || '-'}
        </TableCell>
        <TableCell width={calculateCellWidth(11.9)}>
          {item.additionalAmount}
        </TableCell>
        <TableCell width={calculateCellWidth(16)} last amount>
          {item?.finalAmount}
        </TableCell>
      </View>
    );
  };

  async function requestStoragePermission() {
    if (Platform.OS === 'android') {
      try {
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
        } else {
          console.log('Storage permissions denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  const handleDownload = async () => {
    try {
      // ask storage permission (Android)
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Cannot save PDF without permission',
          );
          return;
        }
      }

      const html = generateInvoiceHTML(invoice, calculateTotals());
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `invoice_${Date.now()}`,
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
      Alert.alert('Error', err.message);
    }
  };

  const calculateTotals = () => {
    let totalGoldWeight = 0;
    let totalPieces = 0;
    let totalMaking = 0;
    let totalAmount = 0;

    invoice.productDetails.forEach(item => {
      totalGoldWeight += parseFloat(item.netWeightInGrams) || 0;
      totalPieces += parseInt(item.piece) || 0;

      // making charge may be percentage or flat, adjust based on your data
      totalMaking += parseFloat(item.additionalAmount) || 0;
      totalAmount += parseFloat(item.finalAmount) || 0;
    });

    return {
      totalGoldWeight: totalGoldWeight.toFixed(3),
      totalPieces,
      totalMaking: totalMaking.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  return (
    <>
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
      <View style={styles.containerMain}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('get-all-invoices')}
            style={styles.backButton}
          >
            <Image
              source={require('../../assets/backarrow.png')}
              style={styles.backarrow}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        {/* Header with back button */}

        {/* Invoice Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          horizontal={isLandscape} // Enable horizontal scroll in landscape
        >
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View
              style={[styles.invoiceContainer, { width: baseWidth * 0.95 }]}
            >
              <View style={styles.invoiceHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.boldText}>
                    {invoice.customerDetails.customerNameEng}
                    {'  '}
                    {invoice.customerDetails.customerNameHin}
                  </Text>
                  <Text style={styles.boldText}>
                    Ph # {invoice.customerDetails.mobileNumber}
                  </Text>
                </View>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.boldText}>
                    Bill No. {invoice.invoiceDetails.billNo}
                  </Text>
                  <Text style={styles.boldText}>
                    Date: {invoice.invoiceDetails.date?.slice(0, 10)}
                  </Text>
                </View>
              </View>

              {/* Table Header */}
              <TableHeader />

              {/* Table Rows */}
              <FlatList
                data={invoice.productDetails} // ✅ correct array
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />

              {/* Table Footer */}
              <View style={[styles.tableRow, styles.tableFooter]}>
                <View
                  style={[
                    styles.footerCell,
                    {
                      width: calculateCellWidth(84.5),
                      borderTopWidth: 1,
                      borderColor: '#888',
                    },
                  ]}
                >
                  <Text style={styles.footerText}>Total</Text>
                  <Text style={styles.footerText}>
                    Gold: {calculateTotals().totalGoldWeight} gm
                  </Text>
                  <Text style={styles.footerText}>
                    {calculateTotals().totalGoldWeight}
                  </Text>
                  <Text style={styles.footerText}>
                    {calculateTotals().totalPieces}
                  </Text>
                  <Text style={styles.footerText}>
                   {calculateTotals().totalMaking}
                  </Text>
                </View>
                <View
                  style={[
                    styles.footerAmountCell,
                    {
                      width: calculateCellWidth(16),
                      borderTopWidth: 1,
                      borderColor: '#888',
                    },
                  ]}
                >
                  <Text style={styles.footerAmount}>
                    {calculateTotals().totalAmount}
                  </Text>
                </View>
              </View>

              <View style={[styles.tableRow, styles.tableFooter]}>
                <View
                  style={[
                    styles.footerCell,
                    { width: calculateCellWidth(84.5) },
                  ]}
                >
                  <Text style={styles.footerTextLight}>
                    {invoiceData.totals.paymentType}
                  </Text>
                </View>
                <View
                  style={[
                    styles.footerAmountCell,
                    { width: calculateCellWidth(16) },
                  ]}
                >
                  <Text style={styles.footerAmountLight}>
                    {calculateTotals().paymentAmount}
                  </Text>
                </View>
              </View>

              <View style={[styles.tableRowTop, styles.tableFooter]}>
                <View
                  style={[
                    styles.footerCell,
                    { width: calculateCellWidth(84.5) },
                  ]}
                >
                  <Text style={styles.footerText}>Rs.,Only</Text>
                  <Text style={styles.footerText}>Net Amount</Text>
                </View>
                <View
                  style={[
                    styles.footerAmountCell,
                    { width: calculateCellWidth(16) },
                  ]}
                >
                  <Text style={styles.footerAmount}>
                    {invoiceData.totals.netAmount}
                  </Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </ScrollView>

        {/* Download Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
          >
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

// Reusable Table Cell Components
const TableHeaderCell = ({ children, width, last }) => (
  <View
    style={[styles.tableHeaderCell, { width }, !last && styles.cellWithBorder]}
  >
    <Text style={styles.tableHeaderText}>{children}</Text>
  </View>
);

const TableCell = ({ children, width, last, amount }) => (
  <View style={[styles.tableCell, { width }, !last && styles.cellWithBorder]}>
    <Text style={amount ? styles.amountText : styles.tableCellText}>
      {children}
    </Text>
  </View>
);

const generateInvoiceHTML = (invoice, calculateTotals) => {
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding: 10px 0; }
        .customer, .invoice { font-size: 14px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { border: 1px solid #000; font-size: 12px; padding: 6px; text-align: center; }
        td { font-size: 12px; padding: 6px; text-align: center; }
        th { background: #f5f5f5; font-weight: bold; }
        .footer { display: flex; justify-content: space-between; margin-top: 15px; font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="customer">
          <div>${invoice.customerDetails.customerNameEng}
                    ${'  '}
                    ${invoice.customerDetails.customerNameHin}</div>
          <div>Ph: ${invoice.customerDetails.mobileNumber}</div>
        </div>
        <div class="invoice">
          <div>Bill No: ${invoice.invoiceDetails.billNo}</div>
          <div>Date: ${invoice.invoiceDetails.date}</div>
        </div>
      </div>

      <!-- Table -->
      <table>
        <tr>
          <th>Type</th><th>Description</th><th>Purity</th><th>Gross Wt.</th><th>Net Wt.</th><th>Pcs.</th>
          <th>Rate</th><th>Value</th><th>Dia</th><th>Stn.</th><th>Dia/Stn Value</th><th>Making</th><th>Amount</th>
        </tr>
        ${invoice.productDetails
          .map(
            item => `
          <tr>
            <td>${item.type}</td>
            <td>${item.description}</td>
            <td>${item.purity}</td>
            <td>${item.grossWeightInGrams}</td>
            <td>${item.netWeightInGrams}</td>
            <td>${item.piece}</td>
            <td>${item.ratePerGram}</td>
            <td>${item.value}</td>
            <td>${item.dia || '-'}</td>
            <td>${item.stn || '-'}</td>
            <td>${item.diaStnValue || '-'}</td>
            <td>${item.additionalAmount}</td>
            <td>₹${item.finalAmount}</td>
          </tr>
        `,
          )
          .join('')}
      </table>

      <!-- Totals -->
      <div class="footer">
        <div>Total Gold: ${calculateTotals.totalGoldWeight} gm | Pcs: ${
    invoiceData.totals.totalPieces
  } | Value: ${invoiceData.totals.totalValue}</div>
        <div>Grand Total: ₹${invoiceData.totals.grandTotal}</div>
      </div>

      <div class="footer">
        <div>${invoiceData.totals.paymentType}</div>
        <div>${invoiceData.totals.paymentAmount}</div>
      </div>

      <div class="footer">
        <div>Net Amount</div>
        <div>${invoiceData.totals.netAmount}</div>
      </div>
    </body>
  </html>
  `;
};

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
    marginTop: hp('4.5%'),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    padding: 5,
    paddingHorizontal: 10,
  },
  backButtonTouch: { flexDirection: 'row', alignItems: 'center' },
  backarrow: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    resizeMode: 'contain',
    marginRight: wp('2%'),
  },
  backText: { fontSize: wp('4%'), fontFamily: 'Poppins-Bold', color: '#000' },
  scrollContainer: {
    flex: 1,
    paddingBottom: hp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  customerInfo: {
    flex: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('1%'),
    paddingBottom: hp('5%'),
  },
  invoiceInfo: {
    flexDirection: 'row',
    gap: wp('5%'),
    borderLeftWidth: 1,
    borderColor: '#888',
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('1%'),
  },
  boldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('2%'),
    color: '#000',
    marginBottom: hp('0.5%'),
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#888',
  },
  tableRowTop: {
    flexDirection: 'row',
    bordeTopWidth: 1,
    borderColor: '#888',
  },
  tableRowMid: {
    flexDirection: 'row',
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
    minHeight: hp('2%'),
  },
  tableCell: {
    justifyContent: 'center',
    padding: wp('0.5%'),
    paddingBottom: hp('1%'),
  },
  tableCellText: {
    fontSize: wp('1.3%'),
    color: '#000',
    textAlign: 'center',
  },
  amountText: {
    fontSize: wp('1.8%'),
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  tableFooter: {
    height: hp('1.8%'),
  },
  footerCell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
    borderRightWidth: 1,
    borderColor: '#888',
  },
  footerCell2: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
    borderRightWidth: 1,
    borderColor: '#888',
  },
  footerAmountCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
  },
  footerText: {
    fontSize: wp('2%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  footerTextLight: {
    fontSize: wp('2%'),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  footerAmount: {
    fontSize: wp('2%'),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  footerAmountLight: {
    fontSize: wp('2%'),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  downloadButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('1%'),
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('4.5%'),
  },
});

export default GenerateInvoiceScreen;
