// components/Modals/AbortConfirmModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { modalStyles } from './modalStyles';

interface AbortConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const AbortConfirmModal: React.FC<AbortConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={modalStyles.abortModalOverlay}>
        <View style={modalStyles.abortModalContent}>
          <Text style={modalStyles.abortModalText}>
            Do you want to resign the game?
          </Text>
          <View style={modalStyles.abortButtonsContainer}>
            <TouchableOpacity
              onPress={onConfirm}
              style={modalStyles.abortModalButton}
            >
              <Text style={modalStyles.abortModalButtonText}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              style={modalStyles.abortModalButton}
            >
              <Text style={modalStyles.abortModalButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AbortConfirmModal;