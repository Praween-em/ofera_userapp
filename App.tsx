import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import NotificationService from './src/services/NotificationService';

function App() {
  React.useEffect(() => {
    NotificationService.requestUserPermission();
    NotificationService.setupNotificationListeners();
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <SafeAreaProvider>
          <Navigation />
        </SafeAreaProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
