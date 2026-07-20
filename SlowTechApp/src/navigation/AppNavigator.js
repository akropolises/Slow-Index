import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CanvasScreen from '../screens/CanvasScreen';
import InterruptionScreen from '../screens/InterruptionScreen';
import SilenceScreen from '../screens/SilenceScreen';
import ColorExitScreen from '../screens/ColorExitScreen';
import SendOffScreen from '../screens/SendOffScreen';
import QuietCloseScreen from '../screens/QuietCloseScreen';
import CompletionScreen from '../screens/CompletionScreen';
import GalleryScreen from '../screens/GalleryScreen';
import ArtworkViewScreen from '../screens/ArtworkViewScreen';

const Stack = createNativeStackNavigator();

// 画面遷移図.md の状態遷移に対応するナビゲーション構成
// 明確な変化(ページめくりなど)を避け、全画面をフェードで切り替える(Slowのコンセプトに合わせる)
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="キャンバス画面"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="キャンバス画面" component={CanvasScreen} />
      <Stack.Screen name="割込導入画面" component={InterruptionScreen} />
      <Stack.Screen name="静寂画面" component={SilenceScreen} />
      <Stack.Screen name="出口色選択画面" component={ColorExitScreen} />
      <Stack.Screen name="送り出し画面" component={SendOffScreen} />
      <Stack.Screen name="そっと閉じる画面" component={QuietCloseScreen} />
      <Stack.Screen name="完成画面" component={CompletionScreen} />
      <Stack.Screen name="ギャラリー画面" component={GalleryScreen} />
      <Stack.Screen name="絵の鑑賞画面" component={ArtworkViewScreen} />
    </Stack.Navigator>
  );
}
