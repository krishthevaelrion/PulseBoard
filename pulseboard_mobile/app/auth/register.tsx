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
  ImageBackground,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, ChevronLeft, User, Mail, Lock, Zap } from 'lucide-react-native';
import { registerUser } from '../../src/services/auth.service';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- Theme Constants ---
const LN_VOLT = '#CCF900'; 

// --- Load the Image ---
const BG_IMAGE = require('../../assets/disc.jpg'); 

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Focus State
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'All fields are required!');
      return;
    }

    if (!email.endsWith('@iitj.ac.in')) {
      Alert.alert('Restricted Access', 'Only emails ending in @iitj.ac.in are allowed.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password });
      
      Alert.alert('Success', 'Account created successfully');
      router.push('/auth/login');
    } catch (err: any) {
      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.message || '';

      if (status === 409 || errorMsg.toLowerCase().includes('already exists')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login Instead', 
              onPress: () => router.push('/auth/login') 
            }
          ]
        );
      } else {
        Alert.alert('Registration Error', errorMsg || 'Signup Failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* LAYER 1: The Image */}
      <ImageBackground 
        source={BG_IMAGE} 
        className="flex-1"
        resizeMode="cover"
        imageStyle={{ opacity: 0.35 }} 
      >
        
        {/* LAYER 2: The Gradient Mask */}
        <LinearGradient
            colors={['transparent', 'rgba(5, 5, 5, 0.8)', '#050505']}
            locations={[0, 0.4, 0.9]}
            className="absolute w-full h-full"
        />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            style={{ paddingHorizontal: wp('6%') }}
          >
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: hp('5%') }}
            >
              
              {/* --- Header Section --- */}
              <View style={{ marginTop: hp('2%'), marginBottom: hp('3%') }}>
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  className="bg-[#121212]/80 border border-neutral-800 rounded-full justify-center items-center"
                  style={{ 
                      width: wp('12%'), 
                      height: wp('12%'), 
                      marginBottom: hp('3%') 
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
                      New Entry
                    </Text>
                  </View>

                  <Text 
                    className="text-white font-black italic tracking-tighter uppercase"
                    style={{ fontSize: hp('5.5%'), lineHeight: hp('5.5%'), marginBottom: hp('2%') }}
                  >
                    Create<Text className="text-[#CCF900]">.</Text>{"\n"}Account
                  </Text>
                  
                  <Text 
                    className="text-neutral-400 font-medium"
                    style={{ fontSize: hp('1.6%'), lineHeight: hp('2.2%'), maxWidth: wp('90%') }}
                  >
                    Join the PulseBoard network. Exclusive to IIT Jodhpur students.
                  </Text>
                </View>
              </View>

              {/* --- Form Section --- */}
              <View style={{ gap: hp('2.5%') }}>
                
                {/* Name Input */}
                <View>
                  <Text 
                    className="text-neutral-500 font-bold uppercase"
                    style={{ fontSize: hp('1.1%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                  >
                    Full Name
                  </Text>
                  <View 
                    className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${
                      focusedInput === 'name' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                    style={{ height: hp('7.5%') }}
                  >
                    <User color={focusedInput === 'name' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                    <TextInput
                      className="flex-1 text-white font-bold h-full"
                      style={{ fontSize: hp('1.8%') }}
                      placeholder="John Doe"
                      placeholderTextColor="#444"
                      value={name}
                      onChangeText={setName}
                      selectionColor={LN_VOLT}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View>
                  <Text 
                    className="text-neutral-500 font-bold uppercase"
                    style={{ fontSize: hp('1.1%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                  >
                    Institute Email
                  </Text>
                  <View 
                    className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${
                      focusedInput === 'email' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                    style={{ height: hp('7.5%') }}
                  >
                    <Mail color={focusedInput === 'email' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                    <TextInput
                      className="flex-1 text-white font-bold h-full"
                      style={{ fontSize: hp('1.8%') }}
                      placeholder="student@iitj.ac.in"
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
                    Set Password
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
                      placeholder="Min 8 chars"
                      placeholderTextColor="#444"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      selectionColor={LN_VOLT}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: wp('2%') }}>
                      {showPassword ? <EyeOff color="#555" size={hp('2.5%')} /> : <Eye color="#555" size={hp('2.5%')} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View>
                  <Text 
                    className="text-neutral-500 font-bold uppercase"
                    style={{ fontSize: hp('1.1%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                  >
                    Confirm Password
                  </Text>
                  <View 
                    className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${
                      focusedInput === 'confirm' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                    style={{ height: hp('7.5%') }}
                  >
                    <Lock color={focusedInput === 'confirm' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                    <TextInput
                      className="flex-1 text-white font-bold h-full"
                      style={{ fontSize: hp('1.8%') }}
                      placeholder="Repeat Password"
                      placeholderTextColor="#444"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      selectionColor={LN_VOLT}
                      onFocus={() => setFocusedInput('confirm')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: wp('2%') }}>
                      {showConfirmPassword ? <EyeOff color="#555" size={hp('2.5%')} /> : <Eye color="#555" size={hp('2.5%')} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  className={`bg-[#CCF900] justify-center items-center group ${loading ? 'opacity-70' : ''}`}
                  onPress={handleRegister}
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
                        REGISTER SYSTEM
                      </Text>
                      <Zap color="black" size={hp('2.5%')} fill="black" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Footer */}
                <View style={{ paddingVertical: hp('2%'), alignItems: 'center' }}>
                  <View className="flex-row items-center">
                    <Text 
                        className="text-neutral-400 font-medium mr-2"
                        style={{ fontSize: hp('1.4%') }}
                    >
                      Already have an account?
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/auth/login')}>
                      <Text 
                        className="text-white font-black uppercase border-b border-[#CCF900]"
                        style={{ fontSize: hp('1.4%'), letterSpacing: 1 }}
                      >
                        LOGIN
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}