import { useState } from 'react';
import { FaPlay, FaStop, FaExclamationTriangle } from 'react-icons/fa';

const ControlPanel = ({ irrigationStatus, onToggleIrrigation, isSoilCritical, isRaining }) => {
  const [loading, setLoading] = useState(false);

  const handleTurnOn = () => {
    setLoading(true);
    onToggleIrrigation(true);
    setTimeout(() => setLoading(false), 1000); // Simulate delay
  };

  const handleTurnOff = () => {
    setLoading(true);
    onToggleIrrigation(false);
    setTimeout(() => setLoading(false), 1000); // Simulate delay
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Controle Manual de Irrigação
      </h2>

      <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${irrigationStatus ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-gray-700 dark:text-gray-300">
              Status: <span className="font-medium">{irrigationStatus ? 'Ligado' : 'Desligado'}</span>
            </span>
          </div>

          {isRaining && (
            <div className="flex items-center space-x-2 mt-2 text-warning-600 dark:text-warning-400">
              <FaExclamationTriangle className="w-4 h-4" />
              <span className="text-sm">Estu00e1 chovendo! Recomenda-se desligar a irrigação.</span>
            </div>
          )}

          {isSoilCritical && !isRaining && (
            <div className="flex items-center space-x-2 mt-2 text-danger-600 dark:text-danger-400">
              <FaExclamationTriangle className="w-4 h-4" />
              <span className="text-sm">Umidade cru00edtica do solo! Recomenda-se ligar a irrigação.</span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleTurnOn}
            disabled={loading || irrigationStatus}
            className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${irrigationStatus ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary-600 hover:bg-secondary-700'} transition-colors`}
          >
            <FaPlay className="mr-2" /> Ligar irrigação
          </button>

          <button
            onClick={handleTurnOff}
            disabled={loading || !irrigationStatus}
            className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${!irrigationStatus ? 'bg-gray-400 cursor-not-allowed' : 'bg-danger-600 hover:bg-danger-700'} transition-colors`}
          >
            <FaStop className="mr-2" /> Desligar irrigação
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
