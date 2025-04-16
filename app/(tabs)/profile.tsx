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
import { useRouter } from 'expo-router';
import mongoose from 'mongoose';
import RecentGameCard from "@/components/RecentGames/recentGames";
const API_URL = "http://172.16.0.133:8080";

// Define TypeScript interfaces based on the mongoose models
interface RatingHistory {
  rating: number;
  timestamp: Date;
}

interface GameHistory {
  gameId: typeof mongoose.Schema.Types.ObjectId;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  opponentId: typeof mongoose.Schema.Types.ObjectId;
  timestamp: Date;
  opponent?: {
    name: string;
    rating: number;
    avatar?: string;
  };
  timeControl?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female';
  dob: Date;
  country: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  gameHistory: GameHistory[];
  ratingHistory: RatingHistory[];
}

const gameTypes = [
  { name: "Rapid", icon: require("../../assets/images/rapid.png"), ratingKey: "rapid" },
  { name: "Bullet", icon: require("../../assets/images/bullet.png"), ratingKey: "bullet" },
  { name: "Daily", icon: require("../../assets/images/daily.png"), ratingKey: "daily" },
  { name: "Classical", icon: require("../../assets/images/classical.png"), ratingKey: "classical" },
  { name: "Blitz", icon: require("../../assets/images/blitz.png"), ratingKey: "blitz" },
  { name: "Puzzles", icon: require("../../assets/images/freestyle.png"), ratingKey: "puzzles" },
];

// Component for the profile header section
const ProfileHeader = ({ profile }: { profile: UserProfile | null }) => (
  <View style={styles.profileHeader}>
    <View style={styles.profileInfo}>
      {/* Replace icon with image from placeholder service */}
      <Image 
        source={{ uri: "https://randomuser.me/api/portraits/men/75.jpg" }} 
        style={styles.profileImage} 
      />

      <View style={styles.profileText}>
        <Text style={styles.profileName}>
          {profile ? `${profile.name}` : "Hello, There"}
        </Text>
        <Text style={styles.profileTitle}>
          {profile ? `${getRankTitle(profile.rating)}` : "Super Challenger"}
        </Text>
      </View>
    </View>
  </View>
);

// Function to determine rank title based on rating
const getRankTitle = (rating: number): string => {
  if (rating >= 2200) return "Grandmaster";
  if (rating >= 2000) return "Master";
  if (rating >= 1800) return "Expert";
  if (rating >= 1600) return "Advanced";
  if (rating >= 1400) return "Intermediate";
  if (rating >= 1200) return "Novice";
  return "Beginner";
};

// Component for game type cards
const GameTypeCards = ({ profile }: { profile: UserProfile | null }) => {
  
  const getRatingForGameType = (gameType: string, ratingObj: any): string => {
    // Convert gameType to lowercase to match keys like "bullet", "blitz", etc.
    const key = gameType.toLowerCase();
  
    // Fallback to standard rating or 800 if specific rating doesn't exist
    const rating = ratingObj?.[key] ?? ratingObj?.standard ?? 800;
  
    return rating.toString();
  };

  return (
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
          <Text style={styles.gameTypeRating}>
            {profile ? getRatingForGameType(game.name, profile.rating) : "---"}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Component for a single game item
const GameItem = ({ item }: { item: GameHistory }) => {
  // Determine game icon based on timeControl
  const getGameIcon = (timeControl?: string) => {
    if (!timeControl) return require("../../assets/images/rapid.png");
    
    switch(timeControl.toLowerCase()) {
      case 'bullet':
      case 'blitz':
        return require("../../assets/images/bullet.png");
      case 'classical':
      case 'rapid':
      default:
        return require("../../assets/images/rapid.png");
    }
  };
  
  // Get result badge style based on result
  const getResultBadgeStyle = (result: string) => {
    switch(result) {
      case 'win': return { backgroundColor: '#4CAF50' };
      case 'loss': return { backgroundColor: '#FF5252' };
      case 'draw': return { backgroundColor: '#FFC107' };
      default: return { backgroundColor: '#888888' };
    }
  };
  
  // Get result text
  const getResultText = (result: string) => {
    switch(result) {
      case 'win': return '+';
      case 'loss': return '−';
      case 'draw': return '=';
      default: return '−';
    }
  };

  return (
    <View>
      <View style={styles.gameItem}>
        <View style={styles.gameInfo}>
          <Image
            source={getGameIcon(item.timeControl)}
            style={styles.gameIcon}
          />
          <View style={styles.opponentInfo}>
            <Image 
              source={{ 
                uri: item.opponent?.avatar || "https://randomuser.me/api/portraits/men/75.jpg"
              }} 
              style={styles.avatar} 
            />
            <Text style={styles.opponentName}>
              {item.opponent?.name || "Opponent"} ({item.opponent?.rating || 1200})
            </Text>
          </View>
        </View>
        <View style={styles.gameResult}>
          <View style={[styles.resultBadge, getResultBadgeStyle(item.result)]}>
            <Text style={styles.resultText}>{getResultText(item.result)}</Text>
          </View>
          <Icon name="arrow-forward" size={24} color="#fff" />
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
};


// Component for section headers
const SectionHeader = ({ title, children }: { title: string, children?: React.ReactNode }) => (
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
const RatingActivity = ({ 
  selectedMode, 
  setSelectedMode,
  profile
}: { 
  selectedMode: string, 
  setSelectedMode: React.Dispatch<React.SetStateAction<string>>,
  profile: UserProfile | null
}) => {
  const [selectedDot, setSelectedDot] = useState<number | null>(null);

  // Process rating history data for the chart
  const processRatingHistory = () => {
    if (!profile?.ratingHistory || profile.ratingHistory.length === 0) {
      // Return default data if no history
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [1200, 1200, 1200, 1200, 1200, 1200]
      };
    }

    // Sort by timestamp
    const sortedHistory = [...profile.ratingHistory]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Only keep up to 6 most recent entries for display
    const recentHistory = sortedHistory.slice(-6);
    
    // Format labels as month abbreviations
    const labels = recentHistory.map(entry => {
      const date = new Date(entry.timestamp);
      return date.toLocaleString('default', { month: 'short' });
    });
    
    // Extract ratings
    const data = recentHistory.map(entry => entry.rating);
    
    return { labels, data };
  };

  const chartData = processRatingHistory();

  const handleDataPointClick = (data: any) => {
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
          labels: chartData.labels,
          datasets: [{ data: chartData.data }],
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
        renderDotContent={({ x, y, index, indexData }: any) => {
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
    if (!auth?.userId) {
      console.log("User ID is null, waiting...");
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log("Fetching profile for userId:", auth.userId);
        const response = await axios.get(
          `${API_URL}/api/profile/${auth.userId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setProfile(response.data.user);
        console.log("Profile data:", response.data);
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };

    fetchProfile();
  }, [auth?.userId, auth?.token]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ProfileHeader profile={profile} />
        <GameTypeCards profile={profile} />
        <View style={styles.contentContainer}>
          <RatingActivity 
            selectedMode={selectedMode} 
            setSelectedMode={setSelectedMode} 
            profile={profile}
          />
          {/* <RecentGames profile={profile} /> */}
          <RecentGameCard />

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