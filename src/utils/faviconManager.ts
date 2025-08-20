// ファビコン更新機能のモジュール

export function updateFavicon(color: string): void {
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