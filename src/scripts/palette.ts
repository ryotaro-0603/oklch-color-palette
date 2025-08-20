import Color from "colorjs.io";
import { updateFavicon } from "../utils/faviconManager";
import { generateLightnessValues, mountainCurve } from "../utils/mathFunctions";
import { drawCurveGraph } from "../utils/chartManager";
import { setupEventHandlers } from "../utils/eventHandlers";

function updateColorFromValue(colorValue: string): void {
  const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
  const paletteEl = document.getElementById("palette") as HTMLElement | null;

  if (!paletteSection || !paletteEl) {
    console.error("Required elements not found");
    return;
  }

  if (!colorValue) {
    paletteSection.style.display = "none";
    return;
  }

  try {
    const base = new Color(colorValue);
    const hex = base.to("srgb").toString({ format: "hex" });

    // faviconを更新
    updateFavicon(hex);

    // 色展開パレットを生成
    generateColorPalette(base, paletteEl);
    paletteSection.style.display = "block";
  } catch (err) {
    paletteSection.style.display = "none";
  }
}

export function generatePalette(): void {
  const hexInput = document.getElementById("hexInput") as HTMLInputElement | null;
  const rgbInput = document.getElementById("rgbInput") as HTMLInputElement | null;

  // どちらかの入力値を取得
  let colorValue = "";
  if (hexInput?.value.trim()) {
    colorValue = hexInput.value.trim();
  } else if (rgbInput?.value.trim()) {
    colorValue = rgbInput.value.trim();
  }

  updateColorFromValue(colorValue);
}

function generateColorPalette(baseColor: Color, paletteEl: HTMLElement): void {
  const oklch = baseColor.oklch;
  const baseLightness = oklch[0]; // 元の明度
  const baseChroma = oklch[1]; // 元の彩度

  // パレット数を取得（デフォルト12色）
  const paletteCountEl = document.getElementById("paletteCount") as HTMLSelectElement | null;
  const paletteCount = paletteCountEl ? parseInt(paletteCountEl.value) : 12;

  // シグモイド係数を取得（デフォルト0.5）
  const sigmoidSteepnessEl = document.getElementById("sigmoidSteepness") as HTMLInputElement | null;
  const sigmoidSteepness = sigmoidSteepnessEl ? parseFloat(sigmoidSteepnessEl.value) : 0.5;

  // 彩度カーブのピーク位置は固定（中央）
  const chromaPeak = 0.5;

  // 彩度カーブの高さを取得（デフォルト1.0）
  const chromaHeightEl = document.getElementById("chromaHeight") as HTMLInputElement | null;
  const chromaHeight = chromaHeightEl ? parseFloat(chromaHeightEl.value) : 1.0;

  // 元の色を含めて指定された数になるように生成（元色を除いた数で生成）
  const additionalColors = Math.max(1, paletteCount - 1);
  const lightnessValues = generateLightnessValues(additionalColors, sigmoidSteepness);

  // 元の色を適切な位置に挿入
  const paletteData: Array<{ hex: string; lightness: number; chroma: number; isOriginal: boolean }> = [];

  // 固定の明度バリエーションを追加（彩度も山型カーブで調整）
  lightnessValues.forEach((lightness, index) => {
    // 各色の位置（0-1の範囲）
    const position = index / (lightnessValues.length - 1);
    
    // 山型カーブに基づいた彩度の計算
    let chromaMultiplier;
    if (chromaHeight === 0) {
      // chromaHeight = 0 の時は全て100%（1.0）
      chromaMultiplier = 1.0;
    } else {
      // chromaHeight = 1 の時は通常の山型カーブ
      const mountainValue = mountainCurve(position, chromaPeak, 1.0);
      // 0から1の間で線形補間（0で平坦、1で山型）
      chromaMultiplier = (1 - chromaHeight) * 1.0 + chromaHeight * mountainValue;
    }
    const adjustedChroma = baseChroma * chromaMultiplier;
    
    const c = new Color("oklch", [lightness, adjustedChroma, oklch[2]]);
    paletteData.push({
      hex: c.to("srgb").toString({ format: "hex" }),
      lightness: lightness,
      chroma: adjustedChroma,
      isOriginal: false,
    });
  });

  // 元の色を追加
  paletteData.push({
    hex: baseColor.to("srgb").toString({ format: "hex" }),
    lightness: baseLightness,
    chroma: baseChroma,
    isOriginal: true,
  });

  // 明度順でソート
  paletteData.sort((a, b) => a.lightness - b.lightness);

  // パレットを描画
  paletteEl.innerHTML = "";
  paletteData.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "swatch-wrapper";

    const div = document.createElement("div");
    div.className = "swatch";
    div.style.background = item.hex;

    const lightnessPercent = Math.round(item.lightness * 100);

    // 色見本の背景色を設定
    div.style.setProperty("--swatch-color", item.hex);

    // 元の色の場合は枠線で強調
    if (item.isOriginal) {
      div.style.border = "3px solid #667eea";
      div.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
    }

    // ラベル（外側のテキスト）
    const label = document.createElement("div");
    label.className = "swatch-label";
    label.innerHTML = `
    <div>${item.hex}</div>
    <div>L${lightnessPercent}%${item.isOriginal ? " 🎯" : ""}</div>
  `;

    // クリックでコピー（divだけ対象にする）
    div.addEventListener("click", () => {
      navigator.clipboard
        .writeText(item.hex)
        .then(() => {
          const originalText = label.innerHTML;
          label.innerHTML = `<div>📋 コピー済み!</div><div>L${lightnessPercent}%</div>`;
          setTimeout(() => {
            label.innerHTML = originalText;
          }, 1000);
        })
        .catch(() => {
          console.error("クリップボードへのコピーに失敗しました");
        });
    });

    wrapper.appendChild(div);
    wrapper.appendChild(label);
    paletteEl.appendChild(wrapper);
  });
}

export function initPalette(): void {
  // 初期表示（デフォルト色で）
  updateColorFromValue("#f64466");

  // 初期グラフを描画
  drawCurveGraph();

  // イベントハンドラーをセットアップ
  setupEventHandlers(updateColorFromValue, isValidHex);
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}