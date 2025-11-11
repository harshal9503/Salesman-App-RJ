// InvoiceModal.js


import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';


const { width, height } = Dimensions.get('window');


const InvoiceModal = ({ visible, onClose, invoice }) => {
  const navigation = useNavigation();


  if (!invoice) return null;


  const products = invoice.productDetails || [];


  // Helper to format amount with "₹" AFTER number (no decimals in amount and total)
  const formatAmountWithSymbolAfter = amount => {
    if (amount === undefined || amount === null) return 'N/A';
    return `₹ ${Math.floor(amount)}`;
  };


  // FIXED: Function to handle edit navigation with proper invoiceId
  const handleEditInvoice = () => {
    console.log('Invoice object:', invoice);
    console.log('Invoice ID to pass:', invoice.invoiceId || invoice._id);
    
    // Use invoiceId if available, otherwise use _id as fallback
    const invoiceIdToPass = invoice.invoiceId || invoice._id;
    
    if (!invoiceIdToPass) {
      alert('Invoice ID is missing. Cannot edit invoice.');
      return;
    }
    
    // Close modal first
    onClose();
    
    // Navigate with proper invoiceId parameter
    navigation.navigate('update-invoice', {
      invoiceId: invoiceIdToPass
    });
  };


  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Image
              source={require('../../assets/modalclose.png')}
              style={{ width: 20, height: 20 ,marginBottom:5}}
              resizeMode="contain"
            />
          </TouchableOpacity>


          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {/* Edit Button - FIXED with proper navigation */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={handleEditInvoice}
            >
              <View style={styles.editBtnContent}>
                <Text style={styles.editText}>Edit Invoice</Text>
                <Image
                  source={require('../../assets/modaledit.png')}
                  style={styles.editIcon}
                />
              </View>
            </TouchableOpacity>


            {/* Title */}
            <Text style={styles.title}>Invoice Details</Text>


            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.label}>Order Id:</Text>
                <Text style={styles.infoText}>{invoice.orderNumber || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <Text style={{ marginLeft: 20, fontSize: 15, fontWeight: '800' }}>Tag Id</Text>
                <Text style={styles.infoText}>{products.length > 0 ? products[0].tagNo || 'N/A' : 'N/A'}</Text>
              </View>
            </View>


            {/* Customer Details */}
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{invoice.customerDetails?.customerNameEng || 'N/A'}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>
                {invoice.customerDetails?.mobileNumber ? `+91${invoice.customerDetails.mobileNumber}` : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{invoice.customerDetails?.address || 'N/A'}</Text>
            </View>


            {/* Products List */}
            <Text style={styles.productsTitle}>Products</Text>
            {products.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', marginVertical: 12 }}>
                No products available
              </Text>
            ) : (
              products.map((product, index) => (
                <View style={styles.productBox} key={index}>
                  <Text style={styles.productName}>{product.productName || 'N/A'}</Text>
                  <View style={styles.productDetailsRow}>
                    <View style={styles.productDetailColumn}>
                      <Text style={styles.detailLabel}>Gross Wt.</Text>
                      <Text style={styles.detailValue}>
                        {product.grossWeightInGrams !== undefined ? product.grossWeightInGrams : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.productDetailColumn}>
                      <Text style={styles.detailLabel}>Net Wt.</Text>
                      <Text style={styles.detailValue}>
                        {product.netWeightInGrams !== undefined ? product.netWeightInGrams : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.productDetailColumn}>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={styles.detailValue}>
                        {product.finalAmount !== undefined ? formatAmountWithSymbolAfter(product.finalAmount) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}


            {/* Total */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {invoice.paymentDetails?.payableAmount !== undefined
                  ? formatAmountWithSymbolAfter(invoice.paymentDetails.payableAmount)
                  : invoice.paymentDetails?.finalAmount !== undefined
                  ? formatAmountWithSymbolAfter(invoice.paymentDetails.finalAmount)
                  : 'N/A'}
              </Text>
            </View>


            {/* Generate Invoice Button */}
            <TouchableOpacity
              style={styles.invoiceBtn}
              onPress={() => navigation.navigate('bill-page', { invoice })}
            >
              <View style={styles.invoiceBtnContent}>
                <Text style={styles.invoiceBtnText}>Generate Invoice</Text>
                <Image
                  source={require('../../assets/downloadicon.png')}
                  style={styles.downloadIcon}
                />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};


export default InvoiceModal;


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.94,
    maxHeight: height * 0.85,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 30,
    position: 'relative',
  },
  scrollContentContainer: {
    paddingBottom: 24,
  },
  closeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  editBtn: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 13,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  editBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  editText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    marginRight: 6,
    marginTop: 3,
  },
  editIcon: {
    width: 14,
    height: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    width: 90,
    fontSize: 15,
  },
  infoText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  value: {
    color: '#aaa',
    fontFamily: 'Poppins-Medium',
    flex: 1,
    fontSize: 15,
  },
  productsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    marginTop: 10,
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  productBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  productName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginBottom: 10,
    color: Colors.PRIMARY,
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productDetailColumn: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#000',
  },
  totalContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 14,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 22,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    width: 90,
  },
  totalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#444',
    flex: 1,
    textAlign: 'left',
  },
  invoiceBtn: {
    backgroundColor: 'red',
    paddingVertical: 13,
    borderRadius: 6,
    marginTop: 24,
    alignItems: 'center',
  },
  invoiceBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    marginRight: 6,
    marginTop: 3,
  },
  downloadIcon: {
    width: 14,
    height: 14,
  },
});