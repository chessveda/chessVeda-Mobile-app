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
// import { ChessMove } from 'react-native-chessboard/lib/typescript/types';
import { io } from 'socket.io-client';
import { AuthContext } from '@/components/context/authContext';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Square } from 'chess.js';

type PlayerColor = 'white' | 'black';
type GamePhase = 'matchmaking' | 'playing' | 'gameover';
type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'error';

interface LocalChessMoveInfo {
  from: string;
  to: string;
  promotion?: string;
  piece?: string;
  san?: string;
  flags?: string;
}

interface PlayerDetails {
  name: string;
  rating: number;
}

interface GameStartData {
  gameId: string;
  white: string;
  black: string;
  fen: string;
  moves: string[];
  isWhite: boolean;
  whiteTime: number;
  blackTime: number;
  whitePlayerDetails?: PlayerDetails;
  blackPlayerDetails?: PlayerDetails;
}

interface MoveHandlerData {
  fen: string;
  san: string;
  from: string;
  to: string;
  flags: string;
  whiteTime: number;
  blackTime: number;
}

const { width } = Dimensions.get('window');

const GameScreen: React.FC = () => {
  const [game, setGame] = useState<Chess | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [opponentInfo, setOpponentInfo] = useState<PlayerDetails>({
    name: 'Waiting...',
    rating: 1500,
  });
  const [whiteTime, setWhiteTime] = useState<number>(0);
  const [blackTime, setBlackTime] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('matchmaking');
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatus>('idle');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

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
    console.log('Game started with data:', data);
    try {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setGameId(data.gameId);
      setPlayerColor(data.isWhite ? 'white' : 'black');
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      setMoveHistory(data.moves || []);
      setGamePhase('playing');
      setIsSearching(false);
      setMatchmakingStatus('found');

      setOpponentInfo({
        name: data.isWhite 
          ? (data.blackPlayerDetails?.name || 'Opponent') 
          : (data.whitePlayerDetails?.name || 'Opponent'),
        rating: data.isWhite 
          ? (data.blackPlayerDetails?.rating || 1500) 
          : (data.whitePlayerDetails?.rating || 1500)
      });

      console.log(`Game started as ${data.isWhite ? 'white' : 'black'}`);
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, []);

  const handleMoveMade = useCallback((data: MoveHandlerData) => {
    console.log('Move received from server:', data);
    try {
      // Always set the game to the server's version for consistency
      const newGame = new Chess(data.fen);
      setGame(newGame);
      
      // Update move history without duplicates
      setMoveHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1] === data.san) {
          return prev;
        }
        return [...prev, data.san];
      });
      
      // Update times
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
    } catch (error) {
      console.error('Error handling server move:', error);
      // Fallback to server's position
      setGame(new Chess(data.fen));
    }
  }, []);

  // Fix time control
  useEffect(() => {
    if (gamePhase !== 'playing' || !game) return;
    
    const interval = setInterval(() => {
      const isWhiteTurn = game.turn() === 'w';
      
      // Only decrease active player's time
      if (isWhiteTurn) {
        setWhiteTime(prev => Math.max(0, prev - 1));
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gamePhase, game]);
  
  // Update your time control effect
  useEffect(() => {
    if (gamePhase !== 'playing' || !game) return;
    
    const interval = setInterval(() => {
      const isWhiteTurn = game.turn() === 'w';
      
      // Only decrease the active player's time
      if (isWhiteTurn) {
        setWhiteTime(prev => Math.max(0, prev - 1));
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
      }
      
      // Check for timeout
      if ((isWhiteTurn && whiteTime <= 1) || (!isWhiteTurn && blackTime <= 1)) {
        const isMyTurn = (isWhiteTurn && playerColor === 'white') || 
                          (!isWhiteTurn && playerColor === 'black');
        
        // Only the player who's out of time should report it
        if (socket && gameId && isMyTurn) {
          socket.emit('timeout', { gameId, color: isWhiteTurn ? 'white' : 'black' });
        }
      }
    }, 1000);
  
    return () => clearInterval(interval);
  }, [gamePhase, game, socket, gameId, whiteTime, blackTime, playerColor]);

  const handleGameEnded = useCallback((result: { 
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
    setGamePhase('gameover');
  }, [playerColor, userId, opponentInfo.name]);

  const makeMove = useCallback((moveData: any) => {
    console.log('Move attempt:', moveData);
    
    if (!gameId || !socket || !playerColor || !game || gamePhase !== 'playing') {
      console.log('Move rejected - missing requirements or not in playing phase');
      return;
    }
  
    try {
      const move = moveData.move || moveData;
      const from = move.from || move.sourceSquare || move.source;
      const to = move.to !== move.from ? move.to : 
                move.targetSquare || move.target || move.san?.slice(-2);
      
      if (!from || !to || from === to) {
        console.log('Invalid move info - incomplete or identical squares:', { from, to });
        return;
      }
  
      const piece = game.get(from as any);
      if (!piece) {
        console.log('No piece at square:', from);
        return;
      }
  
      if ((piece.color === 'w' && playerColor !== 'white') || 
          (piece.color === 'b' && playerColor !== 'black')) {
        console.log('Not your piece');
        return;
      }
  
      if ((game.turn() === 'w' && playerColor !== 'white') ||
          (game.turn() === 'b' && playerColor !== 'black')) {
        console.log('Not your turn');
        return;
      }
  
      const moveObj = {
        from,
        to,
        promotion: 'q'
      };
      
      const result = game.move(moveObj);
      if (!result) {
        console.log('Illegal move');
        return;
      }
      
      console.log('Emitting move to server:', moveObj);
      socket.emit('make_move', {
        gameId,
        ...moveObj
      });
      
      setGame(new Chess(game.fen()));
    } catch (error) {
      console.error('Error in makeMove:', error);
    }
  }, [game, gameId, socket, playerColor, gamePhase]);
  

  const handleResign = useCallback(() => {
    if (!socket || !gameId) return;
    socket.emit('resign_game', gameId);
    setShowResignConfirm(false);
    setGameResult('Resigned');
    setGamePhase('gameover');
  }, [socket, gameId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !token) {
      console.log('Socket or token not available');
      return;
    }
  
    const handleGameWaiting = () => {
      console.log('Game waiting - searching for opponent');
      setIsSearching(true);
      setMatchmakingStatus('searching');
      const timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
      setSearchTimer(timer);
    };
  
    const handleGameStartWrapper = (data: GameStartData) => {
      if (gameId === data.gameId && gamePhase === 'playing') {
        console.log('Game already initialized, skipping duplicate start');
        return;
      }
      handleGameStart(data);
    };
  
    socket.on('game_waiting', handleGameWaiting);
    socket.on('game_start', handleGameStartWrapper);
    socket.on('move_made', handleMoveMade);
    socket.on('game_ended', handleGameEnded);
    socket.on('matchmaking_error', (error: string) => {
      console.log('Matchmaking error:', error);
      setIsSearching(false);
      setMatchmakingStatus('error');
      if (searchTimer) clearInterval(searchTimer);
    });
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (err) => console.log('Socket error:', err));
  
    if (!isSearching) {
      console.log('Starting game search with time control:', timeControl);
      socket.emit('find_game', timeControl);
    }
  
    return () => {
      socket.off('game_waiting', handleGameWaiting);
      socket.off('game_start', handleGameStartWrapper);
      socket.off('move_made', handleMoveMade);
      socket.off('game_ended', handleGameEnded);
      socket.off('matchmaking_error');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      if (searchTimer) clearInterval(searchTimer);
      if (isSearching) socket.emit('cancel_search');
      if (gameId) socket.emit('leave_game', gameId);
    };
  }, [socket, token, timeControl, isSearching, gameId, gamePhase, handleGameStart, handleMoveMade, handleGameEnded]);

  // Time control effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (gamePhase !== 'playing' || !game) return;
      
      setWhiteTime(prev => Math.max(0, prev - 1));
      setBlackTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, game]);

  const customPieces = {
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

  const MoveHistory: React.FC<{ moves: string[] }> = ({ moves }) => {
    const pairedMoves = [];
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
  
      {gamePhase === 'matchmaking' ? (
        <View style={styles.searchingContainer}>
          {matchmakingStatus === 'searching' ? (
            <>
              <Text style={styles.searchingText}>
                Searching for opponent... {formatTime(searchTime)}
                {'\n'}(Time Control: {timeControl / 60}+0)
              </Text>
              <ActivityIndicator size="large" color="#4CAF50" />
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  socket?.emit('cancel_search');
                  setIsSearching(false);
                  router.back();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </TouchableOpacity>
            </>
          ) : matchmakingStatus === 'error' ? (
            <>
              <Text style={styles.errorText}>Error finding opponent</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setSearchTime(0);
                  socket?.emit('find_game', timeControl);
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : gamePhase === 'playing' ? (
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

          {console.log('Attempting to render Chessboard:', { fen: game?.fen() })}
          {gamePhase === 'playing' && game && (
          <Chessboard
            fen={game.fen()}
            onMove={makeMove}
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
                  {game?.turn() === (playerColor === 'white' ? 'w' : 'b') 
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
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText,
            gameResult?.includes('won') ? styles.resultText : 
            gameResult?.includes('lost') ? styles.resultText : 
            styles.resultText
          ]}>
            {gameResult}
          </Text>
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={() => router.back()}
          >
            <Text style={styles.returnButtonText}>Return to Menu</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        transparent={true}
        visible={showResignConfirm}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Are you sure you want to resign?
            </Text>
            <View style={styles.modalButtons}>
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
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </GestureHandlerRootView>
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
  returnButton: {
    backgroundColor: '#FF4444',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  returnButtonText: {
    color: 'white',
    fontWeight: '600',
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
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 20,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 36, // For better multiline text display
  },
});

export default function GameScreenWrapper() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}