import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TodayScreen from './screens/TodayScreen';
import HistoryScreen from './screens/HistoryScreen';
import { colors } from './styles/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        initialRouteName="Today"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Today') {
              iconName = focused ? 'today' : 'today-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.card,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Today" 
          component={TodayScreen} 
          options={{
            title: "75 Hard - Today"
          }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen}
          options={{
            title: "Challenge History"
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
