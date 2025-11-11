import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';

export default function ProductInvoice() {
  const [mini, setMini] = useState(false);
  const [form, setForm] = useState({
    type: '',
    tagnumber: '',
    productname: '',
    remark: '',
    purity: '',
    piece: '',
    gross: '',
    net: '',
    less: '',
    rate: '',
    value: '',
    stonerate: '',
    lobour: '',
    lobourrupee: '',
    finalamount: '',
    addition: '',
    discount: '',
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = () => {
    console.log('Form submitted:', form);
    // validation or API call here
  };

  return (
    <>
      <View>
        <View style={styles.section}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={styles.sectionTitle}>Product 1</Text>
            <TouchableOpacity style={styles.crossIcon}>
              <Image
                source={require('../../assets/crosscircle.png')}
                style={styles.crossImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.productBox1}>
            <Text style={styles.topLeft}>Type: Sale</Text>
            <Text style={styles.topRight}>Name: Gold Ring</Text>
            <Text style={styles.bottomLeft}>Purity: 22K</Text>
            <Text style={styles.bottomRight}>Amount: ₹25000</Text>
          </View>

          <View style={styles.separator} />
        </View>

        <View>
          <TouchableOpacity style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Product 2</Text>
            <Image
              source={require('../../assets/dropdownicon.png')}
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>

          {/* Inputs */}
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Sales/Purchase"
                placeholderTextColor="#777"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tag number</Text>
              <TextInput
                style={styles.input}
                placeholder="08.34"
                keyboardType="numeric"
                placeholderTextColor="#777"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jhunki"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Remark</Text>
            <TextInput
              style={styles.input}
              placeholder="Jhunki"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Purity</Text>
              <TextInput
                style={styles.input}
                placeholder="22K"
                placeholderTextColor="#777"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Piece</Text>
              <TextInput
                style={styles.input}
                placeholder="01"
                keyboardType="numeric"
                placeholderTextColor="#777"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gross Wt.(In Gm)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.8"
                placeholderTextColor="#777"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Net Wt.(In Gm)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.4"
                keyboardType="numeric"
                placeholderTextColor="#777"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Less Wt.(In Gm)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.4"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rate(In Gm)</Text>
            <TextInput
              style={styles.input}
              placeholder="9800.00"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Value(Net Wt. * Rate)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.4"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Stone rate</Text>
              <TextInput
                style={styles.input}
                placeholder="0.8"
                placeholderTextColor="#777"
              />
            </View>
            <View style={styles.inputContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={styles.label}>
                  Labour charge({mini ? 'Gm' : '%'})
                </Text>
                <TouchableOpacity
                  style={styles.minibtn}
                  onPress={() => setMini(!mini)}
                >
                  <Text style={styles.minibtnText}>
                    {mini ? 'In Gram' : 'In Weight'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="0.4"
                keyboardType="numeric"
                placeholderTextColor="#777"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Labour charge(In ₹) </Text>
            <TextInput
              style={styles.input}
              placeholder="₹1200.00"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Final Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="₹40,400.00"
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Addition</Text>
              <TextInput
                style={styles.input}
                placeholder="₹5,500.00"
                placeholderTextColor="#777"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Discount</Text>
              <TextInput
                style={styles.input}
                placeholder="₹500.00"
                keyboardType="numeric"
                placeholderTextColor="#777"
              />
            </View>
          </View>

          <View style={styles.separator} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: hp('2.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Poppins-Medium',
    color: Colors.BTNRED,
    marginBottom: hp('1%'),
  },
  crossIcon: {
    position: 'absolute',
    top: -hp('0.5%'),
    right: wp('2%'),
  },
  crossImage: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    marginLeft: wp('1%'),
  },
  productBox1: {
    padding: wp('2.5%'),
  },
  topLeft: {
    position: 'absolute',
    top: -hp('2.7%'),
    left: 0,
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  topRight: {
    position: 'absolute',
    top: -hp('2.7%'),
    right: wp('3%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: -hp('0.8%'),
    left: 0,
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  bottomRight: {
    position: 'absolute',
    bottom: -hp('0.8%'),
    right: wp('3%'),
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-Medium',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.BTNRED,
    marginVertical: hp('2%'),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  inputContainer: {
    flex: 1,
    marginBottom: hp('1%'),
  },
  label: {
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  input: {
    height: hp('5%'),
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: wp('2.5%'),
    borderRadius: wp('1.5%'),
    fontSize: wp('3.3%'),
    fontFamily: 'Poppins-Medium',
    marginBottom: hp('1%'),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: wp('3%'),
  },
  dropdownIcon: {
    width: wp('4.5%'),
    height: hp('1.2%'),
  },
  minibtn: {
    height: 15,
    borderWidth: 0.5,
    borderColor: Colors.BTNRED,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    marginTop: 3,
  },
  minibtnText: {
    fontSize: 8,
    color: Colors.BTNRED,
  },
});
