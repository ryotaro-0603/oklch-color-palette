import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
  initialColor?: string;
  onColorChange?: (color: string) => void;
}

export default function ColorPicker({ initialColor = '#ff0000', onColorChange }: ColorPickerProps) {
  const [color, setColor] = useState(initialColor);
  const [SketchPicker, setSketchPicker] = useState<any>(null);

  // react-colorを動的にロード
  useEffect(() => {
    const loadColorPicker = async () => {
      try {
        const reactColor = await import('react-color');
        setSketchPicker(() => reactColor.SketchPicker);
      } catch (error) {
        console.error('Failed to load react-color:', error);
      }
    };
    
    loadColorPicker();
  }, []);

  const handleColorChange = (colorResult: any) => {
    const hexColor = colorResult.hex;
    setColor(hexColor);
    
    // 外部への色変更通知
    if (onColorChange) {
      onColorChange(hexColor);
    }
    
    // グローバルイベントとして色変更を通知
    window.dispatchEvent(new CustomEvent('colorChange', { 
      detail: { hex: hexColor } 
    }));
  };

  // 外部からの色変更を受信
  useEffect(() => {
    const handleExternalColorChange = (event: any) => {
      if (event.detail?.hex && event.detail.hex !== color) {
        setColor(event.detail.hex);
      }
    };

    window.addEventListener('externalColorChange', handleExternalColorChange);
    
    return () => {
      window.removeEventListener('externalColorChange', handleExternalColorChange);
    };
  }, [color]);

  if (!SketchPicker) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '300px',
        fontFamily: 'sans-serif'
      }}>
        カラーピッカーを読み込み中...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
      <SketchPicker
        color={color}
        onChange={handleColorChange}
        disableAlpha={true}
        presetColors={[]}
        width="280px"
        styles={{
          default: {
            picker: {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              fontFamily: 'sans-serif'
            }
          }
        }}
      />
    </div>
  );
}