import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4A90E2", // Blue color for active tabs
        tabBarInactiveTintColor: "#6B7280", // Darker gray color for inactive tabs
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 16,
            borderRadius: 16,
            height: 70,
            backgroundColor: "#1A1A1A",
            shadowColor: "#000",
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 5 },
            shadowRadius: 10,
            borderWidth: 0,
          },
          android: {
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 16,
            borderRadius: 16,
            height: 70,
            backgroundColor: "#1A1A1A",
            elevation: 5,
            borderWidth: 0,
          },
          default: {
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 16,
            borderRadius: 16,
            height: 70,
            backgroundColor: "#1A1A1A",
            borderWidth: 0,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        // Header styling
        headerStyle: {
          backgroundColor: "#2C3E50",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#FFFFFF",
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Hinge",
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name="home"
              size={24}
              color={focused ? "#4A90E2" : "#6B7280"}
            />
          ),
          headerRight: () => (
            <Feather
              name="log-out"
              size={26}
              color="#FFFFFF"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="SeekerJobs"
        options={{
          headerTitle: "Industrial Jobs",
          title: "Jobs",
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name="briefcase-outline" 
              size={24} 
              color={focused ? "#4A90E2" : "#6B7280"} 
            />
          ),
          headerRight: () => (
            <Ionicons
              name="share-outline"
              size={22}
              color="#FFFFFF"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="SavedJobs"
        options={{
          headerTitle: "Saved Jobs",
          title: "Saved",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={focused ? "#4A90E2" : "#6B7280"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="SeekerProfile"
        options={{
          headerTitle: "Profile",
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name="person-outline" 
              size={24} 
              color={focused ? "#4A90E2" : "#6B7280"} 
            />
          ),
        }}
      />
    </Tabs>
  );
}