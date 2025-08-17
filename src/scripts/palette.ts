import Color from "colorjs.io";

function generateLightnessValues(count: number): number[] {
  if (count < 3) count = 3; // 最小3色
  if (count > 15) count = 15; // 最大15色
  
  const values: number[] = [];
  const step = 0.9 / (count - 1); // 0.05から0.95まで均等分割
  
  for (let i = 0; i < count; i++) {
    const lightness = 0.05 + (step * i);
    // 0.98を超えないように制限
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
  
  // パレット数を取得（デフォルト12色）
  const paletteCountEl = document.getElementById("paletteCount") as HTMLSelectElement | null;
  const paletteCount = paletteCountEl ? parseInt(paletteCountEl.value) : 12;
  
  // 指定された数に基づいて明度の値を動的に生成
  const lightnessValues = generateLightnessValues(paletteCount);
  
  // 元の色を適切な位置に挿入
  const paletteData: Array<{hex: string, lightness: number, isOriginal: boolean}> = [];
  
  // 固定の明度バリエーションを追加
  lightnessValues.forEach(lightness => {
    const c = new Color("oklch", [lightness, oklch[1], oklch[2]]);
    paletteData.push({
      hex: c.to("srgb").toString({ format: "hex" }),
      lightness: lightness,
      isOriginal: false
    });
  });
  
  // 元の色を追加
  paletteData.push({
    hex: baseColor.to("srgb").toString({ format: "hex" }),
    lightness: baseLightness,
    isOriginal: true
  });
  
  // 明度順でソート
  paletteData.sort((a, b) => a.lightness - b.lightness);

  // パレットを描画
  paletteEl.innerHTML = "";
  paletteData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "swatch";
    div.style.background = item.hex;
    
    const lightnessPercent = Math.round(item.lightness * 100);
    
    // 色見本の背景色を設定
    div.style.setProperty('--swatch-color', item.hex);
    div.style.background = `linear-gradient(to bottom, ${item.hex} 0%, ${item.hex} 60%, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0.95) 100%)`;
    
    div.innerHTML = `
      <div>${item.hex}</div>
      <div>
        L${lightnessPercent}%${item.isOriginal ? ' 🎯' : ''}
      </div>
    `;
    
    // 元の色の場合は枠線で強調
    if (item.isOriginal) {
      div.style.border = "3px solid #667eea";
      div.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
    }
    
    // クリックでクリップボードにコピー
    div.addEventListener("click", () => {
      navigator.clipboard.writeText(item.hex).then(() => {
        const originalText = div.innerHTML;
        div.innerHTML = `<div>📋 コピー済み!</div><div>L${lightnessPercent}%</div>`;
        setTimeout(() => {
          div.innerHTML = originalText;
        }, 1000);
      }).catch(() => {
        console.error("クリップボードへのコピーに失敗しました");
      });
    });
    
    paletteEl.appendChild(div);
  });
}

export function initPalette(): void {
  const hexInput = document.getElementById("hexInput") as HTMLInputElement | null;
  const rgbInput = document.getElementById("rgbInput") as HTMLInputElement | null;
  const paletteCount = document.getElementById("paletteCount") as HTMLSelectElement | null;

  // ColorPickerからの色変更イベントを受信
  window.addEventListener('colorChange', (e: Event) => {
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
        window.dispatchEvent(new CustomEvent('externalColorChange', { 
          detail: { hex: target.value } 
        }));
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
        window.dispatchEvent(new CustomEvent('externalColorChange', { 
          detail: { hex: hex } 
        }));
        
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
  updateColorFromValue("#ff0000");
  
  // パレット数変更時の再生成
  if (paletteCount) {
    paletteCount.addEventListener("change", () => {
      const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
      if (paletteSection && paletteSection.style.display !== "none") {
        // 現在の色でパレットを再生成
        const currentHex = hexInput?.value || "#ff0000";
        updateColorFromValue(currentHex);
      }
    });
  }
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}
