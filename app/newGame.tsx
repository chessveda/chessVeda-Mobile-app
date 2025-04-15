import React, { useState, useEffect, useContext, useCallback, useRef, ReactNode } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';
import { AuthContext } from '@/components/context/authContext';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Square } from 'chess.js';
import CustomChessBoard from '@/components/chessBoard/chessBoard';
import { SafeAreaView } from 'react-native-safe-area-context';
import logo from "@/assets/images/logo2.png";
import speaker from "@/assets/images/speaker.png";
import Icon from 'react-native-vector-icons/FontAwesome';
import backbtn from "@/assets/images/backbtn.png";
import dspeaker from "@/assets/images/dspeaker.png";
import cross from "@/assets/images/Cross.png";
import menu from "@/assets/images/Menu.png"
import analysis from "@/assets/images/analysis.png"
import left from "@/assets/images/left.png"
import right from "@/assets/images/right.png"

type PlayerColor = 'white' | 'black';
type GamePhase = 'matchmaking' | 'playing' | 'gameover';
type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'error';

interface PlayerDetails {
  country?: ReactNode;
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
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
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
  
  // Renamed from `showResignConfirm` to `showOptionsModal`
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  
  const [boardFen, setBoardFen] = useState<string>('start');
  const abortTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const findGameSent = useRef<boolean>(false);
  const params = useLocalSearchParams();
  const timeControl = params.timeControl ? Number(params.timeControl) : 600;
  const router = useRouter();
  const { userId, token, socket } = useContext(AuthContext);
  const [drawOffered, setDrawOffered] = useState<boolean>(false);
const [opponentOfferedDraw, setOpponentOfferedDraw] = useState<boolean>(false);
const [isMuted, setIsMuted] = useState(false);
const [selectedOption, setSelectedOption] = useState('accept');
const [showAbortConfirm, setShowAbortConfirm] = useState(false);



  // ======= Utility: Time formatting =======
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // ======= Game Start =======
  const handleGameStart = useCallback((data: GameStartData) => {
    console.log('Game started with data:', data);
    try {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setGameId(data.gameId);
      setBoardFen(newGame.fen());

      // Set player color
      const isWhite = data.isWhite;
      setPlayerColor(isWhite ? 'white' : 'black');

      // Initialize times
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);

      // Initialize move history
      if (data.moves && Array.isArray(data.moves)) {
        setMoveHistory(data.moves);
      } else {
        setMoveHistory([]);
      }

      setGamePhase('playing');
      setIsSearching(false);
      setMatchmakingStatus('found');

      // Set opponent info
      setOpponentInfo({
        name: isWhite 
          ? (data.blackPlayerDetails?.name || 'Opponent') 
          : (data.whitePlayerDetails?.name || 'Opponent'),
        rating: isWhite 
          ? (data.blackPlayerDetails?.rating || 1500) 
          : (data.whitePlayerDetails?.rating || 1500)
      });
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, []);

  // ======= Move Made (from server) =======
  const handleMoveMade = useCallback((data: MoveHandlerData) => {
    console.log('Move received from server:', data);
    try {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setBoardFen(data.fen);

      setMoveHistory(prevMoves => {
        const lastMove = prevMoves[prevMoves.length - 1];
        if (data.san && lastMove !== data.san) {
          return [...prevMoves, data.san];
        }
        return prevMoves;
      });

      // Sync time
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);

    } catch (error) {
      console.error('Error handling server move:', error);
      if (data.fen) {
        setGame(new Chess(data.fen));
        setBoardFen(data.fen);
      }
    }
  }, []);

