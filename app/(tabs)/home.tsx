import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import human from '@/assets/images/human.png';
import bot from '@/assets/images/bot.png';
import bullet from '@/assets/images/bullet.png';
import rapid from '@/assets/images/rapid.png';
import logo from "@/assets/images/logo2.png";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/components/context/authContext';
import { UserProfile, TimeControlType } from "@/types/types";
// import { EXPO_PUBLIC_API_URL } from '@env';
import GameScreen from '../newGame';
import { useAuth } from '@/hooks/authHook';
import { useRouter } from 'expo-router';

const API_URL = "http://172.16.0.112:8080"


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Add padding to bottom to account for fixed button
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
    marginTop: 15,
    marginLeft: 10
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#ffffff',
    marginTop: 10,
    marginBottom: 15,
    marginLeft: 10,
  },
  playButton: {
    backgroundColor: '#3D4CED', // Primary color
    borderRadius: 44,
    padding: 16,
    alignItems: "center",
    width: 370,
    height: 53,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton2: {
    backgroundColor: '#3D4CED', // Primary color
    borderRadius: 44,
    padding: 16,
    alignItems: 'center',
    width: 370,
    height: 53,
    position: 'absolute',
    bottom: 8, // Adjusted from 35 to 20 to position button slightly lower
    alignSelf: 'center',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  playButtonText2: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
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
    height: 90,
    paddingVertical: 25,
    paddingHorizontal: 30,
  },
  statNumber: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    color: '#888888',
    marginTop: 4,
    fontSize: 12
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#292929',
    borderRadius: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: 402,
    height: 406
  },
  opponentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  opponentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 6,
    height: 100,
    width: 177,
    padding: 12,
    marginHorizontal: 4,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#555554',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000, // Add zIndex to the wrapper to ensure dropdown appears above other elements
  },
  
  timeDropdown: {
    backgroundColor: '#4F4F4F',
    width: 370,
    height: 53,
    marginTop:15,
    borderRadius: 4,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  
  timeDropdownExpanded: {
    height: 0, // Reduced height when expanded
    borderBottomLeftRadius: 0, // Remove bottom radius when expanded
    borderBottomRightRadius: 0, // Remove bottom radius when expanded
    borderBottomWidth: 0, // Remove bottom border when expanded
  },
  
  dropdownContainer: {
    position: 'absolute',
    top: 0, // Match reduced height of timeDropdownExpanded
    left: 0,
    right: 0,
    zIndex: 10000,
    elevation: 10000,
  },
  
  dropdownOptionsList: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 140, // Increased height since we now have more space
    width: 370,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  
  dropdownOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  
  selectedDropdownOption: {
    backgroundColor: '#333',
  },
  
});

