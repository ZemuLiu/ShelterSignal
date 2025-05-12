// frontend/src/components/insightsdashboard.tsx
"use client";

import { PropertyData, PredictionPoint } from "@/types"; // Removed unused CensusData, HistoricalValue
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Assuming cn utility is used
// --- IMPORT HELPER FUNCTIONS ---
// Adjust path if your utils file is located elsewhere
import { formatCurrency, formatNumber, formatDate, getTrendColor } from "@/lib/utils";
// --- END IMPORT ---
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
// Import specific icons
import { Users, Home, TrendingUp, BarChartHorizontal, Bot, FileText, LineChart as LineChartIcon } from 'lucide-react';

// Dynamically import chart components
const ValueHistoryChart = dynamic(() => import('./valuehistorychart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full bg-gray-300 rounded" />,
});
const PredictionChart = dynamic(() => import('./PredictionChart'), { // Import PredictionChart
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full bg-gray-300 rounded" />,
});


interface InsightsDashboardProps {
  data: PropertyData | null;
  isLoading: boolean;
  className?: string;
}

// --- Helper to display Census data item (can stay here as it's specific to this component's layout) ---
const CensusDataItem = ({ label, value }: { label: string; value?: number | string | null }) => {
    // Use imported formatNumber helper
    const displayValue = typeof value === 'number' ? formatNumber(value) : value;
    if (displayValue === null || typeof displayValue === 'undefined' || displayValue === 'N/A') return null; // Don't render if no value or formatted as N/A

    return (
        <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="font-medium">{displayValue}</p>
        </div>
    );
};


