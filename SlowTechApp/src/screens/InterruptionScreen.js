import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { pickRandomQuestion } from '../constants/questions';
import { BACKGROUND, TEXT_DARK } from '../constants/colors';

// フェーズ1:割り込み導入画面
// 固定の問いリストからランダムに1つ表示する
export default function InterruptionScreen({ navigation }) {
  const question = useMemo(() => pickRandomQuestion(), []);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => navigation.replace('静寂画面')}
      >
        <Text style={styles.primaryButtonText}>はじめる</Text>
      </Pressable>

      <Pressable
        style={styles.quitButton}
        onPress={() => navigation.replace('そっと閉じる画面')}
      >
        <Text style={styles.quitText}>やめる</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  question: {
    fontSize: 20,
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 48,
  },
  primaryButton: {
    backgroundColor: TEXT_DARK,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
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