const GameModeModal = ({ modalVisible, setModalVisible, handlePlay, isSearching, setIsSearching } : any) => {
  const [selectedTime, setSelectedTime] = useState(10 * 60);
  const [opponent, setOpponent] = useState('human'); // 'human' or 'bot'
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  const timeOptions = [
    { label: '5 mins (Blitz)', value: 5 * 60 },
    { label: '10 mins (Rapid)', value: 10 * 60 },
    { label: '15 mins (Classical)', value: 15 * 60 },
    { label: '30 mins (Classical)', value: 30 * 60 }
  ];

  // Get selected time label
  const getSelectedTimeLabel = () => {
    const selected = timeOptions.find(option => option.value === selectedTime);
    return selected ? selected.label : '10 mins (Rapid)';
  };

  // Close modal when tapping outside content area
  const handleBackdropPress = () => {
    setModalVisible(false);
  };

  // Prevent closing when tapping on modal content
  const handleModalContentPress = (e : any) => {
    e.stopPropagation();
  };

  const selectTimeOption = (option : any) => {
    setSelectedTime(option.value);
    setTimeDropdownOpen(false);
  };

  return (
    <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => setModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalContentPress}>
            <View style={styles.modalContent}>
              <Text style={styles.cardTitle}>Start a Game</Text>
              <Text style={styles.cardSubtitle}>Please select the game mode you want to play</Text>

              {/* Opponent Selection */}
              <View style={styles.opponentContainer}>
                <TouchableOpacity
                  style={[
                    styles.opponentOption,
                    opponent === 'human' && { borderColor: '#ffffff', borderWidth: 1 }
                  ]}
                  onPress={() => setOpponent('human')}
                >
                  <View style={styles.radioButton}>
                    {opponent === 'human' && <View style={styles.radioSelected} />}
                  </View>
                  <Image source={human} style={{ width: 50, height: 50, marginRight: 12 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Human</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.opponentOption,
                    opponent === 'bot' && { borderColor: '#ffffff', borderWidth: 1 }
                  ]}
                  onPress={() => setOpponent('bot')}
                >
                  <View style={styles.radioButton}>
                    {opponent === 'bot' && <View style={styles.radioSelected} />}
                  </View>
                  <Image source={bot} style={{ width: 50, height: 50, marginRight: 12 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Bot</Text>
                </TouchableOpacity>
              </View>

              {/* Improved Time Control Dropdown */}
              <View style={styles.dropdownWrapper}>
              <TouchableOpacity
  style={[
    styles.timeDropdown,
    timeDropdownOpen && styles.timeDropdownExpanded
  ]}
  onPress={() => setTimeDropdownOpen(!timeDropdownOpen)}
>
  <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{getSelectedTimeLabel()}</Text>
  <Text style={{ color: '#FFFFFF', fontSize: 18 }}>{timeDropdownOpen ? '▲' : '▼'}</Text>
</TouchableOpacity>

  {timeDropdownOpen && (
    <View style={styles.dropdownContainer}>
      <ScrollView style={styles.dropdownOptionsList}>
        {timeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.dropdownOption,
              selectedTime === option.value && styles.selectedDropdownOption
            ]}
            onPress={() => selectTimeOption(option)}
          >
            <Text style={styles.dropdownOptionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )}
</View>


              {isSearching ? (
                <View style={{ marginTop: 60 }}>
                  <Text style={{ color: '#FFFFFF', textAlign: 'center', marginBottom: 12 }}>Searching for opponent...</Text>
                  <TouchableOpacity
                    onPress={() => setIsSearching(false)}
                    style={[styles.playButton, { backgroundColor: '#FF5252' }]}
                  >
                    <Text style={styles.playButtonText}>Cancel Search</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.playButton2}
                  onPress={handlePlay}
                >
                  <Text style={styles.playButtonText2}>Start Playing</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const StatsCard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
    const auth = useContext(AuthContext);
    const userId = useContext(AuthContext);
    const router = useRouter();
    
  
  useEffect(() => {
    if (!auth?.userId) {
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
    if (!auth?.userId) {
      router.replace("/auth");    
    }
  }, [auth?.userId, auth?.token]);

  // Handle redirection if no userId
  

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

      <Text style={{ color: '#888888', marginTop: 10 }}>Last 30d Activity</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>40</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FF5252' }]}>10</Text>
          <Text style={styles.statLabel}>Lose</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FFC107' }]}>02</Text>
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
    switch (type) {
      case 'bullet': return bullet;
      case 'rapid': return rapid;
      default: return bullet;
    }
  };

  const getResultStyle = (result : any) => {
    switch (result) {
      case 'win': return { backgroundColor: '#4CAF50' };
      case 'loss': return { backgroundColor: '#FF5252' };
      case 'draw': return { backgroundColor: '#FFC107' };
      default: return { backgroundColor: '#888888' };
    }
  };

  const getResultSymbol = (result : any) => {
    switch (result) {
      case 'win': return '+';
      case 'loss': return '−';
      case 'draw': return '=';
      default: return '−';
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.cardTitle}>Recent Games</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {[
        // Sample Data
        {
          id: 'sample1',
          type: 'blitz',
          opponent: 'Magnus Carlsen',
          rating: 2847,
          result: 'win',
        },
        {
          id: 'sample2',
          type: 'bullet',
          opponent: 'Hikaru Nakamura',
          rating: 2736,
          result: 'loss',
        },
        // Dynamic Data
        ...recentGames,
      ].map((game) => (
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
              <Text style={styles.ratingText}> ({game.rating})</Text>
            </Text>
          </View>
          <View style={styles.resultContainer}>
            <View style={[styles.resultIndicator, getResultStyle(game.result)]}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(10 * 60);
  const [isSearching, setIsSearching] = useState(false);
  const auth = useContext(AuthContext);
  const { socket } = useContext(AuthContext);
  const router = useRouter();

  const handlePlay = async () => {
    if (!socket || !socket.connected) {
      console.error("Socket not connected!");
      return;
    }

    // First close the modal
    setModalVisible(false);

    // Then proceed with navigation or any other steps you need
    router.push({
      pathname: "/newGame",
      params: { timeControl: selectedTime.toString() }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatsCard />
      <RecentGameCard />
    </ScrollView>

    {/* Fixed Button at bottom */}
    <View style={styles.fixedButtonContainer}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.playButtonText}>Start a New Game</Text>
      </TouchableOpacity>
    </View>

    {/* Game Mode Modal */}
    <GameModeModal
      modalVisible={modalVisible}
      setModalVisible={setModalVisible}
      handlePlay={handlePlay}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
    />
  </SafeAreaView>
  );
}