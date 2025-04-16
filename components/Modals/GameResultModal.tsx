// components/Modals/GameResultModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

type ResultType = 'victory' | 'defeat' | 'draw';
type ReasonType = 'checkmate' | 'timeout' | 'resignation' | 'agreement' | 'stalemate' | 'insufficient' | 'fifty' | 'repetition';

interface GameResultModalProps {
  visible: boolean;
  onClose: () => void;
  resultType: ResultType;
  reason: ReasonType;
  ratingChange?: number;
  newRating?: number;
  playerName?: string;
  opponentName?: string;
}

const RatingChangeComponent: React.FC<{ ratingChange: number }> = ({ ratingChange }) => {
  return (
    <View style={ratingStyles.container}>
      <Text style={ratingStyles.text}>
        Rating Changes
      </Text>
    </View>
  );
};

const GameResultModal: React.FC<GameResultModalProps> = ({
  visible,
  onClose,
  resultType,
  reason,
  ratingChange = 0,
  newRating,
  playerName = 'You',
  opponentName = 'Opponent',
}) => {
  const router = useRouter();

  const getTitle = () => {
    switch (resultType) {
      case 'victory': return 'Victory!';
      case 'defeat': return 'Defeat';
      case 'draw': return 'Draw';
      default: return 'Game Over';
    }
  };

  const getMessage = () => {
    switch (resultType) {
      case 'victory':
        switch (reason) {
          case 'checkmate': return `You checkmated ${opponentName}!`;
          case 'timeout': return `${opponentName} ran out of time!`;
          case 'resignation': return 'Opponent resigned!';
          default: return `You won the game!`;
        }
      case 'defeat':
        switch (reason) {
          case 'checkmate': return `${opponentName} checkmated you!`;
          case 'timeout': return `You ran out of time!`;
          case 'resignation': return `You resigned!`;
          default: return `You lost the game!`;
        }
      case 'draw':
        switch (reason) {
          case 'agreement': return `Draw by agreement!`;
          case 'stalemate': return `Draw by stalemate!`;
          case 'insufficient': return `Draw by insufficient material!`;
          case 'fifty': return `Draw by fifty-move rule!`;
          case 'repetition': return `Draw by threefold repetition!`;
          default: return `The game ended in a draw!`;
        }
      default:
        return 'The game has ended!';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.message}>{getMessage()}</Text>
          
          {/* Rating Change Component */}
          <RatingChangeComponent ratingChange={ratingChange} />
          
          {newRating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                Rating: {newRating} 
                <Text style={[
                  styles.ratingChange, 
                  ratingChange > 0 ? styles.ratingPositive : 
                  ratingChange < 0 ? styles.ratingNegative : {}
                ]}>
                  {' '}{ratingChange > 0 ? '+' : ''}{ratingChange}
                </Text>
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => {
                onClose();
                router.push('/newGame');
              }}
            >
              <Text style={styles.primaryButtonText}>New Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => {
                onClose();
                router.push('/(tabs)/home');
              }}
            >
              <Text style={styles.secondaryButtonText}>Main Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ratingStyles = StyleSheet.create({
  container: {
    borderColor:'#fff',
    borderWidth:1,
    width: '95%',
    height: 150,
    borderRadius:16,
    marginBottom:20

  },
  text: {
    marginTop:8,
    color:'#fff',
    textAlign:'center'
  },
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#292929',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  ratingContainer: {
  
  },
  ratingText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  ratingChange: {
    fontWeight: 'bold',
  },
  ratingPositive: {
    color: '#4CAF50',
  },
  ratingNegative: {
    color: '#F44336',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GameResultModal;