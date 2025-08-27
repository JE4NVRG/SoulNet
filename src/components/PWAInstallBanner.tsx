import React from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAInstallBanner: React.FC = () => {
  const { showInstallBanner, installApp, dismissInstallBanner } = usePWAInstall();

  if (!showInstallBanner) return null;

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      // Show success message or handle success
      console.log('PWA installed successfully!');
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <Smartphone className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Instale o SoulNet no seu dispositivo
            </p>
            <p className="text-xs opacity-90 hidden sm:block">
              Acesse suas memórias offline e receba notificações
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleInstall}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 backdrop-blur-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Instalar</span>
          </button>
          
          <button
            onClick={dismissInstallBanner}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
            aria-label="Fechar banner de instalação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;