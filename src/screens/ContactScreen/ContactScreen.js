import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const ContactScreen = ({ navigation }) => {
  // Helper to clean phone number string for URL
  const cleanPhoneNumber = (phone) => phone.replace(/[^0-9+]/g, '');

  // Open phone dialer with fallback alert
  const handlePhonePress = (phoneNumber) => {
    const telUrl = `tel:${cleanPhoneNumber(phoneNumber)}`;
    Linking.openURL(telUrl).catch(() =>
      Alert.alert(
        'Error',
        'Unable to open phone dialer on this device',
        [{ text: 'OK' }],
        { cancelable: false }
      )
    );
  };

  // Open email client with fallback alert
  const handleEmailPress = (email) => {
    const mailUrl = `mailto:${email}`;
    Linking.openURL(mailUrl).catch(() =>
      Alert.alert(
        'Error',
        'Unable to open email client on this device',
        [{ text: 'OK' }],
        { cancelable: false }
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Status bar background */}
      <View style={styles.statusBarBackground} />

      {/* Back button */}
      <View style={styles.backButton}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonTouch}
        >
          <Image
            source={require('../../assets/backarrow.png')}
            style={styles.backarrow}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Rajmani Jewellers</Text>

        <Text style={styles.address}>
          Jhanda Chowk, Kila Gate, Sarafa Bazar,{'\n'}
          Khargone, Madhya Pradesh{'\n'}
          451001, MP, India
        </Text>

        {/* GSTIN */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>GSTIN:</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="23AVFPS5740P1Z1"
            placeholderTextColor="#777"
          />
        </View>

        {/* Contact Numbers */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Contact:</Text>
          <TouchableOpacity
            style={styles.phoneTouchable}
            onPress={() => handlePhonePress('+91 91790 97007')}
          >
            <Text style={styles.linkText}>+91 91790 97007</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}> </Text>
          <TouchableOpacity
            style={styles.phoneTouchable}
            onPress={() => handlePhonePress('+91 97708 72919')}
          >
            <Text style={styles.linkText}>+91 97708 72919</Text>
          </TouchableOpacity>
        </View>

        {/* Email */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email:</Text>
          <TouchableOpacity
            style={styles.emailTouchable}
            onPress={() => handleEmailPress('rajmaniapp@gmail.com')}
          >
            <Text style={styles.linkText}>rajmaniapp@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          If you encounter any problems, please feel free to reach out to us.
        </Text>
      </ScrollView>
    </View>
  );
};

export default ContactScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarBackground: {
    height: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.PRIMARY,
    width: '100%',
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
    marginTop: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.PRIMARY,
    alignSelf: 'center',
    marginBottom: 35,
    marginTop: 25,
  },
  address: {
    fontSize: 14,
    color: '#222',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 35,
    lineHeight: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  fieldLabel: {
    width: 90,
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
  fieldInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d0073',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  phoneTouchable: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d0073',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  emailTouchable: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d0073',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  footerNote: {
    fontSize: 14,
    color: '#444',
    marginTop: 35,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: 'Poppins-Medium',
  },
});
