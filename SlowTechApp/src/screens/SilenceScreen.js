import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

const TOTAL_MS = 30000;
const DIM_AT_MS = 3000;
const DIM_FADE_MS = 4000;
const PULSE_AT_MS = [10000, 20000];
const FINALE_START_MS = 27000;

const LIGHT_BG = '#F7F4EF';
// 真っ黒(顔が意識される・不安を感じやすい)を避け、暗いが温かみのある色にする
const DIM_BG = '#2E2A33';

// フェーズ2:静寂の30秒(体験)
// 振動(Haptics)を軸に、数字のカウントダウンなしで淡い光の脈動を演出する
export default function SilenceScreen({ navigation }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const dim = useRef(new Animated.Value(0)).current;
  const timers = useRef([]);

  useEffect(() => {
    // 開始の合図:「ここから静寂の時間が始まった」ことを、数字を使わず体で伝える
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playFlicker(pulse, 0.6);

    timers.current.push(
      setTimeout(() => {
        Animated.timing(dim, {
          toValue: 1,
          duration: DIM_FADE_MS,
          useNativeDriver: false,
        }).start();
      }, DIM_AT_MS)
    );

    PULSE_AT_MS.forEach((ms) => {
      timers.current.push(
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          playFlicker(pulse, 1);
        }, ms)
      );
    });

    timers.current.push(
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playFlicker(pulse, 1.4);
      }, FINALE_START_MS)
    );

    timers.current.push(
      setTimeout(() => {
        // 終了の合図:30秒完了を体で伝えてから次の画面へ
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('出口色選択画面');
      }, TOTAL_MS)
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSkip() {
    timers.current.forEach(clearTimeout);
    navigation.replace('出口色選択画面');
  }

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const backgroundColor = dim.interpolate({
    inputRange: [0, 1],
    outputRange: [LIGHT_BG, DIM_BG],
  });

  const instructionOpacity = dim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0.2, 0],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: glowOpacity }]}
      />

      <Animated.Text style={[styles.instruction, { opacity: instructionOpacity }]}>
        目を閉じてください
      </Animated.Text>

      <Pressable style={styles.quitButton} onPress={handleSkip}>
        <Text style={styles.quitText}>やめる</Text>
      </Pressable>
    </Animated.View>
  );
}

// 光の脈動を、不規則な揺らぎではなく「1回明るくなって暗くなる」だけのシンプルなパルスにする
function playFlicker(animatedValue, peak) {
  Animated.sequence([
    Animated.timing(animatedValue, { toValue: peak, duration: 500, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 700, useNativeDriver: true }),
  ]).start();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF6DD',
  },
  instruction: {
    position: 'absolute',
    fontSize: 18,
    color: '#3A362F',
  },
  quitButton: {
    position: 'absolute',
    bottom: 40,
    padding: 12,
  },
  quitText: {
    color: '#8A8578',
    fontSize: 13,
  },
});
