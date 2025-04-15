//@ts-nocheck

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { AuthContext } from "@/components/context/authContext";
import axios from "axios";

import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserProfile } from "@/types/types";
import { useRouter } from 'expo-router';
const API_URL = "http://172.16.0.112:8080";



const recentGames = [
  {
    id: "1",
    type: "bullet",
    opponent: "Koby (1304)",
    result: "-",
    avatar: "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  },
  {
    id: "2",
    type: "rapid",
    opponent: "Koby (1304)",
    result: "-",
    avatar: "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  },
  {
    id: "3",
    type: "bullet",
    opponent: "Koby (1304)",
    result: "-",
    avatar: "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  },
  {
    id: "4",
    type: "bullet",
    opponent: "Koby (1304)",
    result: "-",
    avatar: "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  },
  {
    id: "5",
    type: "bullet",
    opponent: "Koby (1304)",
    result: "-",
    avatar: "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  },
];

const gameTypes = [
  { name: "Rapid", icon: require("../../assets/images/rapid.png"), rating: "1430" },
  { name: "bullet", icon: require("../../assets/images/bullet.png"), rating: "1254" },
  { name: "Daily", icon: require("../../assets/images/daily.png"), rating: "1200" },
  { name: "Daily04", icon: require("../../assets/images/classical.png"), rating: "1430" },
  { name: "Blitz", icon: require("../../assets/images/blitz.png"), rating: "892" },
  { name: "Puzzles", icon: require("../../assets/images/freestyle.png"), rating: "400" },
];

// Component for the profile header section
const ProfileHeader = ({ profile } : any) => (
  <View style={styles.profileHeader}>
    <View style={styles.profileInfo}>
      {/* Replace icon with image from placeholder service */}
      <Image 
  source={{ uri: "https://randomuser.me/api/portraits/men/75.jpg" }} 
  style={styles.profileImage} 
/>

      <View style={styles.profileText}>
        <Text style={styles.profileName}>
          {profile ? `${profile?.name}` : "Hello, There"}
        </Text>
        <Text style={styles.profileTitle}>Super Challenger</Text>
      </View>
    </View>
  </View>
);

// Component for game type cards
const GameTypeCards = () => (
  <View style={styles.gridContainer}>
    {gameTypes.map((game, index) => (
      <View key={index} style={styles.gameTypeCard}>
        <View style={styles.gameTypeInfo}>
        <Image 
      source={game.icon} 
      style={styles.gameTypeIcon} 
    />
          <Text style={styles.gameTypeName}>{game.name}</Text>
        </View>
        <Text style={styles.gameTypeRating}>{game.rating}</Text>
      </View>
    ))}
  </View>
);


// Component for a single game item
const GameItem = ({ item } : any) => (
  <View>
    <View style={styles.gameItem}>
      <View style={styles.gameInfo}>
        <Image
          source={
            item.type === "bullet"
              ? require("../../assets/images/bullet.png")
              : require("../../assets/images/rapid.png")
          }
          style={styles.gameIcon}
        />
        <View style={styles.opponentInfo}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text style={styles.opponentName}>{item.opponent}</Text>
        </View>
      </View>
      <View style={styles.gameResult}>
        <View style={styles.resultBadge}>
          <Text style={styles.resultText}>{item.result}</Text>
        </View>
        <Icon name="arrow-forward" size={24} color="#fff" />
      </View>
    </View>
    <View style={styles.divider} />
  </View>
);

// Component for the recent games section
const RecentGames = () => (
  <View style={styles.recentGames}>
    <SectionHeader title="Recent Games" children={undefined} />
    <FlatList
      data={recentGames}
      renderItem={({ item }) => <GameItem item={item} />}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
    />
  </View>
);

// Component for section headers
const SectionHeader = ({ title, children } : any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children || (
      <TouchableOpacity>
        <Text style={styles.seeAll}>See All</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Component for the rating activity chart
const RatingActivity = () => {
  const [selectedDot, setSelectedDot] = useState(null);

  const handleDataPointClick = (data : any) => {
    // data.index is the index of the data point pressed
    setSelectedDot(data.index);
  };

  return (
    <View style={{ backgroundColor: '#111', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '400', marginBottom: 8 }}>
        Rating Activity
      </Text>

      <LineChart
        data={{
          labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{ data: [1150, 1100, 1180, 1290, 1250, 1320] }],
        }}
        width={475}
        height={167}
        chartConfig={{
          backgroundColor: '#11111',
          backgroundGradientFrom: '#121212',
          backgroundGradientTo: '#111111',
          color: (opacity = 1) => `rgba(61, 76, 237, ${opacity})`, // #3D4CED
          labelColor: () => '#ffffff',
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#3D4CED',
          },
        }}
        bezier
        withShadow
        withHorizontalLabels={false} 
        style={{ marginLeft:-50}}
        onDataPointClick={handleDataPointClick}
        renderDotContent={({ x, y, index, indexData } : any) => {
          // Only render text if this dot is selected
          if (index === selectedDot) {
            return (
              <Text
                key={index}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: y - 25,
                  color: '#fff',
                  fontWeight: '400',
                  backgroundColor:'#3D4CED'
                }}
              >
                {indexData}
              </Text>
            );
          }
          return null;
        }}
      />
    </View>
  );
};


// Main Profile component
const Profile = () => {
  const auth = useContext(AuthContext);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedMode, setSelectedMode] = useState("Rapid");
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.logout();
    
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/profile/${auth.userId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setProfile(response.data.user);
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ProfileHeader profile={profile} />
        <GameTypeCards />
        <View style={styles.contentContainer}>
        <RatingActivity selectedMode={selectedMode} setSelectedMode={setSelectedMode} />
        <RecentGames />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
     <Text style={styles.logoutButtonText}>Logout</Text>
   </TouchableOpacity>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 10,
  },
  profileHeader: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
  },
  profileInfo: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  profileText: {
    alignItems: "center",
  },
  profileName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "500",
    paddingVertical: 5,
    textAlign: "center",
  },
  profileTitle: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "400",
  },
 
  gameTypesContainer: {
    marginBottom: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  
  gameTypeCard: {
    width: 112,
    height:85,
    backgroundColor: '#3D3D3D',
    borderRadius: 6,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  gameTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameTypeIcon: {
    width: 34,
    height: 34,
    marginRight: 8,
  },
  gameTypeName: {
    color: "#828282",
    fontWeight: "400",
    fontSize: 14,
  },
  gameTypeRating: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    alignSelf: "center",
  },
  contentContainer: {
    flexDirection: "column",
  },
  recentGames: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 400,
  },
  seeAll: {
    color: "#fff",
    textDecorationLine: "underline",
    fontSize:14,
    fontWeight: 400,
  },
  gameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  gameInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  opponentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  opponentName: {
    color: "#fff",
    fontSize: 16,
  },
  gameResult: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultBadge: {
    width: 32,
    height: 32,
    backgroundColor: "#4169E1",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  resultText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#3D3D3D",
  },
  ratingActivity: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    color: '#fff',
    marginRight: 5,
    fontWeight: '500',
    fontSize: 14,
  },
  chartContainer: {
    backgroundColor: '#121212',
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 10,
    height: 240,
  },
  logoutButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Profile;