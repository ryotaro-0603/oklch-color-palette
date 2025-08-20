// 数学関数のモジュール

export function sigmoid(x: number, steepness: number = 1): number {
  return 1 / (1 + Math.exp(-steepness * x));
}

export function mountainCurve(x: number, peak: number = 0.5, height: number = 1): number {
  // ガウス関数を使った山型カーブ（0-1の範囲で正規化）
  const sigma = 0.3; // 山の幅を制御
  return height * Math.exp(-Math.pow(x - peak, 2) / (2 * Math.pow(sigma, 2)));
}

export function generateLightnessValues(count: number, steepness: number = 1): number[] {
  if (count < 3) count = 3; // 最小3色
  if (count > 15) count = 15; // 最大15色

  const values: number[] = [];
  
  // シグモイド関数を使用した明度分布
  const minInput = -6; // シグモイド関数の入力範囲
  const maxInput = 6;
  const step = (maxInput - minInput) / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const x = minInput + step * i;
    const normalizedSigmoid = sigmoid(x, steepness);
    
    // 0.05から0.95の範囲にマッピング
    const lightness = 0.05 + normalizedSigmoid * 0.9;
    values.push(Math.min(lightness, 0.98));
  }

  return values;
}