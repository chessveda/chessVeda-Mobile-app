import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import human from '@/assets/images/human.png';
import bullet from '@/assets/images/bullet.png';
import rapid from '@/assets/images/rapid.png';
import logo from "@/assets/images/logo-icon.png";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/components/context/authContext';
import { UserProfile, TimeControlType } from "@/types/types";
// import { EXPO_PUBLIC_API_URL } from '@env';
import { Redirect, useRouter } from 'expo-router';
import GameScreen from '../newGame';
import { useAuth } from '@/hooks/authHook';

const API_URL = "http://172.16.0.109:8080"


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  logo: {
    height: 70,
    width: 45,
    borderRadius: 25,
  },
  cardContainer: {
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    
  },
  profileContainer: {
    flexDirection: 'row',
    
  },
  
  cardTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop:18,
    marginLeft:10
  },
  cardSubtitle: {
    color: '#888888',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#4CAF50', // Primary color
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    width: '30%',
    height:90,
    paddingVertical:25,
    paddingHorizontal:30,
  },
  statNumber: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    color: '#888888',
    marginTop: 4,
    fontSize:12
  },
  recentGameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },

  recentGamePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },

  gameTypeImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 8, // Reduced spacing between elements
  },

  playerAvatar: {
    width: 40,
    height: 40,
    marginRight: 8, // Reduced spacing
  },

  ratingText: {
    color: '#888888',
    fontSize: 14,
    marginLeft: 4,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  seeAllButton: {
    padding: 4,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

const GameModeCard = () => {
  const [selectedTime, setSelectedTime] = useState(10 * 60);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const {socket, isSocketConnected} = useContext(AuthContext)

  useEffect(() => {
    if (!isSocketConnected) {
      console.log('Attempting to reconnect socket...');
      // connectSocket();
    }
  }, [isSocketConnected]);

  const handlePlay = async () => {

    if (!socket || !socket.connected) {
      console.error("Socket not connected!");
      return;
    }

    setIsSearching(true);

    // Navigate to newGame with the time control parameter
    router.push({
      pathname: "/newGame",
      params: { timeControl: selectedTime.toString() }
    });
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>Start a Game</Text>
      <Text style={styles.cardSubtitle}>Please select the game mode you want to play</Text>

      <View style={{
        flexDirection: 'row', 
        backgroundColor: '#2A2A2A', 
        borderRadius: 12, 
        padding: 12,
        marginBottom: 16
      }}>
        <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
          <Image source={human} style={{width: 50, height: 50, marginRight: 12}} />
          <Text style={{color: '#FFFFFF', fontSize: 16}}>Human</Text>
        </TouchableOpacity>
      </View>

      {/* Time Control Picker */}
      <View style={{
        backgroundColor: '#2A2A2A', 
        borderRadius: 12, 
        padding: 12,
        marginBottom: 16
      }}>
        <Text style={{color: '#FFFFFF', marginBottom: 8}}>10 mins (Rapid)</Text>
      </View>

      {isSearching ? (
        <View>
          <Text style={{color: '#FFFFFF', textAlign: 'center'}}>Searching for opponent...</Text>
          <TouchableOpacity 
            onPress={() => setIsSearching(false)}
            style={[styles.playButton, {backgroundColor: '#FF5252'}]}
          >
            <Text style={styles.playButtonText}>Cancel Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlay}
        >
          <Text style={styles.playButtonText}>Start a New Game</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const StatsCard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
    const auth = useContext(AuthContext);
    const userId = useContext(AuthContext);
    
  
  useEffect(() => {
    if (!auth.userId) {
      console.log("User ID is still null, waiting...");
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
  }, [auth.userId]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.profileContainer}>
          <Ionicons 
            name="person-circle" 
            size={50} 
            color="#808080" 
            style={styles.playerAvatar}
          />
          <Text style={styles.cardTitle}>
            {profile ? `Hello, ${profile.name}` : 'Hello, There'}
          </Text>
        </View>
        <Image source={logo} style={styles.logo} />
      </View>

      <Text style={{color: '#888888', marginTop: 10}}>Last 30d Activity</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, {color: '#4CAF50'}]}>40</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, {color: '#FF5252'}]}>10</Text>
          <Text style={styles.statLabel}>Lose</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, {color: '#FFC107'}]}>02</Text>
          <Text style={styles.statLabel}>Drawn</Text>
        </View>
      </View>
    </View>
  );
};


const RecentGameCard = () => {
  const recentGames = [
    { id: '1', type: 'bullet', opponent: 'Koby', rating: 1304, result: 'loss' },
    { id: '2', type: 'rapid', opponent: 'Alex', rating: 1250, result: 'win' },
    { id: '3', type: 'bullet', opponent: 'Maria', rating: 1375, result: 'draw' },
  ];

  const getGameTypeImage = (type : any) => {
    switch(type) {
      case 'bullet': return bullet;
      case 'rapid': return rapid;
      default: return bullet;
    }
  };

  const getResultStyle = (result : any) => {
    switch(result) {
      case 'win': return { backgroundColor: '#4CAF50' };
      case 'loss': return { backgroundColor: '#FF5252' };
      case 'draw': return { backgroundColor: '#FFC107' };
      default: return { backgroundColor: '#888888' };
    }
  };

  const getResultSymbol = (result : any) => {
    switch(result) {
      case 'win': return '+';
      case 'loss': return '−';
      case 'draw': return '=';
      default: return '−';
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
        <Text style={styles.cardTitle}>Recent Games</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentGames.map((game) => (
        <View key={game.id} style={styles.recentGameRow}>
          <View style={styles.recentGamePlayer}>
            <Image 
              source={getGameTypeImage(game.type)} 
              style={styles.gameTypeImage}
            />
            <Ionicons 
              name="person-circle" 
              size={40} 
              color="#808080" 
              style={styles.playerAvatar}
            />
            <Text style={styles.playerName}>
              {game.opponent}
              <Text style={styles.ratingText}>({game.rating})</Text>
            </Text>
          </View>
          <View style={styles.resultContainer}>
            <View style={[styles.resultIndicator, getResultStyle(game.result)]}>
              <Text style={{color: '#FFFFFF', fontWeight: 'bold', fontSize: 16}}>
                {getResultSymbol(game.result)}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#888888" />
          </View>
        </View>
      ))}
    </View>
  );
};



export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatsCard />
        <RecentGameCard />
        <GameModeCard />
      </ScrollView>
    </SafeAreaView>
  );
}