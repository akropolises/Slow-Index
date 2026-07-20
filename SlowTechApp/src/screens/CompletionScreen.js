import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import ArtworkCanvas from '../components/ArtworkCanvas';
import { BACKGROUND, TEXT_DARK } from '../constants/colors';

const HOLD_MS = 2600;
const FADE_MS = 900;

// 完成させたときの「労う」ための間
// 絵をふわっと浮かび上がらせ、詩的な名前をフェードインさせたのち、キャンバス画面へフェードで戻る
export default function CompletionScreen({ route, navigation }) {
  const { drops, title } = route.params;
  const artworkOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(artworkOpacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('キャンバス画面');
    }, FADE_MS * 2 + HOLD_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.canvasWrap, { opacity: artworkOpacity }]}>
        <ArtworkCanvas drops={drops} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
        {title}
      </Animated.Text>
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
    gap: 24,
  },
  canvasWrap: {
    width: '75%',
  },
  title: {
    fontSize: 18,
    color: TEXT_DARK,
    letterSpacing: 1,
  },
});
