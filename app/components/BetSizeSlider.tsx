'use client';

import { useState } from 'react';

interface BetSizeSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
}

export function BetSizeSlider({
  min,
  max,
  step,
  value,
  onChange,
  label,
  unit = 'bb',
}: BetSizeSliderProps) {
  return (
    <div className="px-4 py-3 bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-green-400">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #10b981 0%, #10b981 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">{min}{unit}</span>
        <span className="text-xs text-gray-500">{max}{unit}</span>
      </div>
    </div>
  );
}
