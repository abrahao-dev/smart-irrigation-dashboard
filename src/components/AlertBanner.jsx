import { useState } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const AlertBanner = ({ message, type = 'info', onClose }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const alertStyles = {
    info: 'bg-primary-100 text-primary-800 border-primary-500',
    warning: 'bg-warning-100 text-warning-800 border-warning-500',
    danger: 'bg-danger-100 text-danger-800 border-danger-500',
    success: 'bg-secondary-100 text-secondary-800 border-secondary-500',
  };

  const alertIcons = {
    info: <FaInfoCircle className="h-5 w-5" />,
    warning: <FaExclamationTriangle className="h-5 w-5" />,
    danger: <FaExclamationTriangle className="h-5 w-5" />,
    success: <FaInfoCircle className="h-5 w-5" />,
  };

  return (
    <div className={`border-l-4 p-4 ${alertStyles[type]} mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {alertIcons[type]}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        <div>
          <button
            type="button"
            className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={handleClose}
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
