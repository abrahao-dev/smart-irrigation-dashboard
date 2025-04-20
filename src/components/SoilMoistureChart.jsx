import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import dayjs from 'dayjs';
import { calculateMean, calculateStandardDeviation, formatNumber } from '../utils/statistics';

const SoilMoistureChart = ({ data, timeRange }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [stats, setStats] = useState({
    mean: 0,
    stdDev: 0
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filter data based on selected time range
    const now = dayjs();
    let cutoffTime;

    switch (timeRange) {
      case '1h':
        cutoffTime = now.subtract(1, 'hour');
        break;
      case '3h':
        cutoffTime = now.subtract(3, 'hours');
        break;
      case '6h':
        cutoffTime = now.subtract(6, 'hours');
        break;
      default:
        cutoffTime = now.subtract(1, 'hour');
    }

    const filtered = data.filter(item => dayjs(item.timestamp).isAfter(cutoffTime));
    setFilteredData(filtered);
    
    // Calculate statistics
    if (filtered.length > 0) {
      const values = filtered.map(item => item.value);
      const mean = calculateMean(values);
      const stdDev = calculateStandardDeviation(values);
      setStats({ mean, stdDev });
    }
  }, [data, timeRange]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {`Hora: ${dayjs(payload[0].payload.timestamp).format('HH:mm:ss')}`}
          </p>
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {`Umidade: ${payload[0].value.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format X axis ticks
  const formatXAxis = (timestamp) => {
    return dayjs(timestamp).format('HH:mm');
  };

  if (filteredData.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 bg-white dark:bg-primary-800 rounded-md">
        <p className="text-primary-500 dark:text-primary-400">Aguardando dados...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap justify-between items-center text-xs text-primary-700 dark:text-primary-300">
        <div className="flex space-x-4">
          <span>Média: <strong>{formatNumber(stats.mean)}%</strong></span>
          <span>Desvio Padrão: <strong>±{formatNumber(stats.stdDev)}%</strong></span>
        </div>
        <div>
          <span className="text-xs italic">Baseado em {filteredData.length} medições</span>
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis} 
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference line for mean */}
          <ReferenceLine
            y={stats.mean}
            stroke="#0EA5E9"
            strokeDasharray="3 3"
            label={{ 
              value: `Média: ${formatNumber(stats.mean)}%`, 
              position: 'insideBottomRight',
              fill: '#0EA5E9',
              fontSize: 10
            }}
          />
          
          {/* Reference lines for standard deviation */}
          <ReferenceLine
            y={stats.mean + stats.stdDev}
            stroke="#0EA5E9"
            strokeDasharray="2 2"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={stats.mean - stats.stdDev}
            stroke="#0EA5E9"
            strokeDasharray="2 2"
            strokeOpacity={0.5}
          />
          
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#0EA5E9" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#0EA5E9", stroke: "#0369A1", strokeWidth: 1 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SoilMoistureChart;
