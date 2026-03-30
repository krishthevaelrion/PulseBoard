import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StatusBar,
    ActivityIndicator, RefreshControl, Modal, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, MapPin, Clock, RefreshCw, Inbox, X, Mail, Calendar } from 'lucide-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../src/api/client';

const ACCENT = '#CCF900';

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
    { label: 'CLUBS', value: 'clubs' },
    { label: 'INTERVIEWS', value: 'interviews' },
    { label: 'MESS', value: 'mess' },
    { label: 'CLASSROOM', value: 'google_classroom' },
    { label: 'LOST & FOUND', value: 'lost_found' },
    { label: 'ACADEMIC', value: 'academic' },
    { label: 'GENERAL', value: 'general' },
];

export default function InboxScreen() {
    const [events, setEvents] = useState<PersonalEvent[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rescanning, setRescanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<PersonalEvent | null>(null);

    const filteredEvents = filter === 'all' ? events : events.filter((e: any) => e.category === filter);

    const fetchEvents = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        setError(null);
        try {
            const response = await api.get('/personal-events');
            setEvents(response.data?.events || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load smart inbox.');
        } finally {
            setLoading(false);
            if (isRefreshing) setRefreshing(false);
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
                    backgroundColor: '#0F0F0F',
                    borderRadius: 16,
                    marginBottom: hp('1.5%'),
                    borderWidth: 1,
                    borderColor: '#1E1E1E',
                    overflow: 'hidden',
                }}
            >
                {/* Colored top bar */}
                <View style={{ height: 3, backgroundColor: cardColor }} />

                <View style={{ padding: wp('4%') }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: wp('3%') }}>
                        <Text style={{ fontSize: hp('3%'), marginTop: 2 }}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: hp('1.9%'), lineHeight: hp('2.5%') }} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={{ color: '#555', fontSize: hp('1.3%'), marginTop: 2 }} numberOfLines={1}>
                                {item.sourceFrom}
                            </Text>
                        </View>
                        {item.badge === 'LIVE' && (
                            <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: wp('2%'), paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                                <Text style={{ color: '#EF4444', fontSize: hp('1.1%'), fontWeight: '900', letterSpacing: 1 }}>● LIVE</Text>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {item.description ? (
                        <Text style={{ color: '#888', fontSize: hp('1.5%'), marginTop: hp('1%'), lineHeight: hp('2.2%') }} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : null}

                    {/* Footer row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('1.2%'), gap: wp('4%') }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={hp('1.5%')} color={cardColor} />
                            <Text style={{ color: cardColor, fontSize: hp('1.35%'), fontWeight: '700' }}>
                                {formatDate(item.date)} · {item.timeDisplay}
                            </Text>
                        </View>
                        {item.location !== 'TBD' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MapPin size={hp('1.5%')} color="#555" />
                                <Text style={{ color: '#555', fontSize: hp('1.35%') }} numberOfLines={1}>{item.location}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#050505' }}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
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
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: hp('3.2%'), letterSpacing: -0.5 }}>
                            Smart Inbox
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: wp('2%'), alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={handleRescan}
                            disabled={rescanning}
                            style={{ width: wp('10%'), height: wp('10%'), backgroundColor: '#121212', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' }}
                        >
                            {rescanning
                                ? <ActivityIndicator size="small" color={ACCENT} />
                                : <Zap size={hp('2%')} color={ACCENT} />
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => fetchEvents(false)}
                            disabled={loading}
                            style={{ width: wp('10%'), height: wp('10%'), backgroundColor: '#121212', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' }}
                        >
                            <RefreshCw color={loading ? '#333' : '#888'} size={hp('2%')} />
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
                                        borderColor: active ? ACCENT : 'rgba(255,255,255,0.15)',
                                    }}>
                                        <Text style={{ color: active ? '#000' : '#777', fontWeight: '700', fontSize: hp('1.4%') }}>
                                            {f.label}
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
                            <Text style={{ color: '#555', marginTop: hp('2%'), fontSize: hp('1.5%') }}>
                                Loading inbox...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp('10%') }}>
                            <Text style={{ color: '#ff4444', textAlign: 'center', fontSize: hp('1.8%') }}>{error}</Text>
                        </View>
                    ) : events.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp('10%') }}>
                            <Inbox color="#222" size={hp('7%')} />
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: hp('2.2%'), marginTop: hp('2%'), textAlign: 'center' }}>
                                No events yet
                            </Text>
                            <Text style={{ color: '#444', fontSize: hp('1.5%'), textAlign: 'center', marginTop: hp('1%'), lineHeight: hp('2.2%') }}>
                                PulseBoard scans your Gmail every 5 min.{'\n'}Tap ⚡ to force a fresh re-scan.
                            </Text>
                        </View>
                    ) : filteredEvents.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#444', fontSize: hp('1.6%') }}>
                                No {FILTERS.find(f => f.value === filter)?.label} events
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredEvents}
                            keyExtractor={(item) => item._id}
                            renderItem={renderEvent}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: hp('4%'), paddingTop: hp('0.5%') }}
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

            {/* ── Full Event Detail Modal ── */}
            <Modal
                visible={!!selectedEvent}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedEvent(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: '#0D0D0D',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderWidth: 1,
                        borderColor: '#1E1E1E',
                        maxHeight: hp('85%'),
                    }}>
                        {selectedEvent && (
                            <>
                                <View style={{ height: 4, backgroundColor: selectedEvent.color || ACCENT, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />

                                <ScrollView contentContainerStyle={{ padding: wp('6%') }} showsVerticalScrollIndicator={false}>
                                    {/* Close */}
                                    <TouchableOpacity
                                        onPress={() => setSelectedEvent(null)}
                                        style={{ alignSelf: 'flex-end', width: wp('8%'), height: wp('8%'), backgroundColor: '#1A1A1A', borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: hp('1.5%') }}
                                    >
                                        <X color="#666" size={hp('2%')} />
                                    </TouchableOpacity>

                                    {/* Icon + Title */}
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: wp('3%'), marginBottom: hp('2%') }}>
                                        <Text style={{ fontSize: hp('5%') }}>{selectedEvent.icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: hp('2.5%'), lineHeight: hp('3.2%') }}>
                                                {selectedEvent.title}
                                            </Text>
                                            {selectedEvent.badge === 'LIVE' && (
                                                <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', alignSelf: 'flex-start', paddingHorizontal: wp('2.5%'), paddingVertical: 4, borderRadius: 6, marginTop: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                                                    <Text style={{ color: '#EF4444', fontSize: hp('1.3%'), fontWeight: '900', letterSpacing: 1 }}>● LIVE NOW</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {selectedEvent.description ? (
                                        <Text style={{ color: '#999', fontSize: hp('1.7%'), lineHeight: hp('2.6%'), marginBottom: hp('2.5%') }}>
                                            {selectedEvent.description}
                                        </Text>
                                    ) : null}

                                    <View style={{ height: 1, backgroundColor: '#1E1E1E', marginBottom: hp('2.5%') }} />

                                    {/* Date */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%'), marginBottom: hp('2%') }}>
                                        <View style={{ width: wp('9%'), height: wp('9%'), borderRadius: 12, backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={hp('2%')} color={ACCENT} />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#555', fontSize: hp('1.2%'), marginBottom: 2 }}>DATE & TIME</Text>
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: hp('1.8%') }}>
                                                {new Date(selectedEvent.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </Text>
                                            <Text style={{ color: ACCENT, fontSize: hp('1.5%'), marginTop: 2 }}>
                                                {selectedEvent.timeDisplay}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Location */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%'), marginBottom: hp('2%') }}>
                                        <View style={{ width: wp('9%'), height: wp('9%'), borderRadius: 12, backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center' }}>
                                            <MapPin size={hp('2%')} color={ACCENT} />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#555', fontSize: hp('1.2%'), marginBottom: 2 }}>LOCATION</Text>
                                            <Text style={{ color: selectedEvent.location !== 'TBD' ? '#fff' : '#444', fontWeight: '600', fontSize: hp('1.8%') }}>
                                                {selectedEvent.location}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ height: 1, backgroundColor: '#1E1E1E', marginBottom: hp('2.5%') }} />

                                    {/* Source */}
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: wp('3%') }}>
                                        <View style={{ width: wp('9%'), height: wp('9%'), borderRadius: 12, backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center' }}>
                                            <Mail size={hp('2%')} color="#555" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#555', fontSize: hp('1.2%'), marginBottom: 2 }}>FROM</Text>
                                            <Text style={{ color: '#888', fontSize: hp('1.6%') }}>{selectedEvent.sourceFrom || '—'}</Text>
                                            <Text style={{ color: '#444', fontSize: hp('1.4%'), marginTop: 4 }} numberOfLines={3}>
                                                {selectedEvent.sourceSubject}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ height: hp('3%') }} />
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
