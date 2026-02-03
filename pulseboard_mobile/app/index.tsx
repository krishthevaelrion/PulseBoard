import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Target } from 'lucide-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- Theme Constants ---
const LN_VOLT = '#CCF900'; 

export default function WelcomeScreen() {
  return (
    // OUTER FRAME: Pitch Black Background
    <View className="flex-1 bg-black justify-center items-center" style={{ padding: wp('2%') }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* INNER FRAME: The "Card" */}
      <View className="w-full h-full bg-[#050505] rounded-[20px] border border-neutral-800 relative overflow-hidden">
        
        {/* --- DECORATION: Corner Accents (Scaled) --- */}
        {/* Top Left */}
        <View className="absolute border-l-2 border-t-2 border-[#CCF900]" 
              style={{ top: hp('2%'), left: wp('4%'), width: wp('4%'), height: wp('4%') }} />
        {/* Top Right */}
        <View className="absolute border-r-2 border-t-2 border-[#CCF900]" 
              style={{ top: hp('2%'), right: wp('4%'), width: wp('4%'), height: wp('4%') }} />
        {/* Bottom Left */}
        <View className="absolute border-l-2 border-b-2 border-[#CCF900]" 
              style={{ bottom: hp('2%'), left: wp('4%'), width: wp('4%'), height: wp('4%') }} />
        {/* Bottom Right */}
        <View className="absolute border-r-2 border-b-2 border-[#CCF900]" 
              style={{ bottom: hp('2%'), right: wp('4%'), width: wp('4%'), height: wp('4%') }} />

        {/* --- BACKGROUND ACCENT: Subtle Grid Line --- */}
        <View className="absolute w-full h-[1px] bg-[#CCF900]/10" style={{ top: hp('30%') }} />
        <View className="absolute h-full w-[1px] bg-[#CCF900]/5" style={{ left: wp('20%') }} />

        <SafeAreaView className="flex-1 justify-between" style={{ paddingVertical: hp('3%') }}>
          
          {/* --- TOP: Telemetry Header --- */}
          <View style={{ paddingHorizontal: wp('8%'), paddingTop: hp('2%') }}>
            {/* Header Status Line */}
            <View className="flex-row justify-start items-center opacity-60" style={{ marginBottom: hp('6%') }}>
              <View className="flex-row items-center gap-2">
                <Target size={hp('1.8%')} color={LN_VOLT} />
                <Text 
                    className="text-neutral-400 font-mono tracking-[2px]"
                    style={{ fontSize: hp('1.2%') }}
                >
                    SYS.READY
                </Text>
              </View>
            </View>

            {/* LOGO AREA */}
            <View className="items-center relative">
               {/* Glitch Shadow */}
               <Text 
                  className="font-black italic tracking-tighter text-[#CCF900]/10 absolute -z-10" 
                  style={{ 
                      fontSize: hp('15%'), // Responsive massive font
                      top: hp('0.5%'), 
                      left: wp('1%'),
                      transform: [{ skewX: '-12deg' }] 
                  }}
               >
                 PB
               </Text>
               {/* Main Logo */}
               <Text 
                  className="font-black italic tracking-tighter text-white" 
                  style={{ 
                      fontSize: hp('15%'), // Matches shadow size
                      transform: [{ skewX: '-12deg' }] 
                  }}
               >
                 PB
               </Text>
               
               {/* Speed Strip */}
               <View 
                  className="bg-[#CCF900] -skew-x-12"
                  style={{ 
                      marginTop: hp('1%'), 
                      paddingHorizontal: wp('4%'), 
                      paddingVertical: hp('0.5%') 
                  }}
               >
                 <Text 
                    className="text-black font-black skew-x-12"
                    style={{ fontSize: hp('1.6%'), letterSpacing: 6 }}
                 >
                   PULSEBOARD
                 </Text>
               </View>
            </View>
          </View>

          {/* --- MIDDLE: Impact Text --- */}
          <View style={{ paddingHorizontal: wp('10%') }}>
             <Text 
                className="text-neutral-600 font-bold tracking-widest uppercase"
                style={{ fontSize: hp('1.6%'), marginBottom: hp('1%') }}
             >
               Mission Status
             </Text>
             <Text 
                className="text-white font-black italic uppercase"
                style={{ 
                    fontSize: hp('6%'), 
                    lineHeight: hp('6%'), // Tighter line height for impact
                    transform: [{ skewX: '-6deg' }] 
                }}
             >
               ALL IN.
               <Text className="text-[#CCF900]">{"\n"}ALL OUT.</Text>
             </Text>
          </View>

          {/* --- BOTTOM: Controls --- */}
          <View style={{ paddingHorizontal: wp('8%'), paddingBottom: hp('2%'), gap: hp('2.5%') }}>
            
            {/* Primary Button: Sign Up */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/auth/register')}
              className="bg-[#CCF900] justify-center items-center flex-row group border-b-4 border-[#9dbf00]"
              style={{ 
                  height: hp('8%'), // Touch friendly height
                  transform: [{ skewX: '-12deg' }], 
                  borderRadius: 4 
              }}
            >
              <View className="skew-x-12 flex-row items-center">
                 <Text 
                    className="text-black font-black tracking-widest mr-3 uppercase"
                    style={{ fontSize: hp('2.2%') }}
                 >
                   Sign Up
                 </Text>
                 <ArrowRight color="black" size={hp('3%')} strokeWidth={3} />
              </View>
            </TouchableOpacity>

            {/* Secondary Button: Login */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/auth/login')}
              className="justify-center items-center flex-row border border-neutral-700 bg-neutral-900/50"
              style={{ 
                  height: hp('8%'), 
                  transform: [{ skewX: '-12deg' }], 
                  borderRadius: 4 
              }}
            >
              <View className="skew-x-12 flex-row items-center">
                <Text 
                    className="text-neutral-300 font-bold tracking-[3px] uppercase"
                    style={{ fontSize: hp('1.8%') }}
                >
                  Login / Access
                </Text>
              </View>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginTop: hp('1%') }}>
              <Text 
                className="text-neutral-700 font-mono"
                style={{ fontSize: hp('1.1%') }}
              >
                SECURE CONNECTION ESTABLISHED
              </Text>
            </View>

          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}