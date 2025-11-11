import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const RepairInvoiceList = ({ invoices, onPressItem }) => {
  return (
    <ScrollView>
      {invoices.map(inv => (
        <TouchableOpacity key={inv.id} onPress={() => onPressItem(inv)}>
          <View style={[styles.invoiceCard, { backgroundColor: inv.color }]}>
            <View>
              <Text style={styles.dateText}>{inv.date}</Text>
              <Text style={styles.nameText}>{inv.name}</Text>
              <Text style={styles.phoneText}>{inv.phone}</Text>
            </View>
            <Text style={styles.billText}>{inv.billNo}</Text>
            <Text style={styles.amountText}>{inv.amount}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default RepairInvoiceList;

const styles = StyleSheet.create({
  invoiceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d00',
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  phoneText: {
    fontSize: 12,
    color: '#555',
  },
  billText: {
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  amountText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
});
