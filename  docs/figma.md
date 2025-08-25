# OKLCH Color Palette - Figma プラグイン対応ガイド

現在の OKLCH Color Palette アプリケーションを Figma プラグインに変換するための対応手順と必要な変更点をまとめます。

## 1. Figma プラグイン開発環境のセットアップ

### 必要なツールとセットアップ

```bash
# Figma Plugin開発ツールのインストール
npm install -g @figma/create-plugin

# プラグインプロジェクトの作成
npx @figma/create-plugin oklch-color-palette-plugin

# 必要な依存関係
npm install typescript webpack webpack-cli html-webpack-plugin
```

### プロジェクト構造

```
oklch-color-palette-plugin/
├── manifest.json          # プラグイン設定ファイル
├── src/
│   ├── code.ts            # Figma API メインコード
│   ├── ui.html            # プラグインUI
│   ├── ui.ts              # UIロジック
│   └── utils/             # 共通ユーティリティ
├── webpack.config.js      # ビルド設定
└── package.json
```

## 2. 既存コードの移植と対応

### 2.1 数学関数とコア機能（そのまま使用可能）

以下のファイルはほぼそのまま利用可能：

- `src/utils/mathFunctions.ts` - sigmoid, mountainCurve, generateLightnessValues
- `src/utils/faviconManager.ts` → 削除（Figma では不要）

### 2.2 UI コンポーネントの変更が必要な部分

#### ColorPicker の対応

```typescript
// 現在のReact ColorPicker → Figma用に簡素化
// react-color-palette を使わず、HEX入力 + Figma色選択に変更

interface FigmaColorPicker {
  onColorChange: (hex: string) => void;
  initialColor: string;
}

// Figmaの選択された要素の色を取得
function getCurrentSelectionColor(): string {
  const selection = figma.currentPage.selection;
  if (selection.length > 0 && "fills" in selection[0]) {
    const fills = selection[0].fills as Paint[];
    if (fills.length > 0 && fills[0].type === "SOLID") {
      const { r, g, b } = fills[0].color;
      return rgbToHex(r * 255, g * 255, b * 255);
    }
  }
  return "#f64466";
}
```

#### Chart.js → Canvas 描画への変更

```typescript
// Chart.jsはFigmaプラグインでは使用できないため、Canvas描画に変更
// src/utils/chartManager.ts を以下のように修正：

export function drawCurveGraph(canvas: HTMLCanvasElement, sigmoidSteepness: number, chromaHeight: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 既存のCanvas描画ロジックをChart.jsから移植
  // グリッド、軸、曲線を手動で描画
}
```

### 2.3 Figma API 連携コード

#### code.ts (メインプラグインコード)

```typescript
// Figmaプラグインのメインコード
figma.showUI(__html__, { width: 400, height: 600 });

// UIからのメッセージを受信
figma.ui.onmessage = (msg) => {
  if (msg.type === "create-palette") {
    const { colors, mode } = msg;

    if (mode === "color-styles") {
      createColorStyles(colors);
    } else if (mode === "rectangles") {
      createColorRectangles(colors);
    }
  }

  if (msg.type === "get-selection-color") {
    const color = getCurrentSelectionColor();
    figma.ui.postMessage({ type: "selection-color", color });
  }
};

// カラースタイルとして登録
function createColorStyles(colors: ColorData[]) {
  colors.forEach((color, index) => {
    const style = figma.createPaintStyle();
    style.name = color.isOriginal ? "Primary" : `Shade ${Math.round(color.lightness * 100)}`;

    const paint: SolidPaint = {
      type: "SOLID",
      color: hexToRgb(color.hex),
    };

    style.paints = [paint];
  });

  figma.notify("カラーパレットをスタイルとして作成しました");
}

// 色見本矩形として作成
function createColorRectangles(colors: ColorData[]) {
  const frame = figma.createFrame();
  frame.name = "OKLCH Color Palette";
  frame.resize(colors.length * 100, 100);

  colors.forEach((color, index) => {
    const rect = figma.createRectangle();
    rect.resize(80, 80);
    rect.x = index * 100 + 10;
    rect.y = 10;

    const paint: SolidPaint = {
      type: "SOLID",
      color: hexToRgb(color.hex),
    };

    rect.fills = [paint];
    rect.name = color.hex;

    frame.appendChild(rect);
  });

  figma.currentPage.appendChild(frame);
  figma.notify("カラーパレットを作成しました");
}
```

