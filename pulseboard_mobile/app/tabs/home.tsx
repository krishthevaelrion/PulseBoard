import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Modal, GestureResponderEvent } from 'react-native';
import { Search, Bell, Menu, X, TrendingUp, Calendar, Target, Film, Code, Trophy, Palette, GraduationCap, Briefcase, Mic2, BookOpen, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';

// 1. Define the shape of your Event data
interface EventItem {
  id: number;
  title: string;
  club: string;
  category: string;
  icon: string;
  badge: string;
  date: string;
  location: string;
  interested: string;
  tags: string[];
}

// 2. Define the props for SidebarItem
interface SidebarItemProps {
  icon: React.ComponentType<any>; // Accepts any React component (like Lucide icons)
  text: string;
  onPress: (event: GestureResponderEvent) => void;
}

// 3. Moved Component outside to prevent re-creation on every render
const SidebarItem = ({ icon: Icon, text, onPress }: SidebarItemProps) => (
  <TouchableOpacity className="flex-row items-center py-3 pl-2" onPress={onPress}>
    <Icon color="#00ff88" size={20} className="mr-4" />
    <Text className="text-neutral-300 text-base">{text}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const events: EventItem[] = [
    {
      id: 1,
      title: 'Annual Theatre Festival',
      club: 'DRAMATICS SOCIETY',
      category: 'cultural',
      icon: '🎭',
      badge: 'TOMORROW',
      date: 'Jan 4, 2026 | 6:00 PM',
      location: 'Main Auditorium',
      interested: '250+',
      tags: ['Cultural', 'Performance']
    },
    {
      id: 2,
      title: 'AI/ML Workshop Series',
      club: 'ACM CHAPTER',
      category: 'technical workshops',
      icon: '💻',
      badge: 'THIS WEEK',
      date: 'Jan 5-7, 2026',
      location: 'Computer Lab',
      interested: '180+',
      tags: ['Technical', 'Workshop']
    },
    {
      id: 3,
      title: 'Inter-College Cricket Tournament',
      club: 'SPORTS COMMITTEE',
      category: 'sports',
      icon: '🏆',
      badge: 'LIVE',
      date: 'Jan 3-10, 2026',
      location: 'Sports Ground',
      interested: '500+',
      tags: ['Sports', 'Tournament']
    },
    {
      id: 4,
      title: 'Software Engineering Interview Prep',
      club: 'GOOGLE STUDENT DEVELOPERS',
      category: 'interviews',
      icon: '🎤',
      badge: 'UPCOMING',
      date: 'Jan 8, 2026 | 3:00 PM',
      location: 'Online (Zoom)',
      interested: '320+',
      tags: ['Interview', 'Career']
    }
  ];

  const upcomingToday = [
    { time: '2:00\nPM', title: 'Guest Lecture', location: 'Auditorium' },
    { time: '4:30\nPM', title: 'Basketball Match', location: 'Sports Complex' },
    { time: '6:00\nPM', title: 'Music Jam', location: 'Student Center' },
    { time: '7:00\nPM', title: 'Coding Workshop', location: 'Lab 201' }
  ];

  const notifications = [
    { id: 1, time: '5 mins ago', text: 'AI/ML Workshop starts in 1 hour', unread: true },
    { id: 2, time: '1 hour ago', text: 'Google SDE OA deadline extended', unread: true },
    { id: 3, time: '3 hours ago', text: 'Dramatics Society posted new photos', unread: false }
  ];

  // 4. Added type 'string' to category
  const filterEvents = (category: string) => {
    if (category === 'all') return events;
    return events.filter(e => e.category.includes(category));
  };

  // 5. Added type 'string' to query
  const searchEvents = (query: string) => {
    if (!query) return filterEvents(activeFilter);
    return filterEvents(activeFilter).filter(e => 
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.club.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleLogout = () => {
    router.replace('/');
  };

  const displayedEvents = searchEvents(searchQuery);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b-2 border-cyber-green/30 bg-black/95">
        <TouchableOpacity onPress={() => setShowSidebar(true)}>
          <Menu color="#00ff88" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-black text-cyber-green tracking-[3px]">
          PULSEBOARD
        </Text>
        <TouchableOpacity onPress={() => setShowNotifications(true)} className="relative">
          <Bell color="#00ff88" size={24} />
          <View className="absolute -top-1 -right-1 bg-cyber-red rounded-full min-w-[18px] h-[18px] items-center justify-center">
            <Text className="text-white text-[10px] font-bold">3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-cyber-green/5 border border-cyber-green/30 rounded-full mx-5 my-4 px-4">
        <Search color="#00ff88" size={20} className="mr-2" />
        <TextInput
          className="flex-1 text-white text-base py-3"
          placeholder="Search events, clubs..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Live Banner */}
        <View className="flex-row items-center bg-cyber-red/20 border-2 border-cyber-red/50 rounded-2xl p-4 mb-5">
          <View className="w-3 h-3 bg-cyber-red rounded-full mr-2" />
          <Text className="text-white text-sm font-bold">🔴 LIVE: Tech Fest Hackathon</Text>
        </View>

        {/* Happening Today */}
        <Text className="text-xl font-bold text-cyber-green my-4 tracking-wide">
          ⏰ Happening Today
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {upcomingToday.map((item, idx) => (
            <View key={idx} className="flex-row bg-[#00140f]/60 border border-cyber-green/30 rounded-xl p-3 mr-4 min-w-[250px]">
              <Text className="text-xl font-bold text-cyber-cyan mr-4 text-center min-w-[60px]">
                {item.time}
              </Text>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-1">{item.title}</Text>
                <Text className="text-neutral-300 text-[13px]">{item.location}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {['all', 'technical', 'cultural', 'sports', 'workshops', 'interviews'].map(filter => (
            <TouchableOpacity
              key={filter}
              className={`px-5 py-2 rounded-full mr-2 border ${
                activeFilter === filter 
                  ? 'bg-cyber-green/20 border-cyber-green' 
                  : 'bg-cyber-green/5 border-cyber-green/30'
              }`}
              onPress={() => setActiveFilter(filter)}
            >
              <Text className="text-cyber-green text-sm font-medium">
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Events */}
        <View className="flex-row justify-between items-center mt-5 mb-4">
          <Text className="text-xl font-bold text-cyber-green tracking-wide">
            🔥 Featured Events
          </Text>
          <Text className="text-cyber-cyan text-sm">View All →</Text>
        </View>

        {displayedEvents.map(event => (
          <View key={event.id} className="bg-[#00140f]/60 border-2 border-cyber-green/30 rounded-2xl mb-5 overflow-hidden">
            <View className="h-[150px] bg-cyber-green/10 items-center justify-center relative">
              <Text className="text-6xl">{event.icon}</Text>
              <View className="absolute top-2 right-2 bg-black/80 px-3 py-1 rounded-full border border-cyber-green">
                <Text className="text-cyber-green text-[11px] font-bold">{event.badge}</Text>
              </View>
            </View>
            <View className="p-4">
              <Text className="text-cyber-cyan text-xs font-semibold mb-1">{event.club}</Text>
              <Text className="text-lg font-bold text-white mb-2">{event.title}</Text>
              <Text className="text-neutral-300 text-[13px] mb-1">📅 {event.date}</Text>
              <Text className="text-neutral-300 text-[13px] mb-1">📍 {event.location}</Text>
              <Text className="text-neutral-300 text-[13px] mb-2">👥 {event.interested} Interested</Text>
              <View className="flex-row flex-wrap mt-2">
                {event.tags.map((tag, idx) => (
                  <View key={idx} className="bg-cyber-green/10 px-2 py-1 rounded-2xl border border-cyber-green/30 mr-2 mb-1">
                    <Text className="text-cyber-green text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/80 justify-end"
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-[#00140f]/98 border-t-2 border-cyber-green/30 rounded-t-3xl p-5 h-[80%]">
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-xl font-bold text-cyber-green">Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X color="#00ff88" size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {notifications.map(notif => (
                  <View 
                    key={notif.id} 
                    className={`rounded-xl p-4 mb-2 border ${
                      notif.unread 
                        ? 'bg-cyber-green/10 border-cyber-green' 
                        : 'bg-cyber-green/5 border-cyber-green/20'
                    }`}
                  >
                    <Text className="text-cyber-cyan text-xs mb-1">{notif.time}</Text>
                    <Text className="text-white text-sm leading-5">{notif.text}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Sidebar Modal */}
      <Modal
        visible={showSidebar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSidebar(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/80 justify-end"
          activeOpacity={1}
          onPress={() => setShowSidebar(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-[#00140f]/98 border-t-2 border-cyber-green/30 rounded-t-3xl p-5 h-[85%]">
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-xl font-black text-cyber-green tracking-wide">MENU</Text>
                <TouchableOpacity onPress={() => setShowSidebar(false)}>
                  <X color="#00ff88" size={24} />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                <Text className="text-xs text-cyber-cyan font-semibold mt-5 mb-2 tracking-widest">
                  DISCOVER
                </Text>
                <SidebarItem icon={TrendingUp} text="Trending" onPress={() => setShowSidebar(false)} />
                <SidebarItem icon={Calendar} text="Calendar" onPress={() => setShowSidebar(false)} />
                <SidebarItem icon={Target} text="For You" onPress={() => setShowSidebar(false)} />

                <Text className="text-xs text-cyber-cyan font-semibold mt-5 mb-2 tracking-widest">
                  CATEGORIES
                </Text>
                <SidebarItem icon={Film} text="Cultural" onPress={() => { setActiveFilter('cultural'); setShowSidebar(false); }} />
                <SidebarItem icon={Code} text="Technical" onPress={() => { setActiveFilter('technical'); setShowSidebar(false); }} />
                <SidebarItem icon={Trophy} text="Sports" onPress={() => { setActiveFilter('sports'); setShowSidebar(false); }} />
                <SidebarItem icon={Palette} text="Arts" onPress={() => setShowSidebar(false)} />
                <SidebarItem icon={GraduationCap} text="Academic" onPress={() => setShowSidebar(false)} />

                <Text className="text-xs text-cyber-cyan font-semibold mt-5 mb-2 tracking-widest">
                  OPPORTUNITIES
                </Text>
                <SidebarItem icon={Briefcase} text="Internships" onPress={() => setShowSidebar(false)} />
                <SidebarItem icon={Mic2} text="Interviews" onPress={() => { setActiveFilter('interviews'); setShowSidebar(false); }} />
                <SidebarItem icon={BookOpen} text="Workshops" onPress={() => { setActiveFilter('workshops'); setShowSidebar(false); }} />

                <Text className="text-xs text-cyber-cyan font-semibold mt-5 mb-2 tracking-widest">
                  ACCOUNT
                </Text>
                <SidebarItem icon={LogOut} text="Logout" onPress={handleLogout} />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}