import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ActivityIndicator,
  Alert
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
  const [boardFen, setBoardFen] = useState<string>('start');
  const resignTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const findGameSent = useRef<boolean>(false);
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
      setBoardFen(newGame.fen());
      
      // Set player color based on backend assignment
      const isWhite = data.isWhite;
      setPlayerColor(isWhite ? 'white' : 'black');
      
      // Initialize times from backend
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      
      // Ensure proper move history
      if (data.moves && Array.isArray(data.moves)) {
        setMoveHistory(data.moves);
      } else {
        setMoveHistory([]);
      }
      
      setGamePhase('playing');
      setIsSearching(false);
      setMatchmakingStatus('found');
  
      // Set opponent info based on color assignment
      setOpponentInfo({
        name: isWhite 
          ? (data.blackPlayerDetails?.name || 'Opponent') 
          : (data.whitePlayerDetails?.name || 'Opponent'),
        rating: isWhite 
          ? (data.blackPlayerDetails?.rating || 1500) 
          : (data.whitePlayerDetails?.rating || 1500)
      });
  
      console.log(`Game started as ${isWhite ? 'white' : 'black'}`);
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, []);

  const handleMoveMade = useCallback((data: MoveHandlerData) => {
    console.log('Move received from server:', data);
    try {
      // Always sync with server's game state to ensure consistency
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setBoardFen(data.fen); // Use the exact FEN from server
      
      // Update move history from server's data
      setMoveHistory(prevMoves => {
        const lastMove = prevMoves[prevMoves.length - 1];
        // If this is a new move, add it to the history
        if (data.san && lastMove !== data.san) {
          return [...prevMoves, data.san];
        }
        return prevMoves;
      });
      
      // Always sync with server times
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
    } catch (error) {
      console.error('Error handling server move:', error);
      // Fallback to server's position in case of error
      if (data.fen) {
        setGame(new Chess(data.fen));
        setBoardFen(data.fen);
      }
    }
  }, []);

  // Single time control effect that handles both players' clocks
  useEffect(() => {
    if (gamePhase !== 'playing' || !game) return;
    
    const interval = setInterval(() => {
      // Only decrement time for the player whose turn it is
      if (game.turn() === 'w') {
        setWhiteTime(prev => Math.max(0, prev - 1));
        
        // Check for white timeout
        if (whiteTime <= 1 && socket && gameId && playerColor === 'black') {
          socket.emit('timeout', { gameId, color: 'white' });
        }
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
        
        // Check for black timeout
        if (blackTime <= 1 && socket && gameId && playerColor === 'white') {
          socket.emit('timeout', { gameId, color: 'black' });
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gamePhase, game, whiteTime, blackTime, socket, gameId, playerColor]);

  const handleGameEnded = useCallback((result: { 
    winner: string | null; 
    reason: string;
    whiteRating?: number;
    blackRating?: number;
    whiteRatingChange?: number;
    blackRatingChange?: number;
  }) => {
    const isWhite = playerColor === 'white';
    const playerWon = (result.winner === userId) || 
                     (result.winner === (isWhite ? 'white' : 'black'));
    
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
      case 'stalemate':
        resultText = 'Draw by stalemate';
        break;
      case 'insufficient':
        resultText = 'Draw by insufficient material';
        break;
      case 'fifty':
        resultText = 'Draw by fifty-move rule';
        break;
      case 'repetition':
        resultText = 'Draw by threefold repetition';
        break;
      default:
        resultText = 'Game ended';
    }

    if (result.whiteRatingChange && result.blackRatingChange) {
      const ratingChange = isWhite ? result.whiteRatingChange : result.blackRatingChange;
      const newRating = isWhite ? result.whiteRating : result.blackRating;
      
      if (newRating) {
        resultText += `\nRating: ${newRating} (${ratingChange > 0 ? '+' : ''}${ratingChange})`;
      }
    }

    setGameResult(resultText);
    setGamePhase('gameover');
  }, [playerColor, userId]);

  const makeMove = useCallback((moveData: any) => {
    if (!gameId || !socket || !playerColor || !game || gamePhase !== 'playing') {
      return false;
    }
  
    try {
      const move = moveData.move || moveData;
      const from = move.from || move.sourceSquare;
      const to = move.to || move.targetSquare;
      
      if (!from || !to) return false;
  
      const piece = game.get(from);
      if (!piece) return false;
  
      // Validate it's the player's turn and piece
      const isPieceWhite = piece.color === 'w';
      if ((isPieceWhite && playerColor !== 'white') || 
          (!isPieceWhite && playerColor !== 'black')) {
        return false;
      }
  
      // Validate it's the correct turn
      if ((game.turn() === 'w' && playerColor !== 'white') ||
          (game.turn() === 'b' && playerColor !== 'black')) {
        return false;
      }
  
      // Check for pawn promotion
      const isPromotion = 
        piece.type === 'p' && 
        ((to[1] === '8' && piece.color === 'w') || 
         (to[1] === '1' && piece.color === 'b'));
      
      const promotion = isPromotion ? (move.promotion || 'q') : undefined;
      
      const moveObj = { from, to, promotion };
      
      // Try the move locally first
      const result = game.move(moveObj);
      if (!result) return false;
      
      // Update board state immediately
      setBoardFen(game.fen());
      
      // Emit move to server with all required fields
      socket.emit('make_move', {
        gameId,
        from,
        to,
        promotion: moveObj.promotion
      });
      
      // Update local state optimistically
      setGame(new Chess(game.fen()));
      
      // Optimistically add move to history
      if (result.san) {
        setMoveHistory(prev => [...prev, result.san]);
      }
      
      return true;
    } catch (error) {
      console.error('Error in makeMove:', error);
      return false;
    }
  }, [game, gameId, socket, playerColor, gamePhase]);

  const handleResign = () => {
    if (!socket || !gameId || gamePhase !== "playing") {
      console.log('Cannot resign - missing socket, gameId, or wrong game phase');
      return;
    }
  
    setShowResignConfirm(false);
    
    // Clear any existing timeout
    if (resignTimeoutRef.current) {
      clearTimeout(resignTimeoutRef.current);
    }
  
    // Start a longer timeout (10 seconds instead of 5)
    resignTimeoutRef.current = setTimeout(() => {
      if (gamePhase === 'playing') { // Only show error if still in playing state
        setGameResult("Error: Resignation timed out. Please try again.");
      }
    }, 10000);
  
    // Emit resign event
    socket.emit("resign", { gameId }, (acknowledgement: { success?: boolean, error?: string }) => {
      // Handle server acknowledgement if using callbacks
      if (acknowledgement?.error) {
        console.log('Resign error:', acknowledgement.error);
        setGameResult(`Resignation failed: ${acknowledgement.error}`);
      }
    });
  };
  
  // Main initialization effect
  useEffect(() => {
    if (!socket || !token) {
      console.log('Socket or token not available');
      return;
    }
    
    // Only find game once when component mounts
    if (gamePhase === 'matchmaking' && !findGameSent.current) {
      console.log('Starting game search with time control:', timeControl);
      socket.emit('find_game', timeControl); // Pass timeControl directly
      findGameSent.current = true;
      setIsSearching(true);
      setMatchmakingStatus('searching');
      
      // Start search timer
      const timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
      setSearchTimer(timer);
    }
    
    // Setup event handlers
    const handleGameWaiting = () => {
      console.log('Game waiting - searching for opponent');
      setIsSearching(true);
      setMatchmakingStatus('searching');
    };
    
    const handleGameStartWrapper = (data: GameStartData) => {
      console.log('Game start event received:', data);
      
      // Clear search timer if it exists
      if (searchTimer) {
        clearInterval(searchTimer);
        setSearchTimer(null);
      }
      
      handleGameStart(data);
    };
    
    const handleMatchmakingError = (error: string) => {
      console.log('Matchmaking error:', error);
      setIsSearching(false);
      setMatchmakingStatus('error');
      if (searchTimer) clearInterval(searchTimer);
      findGameSent.current = false; // Reset flag to allow retry
    };
    
    // Register all event listeners
    socket.on('game_waiting', handleGameWaiting);
    socket.on('game_start', handleGameStartWrapper);
    socket.on('move_made', handleMoveMade);
    socket.on('game_ended', handleGameEnded);
    socket.on('matchmaking_error', handleMatchmakingError);
    
    socket.on('connect', () => {
      console.log('Socket connected');
      // If we're still in matchmaking phase on reconnect, try again
      if (gamePhase === 'matchmaking' && !findGameSent.current) {
        socket.emit('find_game', timeControl);
        findGameSent.current = true;
      }
    });
    
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (err) => console.log('Socket error:', err));
    
    // Cleanup function
    return () => {
      // Remove all event listeners
      socket.off('game_waiting', handleGameWaiting);
      socket.off('game_start', handleGameStartWrapper);
      socket.off('move_made', handleMoveMade);
      socket.off('game_ended', handleGameEnded);
      socket.off('matchmaking_error', handleMatchmakingError);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      
      // Clear timers
      if (searchTimer) clearInterval(searchTimer);
      
      // Cancel search if we're still searching
      if (isSearching) socket.emit('cancel_search');
      
      // Leave game if we're in one
      if (gameId && gamePhase !== 'gameover') socket.emit('leave_game', { gameId });
    };
  }, [socket, token, gamePhase, timeControl, searchTimer, handleGameStart, handleMoveMade, handleGameEnded, gameId]);

  // Handle resign responses
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleResignSuccess = (data: { winner: PlayerColor }) => {
      if (resignTimeoutRef.current) {
        clearTimeout(resignTimeoutRef.current);
        resignTimeoutRef.current = null;
      }
    
      const resultText = data.winner === playerColor 
        ? "Opponent resigned. You won!" 
        : "You resigned. You lost.";
    
      setGameResult(resultText);
      setGamePhase("gameover");
    };
  
    const handleResignError = (error: { message: string }) => {
      if (resignTimeoutRef.current) {
        clearTimeout(resignTimeoutRef.current);
        resignTimeoutRef.current = null;
      }
      setGameResult(`Resignation failed: ${error.message}`);
    };
    
    socket.on('resign_failed', handleResignError);
    socket.on("resign_success", handleResignSuccess);
  
    return () => {
      socket.off("resign_success", handleResignSuccess);
      socket.off('resign_failed', handleResignError);
    };
  }, [socket, gameId, playerColor]);

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
      <View style={{ flexDirection: 'column' }}>
        {pairedMoves.map((pair, index) => (
          <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4 }}>
            <Text style={{ flex: 1 }}>{pair.number}.</Text>
            <Text style={{ flex: 2 }}>{pair.white || ''}</Text>
            <Text style={{ flex: 2 }}>{pair.black || ''}</Text>
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
         {...{
           key: boardFen,
           fen: boardFen,
           onMove: makeMove,
           boardOrientation: playerColor || 'white',
           customPieces,
           animationDuration: 200
         } as any}
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
  disabled={gamePhase !== 'playing'} // Disable if game not active
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
  onRequestClose={() => setShowResignConfirm(false)}
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
          disabled={gamePhase !== 'playing'} // Disable if game ended
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
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    opacity: 1,
  },
  resignButtonDisabled: {
    opacity: 0.5,
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