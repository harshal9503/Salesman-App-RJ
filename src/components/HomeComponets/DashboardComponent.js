import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import { baseUrl } from '../../api/baseurl';

const { width } = Dimensions.get('window');

const DashboardComponent = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const currDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('deshboard data home check');
      try {
        const response = await axios.get(
          `${baseUrl}/salesman/salesman-dashboard/${currDate}`,
        );
        setDashboardData(response.data);
        console.log('deshboard data home', response.data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderSection = (title, color, cash, upi, pending, total) => {
    return (
      <View style={styles.sectionContainer}>
        <View style={[styles.titleContainer, { backgroundColor: color }]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <View style={styles.totalAmountRow}>
          <Image
            source={require('../../assets/HomeImg/coin.png')}
            style={styles.iconImage}
          />
          <Text style={styles.totalAmount}> ₹{total}</Text>
        </View>

        <View style={styles.paymentRow}>
          <View style={[styles.paymentBox, { borderColor: color }]}>
            <Text style={styles.paymentTitle}>Cash</Text>
            <Text style={styles.paymentValue}>₹{cash}</Text>
          </View>
          <View style={[styles.paymentBox, { borderColor: color }]}>
            <Text style={styles.paymentTitle}>UPI</Text>
            <Text style={styles.paymentValue}>₹{upi}</Text>
          </View>
        </View>

        <View style={[styles.pendingBox, { borderColor: color }]}>
          <Text style={styles.pendingLabel}>Pending</Text>
          <Text style={styles.pendingValue}>₹{pending}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {dashboardData && (
        <>
          {renderSection(
            'Total Sale',
            Colors.PRIMARY,
            dashboardData.sales.cash,
            dashboardData.sales.upi,
            dashboardData.sales.pending,
            dashboardData.sales.total,
          )}
          {renderSection(
            'Total Repair',
            Colors.BTNRED,
            dashboardData.repairing.cash,
            dashboardData.repairing.upi,
            dashboardData.repairing.pending,
            dashboardData.repairing.total,
          )}
        </>
      )}
    </View>
  );
};

export default DashboardComponent;

const styles = StyleSheet.create({
  container: {
    padding: 5,
    backgroundColor: '#fff',
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingTop: 50,
  },
  titleContainer: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  titleText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },
  iconImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginLeft: 6,
    color: '#000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  paymentBox: {
    borderWidth: 1,
    borderRadius: 8,
    width: (width - 80) / 2,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  paymentTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#000',
  },
  paymentValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#000',
  },
  pendingBox: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
  },
  pendingLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#000',
  },
  pendingValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#000',
  },
});
