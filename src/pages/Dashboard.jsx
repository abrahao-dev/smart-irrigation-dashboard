import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { FaCloudRain, FaTint, FaThermometerHalf, FaWind, FaPowerOff, FaExclamationTriangle } from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';
import SoilMoistureChart from '../components/SoilMoistureChart';
import TemperatureChart from '../components/TemperatureChart';
import StatusCard from '../components/StatusCard';
import ControlPanel from '../components/ControlPanel';
import Header from '../components/Header';
import AlertBanner from '../components/AlertBanner';

const Dashboard = () => {
  // Auth context would be used here if needed for personalization
  const {
    soilMoisture,
    rainStatus,
    temperature,
    humidity,
    irrigationStatus,
    isSoilDry,
    isSoilCritical,
    soilMoistureHistory,
    temperatureHistory,
    controlIrrigation,
    mqttConnected
  } = useData();

  const [timeRange, setTimeRange] = useState('1h');
  const [showAlert, setShowAlert] = useState(false);

  // Show alert when soil moisture is critical
  useEffect(() => {
    if (isSoilCritical) {
      setShowAlert(true);
    }
  }, [isSoilCritical]);

  // Handler for manually turning irrigation on/off
  const handleIrrigationToggle = (turnOn) => {
    controlIrrigation(turnOn);
  };

  // Handle time range selection for charts
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-primary-900">
      <Header />
      
      {/* Connection status indicator */}
      {!mqttConnected && (
        <div className="bg-warning-100 border-l-4 border-warning-500 text-warning-700 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-warning-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">Sem conexão com o broker MQTT. Tentando reconectar...</p>
            </div>
          </div>
        </div>
      )}

      {/* Critical soil moisture alert */}
      {showAlert && isSoilCritical && (
        <AlertBanner
          message="Umidade do solo crítica detectada! Considere ligar a irrigação."
          type="danger"
          onClose={() => setShowAlert(false)}
        />
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard de Irrigação
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoramento em tempo real do sistema de irrigação inteligente
          </p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Umidade do Solo"
            value={soilMoisture !== null ? `${soilMoisture.toFixed(1)}%` : 'Carregando...'}
            icon={<FaTint className="text-primary-500" />}
            status={isSoilDry ? 'warning' : 'normal'}
            statusText={isSoilDry ? 'Solo seco' : 'Normal'}
          />
          
          <StatusCard
            title="Status de Chuva"
            value={rainStatus !== null ? (rainStatus ? 'Chovendo' : 'Sem chuva') : 'Carregando...'}
            icon={<FaCloudRain className="text-primary-500" />}
            status={rainStatus ? 'info' : 'normal'}
            statusText={rainStatus ? '☔' : 'Céu limpo'}
          />
          
          <StatusCard
            title="Temperatura"
            value={temperature !== null ? `${temperature.toFixed(1)}°C` : 'Carregando...'}
            icon={<FaThermometerHalf className="text-danger-500" />}
            status="normal"
          />
          
          <StatusCard
            title="Umidade do Ar"
            value={humidity !== null ? `${humidity.toFixed(1)}%` : 'Carregando...'}
            icon={<WiHumidity className="text-primary-300" />}
            status="normal"
          />
        </div>

        {/* Control panel */}
        <div className="mb-8">
          <ControlPanel
            irrigationStatus={irrigationStatus}
            onToggleIrrigation={handleIrrigationToggle}
            isSoilCritical={isSoilCritical}
            isRaining={rainStatus}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-primary-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary-900 dark:text-white">
                Umidade do Solo
              </h2>
              <div className="flex space-x-2">
                <button
                  className={`px-2 py-1 text-xs rounded ${timeRange === '1h' ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200'}`}
                  onClick={() => handleTimeRangeChange('1h')}
                >
                  1h
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${timeRange === '3h' ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200'}`}
                  onClick={() => handleTimeRangeChange('3h')}
                >
                  3h
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${timeRange === '6h' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => handleTimeRangeChange('6h')}
                >
                  6h
                </button>
              </div>
            </div>
            <SoilMoistureChart data={soilMoistureHistory} timeRange={timeRange} />
          </div>
          
          <div className="bg-white dark:bg-primary-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary-900 dark:text-white">
                Temperatura
              </h2>
              <div className="flex space-x-2">
                <button
                  className={`px-2 py-1 text-xs rounded ${timeRange === '1h' ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200'}`}
                  onClick={() => handleTimeRangeChange('1h')}
                >
                  1h
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${timeRange === '3h' ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200'}`}
                  onClick={() => handleTimeRangeChange('3h')}
                >
                  3h
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${timeRange === '6h' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => handleTimeRangeChange('6h')}
                >
                  6h
                </button>
              </div>
            </div>
            <TemperatureChart data={temperatureHistory} timeRange={timeRange} />
          </div>
        </div>

        {/* System status */}
        <div className="bg-white dark:bg-primary-800 rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
            Status do Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${irrigationStatus ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Sistema de Irrigação: </span>
              <span className="ml-1 text-sm font-medium">
                {irrigationStatus ? 'Ligado' : 'Desligado'}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${mqttConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Conexão MQTT: </span>
              <span className="ml-1 text-sm font-medium">
                {mqttConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${isSoilDry ? 'bg-yellow-500' : 'bg-green-500'} mr-2`}></div>
              <span className="text-sm text-primary-700 dark:text-primary-300">Status do Solo: </span>
              <span className="ml-1 text-sm font-medium">
                {isSoilDry ? 'Seco' : 'Úmido'}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${isSoilCritical ? 'bg-red-500' : 'bg-green-500'} mr-2`}></div>
              <span className="text-sm text-primary-700 dark:text-primary-300">Alerta de Umidade: </span>
              <span className="ml-1 text-sm font-medium">
                {isSoilCritical ? 'CRÍTICO' : 'Normal'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
