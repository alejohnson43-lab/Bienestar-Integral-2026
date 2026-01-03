import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Dimension } from '../types';
import { EncryptedStorage } from '../utils/storage';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onUpdateUser?: (updates: Partial<UserProfile>) => void;
  onAdminImport?: (data: any[]) => void;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  encryptionKey?: string;
  onReset?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activePage, onNavigate, onLogout, onUpdateUser, onAdminImport, currentTheme, onThemeChange, encryptionKey, onReset }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const [desktopSettingsOpen, setDesktopSettingsOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userImportRef = useRef<HTMLInputElement>(null); // User backup import

  // Notifications Logic
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Check if there are unread notifications
    const readStatus = EncryptedStorage.getItem('bi_notifications_read', encryptionKey || '');
    if (readStatus !== 'true') {
      setHasUnread(true);
    }
  }, [encryptionKey, notifications.length]); // Re-check if notifications change
  useEffect(() => {
    if (notificationsOpen) {
      // Generate smart notifications based on current state
      const newNotifs = [];

      // 1. Welcome
      newNotifs.push({
        id: 'welcome',
        icon: 'waving_hand',
        color: 'text-yellow-500',
        title: '¡Bienvenido de nuevo!',
        desc: 'Tu viaje hacia el bienestar continúa.',
        time: 'Ahora'
      });

      // 2. Streak/Profile/Level logic requires context not available here directly or props
      // We will perform a simple read from storage or props since user prop is available

      if (user.streak && user.streak > 0) {
        newNotifs.push({
          id: 'streak',
          icon: 'local_fire_department',
          color: 'text-orange-500',
          title: 'Racha Activa',
          desc: `¡Has mantenido tu racha por ${user.streak} semanas!`,
          time: 'Hace 1h'
        });
      }

      newNotifs.push({
        id: 'level',
        icon: 'hotel_class',
        color: 'text-primary',
        title: 'Nivel Actual',
        desc: `Estás en el rango de ${user.level}.`,
        time: 'Hace 2h'
      });

      setNotifications(newNotifs);
    }
  }, [notificationsOpen, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1280) { // xl breakpoint
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  const handleExport = () => {
    if (!encryptionKey) {
      alert("No se puede exportar: Sesión no segura.");
      return;
    }

    try {
      const exportData = {
        user: EncryptedStorage.getItem('bi_user', encryptionKey),
        habits: EncryptedStorage.getItem('bi_passport_habits', encryptionKey) || [],
        weekly: EncryptedStorage.getItem('bi_weekly_habits', encryptionKey) || [],
        tasks: EncryptedStorage.getItem('bi_daily_tasks', encryptionKey) || [],
        evaluation: EncryptedStorage.getItem('bi_user_evaluation', encryptionKey) || [],
        masterData: EncryptedStorage.getItem('bi_master_data', encryptionKey) || [],
        counters: {
          streak: EncryptedStorage.getItem('bi_streak_count', encryptionKey),
          week: EncryptedStorage.getItem('bi_week_count', encryptionKey),
          enabled_plan: EncryptedStorage.getItem('bi_plan_diario_enabled', encryptionKey),
          locked_assessment: EncryptedStorage.getItem('bi_assessment_locked', encryptionKey),
          submitted: EncryptedStorage.getItem('bi_has_submitted', encryptionKey)
        },
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bienestar-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error al exportar datos.");
    }
  };

  const handleUserImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && encryptionKey && onUpdateUser) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);

          // Basic validation
          if (!json.user || !json.timestamp) {
            throw new Error("Formato de archivo inválido");
          }

          if (!window.confirm(`¿Estás seguro de restaurar este respaldo del ${json.timestamp}? Se sobrescribirán tus datos actuales.`)) {
            return;
          }

          // Restore data
          if (json.user) EncryptedStorage.setItem('bi_user', json.user, encryptionKey);
          if (json.habits) EncryptedStorage.setItem('bi_passport_habits', json.habits, encryptionKey);
          if (json.weekly) EncryptedStorage.setItem('bi_weekly_habits', json.weekly, encryptionKey);
          if (json.tasks) EncryptedStorage.setItem('bi_daily_tasks', json.tasks, encryptionKey);
          if (json.evaluation) EncryptedStorage.setItem('bi_user_evaluation', json.evaluation, encryptionKey);
          if (json.masterData) EncryptedStorage.setItem('bi_master_data', json.masterData, encryptionKey);

          if (json.counters) {
            if (json.counters.streak !== undefined) EncryptedStorage.setItem('bi_streak_count', json.counters.streak, encryptionKey);
            if (json.counters.week !== undefined) EncryptedStorage.setItem('bi_week_count', json.counters.week, encryptionKey);
            if (json.counters.enabled_plan !== undefined) EncryptedStorage.setItem('bi_plan_diario_enabled', json.counters.enabled_plan, encryptionKey);
            if (json.counters.locked_assessment !== undefined) EncryptedStorage.setItem('bi_assessment_locked', json.counters.locked_assessment, encryptionKey);
            if (json.counters.submitted !== undefined) EncryptedStorage.setItem('bi_has_submitted', json.counters.submitted, encryptionKey);
          }

          alert("Respaldo restaurado con éxito. La aplicación se reiniciará.");
          window.location.reload();

        } catch (error) {
          console.error("Import error:", error);
          alert("Error al importar el archivo. Asegúrate de que es un respaldo válido.");
        }
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };




  const handleResetClick = () => {
    if (!onReset) return;

    if (window.confirm("⚠️ ¿PELIGRO: Estás seguro de BORRAR TODO tu historial?\n\nEsta acción eliminará permanentemente tu perfil, medallas, progreso semanal y configuraciones.\n\nNo se puede deshacer.")) {
      if (window.confirm("¿Segurísimo? Esta es tu última oportunidad para cancelar.")) {
        onReset();
        window.location.reload();
      }
    }
  };



  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'daily', label: 'Plan Diario', icon: 'today' },
    { id: 'weekly', label: 'Plan Semanal', icon: 'calendar_month' },
    { id: 'assessment', label: 'Evaluación', icon: 'monitor_heart' },
    { id: 'habits', label: 'Pasaporte de Hábitos', icon: 'check_circle' },
    { id: 'stats', label: 'Estadísticas', icon: 'bar_chart' },
    { id: 'achievements', label: 'Logros', icon: 'emoji_events' },
  ];

  const handleOpenApiKey = () => {
    const current = localStorage.getItem('bi_api_key') || '';
    setTempApiKey(current);
    setApiKeyModalOpen(true);
    setSettingsOpen(false); // mobile/desktop dropdowns
    setMobileMenuOpen(false);
    setDesktopSettingsOpen(false);
    setMobileSettingsOpen(false);
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('bi_api_key', tempApiKey.trim());
      alert("Clave guardada correctamente. recarga la página para asegurar que se use.");
      window.location.reload();
    } else {
      localStorage.removeItem('bi_api_key');
      alert("Clave eliminada. Se usará la configuración por defecto (si existe) o modo offline.");
      window.location.reload();
    }
    setApiKeyModalOpen(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="opacity-0 pointer-events-none absolute"
        accept="image/*"
        onChange={handleFileChange}
      />

      <input
        type="file"
        ref={userImportRef}
        className="opacity-0 pointer-events-none absolute"
        accept=".json"
        onChange={handleUserImport}
      />
      {/* Sidebar - Desktop (xl and up) */}
      <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-surface-highlight h-full flex-shrink-0 z-20 transition-all duration-300">
        <div className="p-6 flex flex-col gap-8 h-full">
          <div className="flex gap-4 items-center group">
            <div
              className="relative bg-center bg-no-repeat bg-cover rounded-full size-12 shrink-0 border-2 border-primary cursor-pointer hover:opacity-90 transition-all"
              style={{ backgroundImage: `url("${user.avatarUrl || 'https://picsum.photos/seed/user/200'}")` }}
              onClick={handleAvatarClick}
              title="Cambiar foto de perfil"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                <span className="material-symbols-outlined text-white text-xs">edit</span>
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-slate-900 dark:text-white text-base font-bold truncate">{user.name}</h1>
              <p className="text-teal-600 dark:text-text-secondary text-xs font-normal truncate">Nivel: {user.level}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === item.id
                  ? 'bg-primary/10 dark:bg-surface-highlight text-primary dark:text-white font-bold shadow-sm dark:shadow-lg dark:shadow-black/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-highlight/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <span className={`material-symbols-outlined ${activePage === item.id ? 'text-primary' : ''}`}>
                  {item.icon}
                </span>
                <p className="text-sm">{item.label}</p>
              </button>
            ))}

            <div className="my-2 border-t border-gray-100 dark:border-surface-highlight/50"></div>

            {/* Desktop Settings Section */}
            <div className="flex flex-col">
              <button
                onClick={() => setDesktopSettingsOpen(!desktopSettingsOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${desktopSettingsOpen
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-highlight/30 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">settings</span>
                  <p className="text-sm">Configuración</p>
                </div>
                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${desktopSettingsOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {desktopSettingsOpen && (
                <div className="flex flex-col gap-1 pl-4 animate-fade-in">
                  <button
                    onClick={handleOpenApiKey}
                    className="flex items-center gap-3 px-4 py-2 text-left text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors">
                    <span className="material-symbols-outlined text-base">psychology</span>
                    Configurar IA
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-3 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">upload</span>
                    Exportar datos
                  </button>
                  <button
                    onClick={() => userImportRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">download</span>
                    Importar datos
                  </button>
                  <button
                    onClick={handleResetClick}
                    className="flex items-center gap-3 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">restart_alt</span>
                    Reiniciar historial
                  </button>
                  <button
                    onClick={() => { onThemeChange('light'); }}
                    className={`flex items-center gap-3 px-4 py-2 text-left text-xs font-medium transition-colors ${currentTheme === 'light' ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-base">light_mode</span>
                    Tema Claro
                  </button>
                  <button
                    onClick={() => { onThemeChange('dark'); }}
                    className={`flex items-center gap-3 px-4 py-2 text-left text-xs font-medium transition-colors ${currentTheme === 'dark' ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-base">dark_mode</span>
                    Tema Oscuro
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-surface-highlight">
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl h-12 px-4 bg-gray-100 dark:bg-surface-highlight hover:bg-red-50 dark:hover:bg-[#32675a] text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-white transition text-sm font-bold"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 xl:hidden flex animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-white dark:bg-surface-dark h-full p-6 flex flex-col gap-6 animate-slide-up sm:animate-none sm:animate-fade-in sm:translate-x-0 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center bg-white dark:bg-surface-dark sticky top-0 z-10 pb-2 border-b border-gray-100 dark:border-surface-highlight/50">
              <span className="text-xl font-bold text-slate-900 dark:text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><span className="material-symbols-outlined text-slate-900 dark:text-white">close</span></button>
            </div>

            {/* Mobile User Profile Section */}
            <div className="flex gap-4 items-center pb-2">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-12 shrink-0 border-2 border-primary cursor-pointer active:opacity-80 transition-opacity relative group"
                style={{ backgroundImage: `url("${user.avatarUrl || 'https://picsum.photos/seed/user/200'}")` }}
                onClick={handleAvatarClick}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-active:opacity-100 rounded-full transition-opacity">
                   <span className="material-symbols-outlined text-white text-[10px]">edit</span>
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <h1 className="text-slate-900 dark:text-white text-base font-bold truncate">{user.name}</h1>
                <p className="text-teal-600 dark:text-text-secondary text-xs font-normal truncate">Nivel: {user.level}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === item.id
                    ? 'bg-primary/10 dark:bg-surface-highlight text-primary dark:text-white font-bold'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                  <span className={`material-symbols-outlined ${activePage === item.id ? 'text-primary' : ''}`}>
                    {item.icon}
                  </span>
                  <p className="text-sm">{item.label}</p>
                </button>
              ))}

              <div className="my-2 border-t border-gray-100 dark:border-surface-highlight/50"></div>

              {/* Mobile Settings Section */}
              <div className="flex flex-col">
                <button
                  onClick={() => setMobileSettingsOpen(!mobileSettingsOpen)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${mobileSettingsOpen
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-highlight/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">settings</span>
                    <p className="text-sm">Configuración</p>
                  </div>
                  <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${mobileSettingsOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {mobileSettingsOpen && (
                  <div className="flex flex-col gap-1 pl-4 animate-fade-in">
                    <button
                      onClick={handleOpenApiKey}
                      className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors">
                      <span className="material-symbols-outlined text-lg">psychology</span>
                      Configurar IA
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">upload</span>
                      Exportar datos
                    </button>
                    <button
                      onClick={() => userImportRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">download</span>
                      Importar datos
                    </button>
                    <button
                      onClick={handleResetClick}
                      className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">restart_alt</span>
                      Reiniciar historial
                    </button>
                    <button
                      onClick={() => { onThemeChange('light'); }}
                      className={`flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${currentTheme === 'light' ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined text-lg">light_mode</span>
                      Tema Claro
                    </button>
                    <button
                      onClick={() => { onThemeChange('dark'); }}
                      className={`flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${currentTheme === 'dark' ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined text-lg">dark_mode</span>
                      Tema Oscuro
                    </button>
                  </div>
                )}
              </div>
            </nav>

            <button onClick={onLogout} className="mt-auto flex items-center justify-center gap-2 rounded-xl h-12 px-4 bg-gray-100 dark:bg-surface-highlight hover:bg-red-50 dark:hover:bg-[#32675a] text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-white transition text-sm font-bold w-full">
              <span className="material-symbols-outlined">logout</span> Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-surface-highlight px-4 md:px-8 py-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4 text-slate-900 dark:text-white">
            <div className="xl:hidden">
              <button onClick={() => setMobileMenuOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-[#00A57C] flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                <span className="text-white font-black text-sm tracking-tight leading-none">BI</span>
              </div>
              <span className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">Bienestar Integral</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">


              {/* Configuración Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1 ${settingsOpen ? 'text-primary dark:text-white' : ''}`}
                >
                  Configuración
                  <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 top-full mt-4 w-60 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col py-2 animate-fade-in origin-top-right ring-1 ring-black/5">
                    <button
                      onClick={handleOpenApiKey}
                      className="flex items-center gap-3 px-4 py-3 text-left text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-surface-highlight hover:text-purple-800 dark:hover:text-purple-200 transition-colors group">
                      <span className="material-symbols-outlined text-lg group-hover:text-purple-500 transition-colors">psychology</span>
                      Configurar IA (Gemini)
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors group">
                      <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">upload</span>
                      Exportar datos
                    </button>
                    <button
                      onClick={() => userImportRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors group">
                      <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">download</span>
                      Importar datos
                    </button>
                    <button
                      onClick={handleResetClick}
                      className="flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors border-b border-gray-100 dark:border-surface-highlight/50 mb-1 group">
                      <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">restart_alt</span>
                      Reiniciar historial
                    </button>
                    <button
                      onClick={() => { onThemeChange('light'); setSettingsOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors group ${currentTheme === 'light' ? 'text-primary' : 'text-gray-500 dark:text-gray-300'}`}
                    >
                      <span className="material-symbols-outlined text-lg group-hover:text-yellow-400 transition-colors">light_mode</span>
                      Tema Claro
                    </button>

                    <button
                      onClick={() => { onThemeChange('dark'); setSettingsOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors group ${currentTheme === 'dark' ? 'text-primary' : 'text-gray-500 dark:text-gray-300'}`}
                    >
                      <span className="material-symbols-outlined text-lg group-hover:text-blue-400 transition-colors">dark_mode</span>
                      Tema Oscuro
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) {
                    // Mark as read immediately on open (optional, or wait for explicit click)
                    // For now, let's keep the red dot until "Mark as read" is clicked or simply viewing them clears it?
                    // User behavior preference: usually viewing clears the dot.
                    // Let's make viewing clear the notification dot.
                    if (notifications.length > 0) {
                      EncryptedStorage.setItem('bi_notifications_read', 'true', encryptionKey || '');
                      setHasUnread(false);
                    }
                  }
                }}
                className={`relative text-gray-500 dark:text-white hover:text-primary transition-colors ${notificationsOpen ? 'text-primary' : ''}`}
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {hasUnread && (
                  <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-4 w-80 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-fade-in origin-top-right ring-1 ring-black/5">
                    <div className="p-4 border-b border-gray-100 dark:border-surface-highlight flex justify-between items-center bg-gray-50/50 dark:bg-surface-highlight/20">
                      <h3 className="font-bold text-slate-900 dark:text-white">Notificaciones</h3>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{notifications.length} nuevas</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-gray-50 dark:border-surface-highlight/50 hover:bg-gray-50 dark:hover:bg-surface-highlight/30 transition-colors flex gap-3">
                          <div className={`mt-1 size-8 rounded-full bg-gray-100 dark:bg-surface-highlight flex items-center justify-center shrink-0 ${notif.color}`}>
                            <span className="material-symbols-outlined text-lg">{notif.icon}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{notif.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mb-2">{notif.desc}</p>
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{notif.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => {
                      setNotificationsOpen(false);
                      EncryptedStorage.setItem('bi_notifications_read', 'true', encryptionKey || '');
                      setHasUnread(false);
                    }} className="p-3 text-center text-xs font-bold text-primary hover:bg-gray-50 dark:hover:bg-surface-highlight transition-colors">
                      Marcar todo como leído
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
          <div className="max-w-[1400px] mx-auto min-h-full pb-20">
            {children}
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      {
        apiKeyModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-gray-100 dark:border-surface-highlight">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurar IA</h3>
                </div>
                <button
                  onClick={() => setApiKeyModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Para activar los consejos inteligentes y el chat con Aura, necesitas tu propia clave de Google Gemini.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200 flex gap-2">
                    <span className="material-symbols-outlined text-sm shrink-0">info</span>
                    <span>Es <strong>gratis</strong> y privado. La clave se guarda solo en tu dispositivo.</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Tu Clave (API Key)
                  </label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-sm"
                  />
                </div>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Obtener mi clave gratis en Google AI Studio
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setApiKeyModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Layout;