// frontend/src/components/PredictionChart.tsx
"use client";

import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, TitleComponent, DataZoomComponent, LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { PredictionPoint } from '@/types'; // Import the new type
import { useTheme } from 'next-themes';

// Register necessary ECharts components
echarts.use([
  TitleComponent, TooltipComponent, GridComponent, LineChart, CanvasRenderer, DataZoomComponent, LegendComponent
]);

interface PredictionChartProps {
  data: PredictionPoint[];
  historicalData?: PredictionPoint[]; // Optional: Pass historical end point for context
  className?: string;
}

// Helper to format currency for tooltips/axis
const formatCurrencyAxis = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
};

export default function PredictionChart({ data, historicalData, className }: PredictionChartProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Prepare data for ECharts series
  // Include the last historical point if provided, to connect the lines
  const combinedData = historicalData && historicalData.length > 0
      ? [historicalData[historicalData.length - 1], ...data] // Combine last historical + predictions
      : data; // Only predictions if no historical context
  const combinedChartData = combinedData.map(item => [item.date, item.value]);


  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
      valueFormatter: (value: number | string) => formatCurrencyAxis(Number(value)),
    },
    legend: { // Add legend
        data: ['Prediction'],
        textStyle: { color: isDarkMode ? '#ccc' : '#333' },
        bottom: 35 // Position above dataZoom slider
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true }, // Increased bottom margin
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: { color: isDarkMode ? '#ccc' : '#333', hideOverlap: true },
      axisLine: { lineStyle: { color: isDarkMode ? '#555' : '#ccc' } }
    },
    yAxis: {
      type: 'value',
      name: 'Predicted Value',
      nameTextStyle: { color: isDarkMode ? '#ccc' : '#333', align: 'left' },
      axisLabel: { formatter: (value: number) => formatCurrencyAxis(value), color: isDarkMode ? '#ccc' : '#333' },
      splitLine: { lineStyle: { color: isDarkMode ? '#333' : '#eee', type: 'dashed' } }
    },
    dataZoom: [
        { type: 'inside', start: 0, end: 100, filterMode: 'filter' },
        { type: 'slider', start: 0, end: 100, filterMode: 'filter', height: 20, bottom: 10, borderColor: isDarkMode ? '#555' : '#ddd', handleStyle: { color: '#4e8af9' }, dataBackground: { lineStyle: { color: isDarkMode ? '#555' : '#ddd' }, areaStyle: { color: isDarkMode ? 'rgba(78, 138, 249, 0.3)' : 'rgba(78, 138, 249, 0.3)' } }, selectedDataBackground: { lineStyle: { color: '#4e8af9' }, areaStyle: { color: '#4e8af9' } }, textStyle: { color: isDarkMode ? '#ccc' : '#333' } }
    ],
    series: [
      {
        name: 'Prediction',
        type: 'line',
        smooth: false, // Keep prediction line straight or slightly smooth
        symbol: 'circle', // Show points for predictions
        symbolSize: 6,
        sampling: 'lttb',
        // Use combined data for the line path
        data: combinedChartData,
        // Style the prediction line differently
        lineStyle: {
            width: 2,
            color: '#f59e0b', // Orange color for prediction
            type: 'dashed' // Dashed line for prediction
         },
         itemStyle: {
            color: '#f59e0b' // Orange points
         },
         // Optional: Area style for prediction range (more complex)
         // areaStyle: { ... }
      },
    ],
    backgroundColor: 'transparent',
  };

  return (
    <div className={className}>
      <ReactECharts
        echarts={echarts}
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: '350px', width: '100%' }}
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
}