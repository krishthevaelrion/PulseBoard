import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const PRIMARY_PURPLE = '#8A56F1';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{ height: height * 0.25, backgroundColor: PRIMARY_PURPLE }}
        className="justify-center items-center"
      >
        <SafeAreaView className="absolute top-6 left-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-white text-base font-semibold">{'<'} Back</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View className="mt-5">
          <Text className="text-white text-3xl font-bold">
            Create Account
          </Text>
        </View>
      </View>

      {/* Wave */}
      <View className="-mt-1">
        <Svg height="120" width={width} viewBox={`0 0 ${width} 120`} preserveAspectRatio="none">
          <Path
            fill={PRIMARY_PURPLE}
            d={`M0,0 L${width},0 L${width},40 C${width * 0.8},120 ${width * 0.2},120 0,40 Z`}
          />
        </Svg>
      </View>

      {/* Form */}
      <View className="flex-1 px-8 pt-5">
        {/* Name */}
        <View className="mb-5">
          <Text className="text-sm text-gray-500 mb-2 font-semibold">
            Full Name
          </Text>
          <TextInput
            className="h-12 bg-gray-100 rounded-xl px-4 text-base text-gray-800"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email */}
        <View className="mb-5">
          <Text className="text-sm text-gray-500 mb-2 font-semibold">
            Email Address
          </Text>
          <TextInput
            className="h-12 bg-gray-100 rounded-xl px-4 text-base text-gray-800"
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View className="mb-5">
          <Text className="text-sm text-gray-500 mb-2 font-semibold">
            Password
          </Text>
          <TextInput
            className="h-12 bg-gray-100 rounded-xl px-4 text-base text-gray-800"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Button */}
        <TouchableOpacity
          style={{ backgroundColor: PRIMARY_PURPLE }}
          className="h-14 rounded-2xl justify-center items-center mt-5 shadow-lg"
          onPress={() => console.log('Registering user...')}
        >
          <Text className="text-white text-lg font-bold">Sign Up</Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text className="text-center mt-6 text-gray-500 text-sm">
            Already have an account?{' '}
            <Text style={{ color: PRIMARY_PURPLE }} className="font-bold">
              Login
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