export default function InsightsDashboard({ data, isLoading, className }: InsightsDashboardProps) {

  // --- Loading State ---
  if (isLoading) {
    // Use the more detailed skeleton from the previous step
    return (
       <Card className={cn("w-full max-w-4xl mt-8 animate-pulse", className)}>
         <CardHeader className="p-4 md:p-6"> <Skeleton className="h-7 w-3/4 mb-2 bg-gray-300" /> <Skeleton className="h-4 w-full bg-gray-300" /> </CardHeader>
         <CardContent className="space-y-6 p-4 md:p-6">
           <div className="border-t border-gray-200 pt-4"> <Skeleton className="h-6 w-1/3 mb-3 bg-gray-300" /> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-20 w-full bg-gray-300 rounded" /><Skeleton className="h-20 w-full bg-gray-300 rounded" /></div></div>
           <div className="border-t border-gray-200 pt-4"> <Skeleton className="h-6 w-1/3 mb-3 bg-gray-300" /> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-16 w-full bg-gray-300 rounded" /><Skeleton className="h-16 w-full bg-gray-300 rounded" /></div></div>
           <div className="border-t border-gray-200 pt-4"> <Skeleton className="h-6 w-1/3 mb-3 bg-gray-300" /> <div className="space-y-2"><Skeleton className="h-4 w-full bg-gray-300 rounded" /><Skeleton className="h-4 w-5/6 bg-gray-300 rounded" /><Skeleton className="h-4 w-full bg-gray-300 rounded" /><Skeleton className="h-4 w-3/4 bg-gray-300 rounded" /></div> </div>
           <div className="border-t border-gray-200 pt-4"> <Skeleton className="h-6 w-1/3 mb-3 bg-gray-300" /> <div className="grid grid-cols-2 gap-4"><Skeleton className="h-12 w-full bg-gray-300 rounded" /><Skeleton className="h-12 w-full bg-gray-300 rounded" /><Skeleton className="h-12 w-full bg-gray-300 rounded" /><Skeleton className="h-12 w-full bg-gray-300 rounded" /></div> </div>
           <div className="border-t border-gray-200 pt-4"> <Skeleton className="h-6 w-1/3 mb-3 bg-gray-300" /> <Skeleton className="h-[350px] w-full bg-gray-300 rounded" /> </div>
           <div className="border-t border-gray-200 pt-4"> <Skeleton className="h-6 w-1/3 mb-3 bg-gray-300" /> <Skeleton className="h-[350px] w-full bg-gray-300 rounded" /> </div>
         </CardContent>
       </Card>
    );
  }

  // --- No Data State ---
  if (!data) { return null; } // Handled by parent page's error alert

  // Check for data presence
  const hasHistoricalData = data.historicalValues && data.historicalValues.length > 0;
  const hasPredictionPoints = data.predictionPoints && data.predictionPoints.length > 0;
  const hasCensusData = data.censusData && Object.values(data.censusData).some(v => v !== null && typeof v !== 'undefined');
  const hasAiSummary = data.aiSummary && data.aiSummary.length > 0;
  const hasValuation = typeof data.valueEstimate === 'number' || typeof data.rentEstimate === 'number';
  const hasPrediction = typeof data.predictedValueNextYear === 'number' || data.marketTrend;
  const hasDetails = data.description || data.lotSize;


  // --- Data Display State ---
  return (
    <Card className={cn("w-full max-w-4xl mt-8 shadow-lg border border-gray-200 bg-white", className)}>
      {/* Header */}
      <CardHeader className="bg-gray-50 rounded-t-lg border-b p-4 md:p-6">
         <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-gray-800">
             <Home className="inline-block h-6 w-6 text-blue-600" />
             Insights for: {data.formattedAddress || data.address}
         </CardTitle>
         <CardDescription className="text-gray-600">
           {/* Use imported formatNumber */}
           {data.propertyType ? `${data.propertyType} ` : ''}
           {data.yearBuilt ? `· Built in ${data.yearBuilt} ` : ''}
           {data.bedrooms ? `· ${data.bedrooms} Beds ` : ''}
           {data.bathrooms ? `· ${data.bathrooms} Baths ` : ''}
           {data.squareFootage ? `· ${formatNumber(data.squareFootage)} sqft` : ''}
         </CardDescription>
      </CardHeader>

      {/* Content Sections */}
      <CardContent className="p-4 md:p-6 space-y-8"> {/* Increased spacing */}

        {/* Section: Valuation & Rent Estimates */}
        {hasValuation && (
            <div className="border-t border-gray-200 pt-5">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><TrendingUp className="h-5 w-5 text-green-600" />Valuation & Rent</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <p className="text-sm text-gray-600">Estimated Value (Rentcast)</p>
                        {/* Use imported formatCurrency */}
                        <p className="font-medium text-xl text-gray-900">{formatCurrency(data.valueEstimate)}</p>
                        {data.valueEstimateLow && data.valueEstimateHigh && ( <p className="text-xs text-gray-500">Range: {formatCurrency(data.valueEstimateLow)} - {formatCurrency(data.valueEstimateHigh)}</p> )}
                        {/* Use imported formatDate */}
                        <p className="text-xs text-gray-500 mt-1">Last Sold: {formatDate(data.lastSoldDate)} for {formatCurrency(data.lastSoldPrice)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Estimated Rent (Rentcast)</p>
                        <p className="font-medium text-xl text-gray-900">{formatCurrency(data.rentEstimate)} <span className="text-base font-normal text-gray-700">/ mo</span></p>
                        {data.rentEstimateLow && data.rentEstimateHigh && ( <p className="text-xs text-gray-500">Range: {formatCurrency(data.rentEstimateLow)} - {formatCurrency(data.rentEstimateHigh)} / mo</p> )}
                    </div>
                </div>
            </div>
        )}

        {/* Section: Future Predictions (Summary Cards) */}
        {hasPrediction && (
           <div className="border-t border-gray-200 pt-5">
             <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><TrendingUp className="h-5 w-5 text-purple-600" />Market Predictions (1 Year)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                   <div>
                       <p className="text-sm text-gray-600">Predicted Value</p>
                       <p className="font-medium text-gray-900">{formatCurrency(data.predictedValueNextYear)}</p>
                       {typeof data.predictionConfidence === 'number' && ( <p className="text-xs text-gray-500">Confidence: {(data.predictionConfidence * 100).toFixed(0)}%</p> )}
                   </div>
                    <div>
                       <p className="text-sm text-gray-600">Market Trend</p>
                       <p className="font-medium">
                          {/* Use imported getTrendColor */}
                          {data.marketTrend ? ( <Badge variant="outline" className={cn("ml-0", getTrendColor(data.marketTrend))}>{data.marketTrend}</Badge> ) : ( <span className="text-gray-600">N/A</span> )}
                       </p>
                        {typeof data.trendConfidence === 'number' && ( <p className="text-xs text-gray-500">Trend Confidence: {(data.trendConfidence * 100).toFixed(0)}%</p> )}
                    </div>
                    {typeof data.predictedRentNextYear === 'number' && (
                      <div className="sm:col-span-2">
                          <p className="text-sm text-gray-600">Predicted Rent</p>
                          <p className="font-medium text-gray-900">{formatCurrency(data.predictedRentNextYear)} / mo</p>
                      </div>
                   )}
               </div>
           </div>
         )}

        {/* Section: AI-Generated Summary */}
        <div className="border-t border-gray-200 pt-5">
           <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><Bot className="h-5 w-5 text-cyan-600" />AI Investment Brief</h3>
           {hasAiSummary ? (
             <div className="prose prose-sm max-w-none bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-md p-4 text-gray-800 shadow-inner dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                <ReactMarkdown
                    components={{
                        // Add styling for markdown elements if desired
                        // h1: ({node, ...props}) => <h1 className="text-lg font-bold" {...props} />,
                        // p: ({node, ...props}) => <p className="mb-2" {...props} />,
                        // strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                    }}
                >
                    {data.aiSummary}
                </ReactMarkdown>
             </div>
           ) : (
             <p className="text-sm text-gray-500 text-center py-4">
               AI summary could not be generated for this property.
             </p>
           )}
        </div>

        {/* Section: Demographics */}
        <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><Users className="h-5 w-5 text-orange-600" />Demographics (Zip Code: {data.zipCode || 'N/A'})</h3>
            {hasCensusData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                 {/* Use CensusDataItem component which uses imported formatNumber */}
                 <CensusDataItem label="Total Population" value={data.censusData?.totalPopulation} />
                 <CensusDataItem label="Median Age" value={data.censusData?.medianAge} />
                 <CensusDataItem label="Male Population" value={data.censusData?.malePopulation} />
                 <CensusDataItem label="Female Population" value={data.censusData?.femalePopulation} />
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Demographic data is not available for this area.
              </p>
            )}
         </div>


        {/* Section: Historical Value Chart */}
        <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><BarChartHorizontal className="h-5 w-5 text-indigo-600" />Historical Value Trend</h3>
            {hasHistoricalData ? (
              <ValueHistoryChart data={data.historicalValues!} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Historical value data is not available for this property.
              </p>
            )}
         </div>

         {/* Section: Prediction Chart */}
         <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><LineChartIcon className="h-5 w-5 text-amber-600" />Value Forecast (Next {data.predictionPoints ? data.predictionPoints.length -1 : 0} Years)</h3>
            {hasPredictionPoints ? (
              <PredictionChart
                  data={data.predictionPoints!}
                  // Pass historical data's last point for context if available
                  // Need to cast type for PredictionChart's prop expectation
                  historicalData={data.historicalValues?.slice(-1) as PredictionPoint[] | undefined}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Value forecast chart could not be generated.
              </p>
            )}
         </div>

        {/* Section: Additional Details */}
        {hasDetails && (
             <div className="border-t border-gray-200 pt-5">
                 <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-700"><FileText className="h-5 w-5 text-gray-600"/>Additional Details</h3>
                 {/* Use imported formatNumber */}
                 {data.lotSize && <p className="text-sm">Lot Size: <span className="font-medium text-gray-800">{formatNumber(data.lotSize)} sqft</span></p>}
                 {data.description && <p className="text-sm text-gray-700 mt-2">{data.description}</p>}
             </div>
         )}

      </CardContent>
    </Card>
  );
}