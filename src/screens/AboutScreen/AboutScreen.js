import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';

const AboutUsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Status bar padding to cover notch and platform specific bar */}
      <View style={styles.statusBarBackground} />
      
      {/* Back button with same height as invoice screen */}
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

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.titleText}>About Us</Text>
        <Text style={styles.descriptionText}>
          This is the About Us screen of the application. Here you can add
          information about your company, your mission, vision, or anything you
          want your users to know.
        </Text>
      </View>
    </View>
  );
};

export default AboutUsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  statusBarBackground: {
    height: Platform.OS === 'ios' ? 60 : 40, // Same as invoice screen's statusBarBackground
    backgroundColor: Colors.PRIMARY,
    width: '100%',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: hp('6%'), // same height as invoice screen backButton
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

  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  titleText: {
    fontSize: wp('5%'),
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginBottom: hp('2%'),
  },

  descriptionText: {
    fontSize: wp('4%'),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    textAlign: 'center',
    lineHeight: hp('3%'),
  },
});
