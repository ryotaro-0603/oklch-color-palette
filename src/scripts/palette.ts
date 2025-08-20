import Color from "colorjs.io";

function updateFavicon(color: string): void {
  try {
    // 既存のfaviconを全て削除
    const existingFavicons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    existingFavicons.forEach((favicon) => favicon.remove());

    // 新しいfaviconを生成
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // 背景を透明にする
      ctx.clearRect(0, 0, 32, 32);

      // 円形のfaviconを描画
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fill();

      // 少し暗い縁取りを追加（コントラストを良くする）
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // canvasをDataURLに変換
      const dataURL = canvas.toDataURL("image/png");

      // 新しいfaviconリンクを作成
      const newFavicon = document.createElement("link");
      newFavicon.rel = "icon";
      newFavicon.type = "image/png";
      newFavicon.href = dataURL;

      // headに追加
      document.head.appendChild(newFavicon);
    }
  } catch (err) {
    console.error("Failed to update favicon:", err);
  }
}

function sigmoid(x: number, steepness: number = 1): number {
  return 1 / (1 + Math.exp(-steepness * x));
}

function mountainCurve(x: number, peak: number = 0.5, height: number = 1): number {
  // ガウス関数を使った山型カーブ（0-1の範囲で正規化）
  const sigma = 0.3; // 山の幅を制御
  return height * Math.exp(-Math.pow(x - peak, 2) / (2 * Math.pow(sigma, 2)));
}

