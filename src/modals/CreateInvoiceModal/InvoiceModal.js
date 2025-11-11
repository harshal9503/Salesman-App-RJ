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

const { width } = Dimensions.get('window');

const InvoiceModal = ({ visible, onClose, invoice }) => {
  const navigation = useNavigation();
  console.log("Modal invoice", invoice);

  if (!invoice) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Image
              source={require('../../assets/modalclose.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('create-invoice')}
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
            <Text style={styles.title}>
              {invoice.productDetails?.[0]?.productName || 'N/A'}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.label}>Order</Text>
                <Text style={{ color: '#aaa', fontSize: 15, fontWeight: 'bold' }}>
                  {invoice.invoiceDetails?.billNo || 'N/A'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <Text style={{ marginLeft: 20, fontSize: 15, fontWeight: '800' }}>
                  Tag Id
                </Text>
                <Text style={{ color: '#aaa', fontSize: 15, fontWeight: 'bold' }}>
                  {invoice.productDetails?.[0]?.tagNo || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Detail Items */}
            {[
              {
                label: 'Name:',
                value: invoice.customerDetails?.customerNameEng || 'N/A',
              },
              {
                label: 'Contact:',
                value: invoice.customerDetails?.mobileNumber
                  ? `+91${invoice.customerDetails.mobileNumber}`
                  : 'N/A',
              },
              {
                label: 'Address:',
                value: invoice.customerDetails?.address || 'N/A',
              },
              {
                label: 'Product:',
                value: invoice.productDetails?.[0]?.productName || 'N/A',
              },
              {
                label: 'Gross Wt.:',
                value: invoice.productDetails?.[0]?.grossWeightInGrams ?? 'N/A',
              },
              {
                label: 'Net Wt.:',
                value: invoice.productDetails?.[0]?.netWeightInGrams ?? 'N/A',
              },
              {
                label: 'Status:',
                value: invoice.productDetails?.[0]?.customOrderStatus || 'N/A',
                color: '#0DC143',
                bold: true,
              },
              {
                label: 'Amount:',
                value:
                  invoice.productDetails?.[0]?.finalAmount !== undefined
                    ? `₹${invoice.productDetails[0].finalAmount}`
                    : 'N/A',
              },
            ].map((item, index) => (
              <View style={styles.detailContainer} key={index}>
                <Text style={styles.label}>{item.label}</Text>
                <Text
                  style={[
                    styles.value,
                    item.color && { color: item.color },
                    item.bold && { fontWeight: 'bold' },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
            ))}

            {/* Total */}
            <View style={styles.detailContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {invoice.paymentDetails?.finalAmount
                  ? `₹${invoice.paymentDetails.finalAmount}`
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
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 40,
    maxHeight: '90%',
    position: 'relative',
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
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    width: 90,
    fontSize: 15,
  },
  value: {
    color: '#aaa',
    fontFamily: 'Poppins-Medium',
    flex: 1,
    textAlign: 'left',
    fontSize: 15,
  },
  totalLabel: {
    fontSize: 22,
    color: '#000',
    width: 90,
    fontFamily: 'Poppins-SemiBold',
  },
  totalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#aaa',
    flex: 1,
    textAlign: 'left',
  },
  invoiceBtn: {
    backgroundColor: 'red',
    paddingVertical: 13,
    borderRadius: 6,
    marginTop: 16,
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
