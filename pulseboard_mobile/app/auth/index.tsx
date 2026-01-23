import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const PRIMARY_PURPLE = '#8A56F1';

export default function MainScreen() {
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{ height: height * 0.35, backgroundColor: PRIMARY_PURPLE }}
        className="justify-center items-center"
      >
        <SafeAreaView>
          <View className="items-center">
            <View
              style={{
                transform: [{ rotate: '45deg' }],
                borderColor: '#fff',
              }}
              className="w-28 h-28 border-4 rounded-2xl justify-center items-center"
            >
              <Text
                style={{ transform: [{ rotate: '-45deg' }] }}
                className="text-white text-5xl font-black"
              >
                PB
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Wave */}
      <View className="-mt-1">
        <Svg
          height="150"
          width={width}
          viewBox={`0 0 ${width} 150`}
          preserveAspectRatio="none"
        >
          <Path
            fill={PRIMARY_PURPLE}
            d={`M0,0 
               L${width},0 
               L${width},90 
               C${width * 0.8},150 ${width * 0.6},150 ${width * 0.5},90 
               C${width * 0.4},30 ${width * 0.2},30 0,90 
               Z`}
          />
        </Svg>
      </View>

      {/* Content */}
      <View className="flex-1 px-8 justify-between pb-12">
        <View className="mt-6 items-center">
          <Text className="text-3xl font-bold text-gray-800 mb-3">
            Welcome to PulseBoard
          </Text>
          <Text className="text-base text-gray-500 text-center leading-6">
            Experience the best way to manage your tasks and stay productive.
          </Text>
        </View>

        {/* Buttons */}
        <View className="flex-row justify-between">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/auth/login')}
            style={{
              backgroundColor: '#F3EFFF',
              borderColor: PRIMARY_PURPLE,
            }}
            className="h-14 rounded-2xl justify-center items-center w-[48%] border"
          >
            <Text style={{ color: PRIMARY_PURPLE }} className="font-bold text-base">
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/auth/register')}
            style={{ backgroundColor: PRIMARY_PURPLE }}
            className="h-14 rounded-2xl justify-center items-center w-[48%]"
          >
            <Text className="text-white font-bold text-base">
              Register Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