function generateLightnessValues(count: number, steepness: number = 1): number[] {
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

  // 彩度カーブのピーク位置を取得（デフォルト0.5）
  const chromaPeakEl = document.getElementById("chromaPeak") as HTMLInputElement | null;
  const chromaPeak = chromaPeakEl ? parseFloat(chromaPeakEl.value) : 0.5;

  // 彩度カーブの高さを取得（デフォルト1.0）
  const chromaHeightEl = document.getElementById("chromaHeight") as HTMLInputElement | null;
  const chromaHeight = chromaHeightEl ? parseFloat(chromaHeightEl.value) : 1.0;

  // 指定された数に基づいて明度の値を動的に生成
  const lightnessValues = generateLightnessValues(paletteCount, sigmoidSteepness);

  // 元の色を適切な位置に挿入
  const paletteData: Array<{ hex: string; lightness: number; chroma: number; isOriginal: boolean }> = [];

  // 固定の明度バリエーションを追加（彩度も山型カーブで調整）
  lightnessValues.forEach((lightness, index) => {
    // 各色の位置（0-1の範囲）
    const position = index / (lightnessValues.length - 1);
    
    // 山型カーブに基づいた彩度の計算
    const chromaMultiplier = mountainCurve(position, chromaPeak, chromaHeight);
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
  // paletteData.forEach((item) => {
  //   const div = document.createElement("div");
  //   div.className = "swatch";
  //   div.style.background = item.hex;

  //   const lightnessPercent = Math.round(item.lightness * 100);

  //   // 色見本の背景色を設定
  //   div.style.setProperty("--swatch-color", item.hex);

  //   div.innerHTML = `
  //     <div>${item.hex}</div>
  //     <div>
  //       L${lightnessPercent}%${item.isOriginal ? " 🎯" : ""}
  //     </div>
  //   `;

  //   // 元の色の場合は枠線で強調
  //   if (item.isOriginal) {
  //     div.style.border = "3px solid #667eea";
  //     div.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
  //   }

  //   // クリックでクリップボードにコピー
  //   div.addEventListener("click", () => {
  //     navigator.clipboard
  //       .writeText(item.hex)
  //       .then(() => {
  //         const originalText = div.innerHTML;
  //         div.innerHTML = `<div>📋 コピー済み!</div><div>L${lightnessPercent}%</div>`;
  //         setTimeout(() => {
  //           div.innerHTML = originalText;
  //         }, 1000);
  //       })
  //       .catch(() => {
  //         console.error("クリップボードへのコピーに失敗しました");
  //       });
  //   });

  //   paletteEl.appendChild(div);
  // });
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
  const hexInput = document.getElementById("hexInput") as HTMLInputElement | null;
  const rgbInput = document.getElementById("rgbInput") as HTMLInputElement | null;
  const paletteCount = document.getElementById("paletteCount") as HTMLSelectElement | null;

  // ColorPickerからの色変更イベントを受信
  window.addEventListener("colorChange", (e: Event) => {
    const event = e as CustomEvent;
    const hexValue = event.detail?.hex;

    if (!hexValue) return;

    // HEX入力フィールドを更新
    if (hexInput) {
      hexInput.value = hexValue;
    }

    // RGB値に変換して入力フィールドを更新
    if (rgbInput) {
      try {
        const color = new Color(hexValue);
        const rgb = color.to("srgb").toString({ format: "rgb" });
        rgbInput.value = rgb;
      } catch (err) {
        console.error("Color conversion failed");
      }
    }

    // リアルタイムでパレットを更新
    updateColorFromValue(hexValue);
  });

  // HEX入力のリアルタイム更新
  if (hexInput) {
    hexInput.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;

      // ColorPickerも同期
      if (isValidHex(target.value)) {
        window.dispatchEvent(
          new CustomEvent("externalColorChange", {
            detail: { hex: target.value },
          })
        );
      }

      // RGB入力をクリア
      if (rgbInput) rgbInput.value = "";

      // リアルタイムでパレットを更新
      if (target.value.trim()) {
        updateColorFromValue(target.value);
      }
    });
  }

  // RGB入力のリアルタイム更新
  if (rgbInput) {
    rgbInput.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;

      // 有効なRGB値の場合、ColorPickerも同期
      try {
        const color = new Color(target.value);
        const hex = color.to("srgb").toString({ format: "hex" });
        window.dispatchEvent(
          new CustomEvent("externalColorChange", {
            detail: { hex: hex },
          })
        );

        // リアルタイムでパレットを更新
        updateColorFromValue(target.value);
      } catch (err) {
        // RGB値が無効な場合は何もしない
      }

      // HEX入力をクリア
      if (hexInput) hexInput.value = "";
    });
  }

  // 初期表示（デフォルト色で）
  updateColorFromValue("#f64466");

  // 初期グラフを描画
  drawCurveGraph();

  // パレット数変更時の再生成とUI更新
  if (paletteCount) {
    const paletteCountValue = document.getElementById("paletteCountValue") as HTMLElement | null;

    // スライダー値変更時の処理
    const updatePaletteCount = () => {
      const value = paletteCount.value;

      // 値表示を更新
      if (paletteCountValue) {
        paletteCountValue.textContent = value;
      }

      // パレットが表示されている場合は再生成
      const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
      if (paletteSection && paletteSection.style.display !== "none") {
        const currentHex = hexInput?.value || "#f64466";
        updateColorFromValue(currentHex);
      }
    };

    // inputイベント（リアルタイム）とchangeイベント（確定時）の両方に対応
    paletteCount.addEventListener("input", updatePaletteCount);
    paletteCount.addEventListener("change", updatePaletteCount);
  }

  // シグモイド係数変更時の再生成とUI更新
  const sigmoidSteepness = document.getElementById("sigmoidSteepness") as HTMLInputElement | null;
  if (sigmoidSteepness) {
    const sigmoidSteepnessValue = document.getElementById("sigmoidSteepnessValue") as HTMLElement | null;

    // スライダー値変更時の処理
    const updateSigmoidSteepness = () => {
      const value = sigmoidSteepness.value;

      // 値表示を更新
      if (sigmoidSteepnessValue) {
        sigmoidSteepnessValue.textContent = parseFloat(value).toFixed(1);
      }

      // パレットが表示されている場合は再生成
      const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
      if (paletteSection && paletteSection.style.display !== "none") {
        const currentHex = hexInput?.value || "#f64466";
        updateColorFromValue(currentHex);
      }

      // グラフを更新
      drawCurveGraph();
    };

    // inputイベント（リアルタイム）とchangeイベント（確定時）の両方に対応
    sigmoidSteepness.addEventListener("input", updateSigmoidSteepness);
    sigmoidSteepness.addEventListener("change", updateSigmoidSteepness);
  }

  // 彩度カーブピーク変更時の再生成とUI更新
  const chromaPeak = document.getElementById("chromaPeak") as HTMLInputElement | null;
  if (chromaPeak) {
    const chromaPeakValue = document.getElementById("chromaPeakValue") as HTMLElement | null;

    // スライダー値変更時の処理
    const updateChromaPeak = () => {
      const value = chromaPeak.value;

      // 値表示を更新
      if (chromaPeakValue) {
        chromaPeakValue.textContent = parseFloat(value).toFixed(1);
      }

      // パレットが表示されている場合は再生成
      const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
      if (paletteSection && paletteSection.style.display !== "none") {
        const currentHex = hexInput?.value || "#f64466";
        updateColorFromValue(currentHex);
      }

      // グラフを更新
      drawCurveGraph();
    };

    // inputイベント（リアルタイム）とchangeイベント（確定時）の両方に対応
    chromaPeak.addEventListener("input", updateChromaPeak);
    chromaPeak.addEventListener("change", updateChromaPeak);
  }

  // 彩度カーブ高さ変更時の再生成とUI更新
  const chromaHeight = document.getElementById("chromaHeight") as HTMLInputElement | null;
  if (chromaHeight) {
    const chromaHeightValue = document.getElementById("chromaHeightValue") as HTMLElement | null;

    // スライダー値変更時の処理
    const updateChromaHeight = () => {
      const value = chromaHeight.value;

      // 値表示を更新
      if (chromaHeightValue) {
        chromaHeightValue.textContent = parseFloat(value).toFixed(1);
      }

      // パレットが表示されている場合は再生成
      const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
      if (paletteSection && paletteSection.style.display !== "none") {
        const currentHex = hexInput?.value || "#f64466";
        updateColorFromValue(currentHex);
      }

      // グラフを更新
      drawCurveGraph();
    };

    // inputイベント（リアルタイム）とchangeイベント（確定時）の両方に対応
    chromaHeight.addEventListener("input", updateChromaHeight);
    chromaHeight.addEventListener("change", updateChromaHeight);
  }
}

