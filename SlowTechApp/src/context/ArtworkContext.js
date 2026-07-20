import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickRandomArtworkTitle } from '../constants/artworkTitles';

const STORAGE_KEY = 'slowtech.artworks.v1';
const MAX_GALLERY_SIZE = 3;

const ArtworkContext = createContext(null);

function randomJitter(range) {
  return (Math.random() - 0.5) * range;
}

export function ArtworkProvider({ children }) {
  // currentDrops: 育成中の絵(キャンバス画面に表示され続ける)
  // gallery: 完成済みの絵(最大3枚、古いものから消える)
  const [currentDrops, setCurrentDrops] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setCurrentDrops(parsed.currentDrops ?? []);
          setGallery(parsed.gallery ?? []);
        }
      } catch (e) {
        // 読み込みに失敗した場合は空の状態から始める
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currentDrops, gallery })
    ).catch(() => {});
  }, [currentDrops, gallery, isLoaded]);

  // リセットタイムの出口で選んだ色を、育成中の絵に1滴追加する
  function addDrop(colorKey) {
    const drop = {
      color: colorKey,
      x: 0.5 + randomJitter(0.5),
      y: 0.5 + randomJitter(0.5),
      size: 40 + Math.random() * 50,
    };
    setCurrentDrops((prev) => [...prev, drop]);
  }

  // 「完成」ボタン:育成中の絵をギャラリーに確定し、次はまっさらな状態から始める
  // 詩的なラベル(案A)を割り当て、そのラベルと絵のスナップショットを呼び出し元に返す
  function completeArtwork() {
    if (currentDrops.length === 0) return null;
    const title = pickRandomArtworkTitle();
    const finished = {
      id: `artwork-${Date.now()}`,
      drops: currentDrops,
      title,
      completedAt: Date.now(),
    };
    setGallery((prev) => {
      const next = [...prev, finished];
      if (next.length > MAX_GALLERY_SIZE) {
        return next.slice(next.length - MAX_GALLERY_SIZE);
      }
      return next;
    });
    setCurrentDrops([]);
    return { drops: finished.drops, title };
  }

  const value = useMemo(
    () => ({ currentDrops, gallery, addDrop, completeArtwork, isLoaded }),
    [currentDrops, gallery, isLoaded]
  );

  return (
    <ArtworkContext.Provider value={value}>{children}</ArtworkContext.Provider>
  );
}

export function useArtwork() {
  const ctx = useContext(ArtworkContext);
  if (!ctx) {
    throw new Error('useArtwork must be used within ArtworkProvider');
  }
  return ctx;
}
