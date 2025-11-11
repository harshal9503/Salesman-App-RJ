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

const CustomOrderModalComplete = ({ visible, onClose, invoice}) => {
  const navigation = useNavigation();
  
if(invoice){
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
              onPress={() => navigation.navigate('custom-order', { id: invoice._id })}
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
            <Text style={styles.title}>{invoice.productDetails[0].productName}</Text>


            {/* Detail Items */}
            {[
             {label: 'Date', value:invoice.invoiceDetails.date?.slice(0, 10)},
              { label: 'Name:', value: invoice.customerDetails.customerNameEng },
              { label: 'Contact', value: invoice.customerDetails.mobileNumber },
              { label: 'Address', value: invoice.customerDetails.address},
              {label: 'Product', value: invoice.productDetails[0].productName},
              {label: 'Purity', value:invoice.productDetails[0].purity},
              {label: 'Status', value: 'Custom Order', color:'green'},
              {label: 'Expected Delivery Date', value:invoice.productDetails[0].expectedDeliveryDate?.slice(0, 10)},
              {label: 'Expected Amount', value:invoice.productDetails[0].expectedAmount},
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
              <Text style={styles.totalValue}>₹{invoice.paymentDetails.totalAmount}</Text>
            </View>

            {/* Generate Invoice Button */}
            <TouchableOpacity
              style={styles.invoiceBtn}
              onPress={() => navigation.navigate('custom-invoice-bill', {invoice})}
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
}
};

export default CustomOrderModalComplete;

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
    fontFamily:'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontFamily:'Poppins-SemiBold',
    color: '#000',
    width: 90,
    fontSize: 13,
  },
  value: {
    color: '#aaa',
    fontFamily:'Poppins-Medium',
    flex: 1,
    textAlign: 'left',
    fontSize: 13,
  },
  totalLabel: {
    fontFamily:'Poppins-SemiBold',
    fontSize: 20,
    color: '#000',
    width: 90,
  },
  totalValue: {
    fontFamily:'Poppins-SemiBold',
    fontSize: 20,
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
    fontFamily:'Poppins-Bold',
    fontSize: 15,
    marginRight: 6,
    marginTop:3
  },
  downloadIcon: {
    width: 14,
    height: 14,
  },
  topInfo: {
    fontSize: 15,
    fontFamily:'Poppins-SemiBold',
    color: 'blue',
    textAlign: 'center',
    marginBottom: 20,
  },
});
