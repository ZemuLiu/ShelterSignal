// frontend/src/components/valuehistorychart.tsx
"use client"; // ECharts interacts with the DOM, needs to be a client component

import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent, // Added for zooming/panning
  LegendComponent,   // Added if you have multiple series
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { HistoricalValue } from '@/types'; // Adjust path if needed
import { useTheme } from 'next-themes'; // Optional: For dark/light mode sync

// Register necessary ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LineChart,
  CanvasRenderer,
  DataZoomComponent, // Register DataZoom
  LegendComponent,   // Register Legend
]);

interface ValueHistoryChartProps {
  data: HistoricalValue[];
  className?: string;
}

// Helper to format currency for tooltips/axis
const formatCurrencyAxis = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value}`;
};

export default function ValueHistoryChart({ data, className }: ValueHistoryChartProps) {
  // Optional: Get theme from next-themes if you've set it up in layout.tsx
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Prepare data for ECharts series
  const chartData = data.map(item => [item.date, item.value]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross', // Use crosshairs
        label: {
            backgroundColor: '#6a7985'
        }
      },
      valueFormatter: (value: number | string) => formatCurrencyAxis(Number(value)), // Format tooltip value
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%', // Increase bottom margin for dataZoom
      containLabel: true,
    },
    xAxis: {
      type: 'time', // Use time axis for dates
      boundaryGap: false, // Line starts/ends at the edge
      axisLabel: {
         color: isDarkMode ? '#ccc' : '#333', // Adjust label color for theme
         hideOverlap: true,
      },
      axisLine: {
         lineStyle: {
            color: isDarkMode ? '#555' : '#ccc',
         }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Estimated Value',
      nameTextStyle: {
         color: isDarkMode ? '#ccc' : '#333',
         align: 'left',
      },
      axisLabel: {
        formatter: (value: number) => formatCurrencyAxis(value), // Format Y-axis labels
        color: isDarkMode ? '#ccc' : '#333',
      },
       splitLine: { // Customize grid lines
         lineStyle: {
            color: isDarkMode ? '#333' : '#eee',
            type: 'dashed',
         }
      }
    },
    dataZoom: [ // Enable zooming and panning
        {
            type: 'inside', // Allow zooming with mouse wheel/touch
            start: 0,      // Initial zoom start percentage
            end: 100,        // Initial zoom end percentage
            filterMode: 'filter', // Use filter mode for smoother performance with large data
        },
        {
            type: 'slider', // Show a slider at the bottom
            start: 0,
            end: 100,
            filterMode: 'filter',
            height: 20,
            bottom: 10, // Position slider
             borderColor: isDarkMode ? '#555' : '#ddd',
             handleStyle: { color: '#4e8af9' },
             dataBackground: {
                lineStyle: { color: isDarkMode ? '#555' : '#ddd' },
                areaStyle: { color: isDarkMode ? 'rgba(78, 138, 249, 0.3)' : 'rgba(78, 138, 249, 0.3)' }
             },
             selectedDataBackground: {
                 lineStyle: { color: '#4e8af9' },
                 areaStyle: { color: '#4e8af9' }
             },
             textStyle: { color: isDarkMode ? '#ccc' : '#333' }
        }
    ],
    series: [
      {
        name: 'Estimated Value',
        type: 'line',
        smooth: true, // Make the line smooth
        symbol: 'none', // Hide data point markers for cleaner look
        sampling: 'lttb', // Downsample large datasets for performance
        data: chartData,
        areaStyle: { // Optional: Add gradient fill under the line
           color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                 offset: 0,
                 color: isDarkMode ? 'rgba(78, 138, 249, 0.5)' : 'rgba(78, 138, 249, 0.5)' // Start color
              },
              {
                 offset: 1,
                 color: isDarkMode ? 'rgba(78, 138, 249, 0.1)' : 'rgba(78, 138, 249, 0.1)' // End color (more transparent)
              }
           ])
        },
         lineStyle: {
            width: 2,
            color: '#4e8af9', // Line color
         },
         itemStyle: { // Color for tooltip hover point etc.
            color: '#4e8af9'
         }
      },
    ],
     // Optional: Add theme considerations
     backgroundColor: 'transparent', // Use parent background
  };

  // Ensure chart resizes correctly
  const handleResize = (chartInstance: echarts.ECharts | undefined) => {
      chartInstance?.resize();
  };

  return (
    <div className={className}>
      <ReactECharts
        echarts={echarts}
        option={option}
        notMerge={true} // Overwrite previous options
        lazyUpdate={true} // Update lazily
        style={{ height: '350px', width: '100%' }} // Set container dimensions
        theme={isDarkMode ? "dark" : "light"} // Optional: Apply built-in themes
        onChartReady={handleResize} // Initial resize if needed
        // onEvents={{ resize: handleResize }} // This might not be needed as echarts-for-react often handles resize
      />
    </div>
  );
}