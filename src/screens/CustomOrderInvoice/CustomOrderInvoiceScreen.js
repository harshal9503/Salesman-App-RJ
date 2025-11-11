import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import { baseUrl } from '../../api/baseurl';
import CustomOrderModalComplete from '../../modals/CustomOrderModals/CustomOrderModalComplete';
import CustomOrderModalPending from '../../modals/CustomOrderModals/CustomOrderInvoicePending';
import CustomOrderModalLetter from '../../modals/CustomOrderModals/CustomOrderInvoiceLetter';

const CustomOrderInvoiceScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [openSaleModal, setOpenSaleModal] = useState(false);
  const [openRepairModal, setOpenRepairModal] = useState(false);
  const [openPendingModal, setOpenPendingModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState(null); // 'name' | 'voucher' | 'amount'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      console.log('datadata');
      const response = await axios.get(
        `${baseUrl}/salesman/get-all-custom-orders`,
      );

      // 👉 Adjust according to API structure
      const apiData = response.data.data || response.data;

      console.log('datadata', apiData);

      // ✅ Set color based on pending vs totalAmount
      const updatedData = apiData.repairingInvoice.map(item => {
        let cardColor = '#fdd9d9'; // default purple

        const pending = Number(item.paymentDetails?.pending) || 0;
        const total = Number(item.paymentDetails?.totalAmount) || 0;

        if (pending === 0) {
          cardColor = '#c8f2d1'; // green (fully paid)
          console.log('green', cardColor);
        } else if (pending === total) {
          cardColor = '#fdd9d9'; // red (not paid at all)
          console.log('red', cardColor);
        } else {
          cardColor = '#dfd8f9'; // purple (partially paid)
          console.log('purple', cardColor);
        }

        return {
          ...item,
          color: cardColor,
        };
      });

      setInvoices(updatedData.reverse());
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortInvoices = data => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let valA, valB;

      if (sortField === 'name') {
        valA = a.customerDetails.customerNameEng?.toLowerCase() || '';
        valB = b.customerDetails.customerNameEng?.toLowerCase() || '';
      } else if (sortField === 'voucher') {
        valA = a.invoiceDetails.voucherNo || '';
        valB = b.invoiceDetails.voucherNo || '';
      } else if (sortField === 'amount') {
        valA = Number(a.paymentDetails.totalAmount) || 0;
        valB = Number(b.paymentDetails.totalAmount) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredInvoices = sortInvoices(
    invoices.filter(inv => {
      const name = inv.customerDetails?.customerNameEng?.toLowerCase() || '';
      const voucher = String(inv.invoiceDetails?.voucherNo || '').toLowerCase();
      const amount = String(
        inv.paymentDetails?.totalAmount || '',
      ).toLowerCase();

      return (
        name.includes(searchText.toLowerCase()) ||
        voucher.includes(searchText.toLowerCase()) ||
        amount.includes(searchText.toLowerCase())
      );
    }),
  );

  const handleInvoicePress = invoice => {
    setSelectedInvoice(invoice);

    console.log('check', invoice);

    if (invoice.color === '#c8f2d1') {
      setOpenSaleModal(true);
    } else if (invoice.color === '#fdd9d9') {
      setOpenRepairModal(true);
    } else {
      setOpenPendingModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ height: hp('5%'), backgroundColor: Colors.PRIMARY }} />
      <View style={styles.backButton}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={styles.backButtonTouch}
        >
          <Image
            source={require('../../assets/backarrow.png')}
            style={styles.backarrow}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Image
          source={require('../../assets/HomeImg/editicon.png')}
          style={{ width: wp('5%'), height: wp('5%') }}
        />
        <Text style={styles.headerTitle}>Custom order invoices</Text>
      </View>

      <View>
        <View
          style={{
            position: 'absolute',
            top: hp('2.8%'),
            left: wp('5%'),
            borderRightWidth: 1,
            borderColor: '#aaa',
            paddingHorizontal: wp('2%'),
          }}
        >
          <Image
            source={require('../../assets/searchicon.png')}
            style={{ width: wp('5%'), height: wp('5%') }}
          />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name, Voucher or Amount"
          placeholderTextColor="#777"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.tableHeader}>
        <TouchableOpacity
          style={{ flexDirection: 'row', gap: 1 }}
          onPress={() => {
            setSortField('name');
            setSortOrder(
              sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc',
            );
          }}
        >
          <Text style={styles.tableHeaderText}>C Name</Text>
          <Image
            source={require('../../assets/doublearrow.png')}
            style={{
              width: wp('2.5%'),
              height: hp('1%'),
              marginTop: hp('0.5%'),
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', gap: 1 }}
          onPress={() => {
            setSortField('voucher');
            setSortOrder(
              sortField === 'voucher' && sortOrder === 'desc' ? 'asc' : 'desc',
            );
          }}
        >
          <Text style={styles.tableHeaderText}>Voucher no.</Text>
          <Image
            source={require('../../assets/doublearrow.png')}
            style={{
              width: wp('2.5%'),
              height: hp('1%'),
              marginTop: hp('0.5%'),
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', gap: 1 }}
          onPress={() => {
            setSortField('amount');
            setSortOrder(
              sortField === 'amount' && sortOrder === 'asc' ? 'desc' : 'asc',
            );
          }}
        >
          <Text style={styles.tableHeaderText}>Amount</Text>
          <Image
            source={require('../../assets/doublearrow.png')}
            style={{
              width: wp('2.5%'),
              height: hp('1%'),
              marginTop: hp('0.5%'),
            }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea}>
        {filteredInvoices.length === 0 ? (
    <View style={{ alignItems: 'center', marginTop: hp('5%') }}>
      <Text style={{ fontSize: wp('4%'), fontFamily: 'Poppins-Medium', color: '#777' }}>
        No invoices found
      </Text>
    </View>
  ) : (filteredInvoices.map(inv => (
          <TouchableOpacity
            key={inv._id || index}
            onPress={() => handleInvoicePress(inv)}
          >
            <View style={[styles.invoiceCard, { backgroundColor: inv.color }]}>
              <View
                style={{
                  backgroundColor: 'yellow',
                  width: wp('0.9%'),
                  justifyContent: 'flex-end',
                  marginRight: wp('6%'),
                  height: hp('6%'),
                }}
              >
                <View
                  style={{
                    width: wp('0.9%'),
                    height: hp('0.3%'),
                    backgroundColor: 'red',
                  }}
                />
              </View>
              <View style={styles.invoiceCardInner}>
                {/* Left Part */}
                <View style={{ gap: 1 }}>
                  <Text style={styles.dateText}>
                    {inv.invoiceDetails.date?.slice(0, 10)}
                  </Text>
                  <Text style={styles.nameText}>
                    {inv.customerDetails.customerNameEng}
                  </Text>
                  <Text style={styles.phoneText}>
                    +91{inv.customerDetails.mobileNumber}
                  </Text>
                </View>

                {/* Middle Part */}
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={styles.billText}>
                    {inv.invoiceDetails.voucherNo}
                  </Text>
                </View>

                {/* Right Part */}
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={styles.amountText}>
                    ₹{inv.paymentDetails.totalAmount}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('custom-order')}
        >
          <Text style={styles.createBtnText}>Create Invoice +</Text>
        </TouchableOpacity>
      </View>

      <CustomOrderModalComplete
        visible={openSaleModal}
        onClose={() => setOpenSaleModal(false)}
        invoice={selectedInvoice}
        type="Sale"
      />

      <CustomOrderModalLetter
        visible={openRepairModal}
        onClose={() => setOpenRepairModal(false)}
        invoice={selectedInvoice}
        type="Repair"
      />

      <CustomOrderModalPending
        visible={openPendingModal}
        onClose={() => setOpenPendingModal(false)}
        invoice={selectedInvoice}
        type="Pending"
      />
    </View>
  );
};

export default CustomOrderInvoiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: wp('4%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  searchInput: {
    margin: wp('4%'),
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: wp('2%'),
    paddingLeft: wp('13%'),
    color: '#000',
    fontFamily: 'Poppins-Regular',
    height: wp('9%'),

    // ✅ Add these to align text vertically center
    paddingVertical: 0, // Avoid default padding interference
    textAlignVertical: 'center', // Android-specific
    justifyContent: 'center', // Optional, in case parent View matters
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
    backgroundColor: '#eee',
    paddingVertical: hp('1%'),
  },
  tableHeaderText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.2%'),
    marginLeft: wp('2%'),
    color: '#000',
  },
  scrollArea: {
    flex: 1,
  },
  invoiceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
    justifyContent: 'space-between',
    width: '92%',
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('4%'),
    marginVertical: hp('0.5%'),
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
    backgroundColor: '#f5f5f5', // sample default
  },
  dateText: {
    fontSize: wp('2.65%'),
    fontFamily: 'Poppins-Medium',
    color: Colors.BTNRED,
  },
  nameText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.4%'),
    color: '#000',
  },
  phoneText: {
    fontSize: wp('2.5%'),
    color: '#555',
    fontFamily: 'Poppins-Medium',
  },
  billText: {
    alignSelf: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  amountText: {
    alignSelf: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  footer: {
    padding: wp('3%'),
    backgroundColor: '#fff',
  },
  createBtn: {
    backgroundColor: Colors.PRIMARY,
    padding: wp('4%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    marginBottom: hp('5%'),
  },
  createBtnText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
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
  backButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
