import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import { baseUrl } from '../../api/baseurl';
import PLRepairingModal from '../../modals/CreateInvoiceModal/PLRepairingModal';
import InvoiceModal from '../../modals/CreateInvoiceModal/InvoiceModal';
import downRed from '../../assets/dropdownicon.png';
import downGreen from '../../assets/greendrop.png';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARD_COLORS = {
  fullyPaid: '#c8f2d1',
  notPaid: '#fdd9d9',
  partiallyPaid: '#dfd8f9',
  default: '#f1d3d3',
};

const CustomOrderInvoiceScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [openSaleModal, setOpenSaleModal] = useState(false);
  const [openRepairModal, setOpenRepairModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [repairInvoices, setRepairInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState(null); // 'customerNameEng' | 'billNo' | 'finalAmount'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [selectedTab, setSelectedTab] = useState('Sale');
  const [cardColors, setCardColors] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchRepairInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/salesman/get-all-invoices`);
      const apiData = response.data.data || response.data;
      console.log('get all invoices', apiData);
      const updatedData = apiData.map(item => {
        // Example logic - currently hardcoded paid status as 'Completed'
        const paid = 'Completed';
        let cardColor = CARD_COLORS.default;
        if (paid === 'In-Progress') {
          cardColor = CARD_COLORS.partiallyPaid;
        } else if (paid === 'Completed') {
          cardColor = CARD_COLORS.fullyPaid;
        } else {
          cardColor = CARD_COLORS.notPaid;
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

  const fetchRepairInvoices = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/salesman/get-all-repair-invoices`,
      );
      console.log('get all repair invoices', response.data.repairingInvoice);
      setRepairInvoices(response.data.repairingInvoice);
    } catch (error) {
      console.error('Error fetching repairing:', error);
    }
  };

  const handleTabChange = tab => setSelectedTab(tab);

  const sortInvoices = data => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      let valA, valB;
      if (sortField === 'customerNameEng') {
        valA = a.customerDetails?.customerNameEng?.toLowerCase() || '';
        valB = b.customerDetails?.customerNameEng?.toLowerCase() || '';
      } else if (sortField === 'billNo') {
        valA = a.invoiceDetails?.billNo || '';
        valB = b.invoiceDetails?.billNo || '';
      } else if (sortField === 'finalAmount') {
        valA = Number(a.paymentDetails?.finalAmount) || 0;
        valB = Number(b.paymentDetails?.finalAmount) || 0;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  };

  const filteredInvoices = useMemo(() => {
    return sortInvoices(
      invoices.filter(inv => {
        const name = inv.customerDetails?.customerNameEng?.toLowerCase() || '';
        const voucher = String(inv.invoiceDetails?.voucherNo || '').toLowerCase();
        const amount = String(inv.paymentDetails?.totalAmount || '').toLowerCase();
        return (
          name.includes(searchText.toLowerCase()) ||
          voucher.includes(searchText.toLowerCase()) ||
          amount.includes(searchText.toLowerCase())
        );
      }),
    );
  }, [invoices, searchText, sortField, sortOrder]);

  const handleInvoicePress = invoice => {
    setSelectedInvoice(invoice);
    if (invoice.color === CARD_COLORS.fullyPaid) {
      setOpenSaleModal(true);
    } else {
      setOpenRepairModal(true);
    }
  };

  const handleStatusChange = async (id, status) => {
    setCardColors(prevColors => {
      const updatedColors = {
        ...prevColors,
        [id]: status === 'deliver' ? CARD_COLORS.fullyPaid : CARD_COLORS.notPaid,
      };
      AsyncStorage.setItem('cardColors', JSON.stringify(updatedColors)).catch(
        err => console.error('Error saving card colors:', err),
      );
      return updatedColors;
    });
    setOpenDropdownId(null);
  };

  useEffect(() => {
    const loadColors = async () => {
      try {
        const savedColors = await AsyncStorage.getItem('cardColors');
        if (savedColors) {
          setCardColors(JSON.parse(savedColors));
        }
      } catch (err) {
        console.error('Error loading card colors:', err);
      }
    };
    loadColors();
  }, []);

  const filteredRepairInvoices = useMemo(() => {
    return repairInvoices.filter(inv => {
      const name = inv.customerDetails?.customerNameEng?.toLowerCase() || '';
      const voucher = String(inv.invoiceDetails?.voucherNo || '').toLowerCase();
      const amount = String(inv.paymentDetails?.payableAmount || '').toLowerCase();
      return (
        name.includes(searchText.toLowerCase()) ||
        voucher.includes(searchText.toLowerCase()) ||
        amount.includes(searchText.toLowerCase())
      );
    });
  }, [repairInvoices, searchText]);

  return (
    <View style={styles.container}>
      <View style={styles.statusBarBackground} />
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
        <Text style={styles.headerTitle}> INVOICE</Text>
      </View>

      <View style={styles.tabContainer}>
        {['Sale', 'Repair'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
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
          placeholder="Search by Name, Bill No. or Amount"
          placeholderTextColor="#777"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.tableHeader}>
        {['customerNameEng', 'billNo', 'finalAmount'].map(field => (
          <TouchableOpacity
            key={field}
            style={{ flexDirection: 'row', gap: 1 }}
            onPress={() => {
              setSortField(field);
              setSortOrder(
                sortField === field && sortOrder === 'asc' ? 'desc' : 'asc',
              );
            }}
          >
            <Text style={styles.tableHeaderText}>
              {field === 'customerNameEng'
                ? 'C Name'
                : field === 'billNo'
                ? 'Bill no.'
                : 'Amount'}
            </Text>
            <Image
              source={require('../../assets/doublearrow.png')}
              style={{
                width: wp('2.5%'),
                height: hp('1%'),
                marginTop: hp('0.5%'),
              }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {selectedTab === 'Sale' ? (
        <ScrollView style={styles.scrollArea}>
          {filteredInvoices.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: hp('5%') }}>
              <Text
                style={{
                  fontSize: wp('4%'),
                  fontFamily: 'Poppins-Medium',
                  color: '#777',
                }}
              >
                No invoices found
              </Text>
            </View>
          ) : (
            filteredInvoices.map(inv => (
              <TouchableOpacity
                key={inv._id}
                onPress={() => handleInvoicePress(inv)}
              >
                <View
                  style={[styles.invoiceCard, { backgroundColor: inv.color }]}
                >
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
                    <View style={{ alignItems: 'flex-start' }}>
                      <Text style={styles.billText}>
                        {inv.invoiceDetails.billNo}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-start' }}>
                      <Text style={styles.amountText}>
                        ₹{inv.paymentDetails.totalPaid}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollArea}>
          {filteredRepairInvoices.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: hp('5%') }}>
              <Text
                style={{
                  fontSize: wp('4%'),
                  fontFamily: 'Poppins-Medium',
                  color: '#777',
                }}
              >
                No invoices found
              </Text>
            </View>
          ) : (
            filteredRepairInvoices.map(inv => (
              <TouchableOpacity
                key={inv._id}
                onPress={() => handleInvoicePress(inv)}
              >
                <View
                  style={[
                    styles.invoiceCard,
                    {
                      backgroundColor:
                        cardColors[inv._id] === CARD_COLORS.notPaid
                          ? '#e7c8c8'
                          : '#bbebc6',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setOpenDropdownId(
                        openDropdownId === inv._id ? null : inv._id,
                      )
                    }
                    style={[
                      styles.minibtn,
                      {
                        borderWidth: 1,
                        borderColor:
                          cardColors[inv._id] === CARD_COLORS.notPaid
                            ? '#fc0101ff'
                            : '#10e83fff',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.minibtntext,
                        {
                          color:
                            cardColors[inv._id] === CARD_COLORS.notPaid
                              ? '#fc0101ff'
                              : '#10e83fff',
                        },
                      ]}
                    >
                      {cardColors[inv._id] === CARD_COLORS.notPaid
                        ? 'Pen'
                        : 'Del'}
                    </Text>
                    <Image
                      source={
                        cardColors[inv._id] === CARD_COLORS.notPaid
                          ? downRed
                          : downGreen
                      }
                      style={[styles.downImg]}
                    />
                  </TouchableOpacity>
                  <View style={styles.invoiceCardInner}>
                    <View>
                      <Text style={styles.dateText}>
                        {inv.invoiceDetails.date.slice(0, 10)}
                      </Text>
                      <Text style={styles.nameText}>
                        {inv.customerDetails.customerNameEng}
                      </Text>
                      <Text style={styles.phoneText}>
                        +91{inv.customerDetails.mobileNumber}
                      </Text>
                    </View>
                    <Text style={styles.billText}>RJ-001</Text>
                    <Text style={styles.amountText}>
                      ₹{inv.paymentDetails.payableAmount}
                    </Text>
                  </View>
                </View>
                {openDropdownId === inv._id && (
                  <View style={[styles.dropdownContainer]}>
                    <TouchableOpacity
                      onPress={() => handleStatusChange(inv._id, 'deliver')}
                    >
                      <Text style={styles.dropdownOption}>Deliver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleStatusChange(inv._id, 'pending')}
                    >
                      <Text style={styles.dropdownOption}>Pending</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('create-invoice')}
        >
          <Text style={styles.createBtnText}>Create Invoice +</Text>
        </TouchableOpacity>
      </View>

      {/* Display the invoice modal with selected invoice details */}
      <InvoiceModal
        visible={openSaleModal}
        onClose={() => setOpenSaleModal(false)}
        invoice={selectedInvoice}
        type="Sale"
      />
      <PLRepairingModal
        visible={openRepairModal}
        onClose={() => setOpenRepairModal(false)}
        invoice={selectedInvoice}
        type="Repair"
      />
    </View>
  );
};

export default CustomOrderInvoiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusBarBackground: {
    height: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.PRIMARY,
    width: '100%',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingBottom: wp('3%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2%'),
  },
  headerTitle: { fontSize: wp('4.2%'), fontFamily: 'Poppins-Bold', color: '#000' },
  searchInput: {
    margin: wp('4%'),
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: wp('2%'),
    paddingLeft: wp('13%'),
    color: '#000',
    fontFamily: 'Poppins-Regular',
    height: wp('9%'),
    paddingVertical: 0,
    textAlignVertical: 'center',
    justifyContent: 'center',
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
  scrollArea: { flex: 1 },
  invoiceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
    justifyContent: 'space-between',
    width: '86%',
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('4%'),
    marginVertical: hp('0.5%'),
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
    backgroundColor: '#f5f5f5',
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
  phoneText: { fontSize: wp('2.5%'), color: '#555', fontFamily: 'Poppins-Medium' },
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
  footer: { padding: wp('3%'), backgroundColor: '#fff' },
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    color: Colors.PRIMARY,
    fontFamily: 'Poppins-SemiBold',
  },
  activeTabText: {
    color: '#fff',
  },
  minibtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    gap: 6,
    width: 35,
    height: 16,
    marginLeft: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  downImg: { width: 7, height: 4 },
  minibtntext: {
    fontSize: 8,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 40,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    zIndex: 999,
    elevation: 10,
  },
  dropdownOption: {
    paddingVertical: 5,
    fontSize: 14,
    color: '#000',
  },
});
