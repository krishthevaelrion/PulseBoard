import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, 
  StyleSheet, Dimensions, Platform
} from 'react-native';
import { 
  ChevronLeft, ChevronRight, MapPin, 
  Clock, Activity, Layers, Calendar as CalendarIcon,
  RefreshCw, Info
} from 'lucide-react-native';
import { router } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MotiView, AnimatePresence } from 'moti';
import { Easing } from 'react-native-reanimated';
import { fetchLHCHeatmap, LHCBooking } from '../src/api/lhc.api';
import { useTheme } from '../src/context/ThemeContext';

// --- CONFIG & THEME (Dark Only) ---
const THEME_BG_DARK = '#050505';
const THEME_CARD_DARK = '#0E0E10';
const THEME_ACCENT = '#CCF900';
const THEME_BORDER_DARK = '#1E1E1E';
const THEME_RED = '#EF4444';
const LHC_ROOMS = ['110', '205', '206', '305', '306', '308'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
const COL_WIDTH = wp('30%');
const HOUR_HEIGHT = hp('8%');

export default function LHCHeatmapScreen() {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<LHCBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colors = {
    bg: THEME_BG_DARK,
    card: THEME_CARD_DARK,
    text: 'white',
    border: THEME_BORDER_DARK,
  };

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await fetchLHCHeatmap(selectedDate);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // --- DERIVED DATA ---
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
  
  const roomStatus = useMemo(() => {
    const statuses: Record<string, { occupied: boolean; title?: string }> = {};
    LHC_ROOMS.forEach(room => {
      const booking = bookings.find(b => {
        const start = new Date(b.start).getHours() + new Date(b.start).getMinutes() / 60;
        const end = new Date(b.end).getHours() + new Date(b.end).getMinutes() / 60;
        return b.room === room && currentHour >= start && currentHour < end;
      });
      statuses[room] = booking ? { occupied: true, title: booking.title } : { occupied: false };
    });
    return statuses;
  }, [bookings, currentHour]);

  const getEventLayout = (booking: LHCBooking) => {
    const start = new Date(booking.start);
    const end = new Date(booking.end);
    const startH = start.getHours() + start.getMinutes() / 60;
    const endH = end.getHours() + end.getMinutes() / 60;
    
    const top = (startH - 8) * HOUR_HEIGHT;
    const height = (endH - startH) * HOUR_HEIGHT;
    return { top, height };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>LHC HEATMAP</Text>
          <Text style={styles.headerSub}>{selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}</Text>
        </View>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }, refreshing && { opacity: 0.5 }]} onPress={() => loadData(true)} disabled={refreshing}>
          <RefreshCw color={THEME_ACCENT} size={20} />
        </TouchableOpacity>
      </View>

      {/* Real-time Room Status Grid (Scrollable horizontally) */}
      <View style={{ marginBottom: hp('3%') }}>
         <View style={styles.sectionHeader}>
            <Activity color={THEME_ACCENT} size={16} />
            <Text style={[styles.sectionTitle, { color: '#52525B' }]}>REAL-TIME OCCUPANCY</Text>
         </View>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%'), gap: 12 }}>
            {LHC_ROOMS.map((room, i) => {
              const status = roomStatus[room];
              return (
                <MotiView 
                  key={room}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 50 }}
                  style={[
                    styles.roomCard, 
                    { backgroundColor: colors.card, borderColor: colors.border },
                    status.occupied && styles.roomOccupied
                  ]}
                >
                  <Text style={[styles.roomNumber, { color: '#888' }, status.occupied && { color: 'white' }]}>{room}</Text>
                  <View style={[styles.statusBadge, status.occupied ? styles.badgeOccupied : styles.badgeAvailable]}>
                    <MotiView 
                      from={{ scale: 1, opacity: 1 }}
                      animate={{ 
                        scale: status.occupied ? [1, 1.2, 1] : 1,
                        opacity: status.occupied ? [1, 0.6, 1] : 1
                      }}
                      transition={{ 
                        type: 'timing',
                        duration: 1500,
                        loop: true,
                        repeat: Infinity
                      }}
                      style={[styles.dot, status.occupied ? { backgroundColor: THEME_RED } : { backgroundColor: THEME_ACCENT }]} 
                    />
                    <Text style={[styles.statusText, { color: 'white' }]}>{status.occupied ? 'LIVE' : 'FREE'}</Text>
                  </View>
                </MotiView>
              );
            })}
         </ScrollView>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
         <TouchableOpacity onPress={() => changeDate(-1)} style={[styles.navBtn, { backgroundColor: colors.card }]}><ChevronLeft color={colors.text} size={20} /></TouchableOpacity>
         <Text style={[styles.currentDate, { color: colors.text }]}>{isToday(selectedDate) ? 'TODAY' : selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}</Text>
         <TouchableOpacity onPress={() => changeDate(1)} style={[styles.navBtn, { backgroundColor: colors.card }]}><ChevronRight color={colors.text} size={20} /></TouchableOpacity>
      </View>

      {/* Timeline View */}
      <View style={{ flex: 1 }}>
        {loading && !refreshing ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={THEME_ACCENT} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
              {/* Hour Labels */}
              <View style={styles.hourLabelsColumn}>
                {HOURS.map(h => (
                  <View key={h} style={styles.hourLabelWrapper}>
                    <Text style={[styles.hourText, { color: '#3A3A3A' }]}>{h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`}</Text>
                  </View>
                ))}
              </View>

              {/* Room Columns */}
              <View style={{ flexDirection: 'row', position: 'relative' }}>
                {LHC_ROOMS.map((room) => (
                  <View key={room} style={[styles.roomColumn, { borderLeftColor: 'rgba(255,255,255,0.03)' }]}>
                    <View style={styles.colHeader}><Text style={styles.colHeaderText}>{room}</Text></View>
                    <View style={styles.colBody}>
                      {/* Grid Lines */}
                      {HOURS.map(h => (
                        <View key={h} style={[styles.gridLine, { borderBottomColor: 'rgba(255,255,255,0.03)' }]} />
                      ))}

                      {/* Bookings for this room */}
                      {bookings.filter(b => b.room === room).map((booking, idx) => {
                        const { top, height } = getEventLayout(booking);
                        return (
                          <TouchableOpacity 
                            key={idx}
                            activeOpacity={0.8}
                            style={[
                              styles.bookingBlock, 
                              { top, height, borderLeftColor: booking.color || THEME_ACCENT },
                              booking.type === 'personal' && { backgroundColor: 'rgba(255,255,255,0.05)' }
                            ]}
                          >
                            <Text style={[styles.bookingTitle, { color: 'white' }]} numberOfLines={2}>{booking.title}</Text>
                            {height > 40 && <Text style={[styles.bookingType, { color: '#555' }]}>{booking.type.toUpperCase()}</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* CURRENT TIME INDICATOR (Across all columns) */}
                {isToday(selectedDate) && currentHour >= 8 && currentHour <= 21 && (
                  <View 
                    style={[
                      styles.nowIndicator, 
                      { top: (currentHour - 8) * HOUR_HEIGHT + 40 } // +40 for colHeader offset
                    ]}
                  >
                    <View style={styles.nowDot} />
                    <View style={styles.nowLine} />
                  </View>
                )}
              </View>
            </ScrollView>
          </ScrollView>
        )}
      </View>

      <View style={[styles.footerLegend, { borderTopColor: colors.border }]}>
          <View style={styles.legendItem}>
             <View style={[styles.legendDot, { backgroundColor: THEME_ACCENT }]} />
             <Text style={[styles.legendText, { color: '#52525B' }]}>Club Event</Text>
          </View>
          <View style={styles.legendItem}>
             <View style={[styles.legendDot, { backgroundColor: '#555' }]} />
             <Text style={[styles.legendText, { color: '#52525B' }]}>Personal (Email)</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Info color="#444" size={16} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: wp('6%'), paddingVertical: hp('2%') 
  },
  backButton: { 
    width: 40, height: 40, borderRadius: 12, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  headerSub: { color: THEME_ACCENT, fontSize: 11, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  
  sectionHeader: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('7%'), 
    marginBottom: 12, gap: 8 
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  
  roomCard: { 
    width: wp('22%'), padding: 14, 
    borderRadius: 20, borderWidth: 1, alignItems: 'center' 
  },
  roomOccupied: { borderColor: THEME_RED + '44', backgroundColor: THEME_RED + '11' },
  roomNumber: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  statusBadge: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, 
    paddingVertical: 4, borderRadius: 20, gap: 5
  },
  badgeAvailable: { backgroundColor: 'rgba(204,249,0,0.1)' },
  badgeOccupied: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  dateNav: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingHorizontal: wp('6%'), marginBottom: hp('2%'), gap: wp('5%') 
  },
  navBtn: { padding: 8, borderRadius: 10 },
  currentDate: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hourLabelsColumn: { width: wp('14%'), paddingTop: 40 },
  hourLabelWrapper: { height: HOUR_HEIGHT, alignItems: 'center', justifyContent: 'flex-start' },
  hourText: { fontSize: 10, fontWeight: '800' },

  roomColumn: { width: COL_WIDTH, borderLeftWidth: 1 },
  colHeader: { height: 40, alignItems: 'center', justifyContent: 'center' },
  colHeaderText: { color: THEME_ACCENT, fontSize: 12, fontWeight: '900' },
  colBody: { flex: 1, position: 'relative' },
  gridLine: { 
    height: HOUR_HEIGHT, borderBottomWidth: 1
  },

  bookingBlock: { 
    position: 'absolute', left: 4, right: 4, 
    backgroundColor: 'rgba(204,249,0,0.08)', borderLeftWidth: 3, 
    borderRadius: 8, padding: 8, zIndex: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4,
  },
  bookingTitle: { fontSize: 10, fontWeight: '800' },
  bookingType: { fontSize: 8, fontWeight: '600', marginTop: 2 },

  footerLegend: { 
    flexDirection: 'row', padding: wp('6%'), borderTopWidth: 1, 
    alignItems: 'center', gap: 16 
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700' },

  nowIndicator: { 
    position: 'absolute', left: 0, right: 0, 
    flexDirection: 'row', alignItems: 'center', zIndex: 50, pointerEvents: 'none'
  },
  nowLine: { flex: 1, height: 1, backgroundColor: THEME_RED, opacity: 0.6 },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME_RED, position: 'absolute', left: -3 }
});
