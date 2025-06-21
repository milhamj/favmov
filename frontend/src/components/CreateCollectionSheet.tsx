import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createCollection } from '../services/collectionService';
import { Success } from '../model/apiResponse';

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
  const { session } = useAuth();
  
  const handleSave = async () => {
    const collectionNameTrimmed = collectionName.trim();
    if (isSaving || !collectionNameTrimmed) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const result = await createCollection(collectionName.trim(), session.access_token);
      
      if (result instanceof Success) {
        setCollectionName('');
        onClose(true, collectionName.trim());
      } else {
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create collection');
    } finally {
      setIsSaving(false);
    }
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
                style={styles.input}
                placeholder="Type collection name here..."
                value={collectionName}
                onChangeText={setCollectionName}
                autoFocus
              />
            </View>

            { errorMessage 
                && <Text style={styles.errorMessage}> {errorMessage} </Text>
            }
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={!collectionName.trim() || isSaving}
              activeOpacity={0.7}
            >
                {
                    isSaving ?
                        <ActivityIndicator size="small" color="#ffffff" /> : 
                        <Text style={styles.saveButtonText}>Save</Text> 
                }
            </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  errorMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 24,
    color: 'red',
  },
  saveButton: {
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateCollectionSheet;