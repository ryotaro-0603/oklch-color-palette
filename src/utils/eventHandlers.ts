// UI イベントハンドラーのモジュール
import Color from "colorjs.io";
import { drawCurveGraph } from "./chartManager";
import { handleExport } from "./exportManager";

export function setupEventHandlers(
  updateColorFromValue: (colorValue: string) => void,
  isValidHex: (hex: string) => boolean,
  getCurrentSelectedColor: () => string
): void {
  const hexInput = document.getElementById("hexInput") as HTMLInputElement | null;
  const rgbInput = document.getElementById("rgbInput") as HTMLInputElement | null;
  const paletteCount = document.getElementById("paletteCount") as HTMLSelectElement | null;

  // ColorPickerからの色変更イベントを受信
  window.addEventListener("colorChange", (e: Event) => {
    const event = e as CustomEvent;
    const hexValue = event.detail?.hex;

    if (!hexValue) return;

    // HEX入力フィールドを更新（存在する場合のみ）
    if (hexInput) {
      hexInput.value = hexValue;
    }

    // RGB値に変換して入力フィールドを更新（存在する場合のみ）
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
        const currentHex = getCurrentSelectedColor();
        updateColorFromValue(currentHex);
      }

      // グラフを更新
      drawCurveGraph();
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
        const currentHex = getCurrentSelectedColor();
        updateColorFromValue(currentHex);
      }

      // グラフを更新
      drawCurveGraph();
    };

    // inputイベント（リアルタイム）とchangeイベント（確定時）の両方に対応
    sigmoidSteepness.addEventListener("input", updateSigmoidSteepness);
    sigmoidSteepness.addEventListener("change", updateSigmoidSteepness);
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
        const currentHex = getCurrentSelectedColor();
        updateColorFromValue(currentHex);
      }

      // グラフを更新
      drawCurveGraph();
    };

    // inputイベント（リアルタイム）とchangeイベント（確定時）の両方に対応
    chromaHeight.addEventListener("input", updateChromaHeight);
    chromaHeight.addEventListener("change", updateChromaHeight);
  }

  // エクスポートボタンのイベントハンドラー
  const exportButton = document.getElementById("exportButton") as HTMLButtonElement | null;
  if (exportButton) {
    exportButton.addEventListener("click", handleExport);
  }
}