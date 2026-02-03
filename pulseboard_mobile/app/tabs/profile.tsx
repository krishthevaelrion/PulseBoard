import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Settings, Bell, Heart, Calendar, Trophy, Users, LogOut, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import UserAvatar from 'react-native-user-avatar';
import { getUserProfile } from '../../src/api/user.api';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

//  Theme
const THEME_ACCENT = '#CCF900'; 

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 404) {
          Alert.alert("Session Expired", "Please login again.");
          await AsyncStorage.removeItem('token');
          router.replace('/login');
        } else {
          Alert.alert('Error', 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    router.replace('/');
  };

  const stats = [
    { label: 'Events', value: '24', icon: Calendar },
    { label: 'Clubs', value: '5', icon: Users },
    { label: 'Awards', value: '12', icon: Trophy },
  ];

  const upcomingEvents = [
    { title: 'AI Workshop', date: 'Jan 25', club: 'ACM Chapter', time: '5:00 PM' },
    { title: 'Drama Auditions', date: 'Jan 27', club: 'Dramatics', time: '6:30 PM' },
    { title: 'Basketball Finals', date: 'Jan 30', club: 'Sports', time: '4:00 PM' },
  ];

  const MenuItem = ({ icon: Icon, title, onPress, showBadge = false, isDestructive = false }: any) => (
    <TouchableOpacity 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: hp('2%'), 
        paddingHorizontal: wp('%'), 
        backgroundColor: '#121212', 
        borderWidth: 1, 
        borderColor: '#171717', 
        borderRadius: 16, 
        marginBottom: hp('1.5%') 
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ 
            padding: wp('2%'), 
            borderRadius: 999, 
            backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(204, 249, 0, 0.1)' 
        }}>
           <Icon color={isDestructive ? '#ef4444' : THEME_ACCENT} size={hp('2.5%')} strokeWidth={2.5} />
        </View>
        <Text style={{ 
            fontSize: hp('1.8%'), 
            fontWeight: 'bold', 
            marginLeft: wp('4%'), 
            color: isDestructive ? '#ef4444' : 'white' 
        }}>
            {title}
        </Text>
      </View>
      {showBadge && (
        <View style={{ 
            backgroundColor: '#CCF900', 
            borderRadius: 999, 
            width: hp('3%'), 
            height: hp('3%'), 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginRight: wp('2%') 
        }}>
          <Text style={{ color: 'black', fontSize: hp('1.2%'), fontWeight: '900' }}>3</Text>
        </View>
      )}
      {!isDestructive && <ChevronRight color="#333" size={hp('2.5%')} />}
    </TouchableOpacity>
  );

  const displayName = user?.name || "Guest User";
  const displayEmail = user?.email || "guest@example.com";
  const avatarSeed = user?._id || user?.email || "default-seed";
  const displayAvatar = `https://api.dicebear.com/9.x/bottts/png?seed=${avatarSeed}`;

  if (loading) {
      return (
        <View className="flex-1 bg-[#050505] justify-center items-center">
          <ActivityIndicator size="large" color={THEME_ACCENT} />
        </View>
      );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      {/* Header */}
      <View style={{ 
          paddingHorizontal: wp('7%'), 
          paddingVertical: hp('3.5%'), 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
      }}>
        <View>
          <Text style={{ 
              color: '#737373', 
              fontWeight: 'bold', 
              fontSize: hp('1.5%'), 
              letterSpacing: 3, 
              textTransform: 'uppercase', 
              marginBottom: hp('0.5%') 
          }}>
            Dashboard
          </Text>
          <Text style={{ color: 'white', fontSize: hp('4%'), fontWeight: '900', letterSpacing: -1 }}>
            PROFILE
          </Text>
        </View>
        <TouchableOpacity style={{ 
            backgroundColor: '#1A1A1A', 
            padding: wp('3%'), 
            borderRadius: 999, 
            borderWidth: 1, 
            borderColor: '#262626',
            marginTop: hp('1.4%')
        }}>
          <Settings color={THEME_ACCENT} size={hp('2.5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%'), paddingBottom: hp('5%') }}>
        
        {/* Main Profile Card */}
        <View style={{ 
            backgroundColor: '#121212', 
            borderWidth: 1, 
            borderColor: '#262626', 
            borderRadius: 32, 
            padding: wp('6%'), 
            marginBottom: hp('3%'), 
            alignItems: 'center', 
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Decoration */}
            <View style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: wp('30%'), 
                height: wp('30%'), 
                backgroundColor: 'rgba(204, 249, 0, 0.05)', 
                borderBottomLeftRadius: 100 
            }} />

            <View style={{ 
                marginBottom: hp('2%'), 
                padding: 4, 
                borderWidth: 2, 
                borderColor: '#CCF900', 
                borderRadius: 999, 
                borderStyle: 'dashed' 
            }}>
               <UserAvatar 
                 size={hp('12%')} 
                 name={displayName} 
                 src={displayAvatar} 
                 bgColor="#050505"
               />
            </View>

            <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900', marginBottom: hp('0.5%') }}>{displayName}</Text>
            <Text style={{ color: '#737373', fontSize: hp('1.6%'), fontWeight: '500', marginBottom: hp('2%') }}>{displayEmail}</Text>
            
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: 'rgba(204, 249, 0, 0.1)', 
                paddingHorizontal: wp('4%'), 
                paddingVertical: hp('0.8%'), 
                borderRadius: 999, 
                borderWidth: 1, 
                borderColor: 'rgba(204, 249, 0, 0.2)' 
            }}>
              <View style={{ width: 6, height: 6, backgroundColor: '#CCF900', borderRadius: 999, marginRight: 8 }} />
              <Text style={{ color: '#CCF900', fontSize: hp('1.2%'), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Active Member</Text>
            </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp('4%') }}>
            {stats.map((stat, idx) => (
                <View key={idx} style={{ 
                    width: '31%', 
                    backgroundColor: '#121212', 
                    borderWidth: 1, 
                    borderColor: '#171717', 
                    borderRadius: 16, 
                    padding: wp('3%'), 
                    alignItems: 'center' 
                }}>
                    <Text style={{ color: '#CCF900', fontSize: hp('2.5%'), fontWeight: '900', marginBottom: hp('0.5%') }}>{stat.value}</Text>
                    <Text style={{ color: '#52525B', fontSize: hp('1.1%'), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</Text>
                </View>
            ))}
        </View>

        {/* Quick Actions */}
        <Text style={{ color: 'white', fontSize: hp('2.2%'), fontWeight: '900', marginBottom: hp('2%') }}>ACTIONS</Text>
        <MenuItem icon={Bell} title="Notifications" showBadge={true} onPress={() => {}} />
        <MenuItem icon={Heart} title="Saved Events" onPress={() => {}} />
        <MenuItem icon={Calendar} title="My Calendar" onPress={() => {}} />

        {/* Upcoming Events Mini-List */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: hp('2%'), marginTop: hp('3%') }}>
            <Text style={{ color: 'white', fontSize: hp('2.2%'), fontWeight: '900' }}>UPCOMING</Text>
            <TouchableOpacity>
                <Text style={{ color: '#CCF900', fontSize: hp('1.4%'), fontWeight: 'bold', textTransform: 'uppercase' }}>View All</Text>
            </TouchableOpacity>
        </View>
        
        {upcomingEvents.map((event, idx) => (
          <View key={idx} style={{ 
              backgroundColor: '#121212', 
              borderWidth: 1, 
              borderColor: '#171717', 
              borderRadius: 16, 
              padding: wp('4%'), 
              marginBottom: hp('1.5%'), 
              flexDirection: 'row', 
              alignItems: 'center' 
          }}>
             <View style={{ 
                 backgroundColor: '#1A1A1A', 
                 width: wp('12%'), 
                 height: wp('12%'), 
                 borderRadius: 12, 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 marginRight: wp('4%') 
             }}>
                <Text style={{ color: '#CCF900', fontWeight: '900', fontSize: hp('1.4%') }}>{event.date.split(' ')[0]}</Text>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: hp('1.6%') }}>{event.date.split(' ')[1]}</Text>
             </View>
             <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: hp('1.8%') }}>{event.title}</Text>
                <Text style={{ color: '#737373', fontSize: hp('1.4%') }}>{event.club} • {event.time}</Text>
             </View>
             <ChevronRight color="#333" size={hp('2%')} />
          </View>
        ))}

        {/* Logout */}
        <View style={{ marginTop: hp('3%'), marginBottom: hp('5%') }}>
            <MenuItem icon={LogOut} title="Logout" isDestructive={true} onPress={handleLogout} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}