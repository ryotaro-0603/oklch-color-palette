import React, { useState, useEffect } from "react";
import { ColorPicker as ReactColorPalette, useColor } from "react-color-palette";
import "react-color-palette/css";

interface ColorPickerProps {
  initialColor?: string;
  onColorChange?: (color: string) => void;
}

export default function ColorPicker({ initialColor = "#ff0000", onColorChange }: ColorPickerProps) {
  const [color, setColor] = useColor(initialColor);

  const handleColorChange = (newColor: any) => {
    setColor(newColor);

    // 外部への色変更通知
    if (onColorChange) {
      onColorChange(newColor.hex);
    }

    // グローバルイベントとして色変更を通知
    window.dispatchEvent(
      new CustomEvent("colorChange", {
        detail: { hex: newColor.hex },
      })
    );
  };

  // 外部からの色変更を受信
  useEffect(() => {
    const handleExternalColorChange = (event: any) => {
      if (event.detail?.hex && event.detail.hex !== color.hex) {
        setColor({ ...color, hex: event.detail.hex });
      }
    };

    window.addEventListener("externalColorChange", handleExternalColorChange);

    return () => {
      window.removeEventListener("externalColorChange", handleExternalColorChange);
    };
  }, [color]);

  return <ReactColorPalette color={color} onChange={handleColorChange} hideInput={["rgb", "hsv"]} />;
}
