import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StatusBar,
    ActivityIndicator, RefreshControl, Modal, ScrollView, Alert,
    TextInput, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, MapPin, Clock, RefreshCw, Inbox, X, Mail, Calendar, Trash2, Plus, SlidersHorizontal, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../src/api/client';
import { useTheme } from '../../src/context/ThemeContext';

const ACCENT = '#CCF900';

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
    personal:         { label: 'Personal',         icon: '👤' },
    clubs:            { label: 'Clubs',             icon: '🎯' },
    interviews:       { label: 'Interviews',        icon: '💼' },
    mess:             { label: 'Mess',              icon: '🍽️' },
    google_classroom: { label: 'Classroom',         icon: '📚' },
    lost_found:       { label: 'Lost & Found',      icon: '🔍' },
    academic:         { label: 'Academic',          icon: '🎓' },
    general:          { label: 'General',           icon: '📌' },
};

interface PersonalEvent {
    _id: string;
    title: string;
    description?: string;
    icon: string;
    badge: 'LIVE' | 'UPCOMING';
    date: string;
    timeDisplay: string;
    location: string;
    color?: string;
    sourceFrom: string;
    sourceSubject: string;
    category?: string;
}

const FILTERS = [
    { label: 'ALL', value: 'all' },
    { label: 'PERSONAL', value: 'personal' },
    { label: 'CLUBS', value: 'clubs' },
    { label: 'INTERVIEWS', value: 'interviews' },
    { label: 'MESS', value: 'mess' },
    { label: 'CLASSROOM', value: 'google_classroom' },
    { label: 'LOST & FOUND', value: 'lost_found' },
    { label: 'ACADEMIC', value: 'academic' },
    { label: 'GENERAL', value: 'general' },
];

