import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BACKGROUND, TEXT_DARK } from '../constants/colors';

// 送り出し画面:「いってらっしゃい」を表示してキャンバス画面に戻る
export default function SendOffScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.popToTop();
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>いってらっしゃい</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: TEXT_DARK,
    fontSize: 20,
  },
});
