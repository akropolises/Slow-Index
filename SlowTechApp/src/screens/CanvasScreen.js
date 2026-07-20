import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useArtwork } from '../context/ArtworkContext';
import ArtworkCanvas from '../components/ArtworkCanvas';
import { BACKGROUND, TEXT_DARK } from '../constants/colors';

// 入口:キャンバス画面
// 機能的な「ホーム画面」ではなく、現在の絵をただ静かに見せる画面
export default function CanvasScreen({ navigation }) {
  const { currentDrops, completeArtwork } = useArtwork();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今のキャンバス</Text>

      <ArtworkCanvas drops={currentDrops} />

      {currentDrops.length === 0 && (
        <Text style={styles.hint}>
          まだ何も描かれていません。リセットタイムを始めると、1滴ずつ育っていきます。
        </Text>
      )}

      <Pressable
        style={styles.primaryButton}
        onPress={() => navigation.navigate('割込導入画面')}
      >
        <Text style={styles.primaryButtonText}>リセットタイムを始める</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        disabled={currentDrops.length === 0}
        onPress={() => {
          const result = completeArtwork();
          if (result) {
            navigation.navigate('完成画面', result);
          }
        }}
      >
        <Text
          style={[
            styles.secondaryButtonText,
            currentDrops.length === 0 && styles.disabledText,
          ]}
        >
          完成させる
        </Text>
      </Pressable>

      <Pressable
        style={styles.linkButton}
        onPress={() => navigation.navigate('ギャラリー画面')}
      >
        <Text style={styles.linkText}>ギャラリーを見に行く</Text>
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
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#8A8578',
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: TEXT_DARK,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: TEXT_DARK,
    fontSize: 14,
  },
  disabledText: {
    color: '#C9C4B8',
  },
  linkButton: {
    marginTop: 8,
  },
  linkText: {
    color: '#5B6B8C',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
