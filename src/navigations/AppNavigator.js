import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen/SplashScreen';
import LoginScreen from '../screens/LoginScreen/LoginScreen';
import DrawerNavigator from './DrawerNavigator/DrawerNavigator';
import DashboardCardScreen from '../screens/DashboardScreen/DashboardCardScreen';
import CreateInvoiceScreen from '../screens/CreateInvoice/CreateInvoiceScreen';
import GetAllInvoice from '../screens/GetAllInvoice/GetAllInvoice';
import GenerateInvoiceScreen from '../screens/GenerateInvoice/GenerateInvoiceScreen';
import InvoicePaymentScreen from '../screens/PaymentScreen/InvoicePaymentScreen';
import RepairingInvoiceScreen from '../screens/RepairingScreen/RepairingInvoiceScreen';
import CustomOrderScreen from '../screens/CustomOrder/CustomOrderScreen';
import CustomOrderInvoiceScreen from '../screens/CustomOrderInvoice/CustomOrderInvoiceScreen';
import InvoiceBillScreen from '../screens/GenerateInvoice/InvoiceBillScreen';
import SecondInvoicePayment from '../screens/PaymentScreen/SecondInvoicePayment';
import ThirdInvoicePayment from '../screens/PaymentScreen/ThirdInvoicePayment';
import CustomOrderBill from '../screens/GenerateInvoice/CustomOrderBill'
import showBill from '../screens/ShowBill/showBill';
import RepairShowBill from '../screens/ShowBill/RepairShowBill';
import CustomOrderShowBill from '../screens/ShowBill/CustomOrderShowBill';  
import UpdateInvoiceScreen from '../screens/CreateInvoice/UpdateInvoiceScreen';
import UpdateInvoiceBill from '../screens/PaymentScreen/UpdateInvoiceBill';
import UpdateSecondBill from '../screens/PaymentScreen/UpdateSecondBill';
import UpdateThirdBill from '../screens/PaymentScreen/UpdateThirdBill';
import UpdateReapairingInvoice from '../screens/RepairingScreen/UpdateReapairingInvoice';
import UpdateCustomOrder from '../screens/CustomOrder/UpdateCustomOrder';
import CustomFirstShowBill from '../screens/ShowBill/CustomFirstShowBill';
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation:'none'
          }}
          initialRouteName="Splash"
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="Dashboard" component={DashboardCardScreen} />
          <Stack.Screen
            name="create-invoice"
            component={CreateInvoiceScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="get-all-invoices"
            component={GetAllInvoice}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="bill-page"
            component={GenerateInvoiceScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="invoice-payment"
            component={InvoicePaymentScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="repairing-screen"
            component={RepairingInvoiceScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="custom-order"
            component={CustomOrderScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="custom-order-invoice"
            component={CustomOrderInvoiceScreen}
            options={{
              headerShown: false,
            }}
          />
           <Stack.Screen
            name="bill-second"
            component={InvoiceBillScreen}
            options={{
              headerShown: false,
            }}
          />
           <Stack.Screen
            name="payment-second"
            component={SecondInvoicePayment}
            options={{
              headerShown: false,
            }}
          />
           <Stack.Screen
            name="payment-third"
            component={ThirdInvoicePayment}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="custom-invoice-bill"
            component={CustomOrderBill}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="show-bill"
            component={showBill}
            options={{
              headerShown: false,
            }}
          />  
          <Stack.Screen
            name="repair-show-bill"
            component={RepairShowBill}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="custom-order-show-bill"
            component={CustomOrderShowBill}
            options={{
              headerShown: false,
            }}
          />  
          <Stack.Screen
            name="update-invoice"
            component={UpdateInvoiceScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="update-invoice-bill"
            component={UpdateInvoiceBill}
            options={{
              headerShown: false,
            }}
          />  
          <Stack.Screen
            name="update-second-bill"
            component={UpdateSecondBill}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="update-third-bill"
            component={UpdateThirdBill}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="update-repairing-invoice"
            component={UpdateReapairingInvoice}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="update-custom-order"
            component={UpdateCustomOrder}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="custom-first-show-bill"
            component={CustomFirstShowBill}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>

      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
