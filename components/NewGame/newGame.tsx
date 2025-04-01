import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions 
} from 'react-native';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/authContext';

// Import icons (you'll need to adjust these imports based on your project structure)
import menuIcon from '@/assets/images/menu.svg';
import analysisIcon from '@/assets/images/analysis.svg';
import voiceMuteIcon from '@/assets/images/voice-mute.svg';
import moveBackIcon from '@/assets/images/move-back.svg';
import moveAheadIcon from '@/assets/images/move-ahead.svg';

// Import piece images 
import whitePawn from '@/assets/images/white-pawn.svg';
import whiteRook from '@/assets/images/rook-white.svg';
import whiteKnight from '@/assets/images/knight-white.svg';
import whiteBishop from '@/assets/images/bishop-white.svg';
import whiteQueen from '@/assets/images/queen-white.svg';
import whiteKing from '@/assets/images/king-white.svg';
import blackKing from '@/assets/images/black-king.svg';
import blackQueen from '@/assets/images/black-queen.svg';
import blackBishop from '@/assets/images/black-bishop.svg';
import blackKnight from '@/assets/images/black-knight.svg';
import blackPawn from '@/assets/images/black-pawn.svg';
import blackRook from '@/assets/images/black-rook.svg';
import { useLocalSearchParams } from 'expo-router';

// Type definitions
type PlayerColor = 'white' | 'black';
type MoveData = {
  from: string;
  to: string;
};

type GameStartData = {
  gameId: string;
  isWhite: boolean;
  fen: string;
  white: string;
  black: string;
  moves?: string[];
  whiteTime?: number;
  blackTime?: number;
};

type MoveHandlerData = {
  fen: string;
  san: string;
  color: string;
  whiteTime: number;
  blackTime: number;
};

type OpponentInfo = {
  name: string;
  rating: number;
};

type CustomPieces = {
  [key: string]: any;
};

const { width } = Dimensions.get('window');

// MoveHistory Component
interface MoveHistoryProps {
  moves: string[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const pairedMoves: Array<{
    white: string | null;
    black: string | null;
    number: number;
  }> = [];

  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      white: moves[i] || null,
      black: moves[i + 1] || null,
      number: Math.ceil((i + 1) / 2),
    });
  }

  return (
    <View style={styles.moveHistoryContainer}>
      {pairedMoves.map((pair, idx) => (
        <View 
          key={idx} 
          style={[
            styles.moveHistoryRow, 
            { backgroundColor: idx % 2 === 0 ? '#2C2C2C' : '#1E1E1E' }
          ]}
        >
          <Text style={styles.moveNumber}>{pair.number}.</Text>
          <Text style={styles.moveText}>{pair.white || ''}</Text>
          <Text style={styles.moveText}>{pair.black || ''}</Text>
        </View>
      ))}
    </View>
  );
};

