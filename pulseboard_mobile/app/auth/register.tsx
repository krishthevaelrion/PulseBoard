import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  StatusBar, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
// Importing your service logic
import { registerUser } from '../../src/services/auth.service';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // YOUR LOGIC: Async registration with error handling
  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'All fields are required!');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password });
      
      Alert.alert('Success', 'Account created successfully');
      // YOUR PATH: Redirect to login after successful registration
      router.replace('/auth/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Signup Failed';
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View className="h-[30vh] bg-black justify-center items-center border-b-2 border-cyber-green/30">
        <SafeAreaView className="absolute top-5 left-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-cyber-green text-base font-bold">
              ← BACK
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View className="items-center">
          <Text className="text-cyber-green text-[34px] font-black tracking-wide">
            REGISTER
          </Text>
          <Text className="text-cyber-cyan text-sm mt-2 tracking-widest">
            CREATE NEW ACCOUNT
          </Text>
        </View>
      </View>

      {/* Form */}
      <View className="flex-1 px-8 pt-10">
        {/* Name */}
        <View className="mb-6">
          <Text className="text-[12px] text-cyber-cyan mb-2 font-bold tracking-widest">
            FULL NAME
          </Text>
          <TextInput
            className="h-[54px] bg-cyber-green/5 border border-cyber-green/30 rounded-xl px-5 text-base text-white"
            placeholder="John Doe"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email */}
        <View className="mb-6">
          <Text className="text-[12px] text-cyber-cyan mb-2 font-bold tracking-widest">
            EMAIL ADDRESS
          </Text>
          <TextInput
            className="h-[54px] bg-cyber-green/5 border border-cyber-green/30 rounded-xl px-5 text-base text-white"
            placeholder="example@mail.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View className="mb-8">
          <Text className="text-[12px] text-cyber-cyan mb-2 font-bold tracking-widest">
            PASSWORD
          </Text>
          <TextInput
            className="h-[54px] bg-cyber-green/5 border border-cyber-green/30 rounded-xl px-5 text-base text-white"
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Button with Loading State */}
        <TouchableOpacity
          className={`bg-cyber-green h-14 rounded-full justify-center items-center mt-2 ${loading ? 'opacity-70' : ''}`}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black text-base font-black tracking-widest">
              SIGN UP
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text className="text-center mt-6 text-neutral-300 text-sm">
            Already have an account?{' '}
            <Text className="text-cyber-green font-bold">LOGIN</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}