import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  StatusBar, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, ChevronLeft, Mail, Lock, Zap } from 'lucide-react-native';
import { loginUser } from '../../src/services/auth.service';
import { LinearGradient } from 'expo-linear-gradient'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- Theme Constants ---
const LN_VOLT = '#CCF900'; 

// --- Load the Image ---
const BG_IMAGE = require('../../assets/roll.jpg'); 

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert('Missing Data', 'Please enter both identifier and security key.');
        return;
    }
  
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      
      if (response.token) {
        await AsyncStorage.setItem('token', response.token);
        router.replace('/tabs/home');
      } else {
        throw new Error("No token received");
      }

    } catch (error: any) {
      console.log("Login Error Full:", error);
      if (error.message === 'Network Error') {
        Alert.alert(
          'Connection Failed', 
          'Cannot reach the server. \n\n1. Check if backend is running.\n2. Ensure API_URL uses your IP (not localhost).'
        );
      } else {
        const msg = error?.response?.data?.message || 'Access Denied. Check credentials.';
        Alert.alert('System Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      {/* LAYER 1: The Image (Lion) */}
      <ImageBackground 
        source={BG_IMAGE} 
        className="flex-1"
        resizeMode="cover"
        imageStyle={{ opacity: 0.35 }} 
      >
        
        {/* LAYER 2: The Gradient Mask */}
        <LinearGradient
            colors={['transparent', 'rgba(5, 5, 5, 0.6)', '#050505']}
            locations={[0, 0.4, 0.8]}
            className="absolute w-full h-full"
        />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-between"
            style={{ paddingHorizontal: wp('6%') }} // Responsive side padding
          >
            {/* --- Header Section --- */}
            <View style={{ marginTop: hp('2%') }}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                className="bg-[#121212]/80 border border-neutral-800 rounded-full justify-center items-center"
                style={{ 
                    width: wp('12%'), 
                    height: wp('12%'), 
                    marginBottom: hp('4%') 
                }}
              >
                <ChevronLeft color="white" size={wp('6%')} />
              </TouchableOpacity>

              <View>
                <View className="flex-row items-center space-x-2 mb-2">
                  <View className="rounded-full animate-pulse" style={{ width: wp('2%'), height: wp('2%'), backgroundColor: '#CCF900' }} />
                  <Text 
                    className="text-[#CCF900] font-mono uppercase"
                    style={{ fontSize: hp('1.2%'), letterSpacing: 3 }}
                  >
                    Secure Access
                  </Text>
                </View>

                <Text 
                    className="text-white font-black italic tracking-tighter uppercase"
                    style={{ fontSize: hp('5.5%'), lineHeight: hp('5.5%'), marginBottom: hp('2%') }}
                >
                  System<Text className="text-[#CCF900]">.</Text>{"\n"}Login
                </Text>
                
                <Text 
                    className="text-neutral-400 font-medium"
                    style={{ fontSize: hp('1.6%'), lineHeight: hp('2.2%'), maxWidth: wp('80%') }}
                >
                  Enter your credentials to sync with the campus network.
                </Text>
              </View>
            </View>

            {/* --- Form Section --- */}
            <View style={{ marginTop: hp('2%'), gap: hp('3%') }}>
              
              {/* Email Input */}
              <View>
                <Text 
                    className="text-neutral-500 font-bold uppercase"
                    style={{ fontSize: hp('1.1%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Identifier // Email
                </Text>
                <View 
                  className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${
                    focusedInput === 'email' ? 'border-[#CCF900]' : 'border-neutral-800'
                  }`}
                  style={{ height: hp('7.5%') }} // Responsive input height
                >
                  <Mail color={focusedInput === 'email' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 text-white font-bold h-full"
                    style={{ fontSize: hp('1.8%') }}
                    placeholder="user@iitj.ac.in"
                    placeholderTextColor="#444"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text 
                    className="text-neutral-500 font-bold uppercase"
                    style={{ fontSize: hp('1.1%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Security Key // Password
                </Text>
                <View 
                  className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${
                    focusedInput === 'password' ? 'border-[#CCF900]' : 'border-neutral-800'
                  }`}
                  style={{ height: hp('7.5%') }}
                >
                  <Lock color={focusedInput === 'password' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 text-white font-bold h-full"
                    style={{ fontSize: hp('1.8%') }}
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: wp('2%') }}>
                    {showPassword ? (
                      <EyeOff color="#555" size={hp('2.5%')} />
                    ) : (
                      <Eye color="#555" size={hp('2.5%')} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={{ alignItems: 'flex-end', marginTop: hp('0.5%') }}>
                <Text 
                    className="text-neutral-400 font-bold uppercase border-b border-[#CCF900]/50"
                    style={{ fontSize: hp('1.4%'), letterSpacing: 1, paddingBottom: 2 }}
                >
                  Reset Credentials?
                </Text>
              </TouchableOpacity>

              {/* Main Action Button */}
              <TouchableOpacity
                className={`bg-[#CCF900] justify-center items-center group ${loading ? 'opacity-70' : ''}`}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
                style={{ 
                    height: hp('7.5%'), 
                    marginTop: hp('2%'),
                    transform: [{ skewX: '-12deg' }], 
                    borderRadius: 4 
                }}
              >
                {loading ? (
                   <View style={{ transform: [{ skewX: '12deg' }] }}>
                     <ActivityIndicator color="black" />
                   </View>
                ) : (
                  <View className="flex-row items-center" style={{ transform: [{ skewX: '12deg' }] }}>
                    <Text 
                        className="text-black font-black uppercase mr-2"
                        style={{ fontSize: hp('2%'), letterSpacing: 2 }}
                    >
                      INITIATE SESSION
                    </Text>
                    <Zap color="black" size={hp('2.5%')} fill="black" />
                  </View>
                )}
              </TouchableOpacity>

            </View>

            {/* --- Footer --- */}
            <View style={{ paddingBottom: hp('4%'), alignItems: 'center' }}>
               <View className="flex-row items-center">
                  <Text 
                    className="text-neutral-400 font-medium mr-2"
                    style={{ fontSize: hp('1.4%') }}
                  >
                    New to PulseBoard?
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/auth/register')}>
                    <Text 
                        className="text-white font-black uppercase border-b border-[#CCF900]"
                        style={{ fontSize: hp('1.4%'), letterSpacing: 1 }}
                    >
                      Create Account
                    </Text>
                  </TouchableOpacity>
               </View>
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}