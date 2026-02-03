import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ClubCard from "../../src/components/ClubCard";

// Club type
type Club = {
  id: number;
  name: string;
  icon: string;
};

const clubs: Club[] = [
  { id: 1, name: "Robotics Society", icon: "🤖" },
  { id: 2, name: "DevIups", icon: "💻" },
  { id: 3, name: "E-Cell", icon: "💡" },
  { id: 4, name: "RAID", icon: "🎯" },
  { id: 5, name: "Photography Club", icon: "📷" },
  { id: 6, name: "Music Society", icon: "🎵" },
  { id: 7, name: "Drama Club", icon: "🎭" },
  { id: 8, name: "Sports Committee", icon: "⚽" },
];

export default function Interests() {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleClub = (id: number): void => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  return (
    <ScrollView 
      className="flex-1 bg-black"
      // Use contentContainerStyle for padding to ensure scrolling works well
      contentContainerStyle={{ paddingHorizontal: wp('5%'), paddingTop: hp('7%'), paddingBottom: hp('5%') }}
    >

      {/* LOGO SECTION */}
      <View style={{ marginBottom: hp('3%'), alignItems: 'center' }}>
        <View 
          className="rounded-full border-2 border-green-400 items-center justify-center"
          style={{ 
            width: wp('28%'), 
            height: wp('28%'), // Keeping height same as width for a perfect circle
            marginBottom: hp('1.5%') 
          }}
        >
          <Text 
            className="text-green-400 font-extrabold"
            style={{ fontSize: hp('4.5%') }} // Responsive font size
          >
            PB
          </Text>
        </View>
        <Text 
          className="text-green-400 font-bold"
          style={{ fontSize: hp('3.2%') }}
        >
          PulseBoard
        </Text>
      </View>

      {/* HEADER TEXT */}
      <Text 
        className="text-green-400 font-semibold text-center"
        style={{ fontSize: hp('2.2%'), marginBottom: hp('0.5%') }}
      >
        Select Your Interests
      </Text>
      <Text 
        className="text-gray-400 text-center"
        style={{ fontSize: hp('1.8%'), marginBottom: hp('3%') }}
      >
        Choose the clubs you'd like to follow
      </Text>

      {/* CLUBS LIST */}
      <View style={{ gap: hp('1.5%') }}> 
        {clubs.map((club) => (
          /* NOTE: Ensure your ClubCard component accepts style props or 
             uses flex/responsive units internally too. 
             If ClubCard has fixed height, consider passing a height prop using hp().
          */
          <View key={club.id}>
             <ClubCard
              icon={club.icon}
              name={club.name}
              selected={selected.includes(club.id)}
              onPress={() => toggleClub(club.id)}
            />
          </View>
        ))}
      </View>

      {/* MAIN BUTTON */}
      <TouchableOpacity
        disabled={selected.length === 0}
        className={`rounded-xl items-center justify-center ${
          selected.length === 0 ? "bg-gray-700" : "bg-green-500"
        }`}
        style={{ 
            marginTop: hp('4%'), 
            paddingVertical: hp('2%'),
            width: wp('90%') // Ensures button is consistent width relative to screen
        }}
      >
        <Text 
            className="text-black font-bold"
            style={{ fontSize: hp('2.2%') }}
        >
          SELECT AT LEAST ONE CLUB
        </Text>
      </TouchableOpacity>

      {/* SKIP BUTTON */}
      <TouchableOpacity 
        className="items-center"
        style={{ marginTop: hp('2%'), marginBottom: hp('5%') }}
      >
        <Text 
            className="text-green-400"
            style={{ fontSize: hp('1.8%') }}
        >
            Skip for now
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}