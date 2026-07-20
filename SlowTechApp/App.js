import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ArtworkProvider } from './src/context/ArtworkContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web版のデフォルトCSSはbodyのスクロールを禁止しているため、
      // ウィンドウが低い場合にコンテンツが見切れてしまう。スクロールできるようにする
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    } else {
      // iPhoneのサイレント(マナー)スイッチがオンだと、既定の音声セッションでは
      // expo-speechのTTSが無音になってしまうため、サイレント時も再生されるようにする
      Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ArtworkProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </ArtworkProvider>
    </SafeAreaProvider>
  );
}