const GameScreen: React.FC = () => {
  // State hooks with explicit typing
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showResignConfirm, setShowResignConfirm] = useState<boolean>(false);
  const [opponentInfo, setOpponentInfo] = useState<OpponentInfo>({
    name: 'Opponent',
    rating: 1500,
  });
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const params = useLocalSearchParams();
  const timeControl = params.timeControl ? Number(params.timeControl) : 600;
  

  // Context
  const { 
    userId, 
    token, 
    socket 
  } = useContext(AuthContext);

  // Time formatting utility
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Start timer
  const startTimer = useCallback((turn: 'w' | 'b') => {
    // Clear existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Create new interval
    const interval = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    setTimerInterval(interval);
  }, [timerInterval]);

  // Game start handler
  const handleGameStart = useCallback((data: GameStartData) => {
    setGameId(data.gameId);
    setPlayerColor(data.isWhite ? 'white' : 'black');
    setGame(new Chess(data.fen));
    setWhiteTime(data.whiteTime || 600);
    setBlackTime(data.blackTime || 600);
    
    startTimer(data.isWhite ? 'w' : 'b');
    
    const opponentId = data.white === userId ? data.black : data.white;
    setOpponentInfo({
      name: `Player ${opponentId?.substring(0, 5)}...` || 'Waiting...',
      rating: 1500,
    });

    setMoveHistory(data.moves || []);
  }, [userId, startTimer]);

  // Move handler
  const handleMove = useCallback((moveData: MoveHandlerData) => {
    setGame(new Chess(moveData.fen));
    setMoveHistory((prev) => [...prev, moveData.san]);
    setWhiteTime(moveData.whiteTime);
    setBlackTime(moveData.blackTime);
    startTimer(new Chess(moveData.fen).turn());
  }, [startTimer]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('game_start', handleGameStart);
    socket.on('move_made', handleMove);

    return () => {
      socket.off('game_start', handleGameStart);
      socket.off('move_made', handleMove);
    };
  }, [socket, handleGameStart, handleMove]);

  // Make move function
  const makeMove = useCallback((move: MoveData): boolean => {
    if (!gameId || !socket) return false;

    // Check if it's the player's turn
    const isPlayerTurn = 
      (game.turn() === 'w' && playerColor === 'white') || 
      (game.turn() === 'b' && playerColor === 'black');

    if (!isPlayerTurn) {
      console.log('Not your turn');
      return false;
    }

    try {
      const tempGame = new Chess(game.fen());
      const result = tempGame.move({ from: move.from, to: move.to });
      
      if (!result) {
        console.error('Invalid move');
        return false;
      }

      // Emit move to server
      socket.emit('make_move', {
        gameId,
        from: move.from,
        to: move.to,
        san: result.san,
      });

      setGame(tempGame);
      return true;
    } catch (e) {
      console.error('Error making move:', e);
      return false;
    }
  }, [game, gameId, socket, playerColor]);

  // Resign game handler
  const handleResign = useCallback(() => {
    if (!socket || !gameId) return;
    
    socket.emit('resign_game', gameId);
    // Add navigation logic here
    // Example: navigation.navigate('Home');
  }, [socket, gameId]);

  // Custom pieces mapping
  const customPieces: CustomPieces = {
    wK: whiteKing,
    wQ: whiteQueen,
    wB: whiteBishop,
    wN: whiteKnight,
    wP: whitePawn,
    wR: whiteRook,
    bK: blackKing,
    bQ: blackQueen,
    bB: blackBishop,
    bN: blackKnight,
    bP: blackPawn,
    bR: blackRook,
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  return (
    <View style={styles.container}>
      <View style={styles.gameContainer}>
        {/* Opponent Info */}
        <View style={styles.playerInfoTop}>
          <View style={styles.playerDetails}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg' }} 
              style={styles.playerAvatar} 
            />
            <View>
              <Text style={styles.playerName}>{opponentInfo.name}</Text>
              <View style={styles.playerStatusContainer}>
                <Text style={styles.playerRating}>{opponentInfo.rating}</Text>
                <View style={styles.onlineStatus} />
              </View>
            </View>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(blackTime)}</Text>
          </View>
        </View>

        {/* Chessboard */}
        <Chessboard
          fen={game.fen()}
          orientation={playerColor}
          onMove={makeMove}
          customPieces={customPieces}
        />

        {/* Player Info */}
        <View style={styles.playerInfoBottom}>
          <View style={styles.playerDetails}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg' }} 
              style={styles.playerAvatar} 
            />
            <View>
              <Text style={styles.playerName}>You</Text>
              <Text style={styles.playerRating}>1500</Text>
            </View>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(whiteTime)}</Text>
          </View>
        </View>
      </View>

      {/* Game Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.iconControls}>
          <TouchableOpacity><Image source={menuIcon} style={styles.controlIcon} /></TouchableOpacity>
          <TouchableOpacity><Image source={analysisIcon} style={styles.controlIcon} /></TouchableOpacity>
          <TouchableOpacity><Image source={voiceMuteIcon} style={styles.controlIcon} /></TouchableOpacity>
          <TouchableOpacity><Image source={moveBackIcon} style={styles.controlIcon} /></TouchableOpacity>
          <TouchableOpacity><Image source={moveAheadIcon} style={styles.controlIcon} /></TouchableOpacity>
        </View>

        {/* Move History */}
        <MoveHistory moves={moveHistory} />

        {/* Resign Button */}
        <TouchableOpacity 
          style={styles.resignButton} 
          onPress={() => setShowResignConfirm(true)}
        >
          <Text style={styles.resignButtonText}>Resign Game</Text>
        </TouchableOpacity>
      </View>

      {/* Resign Confirmation Modal */}
      <Modal
        transparent={true}
        visible={showResignConfirm}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Are you sure you want to resign? This will end the game!
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleResign}
              >
                <Text style={styles.modalButtonText}>Confirm Resign</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowResignConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  gameContainer: {
    flex: 1,
  },
  playerInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 10,
  },
  playerInfoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 10,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  playerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  playerRating: {
    color: '#888',
    fontSize: 12,
  },
  playerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'green',
    marginLeft: 5,
  },
  timeContainer: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timeText: {
    color: 'white',
    fontWeight: '600',
  },
  controlsContainer: {
    backgroundColor: '#1E1E1E',
  },
  iconControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  controlIcon: {
    width: 24,
    height: 24,
  },
  moveHistoryContainer: {
    maxHeight: 200,
  },
  moveHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  moveNumber: {
    color: '#888',
    marginRight: 10,
  },
  moveText: {
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  resignButton: {
    backgroundColor: '#FF4444',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  resignButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalText: {
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    margin: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF4444',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default GameScreen;