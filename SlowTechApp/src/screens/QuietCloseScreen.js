import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TEXT_DARK } from '../constants/colors';

// フェーズ1:「やめる」を選んだ、または通知を見送った場合の画面
// 絵には何も追加されず、ユーザー自身の操作でキャンバス画面に戻る
export default function QuietCloseScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.popToTop();
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>またあとで。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20201C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#D8D4C8',
    fontSize: 18,
  },
});
