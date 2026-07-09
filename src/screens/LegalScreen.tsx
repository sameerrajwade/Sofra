import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Spacing, FontSize, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import type { ProfileStackParamList } from '../navigation/types';

// NOTE: These are plain-language DRAFT documents describing what the app
// actually does. Have them reviewed by legal counsel and replace/adjust to
// match your final data practices and jurisdiction before public launch.

const LAST_UPDATED = 'July 2026';

interface Section {
  heading: string;
  body: string;
}

const PRIVACY: Section[] = [
  {
    heading: 'Overview',
    body: 'Sofra helps you and your household plan meals, track dishes and restaurants, and see insights about your eating and spending. This policy explains what we collect and how we use it.',
  },
  {
    heading: 'Information we collect',
    body:
      'Account details you provide (name, email) when you sign up or sign in with Google. Content you create in the app: meals, dishes, restaurants, costs, notes, household name and members, and an optional profile photo. Basic device information needed to run the app reliably.',
  },
  {
    heading: 'How we use your information',
    body:
      'To provide the core features — saving your meal history, generating plans, and computing insights — and to sync data across the members of your household. We do not sell your personal information.',
  },
  {
    heading: 'Storage and sharing',
    body:
      'Your data is stored using Google Firebase (Authentication, Cloud Firestore, and Cloud Storage). Data you create in a household is visible to the members of that household. We use Google Sign-In when you choose it. These providers process data on our behalf under their own terms.',
  },
  {
    heading: 'Your choices',
    body:
      'You can edit or delete your meals, dishes, and profile photo at any time. You can delete your account from Settings, which removes your personal data associated with the account.',
  },
  {
    heading: 'Children',
    body: 'Sofra is intended for general audiences and is not directed at children under 13.',
  },
  {
    heading: 'Contact',
    body: 'Questions about this policy? Email sofra.support@gmail.com.',
  },
];

const TERMS: Section[] = [
  {
    heading: 'Acceptance',
    body: 'By creating an account or using Sofra, you agree to these terms. If you do not agree, please do not use the app.',
  },
  {
    heading: 'Your account',
    body:
      'You are responsible for keeping your login secure and for the activity in your household. Provide accurate information and keep it up to date.',
  },
  {
    heading: 'Acceptable use',
    body:
      'Use Sofra only for lawful, personal meal-planning purposes. Do not attempt to disrupt the service, access other users’ data, or misuse invite codes.',
  },
  {
    heading: 'Your content',
    body:
      'You keep ownership of the content you add (meals, dishes, notes, photos). You grant us permission to store and process it to operate the app for you and your household.',
  },
  {
    heading: 'Service “as is”',
    body:
      'Sofra is provided “as is” without warranties. Insights and plans are suggestions to help you decide — they are not professional dietary or financial advice.',
  },
  {
    heading: 'Limitation of liability',
    body:
      'To the extent permitted by law, we are not liable for indirect or incidental damages arising from your use of the app.',
  },
  {
    heading: 'Changes',
    body:
      'We may update these terms as the app evolves. Continued use after changes means you accept the updated terms.',
  },
  {
    heading: 'Contact',
    body: 'Questions about these terms? Email sofra.support@gmail.com.',
  },
];

export const LegalScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute<RouteProp<ProfileStackParamList, 'Legal'>>();
  const isPrivacy = route.params?.doc === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</Text>
      <Text style={styles.updated}>Last updated {LAST_UPDATED}</Text>
      {sections.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.lg },
    title: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.text },
    updated: {
      fontFamily: Fonts.body,
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    section: { marginBottom: Spacing.lg },
    heading: {
      fontFamily: Fonts.displayMedium,
      fontSize: FontSize.lg,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    body: {
      fontFamily: Fonts.body,
      fontSize: FontSize.md,
      color: c.textSecondary,
      lineHeight: 22,
    },
  });

export default LegalScreen;
