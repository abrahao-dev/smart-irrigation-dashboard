import React from 'react';

const StatusCard = ({ title, value, icon, status = 'normal', statusText }) => {
  // Define status colors
  const statusColors = {
    normal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 transition-all hover:shadow-lg">
      <div className="flex justify-between">
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          
          {statusText && (
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[status]}`}>
              {statusText}
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