function drawCurveGraph(): void {
  const canvas = document.getElementById("curveGraph") as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const padding = 30;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // キャンバスをクリア
  ctx.clearRect(0, 0, width, height);

  // 背景
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // グリッド線
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = padding + (graphWidth / 10) * i;
    const y = padding + (graphHeight / 10) * i;
    
    // 縦線
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
    
    // 横線
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // 現在のパラメータを取得
  const sigmoidSteepnessEl = document.getElementById("sigmoidSteepness") as HTMLInputElement | null;
  const sigmoidSteepness = sigmoidSteepnessEl ? parseFloat(sigmoidSteepnessEl.value) : 0.5;

  const chromaPeakEl = document.getElementById("chromaPeak") as HTMLInputElement | null;
  const chromaPeak = chromaPeakEl ? parseFloat(chromaPeakEl.value) : 0.5;

  const chromaHeightEl = document.getElementById("chromaHeight") as HTMLInputElement | null;
  const chromaHeight = chromaHeightEl ? parseFloat(chromaHeightEl.value) : 1.0;

  // シグモイド曲線を描画
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  const points = 100;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = padding + t * graphWidth;
    
    // シグモイド計算
    const minInput = -6;
    const maxInput = 6;
    const sigmoidInput = minInput + (maxInput - minInput) * t;
    const sigmoidValue = sigmoid(sigmoidInput, sigmoidSteepness);
    const normalizedSigmoid = 0.05 + sigmoidValue * 0.9;
    
    const y = height - padding - normalizedSigmoid * graphHeight;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // 山型カーブを描画
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = padding + t * graphWidth;
    
    // 山型カーブ計算
    const mountainValue = mountainCurve(t, chromaPeak, chromaHeight);
    const y = height - padding - mountainValue * graphHeight;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // 凡例
  ctx.font = "12px Inter, sans-serif";
  ctx.fillStyle = "#667eea";
  ctx.fillText("明度 (シグモイド)", padding + 5, padding + 15);
  
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("彩度 (山型カーブ)", padding + 5, padding + 30);
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}
