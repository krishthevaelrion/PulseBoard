import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { loginUser } from '../../src/services/auth.service';

const { width, height } = Dimensions.get('window');
const PRIMARY_PURPLE = '#8A56F1';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await loginUser({ email, password });
      // Redirect to home tabs on success
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

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
            Login To Your Account
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
          className={`h-14 rounded-2xl justify-center items-center mt-5 shadow-lg ${loading ? 'opacity-70' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold">Login</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text className="text-center mt-6 text-gray-500 text-sm">
            Don't have an account?{' '}
            <Text style={{ color: PRIMARY_PURPLE }} className="font-bold">
              Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}