import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import ImageViewer from 'react-native-image-zoom-viewer';

interface FullImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const FullImageViewer: React.FC<FullImageViewerProps> = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButtonContainer} onPress={onClose}>
            <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <ImageViewer
          imageUrls={[{ url: imageUrl }]}
          enableSwipeDown={true}
          saveToLocalByLongPress={false}
          onSwipeDown={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
});

export default FullImageViewer;