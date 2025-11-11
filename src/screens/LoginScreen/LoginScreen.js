import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../constants/Colors';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../../api/baseurl';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const LoginScreen = ({ navigation }) => {
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  // Disable going back to splash
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const handleLogin = async values => {
  setLoading(true);
  try {
    const response = await axios.post(`${baseUrl}/salesman/login`, {
      email: values.email,
      password: values.password,
    });
    console.log('🛬 FULL RESPONSE:', JSON.stringify(response.data, null, 2));
    // Store full response and token
    await AsyncStorage.setItem('fullLoginResponse', JSON.stringify(response.data));
    if (response.data.success) {
      await AsyncStorage.setItem('userToken', response.data.token);
      console.log('🗝️ Token:', response.data.token);
      setLoading(false);
      navigation.replace('Main');
    } else {
      alert(response.data.message || 'Login failed');
      setLoading(false);
    }
  } catch (error) {
    setLoading(false);
    console.log('⚠️ Login error:', error.message);
    alert('Salesman not found');
  }
};


  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={require('../../assets/background.jpeg')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <Image
            source={require('../../assets/homelogo.png')}
            style={styles.logo}
          />
          <View style={styles.overlay}>
            <Text style={styles.title}>Rajmani Jewellers</Text>
            <Text style={styles.subtitle}>Login to your account</Text>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <>
                  <Text style={styles.label}>Enter Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    placeholderTextColor="#777"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <Text style={styles.label}>Enter Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter password"
                      placeholderTextColor="#777"
                      secureTextEntry={secureText}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                    />
                    <TouchableOpacity
                      onPress={() => setSecureText(!secureText)}
                    >
                      <Image
                        source={
                          secureText
                            ? require('../../assets/hidden.png')
                            : require('../../assets/eyeicon.png')
                        }
                        style={styles.eyeicon}
                      />
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}
                  >
                    {loading ? (
                      <Text style={styles.buttonText}>Logging in...</Text>
                    ) : (
                      <Text style={styles.buttonText}>Login</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </Formik>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default LoginScreen;

// --- styles unchanged ---
const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    marginTop: hp('12%'),
  },
  overlay: {
    marginHorizontal: wp('5%'),
    padding: wp('6%'),
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  logo: {
    width: wp('30%'),
    height: wp('30%'),
    alignSelf: 'center',
    borderRadius: wp('15%'),
    marginBottom: hp('3%'),
  },
  title: {
    fontSize: wp('6%'),
    fontFamily: 'Poppins-SemiBold',
    color: Colors.PRIMARY,
    textAlign: 'center',
    marginBottom: hp('0.5%'),
  },
  subtitle: {
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    color: '#555',
    marginBottom: hp('3%'),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    fontSize: wp('4%'),
    marginBottom: hp('1%'),
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1%'),
  },
  passwordInput: {
    flex: 1,
    fontSize: wp('4%'),
    paddingVertical: hp('1%'),
    color: '#000',
    fontFamily: 'Poppins-Medium',
  },
  eyeicon: {
    width: wp('6%'),
    height: wp('6%'),
    marginLeft: wp('2%'),
    tintColor: Colors.PRIMARY,
    resizeMode: 'contain',
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: hp('1.5%'),
    borderRadius: 21,
    alignItems: 'center',
    marginTop: hp('1.5%'),
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('4.5%'),
  },
  label: {
    fontSize: wp('3.8%'),
    color: '#000',
    fontFamily: 'Poppins-Medium',
    marginLeft: wp('1%'),
    marginBottom: hp('0.5%'),
  },
  errorText: {
    color: 'red',
    fontSize: wp('3.2%'),
    fontFamily: 'Poppins-Regular',
    marginBottom: hp('1.5%'),
    marginLeft: wp('1%'),
  },
});
