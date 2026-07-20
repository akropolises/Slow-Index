import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { EXIT_COLORS } from '../constants/colors';

const colorMap = EXIT_COLORS.reduce((acc, c) => {
  acc[c.key] = c.hex;
  return acc;
}, {});

// 0〜1の疑似乱数を、値のブレなく毎回同じ結果で返す(乱数生成器に頼らず、シード値から決定的に導出)
function pseudoRandom(seed) {
  const value = Math.sin(seed) * 43758.5453;
  return value - Math.floor(value);
}

// 1滴の絵の具を、水面に垂らしたインクのように「にじんで歪んだ」見た目にするため、
// 中心をわずかにずらした複数の半透明円(View + borderRadius)を重ねて描画する。
// 外側ほど半径を大きく・不透明度を下げることで、疑似的なぼかし(にじみ)の見た目を作る。
function InkBlot({ drop, canvasSize }) {
  const hex = colorMap[drop.color] ?? '#999';
  const seed = drop.x * 97.13 + drop.y * 57.31 + drop.size * 13.7;
  // drop.size は絶対ピクセル値(直径)。基準キャンバス幅(360)からの比率でスケールし、
  // 端末やブラウザ幅が変わっても見た目のバランスが保たれるようにする
  const size = drop.size * (canvasSize / 360);
  const cx = drop.x * canvasSize;
  const cy = drop.y * canvasSize;

  const layers = [0, 1, 2, 3].map((i) => {
    const s = seed + i * 19.7;
    const offsetX = (pseudoRandom(s + 1) - 0.5) * size * 0.3;
    const offsetY = (pseudoRandom(s + 2) - 0.5) * size * 0.3;
    // 外側の層(iが大きいほど)を大きく・薄くして、にじんだ縁の見た目を作る
    const scale = 1 + i * (0.22 + pseudoRandom(s + 3) * 0.12);
    const layerSize = size * scale;
    const opacity = 0.32 - i * 0.06 + pseudoRandom(s + 5) * 0.05;

    return {
      key: i,
      left: cx - layerSize / 2 + offsetX,
      top: cy - layerSize / 2 + offsetY,
      size: layerSize,
      opacity: Math.max(opacity, 0.05),
    };
  });

  return (
    <>
      {layers
        .slice()
        .reverse()
        .map((layer) => (
          <View
            key={layer.key}
            style={{
              position: 'absolute',
              left: layer.left,
              top: layer.top,
              width: layer.size,
              height: layer.size,
              borderRadius: layer.size / 2,
              backgroundColor: hex,
              opacity: layer.opacity,
            }}
          />
        ))}
    </>
  );
}

// 積み重なった絵の具の滴を表示する、育成中/完成済みの絵の共通コンポーネント
export default function ArtworkCanvas({ drops, style }) {
  const [size, setSize] = useState(0);

  const onLayout = useCallback((e) => {
    setSize(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {size > 0 &&
        drops.map((drop, index) => (
          <InkBlot key={index} drop={drop} canvasSize={size} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // デスクトップブラウザ等の横幅が広い画面で、正方形キャンバスが不自然に巨大化しないよう上限を設ける
    maxWidth: 420,
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
});
