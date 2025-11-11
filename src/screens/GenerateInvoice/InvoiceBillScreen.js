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
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import ViewShot from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const InvoiceBillScreen = ({ navigation, route }) => {
  const viewShotRef = useRef();
  const { invoice } = route.params || {};

  console.log('bill screen', invoice);

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

  // ✅ Generate PDF and download
  const handleDownloadPDF = async () => {
    try {
      await requestStoragePermission();

      const html = generateInvoiceHTML(invoice);

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

      Alert.alert('Success', 'PDF Downloaded Successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // ✅ Share as Image
  // const handleShare = async () => {
  //   try {
  //     const uri = await viewShotRef.current.capture();
  //     const filePath = `${
  //       RNFS.CachesDirectoryPath
  //     }/invoice_share_${Date.now()}.jpg`;

  //     await RNFS.copyFile(uri, filePath);

  //     await Share.open({
  //       url: 'file://' + filePath,
  //       type: 'image/jpg',
  //       showAppsToView: true,
  //     });
  //   } catch (error) {
  //     console.log('Share error:', error);
  //     Alert.alert('Error', 'Could not share bill');
  //   }
  // };

  return (
    <>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      <View style={styles.container}>
        <View style={styles.backButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate('custom-order-invoice')}
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
                    {invoice.invoiceDetails.date.slice(0, 10)}
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
                <Text style={styles.label}>
                  Number:{' '}
                  <Text style={styles.normalText}>
                    +91 {invoice.customerDetails.mobileNumber}
                  </Text>
                </Text>
                <Text style={styles.label}>
                  Address:
                  <Text style={styles.normalText}>
                    {invoice.customerDetails.address}
                  </Text>
                </Text>
              </View>

              <View style={styles.tableRowTop}>
                <Text style={[styles.cell1, styles.snCol, styles.bold]}>
                  S No.
                </Text>
                <Text style={[styles.cell1, styles.productCol, styles.bold]}>
                  Product
                </Text>
                <Text style={[styles.cell1, styles.metalCol, styles.bold]}>
                  Expected Weight
                </Text>
                <Text style={[styles.cell1, styles.metalCol, styles.bold]}>
                  Advance Amount
                </Text>
                <Text style={[styles.cell1, styles.weightCol, styles.bold]}>
                  Pending Amount
                </Text>
              </View>

              {invoice.productDetails.map((item, index) => (
                <View key={index}>
                  <View style={styles.tableRow}>
                    <Text style={[styles.cell, styles.snCol]}>{index + 1}</Text>
                    <Text style={[styles.cell, styles.productCol]}>
                      {item.productName}
                    </Text>
                    <Text style={[styles.cell, styles.metalCol]}>
                      {item.expectedWeight} gm
                    </Text>
                    <Text style={[styles.cell, styles.metalCol]}>
                      ₹{invoice.paymentDetails.advanceAmount}
                    </Text>
                    <Text style={[styles.cell, styles.weightCol]}>
                      ₹{invoice.paymentDetails.pending}
                    </Text>
                  </View>

                  <View style={styles.descriptionBox}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.normalText}>
                      {item.description || 'No description'}
                    </Text>
                  </View>

                  <View style={styles.rowBottom}>
                    <Text style={[styles.label, styles.bold]}>Amount</Text>
                    <Text style={styles.amount}>₹{item.expectedAmount}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ViewShot>
        </ScrollView>

        <View style={styles.bottonBox}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.doneText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

// ✅ Function OUTSIDE component
const generateInvoiceHTML = invoice => {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #fff; padding: 25px; color: #000; }
          .header { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding: 8px 0; margin-bottom: 12px; }
          .section { margin-bottom: 12px; }
          .label { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
          .value { font-size: 13px; color: #555; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table th, .table td { border: 1px solid #000; padding: 6px; font-size: 13px; }
          .table th { background: #f2f2f2; font-weight: bold; }
          .description { margin-top: 12px; font-size: 13px; color: #555; }
          .footer { display: flex; justify-content: space-between; margin-top: 16px; font-size: 15px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>Bill No: <span style="color:#0D6EFD">${invoice.invoiceDetails.voucherNo}</span></div>
          <div>Date: ${invoice.invoiceDetails.date.slice(0, 10)}</div>
        </div>
        <div class="section">
          <div class="label">Name: <span class="value">${invoice.customerDetails.customerNameEng}</span></div>
          <div class="label">Number: <span class="value">+91  ${invoice.customerDetails.mobileNumber}</span></div>
          <div class="label">Address: <span class="value">${invoice.customerDetails.address}</span></div>
        </div>
        <table class="table">
          <tr><th>S No.</th><th>Product</th><th>Expected Weight</th><th>Advance Amount</th><th>Pending Amount</th></tr>
          <tr><td>1.</td><td>${invoice.productDetails[0].productName}</td><td>${invoice.productDetails[0].expectedWeight} gm</td><td>₹${invoice.paymentDetails.advanceAmount}</td><td>₹${invoice.paymentDetails.pending}</td></tr>
        </table>
        <div class="description">
          <div class="label">Description</div>
          <p>${invoice.productDetails[0].description}</p>
        </div>
        <div class="footer">
          <div>Amount</div><div>₹${invoice.productDetails[0].expectedAmount}</div>
        </div>
      </body>
    </html>
  `;
};

export default InvoiceBillScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderColor: '#000',
    padding: 5,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#000',
    padding: 5,
  },
  innercontainer: {
    borderWidth: 0.5,
    margin: 10,
    marginTop: 100,
    backgroundColor: '#fff',
  },
  section: { marginBottom: 12, padding: 5 },
  label: { fontSize: 14, color: '#000', marginBottom: 4 },
  normalText: { fontWeight: '400', color: '#aaa', fontSize: 12 },
  billId: { color: '#0D6EFD' },
  tableRowTop: {
    flexDirection: 'row',
    borderBottomWidth: 0.3,
    borderTopWidth: 0.3,
    borderColor: '#000',
    marginBottom: -1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.3,
    borderColor: '#000',
    marginBottom: -1,
  },
  cell1: {
    padding: 6,
    borderRightWidth: 0.3,
    borderColor: '#000',
    fontSize: 13,
  },
  cell: {
    padding: 6,
    borderRightWidth: 0.3,
    borderColor: '#000',
    fontSize: 13,
    color: '#aaa',
  },
  snCol: { flex: 0.8 },
  productCol: { flex: 2.5 },
  metalCol: { flex: 1.5 },
  weightCol: { flex: 1.2, borderRightWidth: 0 },
  descriptionBox: { padding: 8, marginTop: 12, marginBottom: 16 },
  bold: { fontWeight: 'bold', color: '#000' },
  amount: { fontWeight: 'bold', fontSize: 16, color: '#000' },
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
  bottonBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp('4%'),
    backgroundColor: '#fff',
    paddingBottom: hp('6%'),
  },
  doneButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    elevation: 5,
  },
  doneText: { color: '#fff', fontFamily: 'Poppins-Bold', fontSize: wp('5%') },
});
