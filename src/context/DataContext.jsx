import { createContext, useContext, useState, useEffect } from 'react';
import mqttService from '../utils/mqtt';
import { useAuth } from './AuthContext';

// Create context
const DataContext = createContext();

// Maximum number of historical data points to store
const MAX_HISTORY_LENGTH = 100;

// Data provider component
export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Current sensor values
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [rainStatus, setRainStatus] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [irrigationStatus, setIrrigationStatus] = useState(null);
  
  // Historical data for charts
  const [soilMoistureHistory, setSoilMoistureHistory] = useState([]);
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const [humidityHistory, setHumidityHistory] = useState([]);
  
  // Connection state
  const [mqttConnected, setMqttConnected] = useState(false);
  
  // Alerts and thresholds
  const [criticalSoilMoisture, setCriticalSoilMoisture] = useState(20); // Default threshold
  const [isSoilDry, setIsSoilDry] = useState(false);
  const [isSoilCritical, setIsSoilCritical] = useState(false);
  
  // Connect to MQTT when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to MQTT broker - using environment variables if available
      const mqttHost = import.meta.env.VITE_MQTT_HOST || window.location.hostname || 'localhost';
      const mqttPort = import.meta.env.VITE_MQTT_PORT || '9001';
      const mqttPath = import.meta.env.VITE_MQTT_PATH || '/mqtt';
      const mqttUrl = `ws://${mqttHost}:${mqttPort}${mqttPath}`;
      console.log(`Tentando conectar ao broker MQTT em: ${mqttUrl}`);
      
      mqttService.connect(
        mqttUrl,
        () => setMqttConnected(true),
        () => setMqttConnected(false)
      );
      
      // Setup topic handlers
      setupTopicHandlers();
      
      // Clean up on unmount
      return () => {
        mqttService.disconnect();
        setMqttConnected(false);
      };
    }
  }, [isAuthenticated]);
  
  // Set up MQTT topic handlers
  const setupTopicHandlers = () => {
    // Soil moisture handler
    mqttService.on(mqttService.topics.soilMoisture, (data) => {
      const value = typeof data === 'object' ? data.valor : parseFloat(data);
      
      if (!isNaN(value)) {
        // Update current value
        setSoilMoisture(value);
        
        // Update history
        setSoilMoistureHistory(prev => {
          const newHistory = [...prev, {
            timestamp: new Date(),
            value: value
          }];
          
          // Limit history length
          if (newHistory.length > MAX_HISTORY_LENGTH) {
            return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
          }
          return newHistory;
        });
        
        // Check thresholds
        setIsSoilDry(value < 30);
        setIsSoilCritical(value < criticalSoilMoisture);
      }
    });
    
    // Rain status handler
    mqttService.on(mqttService.topics.rainStatus, (data) => {
      const isRaining = typeof data === 'object' 
        ? data.status === 'raining' || data.valor === true 
        : data === 'raining' || data === 'true' || data === true;
      
      setRainStatus(isRaining);
    });
    
    // Temperature handler
    mqttService.on(mqttService.topics.temperature, (data) => {
      const value = typeof data === 'object' ? data.valor : parseFloat(data);
      
      if (!isNaN(value)) {
        // Update current value
        setTemperature(value);
        
        // Update history
        setTemperatureHistory(prev => {
          const newHistory = [...prev, {
            timestamp: new Date(),
            value: value
          }];
          
          // Limit history length
          if (newHistory.length > MAX_HISTORY_LENGTH) {
            return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
          }
          return newHistory;
        });
      }
    });
    
    // Humidity handler
    mqttService.on(mqttService.topics.humidity, (data) => {
      const value = typeof data === 'object' ? data.valor : parseFloat(data);
      
      if (!isNaN(value)) {
        // Update current value
        setHumidity(value);
        
        // Update history
        setHumidityHistory(prev => {
          const newHistory = [...prev, {
            timestamp: new Date(),
            value: value
          }];
          
          // Limit history length
          if (newHistory.length > MAX_HISTORY_LENGTH) {
            return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
          }
          return newHistory;
        });
      }
    });
    
    // Irrigation status handler
    mqttService.on(mqttService.topics.irrigationStatus, (data) => {
      const isOn = typeof data === 'object' 
        ? data.status === 'ON' || data.valor === true 
        : data === 'ON' || data === 'true' || data === true;
      
      setIrrigationStatus(isOn);
    });
  };
  
  // Function to send irrigation control command
  const controlIrrigation = (turnOn) => {
    return mqttService.sendIrrigationCommand(turnOn);
  };
  
  // Function to update the critical soil moisture threshold
  const updateCriticalMoistureThreshold = (value) => {
    if (!isNaN(value) && value > 0 && value <= 100) {
      setCriticalSoilMoisture(value);
      // Re-evaluate critical status
      if (soilMoisture !== null) {
        setIsSoilCritical(soilMoisture < value);
      }
      return true;
    }
    return false;
  };
  
  // Switch to local broker for development or fallback
  const switchToLocalBroker = (url) => {
    mqttService.switchToLocalBroker(url);
  };
  
  const value = {
    // Current sensor values
    soilMoisture,
    rainStatus,
    temperature,
    humidity,
    irrigationStatus,
    
    // Status indicators
    isSoilDry,
    isSoilCritical,
    criticalSoilMoisture,
    updateCriticalMoistureThreshold,
    
    // Historical data
    soilMoistureHistory,
    temperatureHistory,
    humidityHistory,
    
    // Control functions
    controlIrrigation,
    
    // Connection status
    mqttConnected,
    switchToLocalBroker
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
