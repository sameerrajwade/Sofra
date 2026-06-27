import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Button, Avatar, Text } from 'react-native-paper';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';

interface AvatarPickerProps {
  currentAvatar: string | null;
  userName: string;
  onSelect: (uri: string | null) => void;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getInitialsColor = (name: string): string => {
  const palette = [
    '#534AB7', '#1D9E75', '#D85A30', '#EF9F27',
    '#2196F3', '#9C27B0', '#00BCD4', '#FF5722',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  userName,
  onSelect,
}) => {
  const initials = getInitials(userName);
  const initialsColor = getInitialsColor(userName);

  const handleCamera = async () => {
    try {
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      if (result.assets?.[0]?.uri) {
        onSelect(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.assets?.[0]?.uri) {
        onSelect(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const handleInitials = () => {
    onSelect(null);
  };

  return (
    <View style={styles.container} accessibilityLabel="Avatar picker">
      <View style={styles.avatarContainer}>
        {currentAvatar ? (
          <Avatar.Image
            size={96}
            source={{ uri: currentAvatar }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[styles.initialsCircle, { backgroundColor: initialsColor }]}
            accessibilityLabel={`Initials avatar: ${initials}`}
          >
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <Button
          mode="outlined"
          icon="camera"
          onPress={handleCamera}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          accessibilityLabel="Take photo"
        >
          Take Photo
        </Button>
        <Button
          mode="outlined"
          icon="image"
          onPress={handleGallery}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          accessibilityLabel="Choose from gallery"
        >
          Gallery
        </Button>
        <Button
          mode="outlined"
          icon="account"
          onPress={handleInitials}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          accessibilityLabel="Use initials"
        >
          Initials
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    backgroundColor: Colors.surfaceVariant,
  },
  initialsCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.white,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
  },
  buttonLabel: {
    fontSize: FontSize.sm,
  },
});

export default AvatarPicker;
