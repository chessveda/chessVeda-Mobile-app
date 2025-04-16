//components/Modals/MatchmakingModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface MatchmakingModalProps {
  visible: boolean;
  matchmakingStatus: 'searching' | 'error' | string;
  searchTime: number;
  timeControl: number;
  onCancel: () => void;
  onRetry: () => void;
  formatTime: (time: number) => string;
}

const MatchmakingModal: React.FC<MatchmakingModalProps> = ({ 
  visible, 
  matchmakingStatus, 
  searchTime, 
  timeControl, 
  onCancel, 
  onRetry,
  formatTime 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
        <ActivityIndicator size="large" color="#3D4CED" style={styles.spinner} />
          
          {matchmakingStatus === 'searching' ? (
            <>
              <Text style={styles.modalTitle}>
              {timeControl / 60} Min Game
              </Text>
              <Text style={styles.searchingText}>
                Starting Soon... {formatTime(searchTime)}
                </Text>
                
              
             
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : matchmakingStatus === 'error' ? (
            <>
              <Text style={styles.errorText}>Error finding opponent</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={onRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: 402,
    height:332,
    backgroundColor: '#292929',
    borderRadius: 32,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  searchingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  spinner: {
    margin: 20,
  },
  cancelButton: {
    
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    textDecorationLine: 'underline'
  },
  errorText: {
    color: '#E53935',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MatchmakingModal;