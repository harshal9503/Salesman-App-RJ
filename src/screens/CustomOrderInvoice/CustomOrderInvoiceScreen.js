import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
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
      const response = await axios.get(
        `${baseUrl}/salesman/get-all-custom-orders`,
      );

      const apiData = response.data.data || response.data;

      const updatedData = apiData.repairingInvoice.map(item => {
        let cardColor = '#fdd9d9'; // red (not paid at all)

        const pending = Number(item.paymentDetails?.pending) || 0;
        const total = Number(item.paymentDetails?.totalAmount) || 0;

        if (pending === 0) {
          cardColor = '#c8f2d1'; // green (fully paid)
        } else if (pending === total) {
          cardColor = '#fdd9d9'; // red (not paid at all)
        } else {
          cardColor = '#dfd8f9'; // purple (partially paid)
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

  const deleteInvoice = async (customOrderId) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this Invoice?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                const response = await axios.delete(
                  `${baseUrl}/salesman/delete-custom-orders-by-id/${customOrderId}`
                );
                setInvoices(prevInvoices =>
                  prevInvoices.filter(invoice => invoice._id !== customOrderId)
                );
                Alert.alert('Success', 'Invoice deleted successfully');
              } catch (error) {
                console.error('Error deleting invoice:', error);
                Alert.alert('Error', 'Failed to delete invoice');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in delete confirmation:', error);
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

    if (invoice.color === '#c8f2d1') {
      setOpenSaleModal(true);
    } else if (invoice.color === '#fdd9d9') {
      setOpenRepairModal(true);
    } else {
      setOpenPendingModal(true);
    }
  };

  // Helper function to format date to 'DD-MM-YYYY'
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const day = ('0' + dateObj.getDate()).slice(-2);
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
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
          style={styles.searchIconContainer}
        >
          <Image
            source={require('../../assets/searchicon.png')}
            style={styles.searchIcon}
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
          style={styles.tableHeaderItem}
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
            style={styles.sortIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tableHeaderItem}
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
            style={styles.sortIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tableHeaderItem}
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
            style={styles.sortIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {filteredInvoices.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: hp('5%') }}>
            <Text style={styles.noInvoicesText}>
              No invoices found
            </Text>
          </View>
        ) : (filteredInvoices.map((inv, index) => (
          <View key={inv._id || index} style={styles.invoiceCardContainer}>
            <TouchableOpacity
              onPress={() => handleInvoicePress(inv)}
              style={styles.invoiceTouchable}
              activeOpacity={0.8}
            >
              <View style={[styles.invoiceCard, { backgroundColor: inv.color }]}>
                <View style={styles.sideBar}>
                  <View style={styles.sideBarInner} />
                </View>

                <View style={styles.invoiceCardInner}>
                  {/* Left Part */}
                  <View style={styles.leftPart}>
                    <Text style={styles.dateText}>
                      {formatDate(inv.invoiceDetails.date)}
                    </Text>
                    <Text style={styles.nameText}>
                      {inv.customerDetails.customerNameEng}
                    </Text>
                    <Text style={styles.phoneText}>
                      +91{inv.customerDetails.mobileNumber}
                    </Text>
                  </View>

                  {/* Middle Part */}
                  <View style={styles.middlePart}>
                    <Text style={styles.billText}>
                      {inv.invoiceDetails.voucherNo}
                    </Text>
                  </View>

                  {/* Right Part */}
                  <View style={styles.rightPart}>
                    <Text style={styles.amountText}>
                      ₹{inv.paymentDetails.totalAmount}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteInvoice(inv._id)}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../assets/delete.png')}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          </View>
        )))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('custom-order')}
          activeOpacity={0.8}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'),
    backgroundColor: '#fff',
    paddingHorizontal: wp('3%'),
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
  header: {
    paddingHorizontal: wp('4%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2%'),
    height: hp('6%'),
  },
  headerTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  searchIconContainer: {
    position: 'absolute',
    top: hp('2.8%'),
    left: wp('5%'),
    borderRightWidth: 1,
    borderColor: '#aaa',
    paddingHorizontal: wp('2%'),
    height: hp('5.5%'),
    justifyContent: 'center',
  },
  searchIcon: {
    width: wp('5%'),
    height: wp('5%'),
  },
  searchInput: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2.5%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: wp('2%'),
    paddingLeft: wp('13%'),
    color: '#000',
    fontFamily: 'Poppins-Regular',
    height: hp('5.5%'),
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eee',
    paddingVertical: hp('1.5%'),
  },
  tableHeaderItem: {
    width: wp('28%'), // square width based on screen width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.2%'),
  },
  tableHeaderText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.2%'),
    color: '#000',
  },
  sortIcon: {
    width: wp('2.5%'),
    height: hp('1%'),
    resizeMode: 'contain',
    marginTop: hp('0.5%'),
  },
  scrollArea: {
    flex: 1,
  },
  invoiceCardContainer: {
    position: 'relative',
    marginHorizontal: wp('4%'),
    marginVertical: hp('0.6%'),
  },
  invoiceTouchable: {
    flex: 1,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp('1.5%'),
    paddingVertical: hp('1.2%'),
    paddingRight: wp('3%'),
    backgroundColor: '#f5f5f5',
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sideBar: {
    backgroundColor: 'yellow',
    width: wp('0.9%'),
    justifyContent: 'flex-end',
    marginRight: wp('5%'),
    height: hp('6%'),
    borderRadius: wp('0.4%'),
    overflow: 'hidden',
  },
  sideBarInner: {
    width: wp('0.9%'),
    height: hp('0.3%'),
    backgroundColor: 'red',
  },
  invoiceCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  leftPart: {
    width: wp('28%'),
    justifyContent: 'center',
    gap: hp('0.22%'),
  },
  middlePart: {
    width: wp('28%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPart: {
    width: wp('28%'),
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  amountText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.5%'),
    color: '#000',
  },
  deleteButton: {
    position: 'absolute',
    top: hp('0.5%'),
    right: wp('1.5%'),
    zIndex: 10,
    padding: wp('1%'),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: wp('2%'),
  },
  deleteIcon: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    resizeMode: 'contain',
    tintColor: '#ff3b30',
  },
  footer: {
    padding: wp('3%'),
    backgroundColor: '#fff',
  },
  createBtn: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    marginBottom: hp('5%'),
  },
  createBtnText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Bold',
  },
  noInvoicesText: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Medium',
    color: '#777',
  },
});
