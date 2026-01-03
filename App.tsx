
import React, { useState, useEffect } from 'react'; // Force Rebuild
import { GlobalErrorBoundary as ErrorBoundary } from '@/components/GlobalErrorBoundary.tsx';
import Layout from '@/components/Layout.tsx';
import Dashboard from '@/pages/Dashboard.tsx';
import Onboarding from '@/pages/Onboarding.tsx';
import Login from '@/pages/Login.tsx';
import Welcome from '@/pages/Welcome.tsx';
import Assessment from '@/pages/Assessment.tsx';
import PlanSemanal from '@/pages/PlanSemanal.tsx';
import PlanDiario from '@/pages/PlanDiario.tsx';
import PasaporteHabitos from '@/pages/PasaporteHabitos.tsx';
import Estadisticas from '@/pages/Estadisticas.tsx';
import Logros from '@/pages/Logros.tsx';
import Personalizar from '@/pages/Personalizar.tsx';
import { UserProfile } from '@/types.ts';
import { EncryptedStorage } from '@/utils/storage.ts';
import { getLevelTitle } from '@/utils/levels.ts';

// Simple mocked user template
const MOCK_USER_TEMPLATE: UserProfile = {
  name: '',
  hasPin: true,
  level: 'Buscador',
  streak: 0,
  medals: 0,
  avatarUrl: undefined
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [hasEncryptedUser, setHasEncryptedUser] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check local storage for persistent auth
    const exists = EncryptedStorage.exists('bi_user');
    setHasEncryptedUser(exists);

    // Auto-login (simplified for this app context if needed, or just relying on manual login)
    // NOTE: In this app, we don't auto-login fully without PIN, but we could show the user name if we stored it non-encrypted? 
    // For now, we wait for login. But if we are already authenticated (e.g. dev mode or prev session), we should update level.


    // Check theme
    const savedTheme = localStorage.getItem('bi_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default dark
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('bi_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleOnboardingComplete = (name: string, pin: string) => {
    // Create new user
    const newUser: UserProfile = {
      ...MOCK_USER_TEMPLATE,
      name,
      hasPin: true,
      pin,
      streak: 1,
      medals: 0,
      level: getLevelTitle(1) // Start as Semilla (Week 1)
    };

    // Save securely
    EncryptedStorage.setItem('bi_user', newUser, pin);
    EncryptedStorage.setItem('bi_week_count', 1, pin); // Ensure week count is initialized

    // Update state
    setEncryptionKey(pin);
    setUser(newUser);
    setIsAuthenticated(true);
    setHasEncryptedUser(true);
  };

  const handleLogin = (enteredPin: string): boolean => {
    // Attempt to decrypt user
    const decryptedUser = EncryptedStorage.getItem('bi_user', enteredPin);

    if (decryptedUser) {
      setEncryptionKey(enteredPin);

      // Calculate dynamic level based on stored weeks
      const weekCount = EncryptedStorage.getItem('bi_week_count', enteredPin) || 1;
      const dynamicLevel = getLevelTitle(weekCount);

      setUser({ ...decryptedUser, level: dynamicLevel });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    if (user && encryptionKey) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      EncryptedStorage.setItem('bi_user', updatedUser, encryptionKey);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEncryptionKey(null);
    setUser(null);
    setActivePage('dashboard');
    // We do NOT clear storage. We just lock the door.
  };

  const handleClearData = () => {
    setIsAuthenticated(false);
    setEncryptionKey(null);
    setUser(null);
    setHasEncryptedUser(false);

    // Clear All Application Data
    EncryptedStorage.removeItem('bi_user');
    EncryptedStorage.removeItem('bi_daily_tasks');
    EncryptedStorage.removeItem('bi_weekly_habits');
    EncryptedStorage.removeItem('bi_passport_habits');
    EncryptedStorage.removeItem('bi_user_evaluation');
    EncryptedStorage.removeItem('bi_master_data');
    EncryptedStorage.removeItem('bi_streak_count');
    EncryptedStorage.removeItem('bi_week_count');
    EncryptedStorage.removeItem('bi_plan_diario_enabled');
    EncryptedStorage.removeItem('bi_assessment_locked');
    EncryptedStorage.removeItem('bi_has_submitted');

    // Attempt to clear everything to be safe
    localStorage.clear();
  };

  const handleAdminImport = (data: any[]) => {
    if (encryptionKey) {
      // Save habits master data
      EncryptedStorage.setItem('bi_master_data', data, encryptionKey);
      // We rely on Layout's reload to refresh the view
    }
  };

  if (showSplash) {
    return <Welcome onEnter={() => setShowSplash(false)} />;
  }

  // If authenticated, show the App
  if (isAuthenticated && user && encryptionKey) {
    const renderPage = () => {
      switch (activePage) {
        case 'dashboard':
          return <Dashboard user={user} onNavigate={setActivePage} onUpdateUser={handleUpdateUser} encryptionKey={encryptionKey} />;
        case 'assessment':
          return <Assessment encryptionKey={encryptionKey} onComplete={() => setActivePage('weekly')} />;
        case 'weekly':
          return <PlanSemanal encryptionKey={encryptionKey} onNavigate={setActivePage} />;
        case 'daily':
          return <PlanDiario user={user} encryptionKey={encryptionKey} onNavigate={setActivePage} />;
        case 'habits':
          return <PasaporteHabitos onNavigate={setActivePage} encryptionKey={encryptionKey} />;
        case 'stats':
          return <Estadisticas onNavigate={setActivePage} encryptionKey={encryptionKey} />;
        case 'achievements':
          return <Logros encryptionKey={encryptionKey} />;
        case 'personalize':
          return <Personalizar onNavigate={setActivePage} encryptionKey={encryptionKey} />;
        default:
          return <Dashboard user={user} onNavigate={setActivePage} />;
      }
    };

    return (
      <ErrorBoundary>
        <Layout
          user={user}
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          onAdminImport={handleAdminImport}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          encryptionKey={encryptionKey || undefined}
          onReset={handleClearData}
        >
          {renderPage()}
        </Layout>
      </ErrorBoundary>
    );
  }

  // Not authenticated
  if (hasEncryptedUser) {
    return (
      <Login
        onLogin={handleLogin}
        onClearData={handleClearData}
      />
    );
  }

  // No user found -> Onboarding
  return <Onboarding onComplete={handleOnboardingComplete} />;
};

export default App;