export default function InboxScreen() {
    const { isDark } = useTheme();
    const [events, setEvents] = useState<PersonalEvent[]>([]);
    const [mutedCategories, setMutedCategories] = useState<string[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rescanning, setRescanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<PersonalEvent | null>(null);

    // Mute preferences sheet
    const [showMuteSheet, setShowMuteSheet] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);

    // Create manual event modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newTimeDisplay, setNewTimeDisplay] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newCategory, setNewCategory] = useState('personal');
    const [creating, setCreating] = useState(false);
    const [pickedDate, setPickedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const colors = {
        bg: isDark ? '#050505' : '#FFFFFF',
        card: isDark ? '#0F0F0F' : '#FFFFFF',
        border: isDark ? '#1E1E1E' : '#E5E5E5',
        text: isDark ? '#fff' : '#000',
        subtext: isDark ? '#555' : '#888',
        input: isDark ? '#1A1A1A' : '#F0F0F0',
        sheet: isDark ? '#0D0D0D' : '#FFFFFF',
    };

    const filteredEvents = filter === 'all' ? events : events.filter((e: any) => e.category === filter);

    const fetchEvents = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        setError(null);
        try {
            const response = await api.get('/personal-events');
            setEvents(response.data?.events || []);
            setMutedCategories(response.data?.mutedCategories || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load smart inbox.');
        } finally {
            setLoading(false);
            if (isRefreshing) setRefreshing(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Event', 'Remove this event from your inbox?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/personal-events/${id}`);
                        setEvents(prev => prev.filter(e => e._id !== id));
                        if (selectedEvent?._id === id) setSelectedEvent(null);
                    } catch {
                        Alert.alert('Error', 'Failed to delete event.');
                    }
                },
            },
        ]);
    };

    const handleToggleMute = async (category: string) => {
        const isCurrentlyMuted = mutedCategories.includes(category);
        const newMuted = isCurrentlyMuted
            ? mutedCategories.filter(c => c !== category)
            : [...mutedCategories, category];

        setSavingPrefs(true);
        try {
            await api.patch('/personal-events/preferences', { mutedCategories: newMuted });
            setMutedCategories(newMuted);
            // Hide events from newly muted category immediately
            if (!isCurrentlyMuted) {
                setEvents(prev => prev.filter(e => e.category !== category));
            } else {
                // Refresh to pull in unmuted events
                fetchEvents(true);
            }
        } catch {
            Alert.alert('Error', 'Failed to save preferences.');
        } finally {
            setSavingPrefs(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newTitle.trim()) {
            Alert.alert('Missing fields', 'Title is required.');
            return;
        }
        setCreating(true);
        try {
            // Format time display from pickedDate if user didn't type one
            const autoTime = pickedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const res = await api.post('/personal-events', {
                title: newTitle.trim(),
                description: newDescription.trim(),
                date: pickedDate.toISOString(),
                timeDisplay: newTimeDisplay.trim() || autoTime,
                location: newLocation.trim() || 'TBD',
                category: newCategory,
            });
            setEvents(prev => [res.data.event, ...prev]);
            setShowCreateModal(false);
            setNewTitle(''); setNewDescription(''); setNewTimeDisplay('');
            setNewLocation(''); setNewCategory('personal');
            setPickedDate(new Date());
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to create event.');
        } finally {
            setCreating(false);
        }
    };

    const handleRescan = async () => {
        Alert.alert(
            'Re-scan Inbox',
            'This will clear your current events and re-analyse your Gmail. Results appear within 5 minutes.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Re-scan', style: 'destructive',
                    onPress: async () => {
                        setRescanning(true);
                        try {
                            await api.post('/personal-events/rescan');
                            setEvents([]);
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Re-scan failed.');
                        } finally {
                            setRescanning(false);
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => { fetchEvents(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEvents(true);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const renderEvent = ({ item }: { item: PersonalEvent }) => {
        const cardColor = item.color || ACCENT;
        return (
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSelectedEvent(item)}
                style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    marginBottom: hp('1.5%'),
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: 'hidden',
                    ...(isDark ? {} : { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 })
                }}
            >
                <View style={{ height: 3, backgroundColor: cardColor }} />

                <View style={{ padding: wp('4%') }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: wp('3%') }}>
                        <Text style={{ fontSize: hp('3%'), marginTop: 2 }}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: hp('1.9%'), lineHeight: hp('2.5%') }} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={{ color: colors.subtext, fontSize: hp('1.3%'), marginTop: 2 }} numberOfLines={1}>
                                {item.sourceFrom}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {item.badge === 'LIVE' && (
                                <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: wp('2%'), paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                                    <Text style={{ color: '#EF4444', fontSize: hp('1.1%'), fontWeight: '900', letterSpacing: 1 }}>● LIVE</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={() => handleDelete(item._id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Trash2 size={hp('1.8%')} color={isDark ? '#333' : '#CCC'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {item.description ? (
                        <Text style={{ color: isDark ? '#888' : '#666', fontSize: hp('1.5%'), marginTop: hp('1%'), lineHeight: hp('2.2%') }} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('1.2%'), gap: wp('4%') }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={hp('1.5%')} color={cardColor} />
                            <Text style={{ color: cardColor, fontSize: hp('1.35%'), fontWeight: '700' }}>
                                {formatDate(item.date)} · {item.timeDisplay}
                            </Text>
                        </View>
                        {item.location !== 'TBD' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MapPin size={hp('1.5%')} color={colors.subtext} />
                                <Text style={{ color: colors.subtext, fontSize: hp('1.35%') }} numberOfLines={1}>{item.location}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={{
                    paddingHorizontal: wp('5%'),
                    paddingTop: hp('1%'),
                    paddingBottom: hp('1.5%'),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                            <Zap size={hp('1.5%')} color={ACCENT} fill={ACCENT} />
                            <Text style={{ color: ACCENT, fontSize: hp('1.2%'), fontWeight: '800', letterSpacing: 2 }}>
                                AI-PARSED · GMAIL
                            </Text>
                        </View>
                        <Text style={{ color: colors.text, fontWeight: '900', fontSize: hp('3.2%'), letterSpacing: -0.5 }}>
                            Smart Inbox
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: wp('2%'), alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => setShowMuteSheet(true)}
                            style={{ width: wp('10%'), height: wp('10%'), backgroundColor: isDark ? '#121212' : '#F5F5F7', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#222' : '#EEE' }}
                        >
                            <SlidersHorizontal size={hp('2%')} color={isDark ? '#888' : '#666'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleRescan}
                            disabled={rescanning}
                            style={{ width: wp('10%'), height: wp('10%'), backgroundColor: isDark ? '#121212' : '#F5F5F7', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#222' : '#EEE' }}
                        >
                            {rescanning
                                ? <ActivityIndicator size="small" color={ACCENT} />
                                : <Zap size={hp('2%')} color={ACCENT} />
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => fetchEvents(false)}
                            disabled={loading}
                            style={{ width: wp('10%'), height: wp('10%'), backgroundColor: isDark ? '#121212' : '#F5F5F7', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#222' : '#EEE' }}
                        >
                            <RefreshCw color={loading ? (isDark ? '#333' : '#CCC') : (isDark ? '#888' : '#666')} size={hp('2%')} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Chips */}
                <View style={{ height: hp('6%'), marginBottom: hp('1%') }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: wp('5%'), alignItems: 'center' }}
                    >
                        {FILTERS.map(f => {
                            const active = filter === f.value;
                            const muted = f.value !== 'all' && mutedCategories.includes(f.value);
                            return (
                                <TouchableOpacity
                                    key={f.value}
                                    onPress={() => setFilter(f.value)}
                                    style={{ marginRight: wp('2.5%') }}
                                >
                                    <View style={{
                                        paddingHorizontal: wp('5%'),
                                        paddingVertical: hp('1.2%'),
                                        borderRadius: 999,
                                        backgroundColor: active ? ACCENT : 'transparent',
                                        borderWidth: 1,
                                        borderColor: active ? ACCENT : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
                                        opacity: muted ? 0.4 : 1,
                                    }}>
                                        <Text style={{ color: active ? '#000' : (isDark ? '#777' : '#999'), fontWeight: '700', fontSize: hp('1.4%') }}>
                                            {f.label}{muted ? ' 🔕' : ''}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Content */}
                <View style={{ flex: 1, paddingHorizontal: wp('5%') }}>
                    {loading && !refreshing ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={ACCENT} />
                            <Text style={{ color: colors.subtext, marginTop: hp('2%'), fontSize: hp('1.5%') }}>
                                Loading inbox...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp('10%') }}>
                            <Text style={{ color: '#ff4444', textAlign: 'center', fontSize: hp('1.8%') }}>{error}</Text>
                        </View>
                    ) : events.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp('10%') }}>
                            <Inbox color={isDark ? "#222" : "#EEE"} size={hp('7%')} />
                            <Text style={{ color: colors.text, fontWeight: '800', fontSize: hp('2.2%'), marginTop: hp('2%'), textAlign: 'center' }}>
                                No events yet
                            </Text>
                            <Text style={{ color: isDark ? '#444' : '#999', fontSize: hp('1.5%'), textAlign: 'center', marginTop: hp('1%'), lineHeight: hp('2.2%') }}>
                                PulseBoard scans your Gmail every 5 min.{'\n'}Tap ⚡ to force a fresh re-scan.
                            </Text>
                        </View>
                    ) : filteredEvents.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: isDark ? '#444' : '#999', fontSize: hp('1.6%') }}>
                                No {FILTERS.find(f => f.value === filter)?.label} events
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredEvents}
                            keyExtractor={(item) => item._id}
                            renderItem={renderEvent}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: hp('10%'), paddingTop: hp('0.5%') }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={ACCENT}
                                    colors={[ACCENT]}
                                />
                            }
                        />
                    )}
                </View>
            </SafeAreaView>


            {/* ── Event Detail Modal ── */}
            <Modal
                visible={!!selectedEvent}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedEvent(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8',
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        maxHeight: hp('90%'),
                        overflow: 'hidden',
                    }}>
                        {selectedEvent && (() => {
                            const cardColor = selectedEvent.color || ACCENT;
                            const catMeta = CATEGORY_META[selectedEvent.category || 'general'];
                            return (
                                <>
                                    {/* Hero Banner */}
                                    <View style={{
                                        height: hp('18%'),
                                        backgroundColor: cardColor + '22',
                                        borderTopLeftRadius: 28,
                                        borderTopRightRadius: 28,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        borderBottomWidth: 1,
                                        borderBottomColor: cardColor + '44',
                                    }}>
                                        {/* Decorative blobs */}
                                        <View style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: cardColor + '18' }} />
                                        <View style={{ position: 'absolute', bottom: -30, right: -10, width: 130, height: 130, borderRadius: 65, backgroundColor: cardColor + '12' }} />

                                        {/* Close & Delete row */}
                                        <View style={{ position: 'absolute', top: hp('1.5%'), left: wp('4%'), right: wp('4%'), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                onPress={() => setSelectedEvent(null)}
                                                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <X color="#fff" size={15} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDelete(selectedEvent._id)}
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)' }}
                                            >
                                                <Trash2 size={13} color="#FF6B6B" />
                                                <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '800' }}>DELETE</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Big emoji */}
                                        <Text style={{ fontSize: hp('6%'), marginBottom: 6 }}>{selectedEvent.icon}</Text>

                                        {/* Badges row */}
                                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                            {catMeta && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20 }}>
                                                    <Text style={{ fontSize: 11 }}>{catMeta.icon}</Text>
                                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>{catMeta.label.toUpperCase()}</Text>
                                                </View>
                                            )}
                                            {selectedEvent.badge === 'LIVE' && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(239,68,68,0.4)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.7)' }}>
                                                    <Text style={{ color: '#FF6B6B', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>● LIVE NOW</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <ScrollView contentContainerStyle={{ padding: wp('5%'), paddingTop: hp('2%') }} showsVerticalScrollIndicator={false}>

                                        {/* Title */}
                                        <Text style={{ color: colors.text, fontWeight: '900', fontSize: hp('2.6%'), lineHeight: hp('3.5%'), marginBottom: hp('1.5%') }}>
                                            {selectedEvent.title}
                                        </Text>

                                        {/* Description */}
                                        {selectedEvent.description ? (
                                            <Text style={{ color: isDark ? '#AAA' : '#555', fontSize: hp('1.7%'), lineHeight: hp('2.7%'), marginBottom: hp('2.5%') }}>
                                                {selectedEvent.description}
                                            </Text>
                                        ) : null}

                                        {/* Info chips row */}
                                        <View style={{ flexDirection: 'row', gap: wp('2.5%'), marginBottom: hp('2.5%'), flexWrap: 'wrap' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: isDark ? '#141414' : '#EFEFEF', borderRadius: 14, borderWidth: 1, borderColor: isDark ? '#222' : '#E0E0E0' }}>
                                                <Calendar size={13} color={cardColor} />
                                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: hp('1.45%') }}>
                                                    {new Date(selectedEvent.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: isDark ? '#141414' : '#EFEFEF', borderRadius: 14, borderWidth: 1, borderColor: isDark ? '#222' : '#E0E0E0' }}>
                                                <Clock size={13} color={cardColor} />
                                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: hp('1.45%') }}>
                                                    {selectedEvent.timeDisplay}
                                                </Text>
                                            </View>
                                            {selectedEvent.location !== 'TBD' && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: isDark ? '#141414' : '#EFEFEF', borderRadius: 14, borderWidth: 1, borderColor: isDark ? '#222' : '#E0E0E0' }}>
                                                    <MapPin size={13} color={cardColor} />
                                                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: hp('1.45%') }}>
                                                        {selectedEvent.location}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Source card */}
                                        <View style={{ backgroundColor: isDark ? '#111' : '#F0F0F0', borderRadius: 16, padding: wp('4%'), borderWidth: 1, borderColor: isDark ? '#1E1E1E' : '#E5E5E5' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <Mail size={13} color={isDark ? '#555' : '#999'} />
                                                <Text style={{ color: isDark ? '#555' : '#999', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>SOURCE EMAIL</Text>
                                            </View>
                                            <Text style={{ color: isDark ? '#CCC' : '#333', fontWeight: '700', fontSize: hp('1.6%'), marginBottom: 4 }}>
                                                {selectedEvent.sourceFrom || '—'}
                                            </Text>
                                            <Text style={{ color: isDark ? '#555' : '#888', fontSize: hp('1.4%'), lineHeight: hp('2.1%') }} numberOfLines={3}>
                                                {selectedEvent.sourceSubject}
                                            </Text>
                                        </View>

                                        <View style={{ height: hp('3%') }} />
                                    </ScrollView>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            {/* ── Category Mute Sheet ── */}
            <Modal
                visible={showMuteSheet}
                animationType="slide"
                transparent
                onRequestClose={() => setShowMuteSheet(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: colors.sheet,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: wp('6%'),
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('2.5%') }}>
                            <View>
                                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Category Filters</Text>
                                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>Muted categories won't appear in your inbox</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowMuteSheet(false)}
                                style={{ width: wp('8%'), height: wp('8%'), backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X color={isDark ? "#666" : "#AAA"} size={hp('2%')} />
                            </TouchableOpacity>
                        </View>

                        {Object.entries(CATEGORY_META).map(([key, meta]) => {
                            const isMuted = mutedCategories.includes(key);
                            return (
                                <View
                                    key={key}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: hp('1.5%'),
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.border,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
                                        <Text style={{ color: isMuted ? colors.subtext : colors.text, fontWeight: '600', fontSize: 15 }}>
                                            {meta.label}
                                        </Text>
                                        {isMuted && (
                                            <Text style={{ color: '#555', fontSize: 11, fontWeight: '700' }}>MUTED</Text>
                                        )}
                                    </View>
                                    <Switch
                                        value={!isMuted}
                                        onValueChange={() => handleToggleMute(key)}
                                        disabled={savingPrefs}
                                        trackColor={{ false: isDark ? '#333' : '#DDD', true: ACCENT }}
                                        thumbColor={isMuted ? (isDark ? '#555' : '#BBB') : '#000'}
                                    />
                                </View>
                            );
                        })}

                        <View style={{ height: hp('2%') }} />
                    </View>
                </View>
            </Modal>

            {/* ── Create Manual Event Modal ── */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: colors.sheet,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderWidth: 1,
                        borderColor: colors.border,
                        maxHeight: hp('90%'),
                    }}>
                        <ScrollView contentContainerStyle={{ padding: wp('6%') }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('2.5%') }}>
                                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Add Event</Text>
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    style={{ width: wp('8%'), height: wp('8%'), backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X color={isDark ? "#666" : "#AAA"} size={hp('2%')} />
                                </TouchableOpacity>
                            </View>

                            {/* Title */}
                            <View style={{ marginBottom: hp('1.8%') }}>
                                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 }}>TITLE *</Text>
                                <TextInput
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                    placeholder="e.g. Placement Talk by Google"
                                    placeholderTextColor={isDark ? '#444' : '#BBB'}
                                    style={{ backgroundColor: colors.input, color: colors.text, borderRadius: 12, padding: hp('1.6%'), fontSize: 15, borderWidth: 1, borderColor: colors.border }}
                                />
                            </View>

                            {/* Description */}
                            <View style={{ marginBottom: hp('1.8%') }}>
                                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 }}>DESCRIPTION</Text>
                                <TextInput
                                    value={newDescription}
                                    onChangeText={setNewDescription}
                                    placeholder="Optional details..."
                                    placeholderTextColor={isDark ? '#444' : '#BBB'}
                                    multiline
                                    numberOfLines={2}
                                    style={{ backgroundColor: colors.input, color: colors.text, borderRadius: 12, padding: hp('1.6%'), fontSize: 15, borderWidth: 1, borderColor: colors.border }}
                                />
                            </View>

                            {/* Date picker */}
                            <View style={{ marginBottom: hp('1.8%') }}>
                                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 }}>DATE *</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.input, borderRadius: 12, padding: hp('1.6%'), borderWidth: 1, borderColor: colors.border }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Calendar size={16} color={ACCENT} />
                                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
                                            {pickedDate.toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                        </Text>
                                    </View>
                                    <ChevronDown size={16} color={colors.subtext} />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={pickedDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        minimumDate={new Date()}
                                        onChange={(_, selected) => {
                                            setShowDatePicker(false);
                                            if (selected) setPickedDate(prev => {
                                                const d = new Date(selected);
                                                d.setHours(prev.getHours(), prev.getMinutes());
                                                return d;
                                            });
                                        }}
                                    />
                                )}
                            </View>

                            {/* Time picker */}
                            <View style={{ marginBottom: hp('1.8%') }}>
                                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 }}>TIME *</Text>
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.input, borderRadius: 12, padding: hp('1.6%'), borderWidth: 1, borderColor: colors.border }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Clock size={16} color={ACCENT} />
                                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
                                            {pickedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <ChevronDown size={16} color={colors.subtext} />
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={pickedDate}
                                        mode="time"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, selected) => {
                                            setShowTimePicker(false);
                                            if (selected) setPickedDate(prev => {
                                                const d = new Date(prev);
                                                d.setHours(selected.getHours(), selected.getMinutes());
                                                return d;
                                            });
                                        }}
                                    />
                                )}
                                {/* Optional custom display label */}
                                <TextInput
                                    value={newTimeDisplay}
                                    onChangeText={setNewTimeDisplay}
                                    placeholder={`e.g. ${pickedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – 7:00 PM (optional override)`}
                                    placeholderTextColor={isDark ? '#333' : '#CCC'}
                                    style={{ backgroundColor: 'transparent', color: isDark ? '#666' : '#AAA', fontSize: 12, marginTop: 6, paddingHorizontal: 4 }}
                                />
                            </View>

                            {/* Location */}
                            <View style={{ marginBottom: hp('1.8%') }}>
                                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 }}>LOCATION</Text>
                                <TextInput
                                    value={newLocation}
                                    onChangeText={setNewLocation}
                                    placeholder="e.g. Auditorium (leave blank for TBD)"
                                    placeholderTextColor={isDark ? '#444' : '#BBB'}
                                    style={{ backgroundColor: colors.input, color: colors.text, borderRadius: 12, padding: hp('1.6%'), fontSize: 15, borderWidth: 1, borderColor: colors.border }}
                                />
                            </View>

                            {/* Category picker */}
                            <View style={{ marginBottom: hp('2.5%') }}>
                                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>CATEGORY</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => setNewCategory(key)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                marginRight: 8,
                                                backgroundColor: newCategory === key ? ACCENT : 'transparent',
                                                borderColor: newCategory === key ? ACCENT : colors.border,
                                            }}
                                        >
                                            <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                                            <Text style={{ color: newCategory === key ? '#000' : colors.subtext, fontWeight: '700', fontSize: 13 }}>
                                                {meta.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateEvent}
                                disabled={creating}
                                activeOpacity={0.85}
                                style={{
                                    backgroundColor: ACCENT,
                                    borderRadius: 14,
                                    padding: hp('1.8%'),
                                    alignItems: 'center',
                                    marginBottom: hp('1.5%'),
                                    opacity: creating ? 0.7 : 1,
                                }}
                            >
                                {creating
                                    ? <ActivityIndicator size="small" color="#000" />
                                    : <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>ADD EVENT</Text>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                                activeOpacity={0.7}
                                style={{ alignItems: 'center', padding: hp('1%') }}
                            >
                                <Text style={{ color: '#555', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>

                            <View style={{ height: hp('2%') }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
