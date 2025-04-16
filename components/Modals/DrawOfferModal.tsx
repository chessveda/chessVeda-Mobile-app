// components/Modals/DrawOfferModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { modalStyles } from './modalStyles';

interface DrawOfferModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  selectedOption: string;
  setSelectedOption: (option: string) => void;
}

const DrawOfferModal: React.FC<DrawOfferModalProps> = ({
  visible,
  onAccept,
  onDecline,
  onClose,
  selectedOption,
  setSelectedOption
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <Text style={modalStyles.modalTitle}>Draw Offer</Text>
          <Text style={modalStyles.drawOfferText}>
            Your opponent has offered a draw. Do you accept?
          </Text>
          <View style={modalStyles.drawButtonsContainer}>
            <TouchableOpacity 
              style={[
                modalStyles.drawResponseButton, 
                modalStyles.acceptButton,
                selectedOption === 'accept' && modalStyles.selectedButton
              ]} 
              onPress={() => {
                setSelectedOption('accept');
                onAccept();
              }}
              activeOpacity={0.7}
              pressRetentionOffset={{top: 10, left: 10, bottom: 10, right: 10}}
            >
              <Text style={modalStyles.drawResponseButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                modalStyles.drawResponseButton, 
                modalStyles.declineButton,
                selectedOption === 'decline' && modalStyles.selectedButton
              ]} 
              onPress={() => {
                setSelectedOption('decline');
                onDecline();
              }}
              activeOpacity={0.7}
              pressRetentionOffset={{top: 10, left: 10, bottom: 10, right: 10}}
            >
              <Text style={modalStyles.drawResponseButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DrawOfferModal;