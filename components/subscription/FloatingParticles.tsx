// FloatingParticles - Ambient background particles for premium feel
import { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { premiumColors } from '@/constants';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 15;
const COLORS = ['#007AFF', '#A855F7', '#FFD700'];

interface Particle {
  id: number;
  x: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  translateY: Animated.Value;
  translateX: Animated.Value;
  opacity: Animated.Value;
}

export function FloatingParticles() {
  const reduceMotionRef = useRef(false);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // Generate particles with random properties
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      size: 3 + Math.random() * 4, // 3-7px
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 3000 + Math.random() * 3000, // 3-6s
      delay: Math.random() * 2000,
      translateY: new Animated.Value(height + 50),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }));
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      reduceMotionRef.current = reduceMotion;

      if (reduceMotion) return;

      // Start each particle animation
      particles.forEach((particle) => {
        const animate = () => {
          // Reset values
          particle.translateY.setValue(height + 50);
          particle.translateX.setValue(0);
          particle.opacity.setValue(0);

          const animation = Animated.sequence([
            Animated.delay(particle.delay),
            Animated.parallel([
              // Float upward
              Animated.timing(particle.translateY, {
                toValue: -50,
                duration: particle.duration,
                useNativeDriver: true,
              }),
              // Slight horizontal drift
              Animated.timing(particle.translateX, {
                toValue: (Math.random() - 0.5) * 80,
                duration: particle.duration,
                useNativeDriver: true,
              }),
              // Fade in, stay, fade out
              Animated.sequence([
                Animated.timing(particle.opacity, {
                  toValue: 0.25,
                  duration: particle.duration * 0.2,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0.25,
                  duration: particle.duration * 0.6,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0,
                  duration: particle.duration * 0.2,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]);

          animation.start(() => {
            // Loop the animation
            if (!reduceMotionRef.current) {
              animate();
            }
          });

          animationsRef.current.push(animation);
        };

        animate();
      });

      return () => {
        animationsRef.current.forEach((anim) => anim.stop());
        animationsRef.current = [];
      };
    });
  }, [particles]);

  if (reduceMotionRef.current) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateY: particle.translateY },
                { translateX: particle.translateX },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    bottom: 0,
  },
});
