import React, { useMemo } from 'react';
import { StyleSheet, View, Alert, Linking } from 'react-native';
import { Button, Avatar, Text } from 'react-native-paper';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface AvatarPickerProps {
  currentAvatar: string | null;
  userName: string;
  onSelect: (uri: string | null) => void;
  // When false, renders only the change-photo buttons (the caller shows the
  // avatar itself) — avoids a duplicate avatar on the Profile screen.
  showAvatar?: boolean;
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
  showAvatar = true,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const initials = getInitials(userName);
  const initialsColor = getInitialsColor(userName);

  // react-native-image-picker reports cancel/permission via the result, not throws.
  const handleResult = (result: ImagePickerResponse, source: string) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      if (result.errorCode === 'permission') {
        Alert.alert(
          `${source} access needed`,
          `Allow ${source.toLowerCase()} access in Settings to set a photo.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
      } else {
        Alert.alert('Couldn\'t open', result.errorMessage ?? `Could not open ${source.toLowerCase()}.`);
      }
      return;
    }
    if (result.assets?.[0]?.uri) {
      onSelect(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    try {
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      handleResult(result, 'Camera');
    } catch {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      handleResult(result, 'Photos');
    } catch {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const handleInitials = () => {
    onSelect(null);
  };

  return (
    <View style={styles.container} accessibilityLabel="Avatar picker">
      {showAvatar && (
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
      )}

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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: Spacing.md,
    },
    avatarContainer: {
      marginBottom: Spacing.md,
    },
    avatar: {
      backgroundColor: c.surfaceVariant,
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
      fontFamily: Fonts.display,
      color: c.white,
    },
    buttons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    button: {
      borderColor: c.border,
      borderRadius: BorderRadius.sm,
    },
    buttonLabel: {
      fontSize: FontSize.sm,
    },
  });

export default AvatarPicker;
