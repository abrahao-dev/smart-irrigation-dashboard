import { useAuth } from '../context/AuthContext';
import { FaSun, FaMoon, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-primary-600 dark:text-primary-400 text-xl font-bold">Irrigation</span>
            <span className="text-secondary-600 dark:text-secondary-400 text-xl font-bold">Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:inline-block">
                  Olá, {user.name}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Sair"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
