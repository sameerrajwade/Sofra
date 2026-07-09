import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import { Motion } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

// Enable LayoutAnimation on Android (needed for Collapsible)
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FadeSlideInProps {
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Mount transition: fade up. Use `delay` (e.g. index * Motion.stagger) to stagger lists.
export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  delay = 0,
  distance = 12,
  style,
  children,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: Motion.duration.slow,
      delay,
      easing: Motion.easing.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Tactile press feedback: springs down to Motion.pressScale, back on release.
export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: Motion.spring.friction,
      tension: Motion.spring.tension,
    });

  return (
    <Pressable
      onPressIn={(e) => {
        springTo(Motion.pressScale).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        springTo(1).start();
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface AnimatedRingProps {
  size?: number;
  thickness?: number;
  color?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Indeterminate progress ring (e.g. around an avatar during upload).
// Uses rotation only — native-driver safe.
export const AnimatedRing: React.FC<AnimatedRingProps> = ({
  size = 76,
  thickness = 3,
  color,
  active = true,
  style,
}) => {
  const { colors } = useTheme();
  const ringColor = color ?? colors.primary;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, spin]);

  if (!active) return null;

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: colors.border,
          borderTopColor: ringColor,
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );
};

interface CollapsibleProps {
  open: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Expand/collapse with an eased layout transition (used by hierarchical settings).
export const Collapsible: React.FC<CollapsibleProps> = ({
  open,
  style,
  children,
}) => {
  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        Motion.duration.base,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
  }, [open]);

  if (!open) return null;
  return <View style={style}>{children}</View>;
};
