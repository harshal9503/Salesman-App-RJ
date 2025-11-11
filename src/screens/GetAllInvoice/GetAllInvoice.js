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
  Alert,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

import InvoiceModal from '../../modals/CreateInvoiceModal/InvoiceModal';
import PLRepairingModal from '../../modals/CreateInvoiceModal/PLRepairingModal';

const CARD_COLORS = {
  fullyPaid: '#c8f2d1',
  notPaid: '#fdd9d9',
  partiallyPaid: '#dfd8f9',
  default: '#f1d3d3',
};

// Helper to format date as DD-MM-YYYY
const formatDate = isoDate => {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d)) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const CustomOrderInvoiceScreen = ({ navigation, route }) => {
  const [searchText, setSearchText] = useState('');
  const [openSaleModal, setOpenSaleModal] = useState(false);
  const [openRepairModal, setOpenRepairModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [repairInvoices, setRepairInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTab, setSelectedTab] = useState('Sale');
  const [cardColors, setCardColors] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    if (route.params?.showRepairTab) {
      setSelectedTab('Repair');
    }
    if (route.params?.refresh) {
      fetchInvoices();
      fetchRepairInvoices();
    }
  }, [route.params]);

  useEffect(() => {
    fetchInvoices();
    fetchRepairInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://rajmanijewellers.in/api/salesman/get-all-invoices');
      const apiData = response.data.data || response.data;
      const updatedData = apiData.map(item => {
        const paid = item.status || 'Completed';
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
      const response = await axios.get('https://rajmanijewellers.in/api/salesman/get-all-repair-invoices');
      const apiData = response.data.repairingInvoice || [];
      setRepairInvoices(apiData.reverse());
    } catch (error) {
      console.error('Error fetching repairing invoices:', error);
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
        valA = a.orderNumber || '';
        valB = b.orderNumber || '';
      } else if (sortField === 'finalAmount') {
        valA = Number(a.paymentDetails?.payableAmount) || 0;
        valB = Number(b.paymentDetails?.payableAmount) || 0;
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
        const orderNumber = String(inv.orderNumber || '').toLowerCase();
        const amount = String(inv.paymentDetails?.payableAmount || '').toLowerCase();
        return (
          name.includes(searchText.toLowerCase()) ||
          orderNumber.includes(searchText.toLowerCase()) ||
          amount.includes(searchText.toLowerCase())
        );
      }),
    );
  }, [invoices, searchText, sortField, sortOrder]);

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

  const handleInvoicePress = invoice => {
    setSelectedInvoice(invoice);
    if (selectedTab === 'Sale') {
      setOpenSaleModal(true);
    } else {
      setOpenRepairModal(true);
    }
  };

  const deleteSaleInvoice = async (invoiceId) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this Sale Invoice?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await axios.delete(`https://rajmanijewellers.in/api/salesman/delete-invoice-by-id/${invoiceId}`);
                setInvoices(prev => prev.filter(i => i._id !== invoiceId));
                Alert.alert('Success', 'Invoice deleted successfully');
              } catch (error) {
                console.error('Error deleting sale invoice:', error);
                Alert.alert('Error', 'Failed to delete sale invoice');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Delete confirmation error:', error);
    }
  };

  const deleteRepairInvoice = async (repairInvoiceId) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this Repair Invoice?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await axios.delete(`https://rajmanijewellers.in/api/salesman/delete-repair-invoice-by-id/${repairInvoiceId}`);
                setRepairInvoices(prev => prev.filter(i => i._id !== repairInvoiceId));
                Alert.alert('Success', 'Repair invoice deleted successfully');
              } catch (error) {
                console.error('Error deleting repair invoice:', error);
                Alert.alert('Error', 'Failed to delete repair invoice');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Delete confirmation error:', error);
    }
  };

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
              <View key={inv._id} style={styles.invoiceCardContainer}>
                <TouchableOpacity
                  onPress={() => handleInvoicePress(inv)}
                  style={styles.invoiceTouchable}
                  activeOpacity={0.8}
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
                      <View style={{ gap: 1 }}>
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
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={styles.billText} numberOfLines={1} adjustsFontSizeToFit>
                          {inv.orderNumber || 'N/A'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={styles.amountText}>
                          ₹{Math.floor(inv.paymentDetails?.payableAmount || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSaleInvoice(inv._id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../assets/delete.png')}
                    style={styles.deleteIcon}
                  />
                </TouchableOpacity>
              </View>
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
                No repair invoices found
              </Text>
            </View>
          ) : (
            filteredRepairInvoices.map(inv => {
              const color =
                cardColors[inv._id] === CARD_COLORS.fullyPaid
                  ? CARD_COLORS.fullyPaid
                  : CARD_COLORS.notPaid;
              return (
                <View key={inv._id} style={styles.invoiceCardContainer}>
                  <TouchableOpacity
                    onPress={() => handleInvoicePress(inv)}
                    style={styles.invoiceTouchable}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.invoiceCard, { backgroundColor: color }]}>
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
                            {formatDate(inv.invoiceDetails.date)}
                          </Text>
                          <Text style={styles.nameText}>
                            {inv.customerDetails.customerNameEng}
                          </Text>
                          <Text style={styles.phoneText}>
                            +91{inv.customerDetails.mobileNumber}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-start' }}>
                          <Text style={styles.billText} numberOfLines={1} adjustsFontSizeToFit>
                            {inv.orderNumber || 'N/A'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-start' }}>
                          <Text style={styles.amountText}>
                            ₹{Math.floor(inv.paymentDetails?.payableAmount || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteRepairInvoice(inv._id)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require('../../assets/delete.png')}
                      style={styles.deleteIcon}
                    />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() =>
            selectedTab === 'Sale'
              ? navigation.navigate('create-invoice')
              : navigation.navigate('repairing-screen')
          }
        >
          <Text style={styles.createBtnText}>Create Invoice +</Text>
        </TouchableOpacity>
      </View>

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
    fontSize: wp('4%'),
    color: '#000',
    maxWidth: wp('20%'),
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
  deleteButton: {
    position: 'absolute',
    top: hp('0.9%'),
    right: wp('5.5%'),  // shifted more left from 1.5% to 4%
    zIndex: 10,
    padding: wp('1%'),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: wp('2%'),
  },
  deleteIcon: {
    width: wp('4.3%'),
    height: wp('4.3%'),
    resizeMode: 'contain',
    tintColor: '#ff3b30',
  },
});