  // ======= Timers for each move =======
  useEffect(() => {
    if (gamePhase !== 'playing' || !game) return;

    const interval = setInterval(() => {
      if (game.turn() === 'w') {
        setWhiteTime(prev => Math.max(0, prev - 1));
        if (whiteTime <= 1 && socket && gameId && playerColor === 'black') {
          socket.emit('timeout', { gameId, color: 'white' });
        }
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
        if (blackTime <= 1 && socket && gameId && playerColor === 'white') {
          socket.emit('timeout', { gameId, color: 'black' });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase, game, whiteTime, blackTime, socket, gameId, playerColor]);

  // ======= Game Ended =======
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

  // ======= Handle Local Move =======
  const handleChessBoardMove = useCallback((moveObj: { from: string, to: string, promotion?: string }) => {
    if (!gameId || !socket || !playerColor || !game || gamePhase !== 'playing') {
      console.log('Invalid move conditions');
      return false;
    }

    try {
      const piece = game.get(moveObj.from);
      if (!piece) {
        console.log('No piece at source square');
        return false;
      }

      const pieceColor = piece.color === 'w' ? 'white' : 'black';
      if (pieceColor !== playerColor) {
        console.log(`Invalid move: Player (${playerColor}) cannot move ${pieceColor} pieces`);
        return false;
      }

      const currentTurn = game.turn() === 'w' ? 'white' : 'black';
      if (currentTurn !== playerColor) {
        console.log(`Invalid move: Not player's turn (current turn: ${currentTurn})`);
        return false;
      }

      const result = game.move(moveObj);
      if (!result) {
        console.log('Invalid chess move');
        return false;
      }

      setBoardFen(game.fen());

      socket.emit('make_move', {
        gameId,
        from: moveObj.from,
        to: moveObj.to,
        promotion: moveObj.promotion
      });

      setGame(new Chess(game.fen()));
      if (result.san) {
        setMoveHistory(prev => [...prev, result.san]);
      }

      return true;
    } catch (error) {
      console.error('Error handling move:', error);
      return false;
    }
  }, [game, gameId, socket, playerColor, gamePhase]);

  // ======= Handle Abort =======
  const handleAbort = () => {
    if (!socket || !gameId || gamePhase !== "playing") {
      console.log('Cannot abort - missing socket, gameId, or wrong game phase');
      return;
    }

    setShowOptionsModal(false);

    if (abortTimeoutRef.current) {
      clearTimeout(abortTimeoutRef.current);
    }

    // Start a longer timeout
    abortTimeoutRef.current = setTimeout(() => {
      if (gamePhase === 'playing') {
        setGameResult("Error: Abort timed out. Please try again.");
      }
    }, 10000);

    // The server may treat “abort” the same way as “resign” or differently.
    // For demonstration, we reuse the same event:
    socket.emit("resign_game", gameId, (acknowledgement: { success?: boolean, error?: string }) => {
      if (abortTimeoutRef.current) {
        clearTimeout(abortTimeoutRef.current);
        abortTimeoutRef.current = null;
      }

      if (acknowledgement?.error) {
        console.log('Abort error:', acknowledgement.error);
        setGameResult(`Abort failed: ${acknowledgement.error}`);
        setGamePhase('gameover');
      }
    });
  };

  const handleOfferDraw = () => {
    if (!socket || !gameId) {
      console.error('Cannot offer draw - socket or gameId missing:', { socket: !!socket, gameId });
      return;
    }
    
    console.log('Offering draw for game:', gameId);
    
    // Send just the gameId as a string - this is the fix!
    socket.emit('offer_draw', gameId);
    
    setDrawOffered(true);
    setShowOptionsModal(false);
   Alert.alert("Draw Offered", "Your draw offer has been sent to your opponent.");
  }
  
  // 3. Update the accept/decline draw handlers
  const handleAcceptDraw = () => {
    if (!socket || !gameId) {
      console.error('Cannot accept draw - socket or gameId missing');
      return;
    }
    
    console.log('Accepting draw for game:', gameId);
    socket.emit('accept_draw', gameId ); // Use consistent format for emitting events
    setOpponentOfferedDraw(false);
  };
  
  const handleDeclineDraw = () => {
    if (!socket || !gameId) {
      console.error('Cannot decline draw - socket or gameId missing');
      return;
    }
    
    console.log('Declining draw for game:', gameId);
    socket.emit('decline_draw',  gameId ); // Use consistent format for emitting events
    setOpponentOfferedDraw(false);
  };

  // ======= Socket & Matchmaking Setup =======
  useEffect(() => {
    if (!socket || !token) {
      console.log('Socket or token not available');
      return;
    }

    if (gamePhase === 'matchmaking' && !findGameSent.current) {
      console.log('Starting game search with time control:', timeControl);
      socket.emit('find_game', timeControl);
      findGameSent.current = true;
      setIsSearching(true);
      setMatchmakingStatus('searching');

      const timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
      setSearchTimer(timer);
    }

    // Event handlers
    const handleGameWaiting = () => {
      console.log('Game waiting - searching for opponent');
      setIsSearching(true);
      setMatchmakingStatus('searching');
    };

    const handleGameStartWrapper = (data: GameStartData) => {
      console.log('Game start event received:', data);

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
      findGameSent.current = false;
    };
    const handleDrawOffered = () => {
      console.log('Opponent offered a draw for game:', gameId);
      setOpponentOfferedDraw(true);
    };
  
    const handleDrawDeclined = () => {
      console.log('Draw was declined');
      Alert.alert("Draw Declined", "Your opponent declined the draw offer.");
      setDrawOffered(false);
    };

    socket.on('game_waiting', handleGameWaiting);
    socket.on('game_start', handleGameStartWrapper);
    socket.on('move_made', handleMoveMade);
    socket.on('game_ended', handleGameEnded);
    socket.on('matchmaking_error', handleMatchmakingError);
    socket.on('draw_offered', handleDrawOffered);
    socket.on('draw_declined', handleDrawDeclined);

    socket.on('connect', () => {
      console.log('Socket connected');
      if (gamePhase === 'matchmaking' && !findGameSent.current) {
        socket.emit('find_game', timeControl);
        findGameSent.current = true;
      }
    });
   
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (err) => console.log('Socket error:', err));

    return () => {
      socket.off('game_waiting', handleGameWaiting);
      socket.off('game_start', handleGameStartWrapper);
      socket.off('move_made', handleMoveMade);
      socket.off('game_ended', handleGameEnded);
      socket.off('matchmaking_error', handleMatchmakingError);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('draw_offered', handleDrawOffered);
      socket.off('draw_declined', handleDrawDeclined);
      if (searchTimer) clearInterval(searchTimer);

      if (isSearching) socket.emit('cancel_search');
      if (gameId && gamePhase !== 'gameover') socket.emit('leave_game', { gameId });
    };
  }, [
    socket, 
    token, 
    gamePhase, 
    timeControl, 
    searchTimer, 
    handleGameStart, 
    handleMoveMade, 
    handleGameEnded, 
    gameId
  ]);

  // ======= Listen for Abort success/failure =======
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleResignSuccess = (data: { winner: PlayerColor }) => {
      if (abortTimeoutRef.current) {
        clearTimeout(abortTimeoutRef.current);
        abortTimeoutRef.current = null;
      }
      const resultText = data.winner === playerColor 
        ? "Opponent resigned. You won!" 
        : "You resigned. You lost.";
      setGameResult(resultText);
      setGamePhase("gameover");
    };

    const handleResignError = (error: { message: string }) => {
      if (abortTimeoutRef.current) {
        clearTimeout(abortTimeoutRef.current);
        abortTimeoutRef.current = null;
      }
      setGameResult(`Abort failed: ${error.message}`);
    };

    socket.on('resign_failed', handleResignError);
    socket.on("resign_success", handleResignSuccess);
    socket.on('draw_offered', () => {
      console.log('Received draw offer event! Game ID:', gameId);
      setOpponentOfferedDraw(true);
    });

    return () => {
      socket.off("resign_success", handleResignSuccess);
      socket.off('resign_failed', handleResignError);
    };
  }, [socket, gameId, playerColor]);

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
      <ScrollView 
        horizontal={true} 
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "#000", height:34 }}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {pairedMoves.map((pair, index) => (
          <View 
            key={index} 
            style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 0,
            }}
          >
            <Text style={{ color: "#fff", marginRight: 1 }}>{pair.number}.</Text>
            <Text style={{ color: "#fff", width: 60 }}>{pair.white || '...'}</Text>
            <Text style={{ color: "#fff", width: 60 }}>{pair.black || ''}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
  {/* Back button on the left */}
  {gamePhase === 'playing' && (
    <TouchableOpacity 
    style={styles.backButton} 
    onPress={() => setShowAbortConfirm(true)}
  >
    <Image source={backbtn} style={styles.backButton} />
  </TouchableOpacity>
  
  )}
  
  {/* Logo and title in the center */}
  <View style={styles.centerContainer} accessibilityRole="header">
    <Image 
      source={logo} 
      style={styles.logo} 
      accessibilityLabel="ChessVeda logo"
    />
    <Text style={styles.htext}>ChessVeda</Text>
  </View>
  
  {/* Mute button on the right */}
  <TouchableOpacity 
    style={styles.muteButton}
    onPress={() => setIsMuted(!isMuted)}
    accessibilityLabel={isMuted ? "Unmute sound" : "Mute sound"}
    accessibilityHint="Toggles game sound on and off"
  >
   <Image 
  source={isMuted ? dspeaker : speaker} 
  style={[styles.muteButton, isMuted && styles.dspeaker]} 
/>
  </TouchableOpacity>
</View>
        {/* ====== MATCHMAKING PHASE ====== */}
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
            {/* ====== Top Player (Opponent) ====== */}
            <View style={styles.playerInfoTop}>
              <View style={styles.playerDetails}>
                <Image 
                  source={{ uri: 'https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg' }} 
                  style={styles.playerAvatar} 
                />
                <View>
                  <Text style={styles.playerName}>{opponentInfo.name}</Text>
                  <Text style={styles.playerRating}>{opponentInfo.rating}</Text>
                  {/* If you want to show opponent country, ensure `country` is a string or image */}
                  {opponentInfo.country ? (
                    <Text style={styles.playerRating}>{opponentInfo.country}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formatTime(playerColor === 'white' ? blackTime : whiteTime)}
                </Text>
              </View>
            </View>

            {/* ====== Chess Board ====== */}
            {gamePhase === 'playing' && game && (
              <CustomChessBoard
                fen={boardFen}
                onMove={handleChessBoardMove}
                orientation={playerColor}
                customPieces={{
                  wK: require('@/assets/images/king-white.png'),
                  wQ: require('@/assets/images/queen-white.png'),
                  wB: require('@/assets/images/bishop-white.png'),
                  wN: require('@/assets/images/knight-white.png'),
                  wP: require('@/assets/images/white-pawn.png'),
                  wR: require('@/assets/images/rook-white.png'),
                  bK: require('@/assets/images/black-king.png'),
                  bQ: require('@/assets/images/black-queen.png'),
                  bB: require('@/assets/images/black-bishop.png'),
                  bN: require('@/assets/images/black-knight.png'),
                  bP: require('@/assets/images/black-pawn.png'),
                  bR: require('@/assets/images/black-rook.png'),
                }}
              />
            )}

            {/* ====== Bottom Player (You) ====== */}
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

            {/* ====== Move History ====== */}
            <View style={styles.controlsContainer}>
              <MoveHistory moves={moveHistory} />
            </View>
          </>
        ) : (
          /* ====== GAME OVER PHASE ====== */
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
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

        {/* ====== The NEW Modal With Options ====== */}
        <Modal
          transparent={true}
          visible={showOptionsModal}
          animationType="slide"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Game Options</Text>
               {/* Close button */}
               <TouchableOpacity 
  style={[styles.optionButton]} 
  onPress={() => setShowOptionsModal(false)}
>
<Image source={cross} />
</TouchableOpacity>
</View>
              
              {/* Option: Draw */}
              <TouchableOpacity 
  style={[styles.optionButton, drawOffered && styles.disabledButton]} 
  onPress={handleOfferDraw}
  disabled={drawOffered}
>
  <Text style={styles.optionButtonText}>
    {drawOffered ? "Draw Offered" : "Offer Draw"}
  </Text>
</TouchableOpacity>

              {/* Option: Abort (calls handleAbort) */}
              <TouchableOpacity style={styles.optionButton} onPress={handleAbort}>
                <Text style={styles.optionButtonText}>Abort</Text>
              </TouchableOpacity>

              {/* Option: Share Game */}
              <TouchableOpacity style={styles.optionButton} onPress={() => {
                Alert.alert("Share Game not implemented yet!");
              }}>
                <Text style={styles.optionButtonText}>Share Game</Text>
              </TouchableOpacity>

              {/* Option: Settings */}
              <TouchableOpacity style={styles.optionButton} onPress={() => {
                Alert.alert("Settings not implemented yet!");
              }}>
                <Text style={styles.optionButtonText}>Settings</Text>
              </TouchableOpacity>

              {/* Option: Flip Board */}
              <TouchableOpacity style={styles.optionButton} onPress={() => {
                Alert.alert("Flip Board not implemented yet!");
              }}>
                <Text style={styles.optionButtonText}>Flip Board</Text>
              </TouchableOpacity>

              {/* Option: Disable Sounds */}
             {/* Option: Disable Sounds */}
<TouchableOpacity 
  style={styles.optionButton} 
  onPress={() => {
    setIsMuted(!isMuted); // This will toggle the sound state
    setShowOptionsModal(false); // Close the modal after pressing
  }}
>
  <Text style={styles.optionButtonText}>
    {isMuted ? "Enable Sounds" : "Disable Sounds"}
  </Text>
</TouchableOpacity>

             
            </View>
          </View>
        </Modal>
        <Modal
      transparent={true}
      visible={opponentOfferedDraw}
      animationType="slide"
      onRequestClose={() => setOpponentOfferedDraw(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Draw Offer</Text>
          <Text style={styles.drawOfferText}>
            Your opponent has offered a draw. Do you accept?
          </Text>
          <View style={styles.drawButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.drawResponseButton, 
                styles.acceptButton,
                selectedOption === 'accept' && styles.selectedButton
              ]} 
              onPress={() => {
                setSelectedOption('accept');
                handleAcceptDraw();
              }}
              activeOpacity={0.7}
              pressRetentionOffset={{top: 10, left: 10, bottom: 10, right: 10}}
            >
              <Text style={styles.drawResponseButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.drawResponseButton, 
                styles.declineButton,
                selectedOption === 'decline' && styles.selectedButton
              ]} 
              onPress={() => {
                setSelectedOption('decline');
                handleDeclineDraw();
              }}
              activeOpacity={0.7}
              pressRetentionOffset={{top: 10, left: 10, bottom: 10, right: 10}}
            >
              <Text style={styles.drawResponseButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>


    <Modal
  animationType="fade"
  transparent={true}
  visible={showAbortConfirm}
  onRequestClose={() => setShowAbortConfirm(false)}
>
  <View style={{
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <View style={{
      backgroundColor: '#292929',
      borderRadius: 12,
      padding: 20,
      width: '80%',
      alignItems: 'center'
    }}>
      <Text style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color:'#fff' }}>
        Do you want to resign the game?
      </Text>
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <TouchableOpacity
          onPress={() => {
            setShowAbortConfirm(false);
            handleAbort(); // Trigger abort logic here
          }}
          style={{ backgroundColor: '#3D3D3D', padding: 10, borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>Yes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowAbortConfirm(false)}
          style={{ backgroundColor: '#3D3D3D', padding: 10, borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>












    <View style={styles.footer}>
  <View style={styles.footerEle}>
    <TouchableOpacity style={styles.footerButton}  onPress={() => setShowOptionsModal(true)}
      disabled={gamePhase !== 'playing'}
      accessibilityLabel="Back button"
      accessibilityHint="Opens game options menu">
      <Image source={menu} style={styles.footerIcon} />
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.footerButton}>
      <Image source={analysis} style={styles.footerIcon} />
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.footerButton}>
      <Image source={left} style={styles.footerIcon} />
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.footerButton}>
      <Image source={right} style={styles.footerIcon} />
    </TouchableOpacity>
  </View>
</View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    height:76,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#292929',
    padding: 10,
  
    borderColor: '#4CAF50',
  },
  playerInfoBottom: {
    height:76,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#292929',
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
    backgroundColor: '#202020',
    width:79,
    height:44,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  timeText: {
    color: 'white',
    fontWeight: '600',
    textAlign:"center",
    
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
  // modalOverlay: {
  //   flex: 1,
  //   backgroundColor: 'rgba(0,0,0,0.5)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginBottom:45,
    backgroundColor: '#000', // or your preferred color
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backButton: {
    width: 19, // adjust as needed
    height: 19.5, // adjust as needed
    color:'#fff',
    marginLeft: 5,
  },
  logo: {
    width: 19.58, // adjust as needed
    height: 32, // adjust as needed
    color:'#fff',
    marginRight: 10,
  },
  htext: {
    fontSize: 16,
    fontWeight: 600,
    color:'#fff',
  },
  muteButton: {
    
    width: 21, // adjust as needed
    height: 15, // adjust as needed
    color:'#fff',
    marginRight: 10,
  },
  dspeaker: {
    
    width: 21, // adjust as needed
    height: 15, // adjust as needed
    color:'#fff',
    marginRight: 10,
  },
 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'flex-end', 
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: 406,
    backgroundColor: '#292929',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    marginTop: 12,
    fontWeight: '400'
  },
  drawOfferText: {
    fontSize: 16,
    color: 'white',
    marginVertical: 20,
  },
  drawButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 10,
  },
  drawResponseButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 0,  // Default: no border
    minWidth: 100,
    alignItems: 'center',
  },
  pressedButton: {
    borderWidth: 1,
    borderColor: '#ffffff',  // White border only when pressed
  },
  acceptButton: {
    backgroundColor: '#3D3D3D',
    height:60,
    width:100,
  },
  declineButton: {
    backgroundColor: '#3D3D3D',
    height:60,
    width:100
  },
  selectedButton: {
    borderWidth: 1,
    borderColor: '#ffffff',  // White border for the selected button
  },
  drawResponseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 500,
    textAlign: 'center',
    marginTop:8
  },
  cross:{
   
    color:'#fff'
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  optionButton: {
    backgroundColor: '#333',
    paddingVertical: 12,

    borderRadius: 6,
    marginVertical: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  footer: {
    height: 63,
    marginTop:33,
    paddingHorizontal: 4,
    justifyContent: 'center',
    backgroundColor: '#292929',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerEle: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This creates equal space between items
    alignItems: 'center',
    width: '100%', // Ensure it spans full width
  },
  footerButton: {
    padding: 10, // Makes the touch area larger
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    width: 24, // Set appropriate dimensions for your icons
    height: 24,
    resizeMode: 'contain',
  },
});

export default function GameScreenWrapper() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}












