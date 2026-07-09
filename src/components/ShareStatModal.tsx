import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Modal, Share, Alert, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Spacing, FontSize, BorderRadius, Fonts } from '../config/theme';

export interface ShareStat {
  headline: string; // e.g. "Home cooked this month"
  value: string; // e.g. "88%"
  sub?: string; // e.g. "Last month was 86%"
  accent?: string; // dot/bar accent
}

interface Props {
  stat: ShareStat | null;
  onClose: () => void;
}

// Fixed brand palette — the share card looks the same regardless of app theme.
const TERRA = '#C0532E';
const CREAM = '#FBF7F2';
const CREAM_DIM = 'rgba(251,247,242,0.82)';
const SAGE = '#7FB08D';

export const ShareStatModal: React.FC<Props> = ({ stat, onClose }) => {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const doShare = useCallback(async () => {
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      // Sharing.shareAsync sends the actual PNG on both Android & iOS. React
      // Native's Share.share only carries `url` on iOS, so on Android it would
      // drop the image and share plain text — hence expo-sharing here.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Share your Sofra stat',
        });
      } else {
        await Share.share({ url: uri, message: 'My family’s meal memory — Sofra' });
      }
    } catch {
      Alert.alert('Couldn’t share', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Modal visible={!!stat} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* The captured card */}
          {stat && (
            <View ref={cardRef} collapsable={false} style={styles.card}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={CREAM} />
                <Text style={styles.brand}>Sofra</Text>
                <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={CREAM} />
              </View>
              <View style={styles.valueWrap}>
                <View style={[styles.accentDot, { backgroundColor: stat.accent ?? SAGE }]} />
                <Text style={styles.value}>{stat.value}</Text>
              </View>
              <Text style={styles.headline}>{stat.headline}</Text>
              {stat.sub ? <Text style={styles.sub}>{stat.sub}</Text> : null}
              <View style={styles.divider} />
              <Text style={styles.tagline}>Your family’s meal memory</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button mode="text" onPress={onClose} textColor={TERRA} disabled={busy}>
              Close
            </Button>
            <Button
              mode="contained"
              icon="share-variant"
              onPress={doShare}
              loading={busy}
              disabled={busy}
              buttonColor={TERRA}
              textColor={CREAM}
            >
              Share
            </Button>
          </View>
        </View>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Dismiss" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  backdropTap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
  sheet: { width: 320, alignItems: 'stretch' },
  card: {
    backgroundColor: TERRA,
    borderRadius: 24,
    paddingVertical: Spacing.xl + Spacing.sm,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  brand: { fontFamily: Fonts.display, fontSize: 22, color: CREAM, letterSpacing: 0.5 },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accentDot: { width: 14, height: 14, borderRadius: 7 },
  value: { fontFamily: Fonts.display, fontSize: 64, color: CREAM, lineHeight: 70 },
  headline: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.lg, color: CREAM, textAlign: 'center', marginTop: Spacing.sm },
  sub: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: CREAM_DIM, textAlign: 'center', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(251,247,242,0.25)', alignSelf: 'stretch', marginVertical: Spacing.lg },
  tagline: { fontFamily: Fonts.displayMedium, fontSize: FontSize.sm, color: CREAM_DIM },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: CREAM,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});

export default ShareStatModal;
