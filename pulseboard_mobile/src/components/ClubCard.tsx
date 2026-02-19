import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Check } from 'lucide-react-native';

export default function ClubCard({ icon, name, description, isFollowed, isLoading, onFollowPress, onCardPress }: any) {
  return (
    <View style={{ width: Platform.OS === 'web' ? '48%' : '47%', marginBottom: 15 }}>
      <View 
        style={{
          height: 200, // Fixed height is the only way to be 100% sure on Web
          backgroundColor: isFollowed ? '#0E0E10' : '#09090B',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isFollowed ? 'rgba(204, 249, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          padding: 15,
        }}
      >
        <TouchableOpacity onPress={onCardPress} style={{ flex: 1 }}>
          {/* ICON ROW */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 28 }}>{icon}</Text>
            {isFollowed && <Check size={16} color="#CCF900" strokeWidth={3} />}
          </View>

          {/* NAME & DESCRIPTION (Fixed Margin ensures they appear below icon) */}
          <View style={{ marginTop: 10 }}>
            <Text 
              style={{ color: 'white', fontWeight: '900', fontSize: 16 }} 
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text 
              style={{ color: '#666', fontSize: 11, marginTop: 4 }} 
              numberOfLines={2}
            >
              {description}
            </Text>
          </View>
        </TouchableOpacity>

        {/* BUTTON (Locked to bottom) */}
        <TouchableOpacity
          onPress={onFollowPress}
          disabled={isLoading}
          style={{
            height: 40,
            borderRadius: 12,
            backgroundColor: isFollowed ? 'rgba(255, 255, 255, 0.05)' : '#CCF900',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isFollowed ? "white" : "black"} />
          ) : (
            <Text style={{ color: isFollowed ? '#999' : 'black', fontWeight: 'bold', fontSize: 11 }}>
              {isFollowed ? 'FOLLOWING' : 'FOLLOW'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}