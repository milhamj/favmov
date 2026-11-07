import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { createCollection } from '../services/collectionService';
import { Success } from '../model/apiResponse';
import { FIELD_STYLES } from '../styles/fields';
import { COLORS } from '../styles/colors';
import AppButton from './AppButton';

interface CreateCollectionSheetProps {
  visible: boolean;
  onClose: (isSuccess: boolean, collectionName?: string) => void;
}

const CreateCollectionSheet: React.FC<CreateCollectionSheetProps> = ({
  visible,
  onClose
}) => {
  const [collectionName, setCollectionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null as string | null);
  
  const handleSave = async () => {
    const collectionNameTrimmed = collectionName.trim();
    if (isSaving || !collectionNameTrimmed) return;

    setIsSaving(true);
    setErrorMessage(null);

    const result = await createCollection(collectionNameTrimmed);
    if (result instanceof Success) {
      setCollectionName('');
      onClose(true, collectionNameTrimmed);
    } else {
      setErrorMessage(result.message);
    }

    setIsSaving(false);
  };

  const handleClose = () => {
    if (isSaving) return;
    
    setCollectionName('');
    setErrorMessage(null);
    onClose(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={handleClose}
      >
        <Pressable 
          style={styles.bottomSheet}
          onPress={(e) => {
            // Prevent closing when pressing on the bottom sheet itself
            e.stopPropagation();
          }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create New Collection</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[FIELD_STYLES.input, styles.input]}
                accessibilityLabel="Name"
                placeholderTextColor={COLORS.secondaryText}
                placeholder="Type collection name here..."
                value={collectionName}
                onChangeText={setCollectionName}
                autoFocus
              />
            </View>

            { errorMessage 
                && <Text style={styles.errorMessage}> {errorMessage} </Text>
            }
            
            <AppButton label="Save" onPress={handleSave} disabled={!collectionName.trim()} loading={isSaving} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...FIELD_STYLES.surface,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 24,
    color: 'red',
  },
});

export default CreateCollectionSheet;