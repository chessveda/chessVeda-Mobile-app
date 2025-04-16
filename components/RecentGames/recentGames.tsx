import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

import bullet from '@/assets/images/bullet.png'
import rapid from '@/assets/images/rapid.png';

const API_URL = "http://172.16.0.133:8080";

interface RatingHistory {
    rating: number;
    timestamp: Date;
  }

interface GameHistory {
  gameId: string;
  opponent: {
    id: string;
    name: string;
  };
  userColor: 'white' | 'black';
  whitePlayer: string;
  blackPlayer: string;
  status: string;
  result: {
    winner: string | null; // User ID or null
    reason: string | null;
  };
  gameType: 'bullet' | 'blitz' | 'standard';
  timeControl: number;
  createdAt: Date;
  endedAt: Date | null;
  moves: number;
  whiteRating: number; // Added
  blackRating: number; // Added
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female';
  dob: Date;
  country: string;
  rating: {
    standard: number;
    blitz: number;
    bullet: number;
  };
  games: string[];
  stats: {
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
  };
  gameHistory?: GameHistory[];
  ratingHistory?: RatingHistory[];
}

const RecentGameCard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const auth = useContext(AuthContext);

  useEffect(() => {
    if (!auth?.userId) return;

    const fetchGameHistory = async () => {
      try {
        // Fetch profile
        const profileResponse = await axios.get(
          `${API_URL}/api/auth/profile/${auth.userId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setProfile(profileResponse.data.user);

        // Fetch game history
        const historyResponse = await axios.get(
          `${API_URL}/api/game/history/${auth.userId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );

        const gameHistory = historyResponse.data.games;

        if (gameHistory && gameHistory.length > 0) {
          // Get the 3 most recent games
          const sortedGames = gameHistory
            .sort((a: GameHistory, b: GameHistory) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

          // Transform games for display
          const gamesForDisplay = sortedGames.map((game: GameHistory) => {
            // Determine result based on userColor and winner
            let result: 'win' | 'loss' | 'draw';
            if (game.result.reason === 'agreement' || game.result.winner === null) {
              result = 'draw';
            } else if (game.result.winner === auth.userId) {
              result = 'win';
            } else {
              result = 'loss';
            }

            return {
              id: game.gameId,
              type: game.gameType || 'blitz',
              whitePlayer: game.whitePlayer,
              blackPlayer: game.blackPlayer,
              userColor: game.userColor,
              result,
            };
          });

          setRecentGames(gamesForDisplay);
        }
      } catch (err) {
        console.log('Game history fetch error:', err);
      }
    };

    fetchGameHistory();
  }, [auth?.userId, auth?.token]);

  const getGameTypeImage = (type: string | undefined | null) => {
    const gameType = type?.toLowerCase() || 'blitz';
    switch (gameType) {
      case 'bullet':
      case 'blitz':
        return bullet;
      case 'standard':
      case 'rapid':
      case 'classical':
        return rapid;
      default:
        return bullet;
    }
  };

  const getResultStyle = (result: string) => {
    switch (result) {
      case 'win':
        return { backgroundColor: '#4CAF50' };
      case 'loss':
        return { backgroundColor: '#FF5252' };
      case 'draw':
        return { backgroundColor: '#FFC107' };
      default:
        return { backgroundColor: '#888888' };
    }
  };

  const getResultSymbol = (result: string) => {
    switch (result) {
      case 'win':
        return '+';
      case 'loss':
        return '−';
      case 'draw':
        return '=';
      default:
        return '−';
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

      {recentGames.length > 0 ? (
        recentGames.map((game) => (
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
                {game.userColor === 'white' 
                  ? `${game.whitePlayer} vs ${game.blackPlayer}` 
                  : `${game.blackPlayer} vs ${game.whitePlayer}`}
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
        ))
      ) : (
        <Text style={{ color: '#888888', textAlign: 'center', padding: 20 }}>
          No recent games found
        </Text>
      )}
    </View>
  );
};

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

export default RecentGameCard;