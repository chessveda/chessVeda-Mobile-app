// components/Modals/OptionsModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { modalStyles } from './modalStyles';

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onOfferDraw: () => void;
  onAbort: () => void;
  drawOffered: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  cross: any; // Image source
}

const OptionsModal: React.FC<OptionsModalProps> = ({ 
  visible, 
  onClose, 
  onOfferDraw, 
  onAbort, 
  drawOffered,
  isMuted,
  setIsMuted,
  cross
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
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Game Options</Text>
            <TouchableOpacity 
              style={modalStyles.optionButton} 
              onPress={onClose}
            >
              <Image source={cross} />
            </TouchableOpacity>
          </View>
          
          {/* Option: Draw */}
          <TouchableOpacity 
            style={[modalStyles.optionButton, drawOffered && modalStyles.disabledButton]} 
            onPress={onOfferDraw}
            disabled={drawOffered}
          >
            <Text style={modalStyles.optionButtonText}>
              {drawOffered ? "Draw Offered" : "Offer Draw"}
            </Text>
          </TouchableOpacity>

          {/* Option: Abort */}
          <TouchableOpacity style={modalStyles.optionButton} onPress={onAbort}>
            <Text style={modalStyles.optionButtonText}>Abort</Text>
          </TouchableOpacity>

          {/* Option: Share Game */}
          <TouchableOpacity style={modalStyles.optionButton} onPress={() => {
            Alert.alert("Share Game not implemented yet!");
          }}>
            <Text style={modalStyles.optionButtonText}>Share Game</Text>
          </TouchableOpacity>

          {/* Option: Settings */}
          <TouchableOpacity style={modalStyles.optionButton} onPress={() => {
            Alert.alert("Settings not implemented yet!");
          }}>
            <Text style={modalStyles.optionButtonText}>Settings</Text>
          </TouchableOpacity>

          {/* Option: Flip Board */}
          <TouchableOpacity style={modalStyles.optionButton} onPress={() => {
            Alert.alert("Flip Board not implemented yet!");
          }}>
            <Text style={modalStyles.optionButtonText}>Flip Board</Text>
          </TouchableOpacity>

          {/* Option: Toggle Sounds */}
          <TouchableOpacity 
            style={modalStyles.optionButton} 
            onPress={() => {
              setIsMuted(!isMuted);
              onClose();
            }}
          >
            <Text style={modalStyles.optionButtonText}>
              {isMuted ? "Enable Sounds" : "Disable Sounds"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default OptionsModal;