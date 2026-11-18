import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Platform, Pressable } from 'react-native';
import { createCollection } from './collectionService';
import { useQueryClient } from '@tanstack/react-query';
import { FIELD_STYLES } from '@/theme/fields';
import { COLORS, RADIUS, SPACING } from '@/theme/colors';
import AppButton from '@/components/AppButton';

interface CreateCollectionSheetProps {
  visible: boolean;
  onClose: (isSuccess: boolean, collectionName?: string) => void;
}

const CreateCollectionSheet: React.FC<CreateCollectionSheetProps> = ({ visible, onClose }) => {
  const queryClient = useQueryClient();
  const [collectionName, setCollectionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null as string | null);

  const handleSave = async () => {
    const collectionNameTrimmed = collectionName.trim();
    if (isSaving || !collectionNameTrimmed) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createCollection(collectionNameTrimmed);
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      setCollectionName('');
      onClose(true, collectionNameTrimmed);
    } catch (result: unknown) {
      setErrorMessage(result instanceof globalThis.Error ? result.message : '');
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
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close collection dialog"
          aria-disabled={isSaving}
          disabled={isSaving}
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Collection</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[FIELD_STYLES.input, FIELD_STYLES.surface, styles.input]}
              accessibilityLabel="Name"
              placeholderTextColor={COLORS.secondaryText}
              placeholder="Type collection name here..."
              value={collectionName}
              onChangeText={setCollectionName}
              autoFocus
            />

            {errorMessage && <Text style={styles.errorMessage}> {errorMessage} </Text>}

            <AppButton
              label="Save"
              onPress={handleSave}
              disabled={!collectionName.trim()}
              loading={isSaving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.page,
    borderTopLeftRadius: RADIUS.panel,
    borderTopRightRadius: RADIUS.panel,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sheetDivider,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SPACING.small,
    color: COLORS.text,
  },
  input: {
    marginBottom: SPACING.large,
  },
  errorMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: SPACING.large,
    color: COLORS.validationError,
  },
});

export default CreateCollectionSheet;
