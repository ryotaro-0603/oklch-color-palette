// グラフ描画機能のモジュール
import Chart from "chart.js/auto";
import { sigmoid, mountainCurve } from "./mathFunctions";

let chart: Chart | null = null;

export function drawCurveGraph(): void {
  const canvas = document.getElementById("curveGraph") as HTMLCanvasElement | null;
  if (!canvas) return;

  // 現在のパラメータを取得
  const sigmoidSteepnessEl = document.getElementById("sigmoidSteepness") as HTMLInputElement | null;
  const sigmoidSteepness = sigmoidSteepnessEl ? parseFloat(sigmoidSteepnessEl.value) : 0.5;

  const chromaPeak = 0.5;

  const chromaHeightEl = document.getElementById("chromaHeight") as HTMLInputElement | null;
  const chromaHeight = chromaHeightEl ? parseFloat(chromaHeightEl.value) : 1.0;

  // データポイントを生成
  const points = 100;
  const labels: number[] = [];
  const sigmoidData: number[] = [];
  const chromaData: number[] = [];

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    labels.push(t);

    // シグモイド計算
    const minInput = -6;
    const maxInput = 6;
    const sigmoidInput = minInput + (maxInput - minInput) * t;
    const sigmoidValue = sigmoid(sigmoidInput, sigmoidSteepness);
    const normalizedSigmoid = 0.05 + sigmoidValue * 0.9;
    sigmoidData.push(normalizedSigmoid);

    // 山型カーブ計算
    let mountainValue;
    if (chromaHeight === 0) {
      mountainValue = 1.0;
    } else {
      const originalMountainValue = mountainCurve(t, chromaPeak, 1.0);
      mountainValue = (1 - chromaHeight) * 1.0 + chromaHeight * originalMountainValue;
    }
    chromaData.push(mountainValue);
  }

  // 既存のチャートがある場合はデータを更新、なければ新規作成
  if (chart) {
    // データを更新してアニメーション
    chart.data.datasets[0].data = sigmoidData;
    chart.data.datasets[1].data = chromaData;
    chart.update('active');
    return;
  }

  // Chart.jsでグラフを作成
  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "明度 (シグモイド)",
          data: sigmoidData,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: "彩度 (山型カーブ)",
          data: chromaData,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: "Inter, sans-serif",
              size: 12,
            },
          },
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          min: 0,
          max: 1,
          title: {
            display: true,
            text: "位置",
            font: {
              family: "Inter, sans-serif",
              size: 12,
            },
          },
          grid: {
            color: "#e2e8f0",
            lineWidth: 1,
          },
          ticks: {
            font: {
              family: "Inter, sans-serif",
              size: 10,
            },
          },
        },
        y: {
          min: 0,
          max: 1.2,
          title: {
            display: true,
            text: "値",
            font: {
              family: "Inter, sans-serif",
              size: 12,
            },
          },
          grid: {
            color: "#e2e8f0",
            lineWidth: 1,
          },
          ticks: {
            font: {
              family: "Inter, sans-serif",
              size: 10,
            },
          },
        },
      },
      animation: {
        duration: 300,
        easing: 'easeInOutQuart'
      }
    },
  });
}
