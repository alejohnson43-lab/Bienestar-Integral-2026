import React, { useEffect, useState } from 'react';
import { UserProfile, Dimension, AssessmentArea } from '../types';
import { generateDailyTip } from '../services/gemini';
import { EncryptedStorage } from '../utils/storage';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (page: string) => void;
  onUpdateUser?: (updates: Partial<UserProfile>) => void;
  encryptionKey?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onUpdateUser, encryptionKey }) => {
  const [dailyTip, setDailyTip] = useState<string>("Cargando...");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [assessmentData, setAssessmentData] = useState<AssessmentArea[]>([]);

  useEffect(() => {
    if (encryptionKey) {
      const saved = EncryptedStorage.getItem('bi_user_evaluation', encryptionKey);
      if (saved) setAssessmentData(saved);
    }
  }, [encryptionKey]);

  // Load counters
  const [streakCount, setStreakCount] = useState(0);
  const [weekCount, setWeekCount] = useState(1);
  const [medalCount, setMedalCount] = useState(0);

  useEffect(() => {
    if (encryptionKey) {
      const streak = EncryptedStorage.getItem('bi_streak_count', encryptionKey) || 0;
      const week = EncryptedStorage.getItem('bi_week_count', encryptionKey) || 1;
      setStreakCount(streak);
      setWeekCount(week);

      // Load medals dynamically
      const passportHabits = EncryptedStorage.getItem('bi_passport_habits', encryptionKey) || [];
      const completedCount = passportHabits.filter((h: any) => h.status === 'Cumplido').length;
      setMedalCount(completedCount);
    }
  }, [encryptionKey]);

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await generateDailyTip(user.name, "mindfulness");
      setDailyTip(tip);
    };
    fetchTip();
  }, [user.name]);

  const saveName = () => {
    if (editName.trim() && onUpdateUser) {
      onUpdateUser({ name: editName });
      setIsEditing(false);
    }
  };

  const getDimensionProgress = (dimension: Dimension) => {
    const dimensionAreas = assessmentData.filter(a => a.dimension === dimension);
    if (dimensionAreas.length === 0) return 0;
    const totalScore = dimensionAreas.reduce((sum, a) => sum + (a.score || 0), 0);
    const maxScore = dimensionAreas.length * 3;
    return Math.round((totalScore / maxScore) * 100);
  };

  const mindProgress = getDimensionProgress(Dimension.Mind);
  const bodyProgress = getDimensionProgress(Dimension.Body);
  const spiritProgress = getDimensionProgress(Dimension.Spirit);
  const totalProgress = Math.round((mindProgress + bodyProgress + spiritProgress) / 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días,";
    if (hour >= 12 && hour < 20) return "Buenas tardes,";
    return "Buenas noches,";
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-10">
      {/* Top Section: Hero + Progress + Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left: Intro & Tip (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-6 group">
          <div>
            <h1 className="text-slate-900 dark:text-white text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 flex flex-col gap-2">
              <span>{getGreeting()}</span>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-lg px-2 py-1 text-primary w-full max-w-xs focus:outline-none focus:border-primary text-4xl"
                    autoFocus
                  />
                  <button onClick={saveName} className="p-2 bg-primary rounded-full text-background-dark hover:bg-white transition-colors">
                    <span className="material-symbols-outlined text-xl">check</span>
                  </button>
                </div>
              ) : (
                <span className="text-primary flex items-center gap-3">
                  {user.name}
                  <button
                    onClick={() => {
                      setEditName(user.name);
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                    title="Editar nombre"
                  >
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white text-2xl">edit</span>
                  </button>
                  <button
                    onClick={() => onNavigate('personalize')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                    title="Personalizar experiencia"
                  >
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white text-2xl">tune</span>
                  </button>
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-light leading-relaxed">
              Tu camino hacia la coherencia continúa. Recuerda: progreso, no perfección.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 px-5 py-4 bg-primary/10 dark:bg-[#192b26] rounded-2xl w-fit border border-primary/20 dark:border-surface-highlight/50">
            <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Tip del día: {dailyTip === "Cargando..." ? "Respira 3 veces antes de reaccionar." : dailyTip}
            </p>
          </div>
        </div>

        {/* Middle: Circle (Col Span 3) */}
        <div className="lg:col-span-4 flex items-center justify-center relative py-4 lg:py-0">
          {/* Custom Donut Chart */}
          <div className="relative size-64 xl:size-72">
            {/* Background Circle */}
            <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle className="text-gray-200 dark:text-surface-highlight" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="6"></circle>
              {/* Progress Circle */}
              <circle className="text-primary transition-all duration-1000 ease-out" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeDasharray="263.89" strokeDashoffset={263.89 - (263.89 * totalProgress / 100)} strokeLinecap="round" strokeWidth="6"></circle>
            </svg>
            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-surface-dark/50 rounded-full m-4 backdrop-blur-sm shadow-2xl">
              <span className="text-5xl font-black text-slate-900 dark:text-white">{totalProgress}%</span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mt-2">Progreso del viaje</span>
            </div>
          </div>
        </div>

        {/* Right: Stats Stack (Col Span 4) */}
        <div className="lg:col-span-3 flex flex-col gap-4 justify-center">
          {/* Card 1 */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/30 transition-all group shadow-sm dark:shadow-none">
            <div className="size-12 rounded-full bg-orange-50 dark:bg-[#233630] flex items-center justify-center text-orange-500 dark:text-orange-400">
              <span className="material-symbols-outlined text-2xl filled">local_fire_department</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Racha Actual</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white text-xl font-bold">{streakCount} Semanas</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/30 transition-all group shadow-sm dark:shadow-none">
            <div className="size-12 rounded-full bg-primary/10 dark:bg-[#233630] flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl filled">accessibility_new</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Semana Actual</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white text-xl font-bold">Semana {weekCount}</span>
              </div>
            </div>
          </div>

          {/* Card 3 - Logros (Clickable) */}
          <button onClick={() => onNavigate('achievements')} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-[#1a2522] transition-all group w-full text-left relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="size-12 rounded-full bg-yellow-50 dark:bg-[#233630] flex items-center justify-center text-yellow-500 dark:text-yellow-400">
              <span className="material-symbols-outlined text-2xl filled">emoji_events</span>
            </div>
            <div className="flex-1 z-10">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Logros</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white text-xl font-bold">{medalCount} Medallas</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 group-hover:text-primary transition-colors text-lg">arrow_forward_ios</span>
          </button>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acciones Rápidas</h2>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <button onClick={() => onNavigate('assessment')} className="group flex flex-col p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#1a352f] transition-all text-left h-48 justify-between relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl text-slate-900 dark:text-white">monitor_heart</span>
            </div>
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="size-12 rounded-xl bg-red-50 dark:bg-[#2a1e1e] flex items-center justify-center text-red-500 dark:text-red-400">
                <span className="material-symbols-outlined">monitor_heart</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">arrow_forward</span>
            </div>
            <div className="relative z-10">
              <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-1 leading-tight">Evaluación de Bienestar</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Estado real: {totalProgress}%</p>
            </div>
          </button>

          {/* Card 2 */}
          <button onClick={() => onNavigate('weekly')} className="group flex flex-col p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#1a352f] transition-all text-left h-48 justify-between relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl text-slate-900 dark:text-white">calendar_month</span>
            </div>
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="size-12 rounded-xl bg-yellow-50 dark:bg-[#2a261a] flex items-center justify-center text-yellow-500 dark:text-yellow-400">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">arrow_forward</span>
            </div>
            <div className="relative z-10">
              <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-1 leading-tight">Plan Semanal</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Próximos pasos.</p>
            </div>
          </button>

          {/* Card 3 */}
          <button onClick={() => onNavigate('stats')} className="group flex flex-col p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#1a352f] transition-all text-left h-48 justify-between relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl text-slate-900 dark:text-white">bar_chart</span>
            </div>
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="size-12 rounded-xl bg-blue-50 dark:bg-[#1a252a] flex items-center justify-center text-blue-500 dark:text-blue-400">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">arrow_forward</span>
            </div>
            <div className="relative z-10">
              <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-1 leading-tight">Estadísticas</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Analiza tu progreso.</p>
            </div>
          </button>

          {/* Card 4 */}
          <button onClick={() => onNavigate('habits')} className="group flex flex-col p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#1a352f] transition-all text-left h-48 justify-between relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-9xl text-slate-900 dark:text-white">check_circle</span>
            </div>
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="size-12 rounded-xl bg-emerald-50 dark:bg-[#1a2a24] flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">arrow_forward</span>
            </div>
            <div className="relative z-10">
              <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-1 leading-tight">Pasaporte de Hábitos</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Lista de Chequeo.</p>
            </div>
          </button>
        </div>
      </section>
      {/* Dimensions Status */}
      <section className="rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight p-8 relative overflow-hidden shadow-sm dark:shadow-none">
        {/* Background Gradient */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Estado por Dimensión</h3>
              <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl">
                El equilibrio es clave. Observa cómo tus esfuerzos se distribuyen entre mente, cuerpo y espíritu.
              </p>
            </div>
            <button onClick={() => onNavigate('stats')} className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-[#233630] hover:bg-gray-200 dark:hover:bg-surface-highlight text-slate-900 dark:text-white text-sm font-bold transition-all border border-gray-200 dark:border-surface-highlight">
              Ver Detalles
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-4">
            {/* Cuerpo */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-slate-900 dark:text-white mb-1">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">accessibility_new</span>
                  <span className="font-bold">Cuerpo</span>
                </div>
                <span className="text-primary font-bold text-lg">{bodyProgress}%</span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-[#1a2b26] rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${bodyProgress}%` }}></div>
              </div>
            </div>

            {/* Mente */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-slate-900 dark:text-white mb-1">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500 dark:text-blue-400">psychology</span>
                  <span className="font-bold">Mente</span>
                </div>
                <span className="text-blue-500 dark:text-blue-400 font-bold text-lg">{mindProgress}%</span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-[#1a252a] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${mindProgress}%` }}></div>
              </div>
            </div>

            {/* Espíritu */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-slate-900 dark:text-white mb-1">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-500 dark:text-purple-400">self_improvement</span>
                  <span className="font-bold">Espíritu</span>
                </div>
                <span className="text-purple-500 dark:text-purple-400 font-bold text-lg">{spiritProgress}%</span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-[#251a2a] rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all duration-500" style={{ width: `${spiritProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