#### ui.html (プラグイン UI)

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      /* 既存のglobal.cssを移植、Figmaプラグイン用に調整 */
      body {
        margin: 0;
        padding: 16px;
        font-family: "Inter", sans-serif;
        font-size: 12px;
      }

      /* モバイル対応とFigmaプラグインサイズに最適化 */
      .main-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .custom-wrapper {
        background: #fff;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 12px;
      }
    </style>
  </head>
  <body>
    <!-- 既存のUIを簡素化してFigmaプラグインサイズに対応 -->
    <div class="main-container">
      <div class="custom-wrapper">
        <h3>Color Input</h3>
        <input type="text" id="colorInput" placeholder="#f64466" />
        <button id="pickFromSelection">選択中の色を使用</button>
      </div>

      <div class="custom-wrapper">
        <h3>Settings</h3>
        <!-- 既存のスライダーコントロールを移植 -->
      </div>

      <div class="custom-wrapper">
        <h3>Generate</h3>
        <button id="generatePalette">パレット生成</button>
        <select id="outputMode">
          <option value="color-styles">カラースタイル</option>
          <option value="rectangles">色見本矩形</option>
        </select>
      </div>

      <div id="preview">
        <!-- パレットプレビュー -->
      </div>
    </div>

    <script src="ui.js"></script>
  </body>
</html>
```

## 3. 必要な機能調整

### 3.1 削除する機能

- ファビコン更新機能
- Chart.js グラフ表示（Canvas 描画に簡素化）
- react-color-palette（HEX 入力のみに変更）
- CSS/JSON エクスポート（Figma 内で完結）

### 3.2 追加する機能

- Figma 選択要素からの色取得
- カラースタイルとして登録機能
- 色見本矩形作成機能
- レイヤー命名（色コード + 明度%）

### 3.3 UI 調整

- プラグインサイズ（400x600px）に最適化
- モバイルファーストなレスポンシブ対応
- Figma デザインシステムに準拠

## 4. ビルドとデプロイ

### webpack.config.js

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    ui: "./src/ui.ts",
    code: "./src/code.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/ui.html",
      filename: "ui.html",
      chunks: ["ui"],
    }),
  ],
};
```

### manifest.json

```json
{
  "name": "OKLCH Color Palette",
  "id": "oklch-color-palette",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "capabilities": [],
  "enableProposedApi": false,
  "editorType": ["figma"]
}
```

## 5. 移植作業の優先順位

1. **Phase 1**: 基本機能移植

   - 数学関数の移植
   - HEX 入力によるパレット生成
   - 基本的な Figma API 連携

2. **Phase 2**: UI 最適化

   - Figma プラグインサイズに対応
   - パラメータ調整スライダー実装

3. **Phase 3**: 高度な機能
   - Canvas 描画によるカーブプレビュー
   - 選択要素からの色取得
   - 複数出力オプション

## 6. 技術的課題と解決策

### 課題 1: Chart.js 依存

**解決策**: Canvas API を使った手動描画に変更

### 課題 2: react-color-palette 依存

**解決策**: HEX 入力 + Figma 色選択機能で代替

### 課題 3: ファイルサイズ制限

**解決策**: 外部ライブラリの最小化、core 機能のみ移植

この対応により、現在の Web アプリケーションの核となる機能を Figma プラグインとして提供できます。
