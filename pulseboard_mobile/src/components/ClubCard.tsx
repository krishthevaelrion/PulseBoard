import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Image } from "react-native";
import { Check } from 'lucide-react-native';

export default function ClubCard({ icon, name, image, description, isFollowed, isLoading, onFollowPress, onCardPress }: any) {
  return (
    <View style={{ width: Platform.OS === 'web' ? '48%' : '47%', marginBottom: 15 }}>
      <View 
        style={{
          height: 220,
          backgroundColor: isFollowed ? '#0E0E10' : '#09090B',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isFollowed ? 'rgba(204, 249, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          padding: 15,
        }}
      >
        <TouchableOpacity onPress={onCardPress} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 45, height: 45, borderRadius: 12, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {image ? (
                    <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                )}
            </View>
            {isFollowed && <Check size={16} color="#CCF900" strokeWidth={3} />}
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
              {name}
            </Text>
            <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }} numberOfLines={3}>
              {description}
            </Text>
          </View>
        </TouchableOpacity>

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