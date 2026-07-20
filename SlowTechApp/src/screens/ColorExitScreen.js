import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { EXIT_COLORS, BACKGROUND, TEXT_DARK } from '../constants/colors';
import { useArtwork } from '../context/ArtworkContext';

// 静寂画面が暗くなっていく速さ(DIM_FADE_MS)に合わせて、この画面はゆっくり明るくなる
const BRIGHTEN_FADE_MS = 4000;

// フェーズ2の出口:4色から直感的に選び、絵の具が広がる一期一会の演出を見せる
export default function ColorExitScreen({ navigation }) {
  const { addDrop } = useArtwork();
  const [selected, setSelected] = useState(null);
  const spread = useRef(new Animated.Value(0)).current;
  const darkOverlay = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(darkOverlay, {
      toValue: 0,
      duration: BRIGHTEN_FADE_MS,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(color) {
    if (selected) return;
    Haptics.selectionAsync();
    setSelected(color);
    addDrop(color.key);

    // 広がる速さにわずかなゆらぎを持たせ、毎回違う一期一会の見た目にする
    const duration = 900 + Math.random() * 500;
    Animated.timing(spread, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start(() => {
      navigation.replace('送り出し画面');
    });
  }

  const scale = spread.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const opacity = spread.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] });

  return (
    <View style={styles.container}>
      {!selected && (
        <Text style={styles.title}>今の気分に近い色を選んでください</Text>
      )}

      {selected && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              backgroundColor: selected.hex,
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
      )}

      {!selected && (
        <View style={styles.palette}>
          {EXIT_COLORS.map((color) => (
            <Pressable
              key={color.key}
              style={[styles.circle, { backgroundColor: color.hex }]}
              onPress={() => handleSelect(color)}
            />
          ))}
        </View>
      )}

      <Animated.View
        pointerEvents="none"
        style={[styles.darkOverlay, { opacity: darkOverlay }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 40,
    textAlign: 'center',
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  ripple: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  // 静寂画面の暗転(DIM_BG)と同じ色から、ゆっくり明るくなるように見せるための重ね幕
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E2A33',
  },
});
