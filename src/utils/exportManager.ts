// エクスポート機能のモジュール

export interface ColorData {
  hex: string;
  lightness: number;
  chroma: number;
  isOriginal: boolean;
}

export function exportToCSS(colors: ColorData[]): string {
  let cssOutput = `:root {\n`;
  
  colors.forEach((color, index) => {
    const lightness = Math.round(color.lightness * 100);
    const variableName = color.isOriginal 
      ? `--color-primary` 
      : `--color-${lightness}`;
    
    cssOutput += `  ${variableName}: ${color.hex};\n`;
  });
  
  cssOutput += `}\n\n/* 使用例 */\n`;
  cssOutput += `.primary { color: var(--color-primary); }\n`;
  colors.forEach((color, index) => {
    if (!color.isOriginal) {
      const lightness = Math.round(color.lightness * 100);
      cssOutput += `.text-${lightness} { color: var(--color-${lightness}); }\n`;
    }
  });
  
  return cssOutput;
}

export function exportToJSON(colors: ColorData[]): string {
  const jsonData = {
    palette: colors.map((color, index) => ({
      name: color.isOriginal ? 'primary' : `shade-${Math.round(color.lightness * 100)}`,
      hex: color.hex,
      lightness: Math.round(color.lightness * 100),
      chroma: Math.round(color.chroma * 100),
      isOriginal: color.isOriginal
    })),
    generated: new Date().toISOString(),
    total: colors.length
  };
  
  return JSON.stringify(jsonData, null, 2);
}

export function downloadFile(content: string, filename: string, contentType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function handleExport(): void {
  const paletteEl = document.getElementById("palette") as HTMLElement | null;
  const exportFormatEl = document.getElementById("exportFormat") as HTMLSelectElement | null;
  
  if (!paletteEl || !exportFormatEl) {
    console.error("Required elements not found for export");
    return;
  }
  
  // パレットが表示されていない場合
  const paletteSection = document.getElementById("paletteSection") as HTMLElement | null;
  if (!paletteSection || paletteSection.style.display === "none") {
    alert("エクスポートするカラーパレットがありません。まず色を選択してください。");
    return;
  }
  
  // 現在表示されているパレットデータを取得
  const swatchElements = paletteEl.querySelectorAll('.swatch-wrapper');
  const colors: ColorData[] = [];
  
  swatchElements.forEach(wrapper => {
    const swatchEl = wrapper.querySelector('.swatch') as HTMLElement;
    const labelEl = wrapper.querySelector('.swatch-label') as HTMLElement;
    
    if (swatchEl && labelEl) {
      const hex = swatchEl.style.background || '#000000';
      const isOriginal = swatchEl.style.border.includes('rgb(102, 126, 234)');
      
      // ラベルからlightness値を抽出
      const labelText = labelEl.textContent || '';
      const lightnessMatch = labelText.match(/L(\d+)%/);
      const lightness = lightnessMatch ? parseInt(lightnessMatch[1]) / 100 : 0.5;
      
      colors.push({
        hex: hex,
        lightness: lightness,
        chroma: 0.5, // デフォルト値（実際の値は計算が複雑）
        isOriginal: isOriginal
      });
    }
  });
  
  const format = exportFormatEl.value;
  let content: string;
  let filename: string;
  let contentType: string = 'text/plain';
  
  switch (format) {
    case 'css':
      content = exportToCSS(colors);
      filename = 'color-palette.css';
      contentType = 'text/css';
      break;
    case 'json':
      content = exportToJSON(colors);
      filename = 'color-palette.json';
      contentType = 'application/json';
      break;
    default:
      console.error("Unknown export format:", format);
      return;
  }
  
  downloadFile(content, filename, contentType);
}