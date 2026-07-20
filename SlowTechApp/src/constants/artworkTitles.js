// ギャラリーで「完成」させた絵に付ける、詩的な短いラベルのプール(案A)
// AI生成ではなく静的なリストからランダムに1つ割り当てることで、日付よりも味わいのある名前にする
export const ARTWORK_TITLES = [
  '凪の一枚',
  '余白の情景',
  '静かな重なり',
  'ひと呼吸の跡',
  '揺らぎの記録',
  '遠くの音の絵',
  'そのままの色',
  '重ねた一日',
  '静けさの層',
  '淡い集積',
  '滲んだ時間',
  '今にしかない色',
];

export function pickRandomArtworkTitle() {
  const index = Math.floor(Math.random() * ARTWORK_TITLES.length);
  return ARTWORK_TITLES[index];
}
