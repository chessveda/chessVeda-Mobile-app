// components/Modals/modalStyles.ts
import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
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
  // Draw offer modal styles
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
    borderWidth: 0,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#3D3D3D',
    height: 60,
    width: 100,
  },
  declineButton: {
    backgroundColor: '#3D3D3D',
    height: 60,
    width: 100
  },
  selectedButton: {
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  drawResponseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8
  },
  // Abort confirmation modal styles
  abortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  abortModalContent: {
    backgroundColor: '#292929',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center'
  },
  abortModalText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#fff'
  },
  abortButtonsContainer: {
    flexDirection: 'row',
    gap: 20
  },
  abortModalButton: {
    backgroundColor: '#3D3D3D',
    padding: 10,
    borderRadius: 8
  },
  abortModalButtonText: {
    color: 'white'
  }
});