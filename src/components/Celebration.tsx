import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Tasteful one-shot celebration: a central icon pop + expanding ring + a burst of
// confetti dots radiating outward. Built entirely on RN Animated with the native
// driver (transform + opacity only) — no Lottie / native rebuild needed.

const CONFETTI_COLORS = ['#C0532E', '#5E8B6A', '#E0A63C', '#D9764E', '#7FB08D'];
const DOT_COUNT = 16;

interface Props {
  visible: boolean;
  onDone?: () => void;
  icon?: string;
  color?: string;
}

export const Celebration: React.FC<Props> = ({
  visible,
  onDone,
  icon = 'check-circle',
  color = '#C0532E',
}) => {
  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.ValueXY({ x: 0, y: 0 })),
  ).current;
  const dotOpacity = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    ring.setValue(0);

    const dotAnims = dots.map((d, i) => {
      const angle = (Math.PI * 2 * i) / DOT_COUNT + Math.random() * 0.4;
      const dist = 90 + Math.random() * 70;
      d.setValue({ x: 0, y: 0 });
      dotOpacity[i].setValue(1);
      return Animated.parallel([
        Animated.timing(d, {
          toValue: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist },
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity[i], {
          toValue: 0,
          duration: 650,
          delay: 250,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      Animated.timing(ring, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      ...dotAnims,
    ]).start(() => onDone?.());
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.4] }) }],
          },
        ]}
      />
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              opacity: dotOpacity[i],
              transform: [{ translateX: d.x }, { translateY: d.y }],
            },
          ]}
        />
      ))}
      <Animated.View
        style={{
          opacity: pop,
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={76} color={color} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default Celebration;
