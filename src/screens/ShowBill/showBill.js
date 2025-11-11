import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';

const ShowBill = ({ navigation, route }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(dimensions.width > dimensions.height);

  const { billData: invoice } = route.params;

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

  // Use minimum dimension for consistent cell width across orientations
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
      // For "Amount" column, show only integer part (no decimals)
      if (item.type === 'Purchase') {
        if (!amount || amount === 0) {
          const rateVal = parseFloat(item.ratePerGram) || 0;
          // Show negative sign for purchase amounts/rates
          return rateVal > 0 ? `-${Math.floor(rateVal)}` : '';
        } else {
          return amount > 0 ? `-${Math.floor(amount)}` : '';
        }
      }
      return amount > 0 ? `${Math.floor(amount)}` : '';
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
  const hasAnyPayment = hasCashPayment || hasUPIPayment;
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
        <View style={styles.estimateContainer}>
          <Text style={styles.estimateText}>ESTIMATE</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.boldTextNoMargin}>
                  Bill No. {invoice.invoiceDetails.billNo}
                </Text>
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
                  {Math.abs(Math.floor(parseFloat(totals.grandTotal)))}
                </Text>
              </View>
            </View>
            {hasCashPayment && (
              <>
                <View style={[styles.tableRow, styles.paymentRow, styles.noBottomBorder]}>
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
                        borderRightWidth: 0,
                        borderColor: '#888',
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text style={styles.footerAmount}>
                      {Math.floor(parseFloat(invoice.paymentDetails?.cash) || 0)}
                    </Text>
                  </View>
                </View>
                {!hasUPIPayment && (
                  <View style={[styles.tableRow, styles.separationLine]}>
                    <View style={[styles.footerCell, { width: calculateCellWidth(100) }]} />
                  </View>
                )}
              </>
            )}
            {hasUPIPayment && (
              <>
                <View style={[styles.tableRow, styles.paymentRow, styles.noBottomBorder]}>
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
                        borderRightWidth: 0,
                        borderColor: '#888',
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text style={styles.footerAmount}>
                      {Math.floor(parseFloat(invoice.paymentDetails?.upi) || 0)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.separationLine]}>
                  <View style={[styles.footerCell, { width: calculateCellWidth(100) }]} />
                </View>
              </>
            )}
            <View style={[styles.tableRow, styles.netAmountRow, styles.noBottomBorder]}>
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
                    borderRightWidth: 0,
                    borderColor: '#888',
                    borderBottomWidth: 0,
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
                  {isFullyPaid ? 'NIL' : `₹${Math.floor(parseFloat(totals.netAmount))}`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
    marginTop: hp('4.5%'),
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
    paddingBottom: hp('2%'),
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
    paddingBottom: 0,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderColor: '#888',
    paddingLeft: wp('2%'),
    paddingRight: wp('2%'),
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
  separationLine: {
    borderBottomWidth: 1,
    borderColor: '#888',
    height: hp('0.2%'),
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
  },
  netAmountRow: {
    height: hp('2.2%'),
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
    borderRightWidth: 1,
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
  noBottomBorder: {
    borderBottomWidth: 0,
  },
});

export default ShowBill;
