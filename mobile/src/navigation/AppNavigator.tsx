import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import IntakeScreen from '../screens/IntakeScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const tabIcon = (name: string) => ({ color }: { color: string }) => (
  <Text style={{ fontSize: 18, color }}>
    {name==='Home'?'🏠':name==='Patients'?'👥':name==='Reports'?'📊':'⚙️'}
  </Text>
);

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      tabBarActiveTintColor: '#4ADE80',
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { fontSize: 10 },
    }}>
    <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarIcon: tabIcon('Home') }} />
    <Tab.Screen name="Patients" component={DashboardScreen} options={{ tabBarIcon: tabIcon('Patients') }} />
    <Tab.Screen name="Reports" component={DashboardScreen} options={{ tabBarIcon: tabIcon('Reports') }} />
    <Tab.Screen name="Settings" component={DashboardScreen} options={{ tabBarIcon: tabIcon('Settings') }} />
  </Tab.Navigator>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs"         component={HomeTabs} />
        <Stack.Screen name="IntakeScreen" component={IntakeScreen} />
        <Stack.Screen name="ResultScreen" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
