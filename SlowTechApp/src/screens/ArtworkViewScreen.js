import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import ArtworkCanvas from '../components/ArtworkCanvas';
import { SAMPLE_DIALOGUE } from '../constants/sampleArtwork';
import { BACKGROUND, TEXT_DARK } from '../constants/colors';

// 絵の鑑賞画面
// フェーズ1では「サンプル」の絵のみ、事前に用意したAI対話をTTS+文字の浮沈で再生する
// 話者が交代する際に一呼吸置くための間(ミリ秒)
const SPEAKER_PAUSE_MS = 350;
// Chromeは無音区間が続くと自動でspeechSynthesisを一時停止してしまうことがあるため、
// 再生中は定期的にresume()を呼んで字幕と音声がずれないようにする(Web版のみ)
const SPEECH_RESUME_INTERVAL_MS = 5000;

export default function ArtworkViewScreen({ route, navigation }) {
  const { drops, sample, title } = route.params;
  const [lineIndex, setLineIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const pauseTimer = useRef(null);
  // Speech.stop()後にonDone/onErrorが遅れて発火しても再生を継続しないようにするフラグ
  const stoppedRef = useRef(false);
  const resumeInterval = useRef(null);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  function stopSpeech() {
    stoppedRef.current = true;
    Speech.stop();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (resumeInterval.current) {
      clearInterval(resumeInterval.current);
      resumeInterval.current = null;
    }
  }

  function playDialogue() {
    stoppedRef.current = false;
    setIsPlaying(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      resumeInterval.current = setInterval(() => {
        window.speechSynthesis.resume();
      }, SPEECH_RESUME_INTERVAL_MS);
    }
    speakLine(0);
  }

  function speakLine(index) {
    if (stoppedRef.current) return;
    if (index >= SAMPLE_DIALOGUE.length) {
      setIsPlaying(false);
      setLineIndex(-1);
      if (resumeInterval.current) {
        clearInterval(resumeInterval.current);
        resumeInterval.current = null;
      }
      return;
    }
    const previousSpeaker = index > 0 ? SAMPLE_DIALOGUE[index - 1].speaker : null;
    const speakerChanged = previousSpeaker !== null && previousSpeaker !== SAMPLE_DIALOGUE[index].speaker;

    setLineIndex(index);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Speech.speak(SAMPLE_DIALOGUE[index].text, {
      language: 'ja-JP',
      onDone: () => {
        if (stoppedRef.current) return;
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          if (stoppedRef.current) return;
          // 話者が変わるときは、掛け合いらしさを出すために少し間を空ける
          pauseTimer.current = setTimeout(
            () => speakLine(index + 1),
            speakerChanged ? SPEAKER_PAUSE_MS : 0
          );
        });
      },
      onStopped: () => setIsPlaying(false),
      onError: () => {
        if (stoppedRef.current) return;
        speakLine(index + 1);
      },
    });
  }

  function handleBack() {
    stopSpeech();
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    setIsPlaying(false);
    navigation.goBack();
  }

  const currentLine = lineIndex >= 0 ? SAMPLE_DIALOGUE[lineIndex] : null;

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.artworkTitle}>{title}</Text> : null}
      <ArtworkCanvas drops={drops} />

      <View style={styles.dialogueArea}>
        {currentLine && (
          <Animated.Text style={[styles.dialogueText, { opacity }]}>
            {currentLine.speaker}：{currentLine.text}
          </Animated.Text>
        )}
      </View>

      <View style={styles.footer}>
        {sample ? (
          <Pressable
            style={styles.primaryButton}
            disabled={isPlaying}
            onPress={playDialogue}
          >
            <Text style={styles.primaryButtonText}>
              {isPlaying ? '再生中…' : 'AI対話を再生'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>
            この絵のAI対話は、フェーズ1ではまだ体験できません
          </Text>
        )}

        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>戻る</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 「今のキャンバス」画面(CanvasScreen)と絵・タイトルの位置を完全に揃えるため、
  // container/title のスタイルは CanvasScreen と同じ値にしている
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 120,
    gap: 16,
  },
  artworkTitle: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  // 対話文の行数が変わっても絵の位置がずれないよう、高さを固定する
  dialogueArea: {
    height: 110,
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  dialogueText: {
    fontSize: 15,
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: '#8A8578',
    textAlign: 'center',
  },
  // 対話文の長さが変わってもボタン位置がずれないよう、画面下部に固定する
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: TEXT_DARK,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  backButton: {
    padding: 12,
  },
  backText: {
    color: '#5B6B8C',
    fontSize: 13,
  },
});
