import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ActivityIndicator
} from 'react-native';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import { io } from 'socket.io-client';
import { AuthContext } from '@/components/context/authContext';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Square } from 'chess.js';

type PlayerColor = 'white' | 'black';
type MoveData = {
  from: string;
  to: string;
};

interface ChessMoveInfo {
  from: string;
  to: string;
  piece?: string;
  san?: string;
}

type GameStartData = {
  gameId: string;
  isWhite: boolean;
  fen: string;
  white: string;
  black: string;
  moves?: string[];
  whiteTime?: number;
  blackTime?: number;
  whitePlayerDetails?: {
    name: string;
    rating: number;
  };
  blackPlayerDetails?: {
    name: string;
    rating: number;
  };
};

type MoveHandlerData = {
  fen: string;
  san: string;
  from: string;
  to: string;
  flags: string;
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

type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'error';

const { width } = Dimensions.get('window');

const MoveHistory: React.FC<{ moves: string[] }> = ({ moves }) => {
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
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [opponentInfo, setOpponentInfo] = useState<OpponentInfo>({
    name: 'Waiting...',
    rating: 1500,
  });
  const [whiteTime, setWhiteTime] = useState<number>(0);
  const [blackTime, setBlackTime] = useState<number>(0);
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatus>('idle');
  const [searchTime, setSearchTime] = useState(0);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  
  const params = useLocalSearchParams();
  const timeControl = params.timeControl ? Number(params.timeControl) : 600;
  const router = useRouter();
  const { userId, token, socket } = useContext(AuthContext);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handleGameStart = useCallback((data: GameStartData) => {
    console.log('Game start data:', data);
    setMatchmakingStatus('found');
    if (searchTimer) clearInterval(searchTimer);
    
    setGameId(data.gameId);
    setPlayerColor(data.isWhite ? 'white' : 'black');
    setGame(new Chess(data.fen));
    setWhiteTime(data.whiteTime || timeControl);
    setBlackTime(data.blackTime || timeControl);
    setMoveHistory(data.moves || []);
    
    setOpponentInfo({
      name: data.isWhite 
        ? (data.blackPlayerDetails?.name || 'Opponent')
        : (data.whitePlayerDetails?.name || 'Opponent'),
      rating: data.isWhite 
        ? (data.blackPlayerDetails?.rating || 1500)
        : (data.whitePlayerDetails?.rating || 1500)
    });
  }, [searchTimer, timeControl]);

  const handleCancelSearch = useCallback(() => {
    if (!socket) return;
    
    socket.emit('cancel_search');
    setMatchmakingStatus('idle');
    if (searchTimer) clearInterval(searchTimer);
    router.back();
  }, [socket, searchTimer]);

  const makeMove = useCallback((info: ChessMoveInfo) => {
    if (!gameId || !socket || !playerColor) {
      console.log('Missing gameId, socket, or playerColor');
      return;
    }
  
    const currentTurn = game.turn();
    const isPlayerTurn = 
      (currentTurn === 'w' && playerColor === 'white') || 
      (currentTurn === 'b' && playerColor === 'black');

    console.log(`Move attempt - Current turn: ${currentTurn}, Player color: ${playerColor}, Is player turn: ${isPlayerTurn}`); // Debug log

    if (!isPlayerTurn) {
      console.log('Not your turn - move rejected');
      return;
    }
  
    const moveData = {
      gameId,
      from: info.from,
      to: info.to,
      promotion: (info.to[1] === '8' || info.to[1] === '1') && 
        game.get(info.from as Square)?.type === 'p' ? 'q' : undefined
    };

    socket.emit('make_move', moveData);
  }, [game, gameId, socket, playerColor]);

  const handleResign = useCallback(() => {
    if (!socket || !gameId) return;
    
    socket.emit('resign_game', gameId);
    setShowResignConfirm(false);
    setGameResult('Resigned');
  }, [socket, gameId]);

  

    const handleMoveMade = useCallback((data: MoveHandlerData) => {
      console.log('Move made:', data); // Debug log
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setMoveHistory(prev => [...prev, data.san]);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
    }, []);

    const handleGameEnded = (result: { 
      winner: string | null; 
      reason: string;
      whiteRating?: number;
      blackRating?: number;
      whiteRatingChange?: number;
      blackRatingChange?: number;
    }) => {
      const isWhite = playerColor === 'white';
      const playerWon = result.winner === (isWhite ? userId : opponentInfo.name);
      
      let resultText = '';
      switch (result.reason) {
        case 'checkmate':
          resultText = playerWon ? 'You won by checkmate!' : 'You lost by checkmate';
          break;
        case 'resignation':
          resultText = playerWon ? 'Opponent resigned!' : 'You resigned';
          break;
        case 'timeout':
          resultText = playerWon ? 'You won on time!' : 'You lost on time';
          break;
        case 'agreement':
          resultText = 'Draw by agreement';
          break;
        default:
          resultText = 'Game ended';
      }

      if (result.whiteRatingChange && result.blackRatingChange) {
        resultText += `\nRating: ${isWhite ? result.whiteRating : result.blackRating} (${
          (isWhite ? result.whiteRatingChange : result.blackRatingChange) > 0 ? '+' : ''
        }${isWhite ? result.whiteRatingChange : result.blackRatingChange})`;
      }

      setGameResult(resultText);
    };

    const handleGameWaiting = () => {
      setMatchmakingStatus('searching');
      if (!searchTimer) {
        const timer = setInterval(() => {
          setSearchTime(prev => prev + 1);
        }, 1000);
        setSearchTimer(timer);
      }
    };

    useEffect(() => {
      if (!socket) return;

    socket.on('game_start', handleGameStart);
    socket.on('move_made', handleMoveMade);
    socket.on('game_ended', handleGameEnded);
    socket.on('game_waiting', handleGameWaiting);
    socket.on('matchmaking_error', () => {
      setMatchmakingStatus('error');
      if (searchTimer) clearInterval(searchTimer);
    });

    socket.emit('find_game', timeControl);

    return () => {
      socket.off('game_start', handleGameStart);
      socket.off('move_made', handleMoveMade);
      socket.off('game_ended', handleGameEnded);
      socket.off('game_waiting', handleGameWaiting);
      socket.off('matchmaking_error');
      if (searchTimer) clearInterval(searchTimer);
      if (matchmakingStatus === 'searching') {
        socket.emit('cancel_search');
      }
    };
  }, [socket, timeControl, handleGameStart, handleMoveMade]);

  const customPieces: CustomPieces = {
    wK: require('@/assets/images/king-white.svg'),
    wQ: require('@/assets/images/queen-white.svg'),
    wB: require('@/assets/images/bishop-white.svg'),
    wN: require('@/assets/images/knight-white.svg'),
    wP: require('@/assets/images/white-pawn.svg'),
    wR: require('@/assets/images/rook-white.svg'),
    bK: require('@/assets/images/black-king.svg'),
    bQ: require('@/assets/images/black-queen.svg'),
    bB: require('@/assets/images/black-bishop.svg'),
    bN: require('@/assets/images/black-knight.svg'),
    bP: require('@/assets/images/black-pawn.svg'),
    bR: require('@/assets/images/black-rook.svg'),
  };

  return (
    <View style={styles.container}>
      {matchmakingStatus !== 'found' ? (
        <View style={styles.searchingContainer}>
          {matchmakingStatus === 'searching' ? (
            <>
              <Text style={styles.searchingText}>
                Searching for opponent... {formatTime(searchTime)}
              </Text>
              <ActivityIndicator size="large" color="#4CAF50" />
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelSearch}
              >
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </TouchableOpacity>
            </>
          ) : matchmakingStatus === 'error' ? (
            <>
              <Text style={styles.errorText}>Error finding opponent</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => socket?.emit('find_game', timeControl)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.playerInfoTop}>
            <View style={styles.playerDetails}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg' }} 
                style={styles.playerAvatar} 
              />
              <View>
                <Text style={styles.playerName}>{opponentInfo.name}</Text>
                <Text style={styles.playerRating}>{opponentInfo.rating}</Text>
              </View>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(playerColor === 'white' ? blackTime : whiteTime)}
              </Text>
            </View>
          </View>

          {playerColor && (
            <Chessboard
              fen={game.fen()}
              orientation={playerColor}
              onMove={makeMove}
              customPieces={customPieces}
              // Disable interaction when it's not the player's turn
              isInteractive={game.turn() === (playerColor === 'white' ? 'w' : 'b')}
            />
          )}

          <View style={styles.playerInfoBottom}>
            <View style={styles.playerDetails}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg' }} 
                style={styles.playerAvatar} 
              />
              <View>
                <Text style={styles.playerName}>You</Text>
                <Text style={styles.playerRating}>1500</Text>
                <Text style={styles.turnIndicator}>
                  {game.turn() === (playerColor === 'white' ? 'w' : 'b') 
                    ? 'Your turn' 
                    : 'Waiting...'}
                </Text>
              </View>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(playerColor === 'white' ? whiteTime : blackTime)}
              </Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <MoveHistory moves={moveHistory} />
            <TouchableOpacity 
              style={styles.resignButton} 
              onPress={() => setShowResignConfirm(true)}
            >
              <Text style={styles.resignButtonText}>Resign Game</Text>
            </TouchableOpacity>
          </View>

          <Modal
            transparent={true}
            visible={showResignConfirm || !!gameResult}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalText}>
                  {gameResult || 'Are you sure you want to resign?'}
                </Text>
                <View style={styles.modalButtons}>
                  {gameResult ? (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={() => router.back()}
                    >
                      <Text style={styles.modalButtonText}>Return to Menu</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={handleResign}
                      >
                        <Text style={styles.modalButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowResignConfirm(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    borderRadius: 30,
    padding: 16,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    padding: 16,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
  
    borderColor: '#4CAF50',
  },
  playerInfoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 10,
  
    borderColor: '#4CAF50',
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
  cancelButton1: {
    backgroundColor: '#555',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  turnIndicator: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function GameScreenWrapper() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}