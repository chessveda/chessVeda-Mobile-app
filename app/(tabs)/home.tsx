import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import human from '@/assets/images/human.png';
import bullet from '@/assets/images/bullet.png';
import rapid from '@/assets/images/rapid.png';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/components/context/authContext';
import { EXPO_PUBLIC_API_URL } from '@env';
import { Redirect, useRouter } from 'expo-router';
import GameScreen from './gameScreen';

const API_URL = EXPO_PUBLIC_API_URL


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background similar to web version
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  cardContainer: {
    backgroundColor: '#1E1E1E', // Overlay dark color
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
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
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    color: '#888888',
    marginTop: 4,
  },
  recentGameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3D3D3D',
  },
  recentGamePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

const GameModeCard = () => {
  const [selectedTime, setSelectedTime] = useState(10 * 60);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handlePlay = () => {
    setIsSearching(true);
    setTimeout(() => {
      router.push('/(tabs)/gameScreen');
      setIsSearching(false);
    }, 500); // Small delay for better UX
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
  const [profile, setProfile] = useState(null);
    const auth = useContext(AuthContext);
    const userId = useContext(AuthContext);

    if (!userId) {
      return <Redirect href="/auth" />;
    }
  

    
  

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
          console.log("Profile data:", response.data.user);
        } catch (err) {
          console.log("Profile fetch error:", err);
        }
      };
  
      fetchProfile();
    }, [auth.userId]);

  return (
    <View style={styles.cardContainer}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
        <Ionicons name="person-circle" size={80} color="#808080" />
        <View style={{marginLeft: 12}}>
          <Text style={styles.cardTitle}>
            {profile ? `Hello, ${profile.name}` : 'Hello, There'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {profile ? `Rating: ${profile.rating}` : 'Rating: Loading...'}
          </Text>
          <Text style={styles.cardSubtitle}>Super Challenger</Text>
        </View>
      </View>

      <Text style={{color: '#888888', marginBottom: 12}}>Last 30d Activity</Text>

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
    { id: '1', type: 'bullet', opponent: 'Koby', rating: 1304 },
    { id: '2', type: 'rapid', opponent: 'Alex', rating: 1250 },
    { id: '3', type: 'bullet', opponent: 'Maria', rating: 1375 },
  ];

  const getGameTypeImage = (type) => {
    switch(type) {
      case 'bullet': return bullet;
      case 'rapid': return rapid;
      default: return bullet;
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16}}>
        <Text style={styles.cardTitle}>Recent Games</Text>
        <TouchableOpacity>
          <Text style={{color: '#4CAF50', textDecorationLine: 'underline'}}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentGames.map((game) => (
        <View key={game.id} style={styles.recentGameRow}>
          <View style={styles.recentGamePlayer}>
            <Image source={getGameTypeImage(game.type)} style={{width: 30, height: 30, marginRight: 12}} />
            <View>
              <Text style={styles.playerName}>{game.opponent} ({game.rating})</Text>
            </View>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{
              width: 30, 
              height: 30, 
              borderRadius: 15, 
              backgroundColor: '#FF5252', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginRight: 8
            }}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>-</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
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
        <GameModeCard />
        <RecentGameCard />
      </ScrollView>
    </SafeAreaView>
  );
}