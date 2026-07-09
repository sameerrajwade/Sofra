import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize, Fonts } from '../config/theme';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

// Catches render errors so an uncaught exception shows a friendly screen
// instead of a white crash. componentDidCatch is the hook for crash
// reporting (CRASH-1) when that lands.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: unknown) {
    // TODO(CRASH-1): forward to crash reporting here.
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            Try again — your data is safe in the cloud.
          </Text>
          <Text style={styles.button} onPress={this.handleReset}>
            Reload
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xl,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  button: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.primary,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});

export default ErrorBoundary;
