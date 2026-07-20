import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useArtwork } from '../context/ArtworkContext';
import ArtworkCanvas from '../components/ArtworkCanvas';
import { SAMPLE_ARTWORK_ID, SAMPLE_DROPS } from '../constants/sampleArtwork';
import { BACKGROUND, TEXT_DARK } from '../constants/colors';

// ギャラリー画面:完成済み(最大3枚)+ フェーズ1の「サンプル」絵1枚を表示
export default function GalleryScreen({ navigation }) {
  const { gallery } = useArtwork();
  const insets = useSafeAreaInsets();

  // サンプルを先頭に固定し、完成した絵は完成順(古い→新しい)に並べる
  const items = [
    { id: SAMPLE_ARTWORK_ID, drops: SAMPLE_DROPS, title: 'サンプル', sample: true },
    ...gallery.map((a) => ({ id: a.id, drops: a.drops, title: a.title, sample: false })),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>ギャラリー</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.cell}
            onPress={() =>
              navigation.navigate('絵の鑑賞画面', {
                artworkId: item.id,
                drops: item.drops,
                sample: item.sample,
                title: item.title,
              })
            }
          >
            <ArtworkCanvas drops={item.drops} />
            {item.title ? <Text style={styles.label}>{item.title}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>戻る</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 80,
  },
  cell: {
    width: '46%',
  },
  backButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 12,
  },
  backText: {
    fontSize: 13,
    color: '#5B6B8C',
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8A8578',
    marginTop: 4,
  },
});
