import React, { useState, useEffect } from 'react';
import { Dimension, HabitStatus } from '../types';
import { getLevelTitle, getLevelImage } from '../utils/levels';
import { generateMotivationalQuote } from '../services/gemini';
import { EncryptedStorage } from '../utils/storage';

interface Badge {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  dimension: Dimension | 'General';
  isLocked: boolean;
  color: string;
  description?: string;
}

const Logros: React.FC<{ encryptionKey: string }> = ({ encryptionKey }) => {
  const [filter, setFilter] = useState('Todas');
  const [dailyMessage, setDailyMessage] = useState("La constancia es el puente entre tus metas y tus logros.");

  // Stats State
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalMedals, setTotalMedals] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [nextMilestone, setNextMilestone] = useState({ title: 'Cargando...', target: 10, current: 0 });

  useEffect(() => {
    const fetchQuote = async () => {
      // Only fetch if not already set (or could strictly rely on gemini)
      const quote = await generateMotivationalQuote();
      setDailyMessage(quote);
    };
    fetchQuote();
  }, []);

  useEffect(() => {
    if (encryptionKey) {
      loadUserData();
    }
  }, [encryptionKey]);

  const loadUserData = () => {
    // 1. Load basic stats
    const currentStreak = EncryptedStorage.getItem('bi_streak_count', encryptionKey) || 0;
    const currentWeek = EncryptedStorage.getItem('bi_week_count', encryptionKey) || 1;

    setStreak(currentStreak);
    setLevel(currentWeek);

    // 2. Load History for Medals & Activity
    const passportHabits = EncryptedStorage.getItem('bi_passport_habits', encryptionKey) || [];
    const completedHabits = passportHabits.filter((h: any) => h.status === 'Cumplido');

    setTotalMedals(completedHabits.length);

    // 3. Process Recent Activity (Last 4 completed)
    // Sort by absolute date if possible, or just take the most recent from end of array
    // Assuming passportHabits appends new items at the end
    const activity = [...completedHabits].reverse().slice(0, 4).map((h: any) => ({
      title: h.title,
      time: new Date(h.dateAdded || Date.now()).toLocaleDateString(), // Simplified relative time
      dimension: h.dimension,
      type: 'habit'
    }));
    setRecentActivity(activity);

    // 4. Calculate Badges
    calculateBadges(currentStreak, completedHabits, currentWeek);

    // 5. Calculate Next Milestone
    calculateMilestone(completedHabits.length);
  };

  const calculateBadges = (streakVal: number, completedHabits: any[], weekVal: number) => {
    // Helper to count per dimension
    const countByDim = (dim: Dimension) => completedHabits.filter((h: any) => h.dimension === dim).length;

    const mindCount = countByDim(Dimension.Mind);
    const bodyCount = countByDim(Dimension.Body);
    const spiritCount = countByDim(Dimension.Spirit);
    const totalCount = completedHabits.length;

    const newBadges: Badge[] = [
      {
        id: '1',
        title: 'Primer Paso',
        subtitle: '1er Hábito Cumplido',
        icon: 'footprint',
        dimension: 'General',
        isLocked: totalCount < 1,
        color: 'text-emerald-500'
      },
      {
        id: '2',
        title: 'Mente Despierta',
        subtitle: '5 Hábitos Mentales',
        icon: 'psychology',
        dimension: Dimension.Mind,
        isLocked: mindCount < 5,
        color: 'text-blue-500'
      },
      {
        id: '3',
        title: 'Cuerpo Activo',
        subtitle: '5 Hábitos Físicos',
        icon: 'directions_run',
        dimension: Dimension.Body,
        isLocked: bodyCount < 5,
        color: 'text-red-500'
      },
      {
        id: '4',
        title: 'Espíritu Conectado',
        subtitle: '5 Hábitos Espirituales',
        icon: 'self_improvement',
        dimension: Dimension.Spirit,
        isLocked: spiritCount < 5,
        color: 'text-purple-500'
      },
      {
        id: '5',
        title: 'Constancia Pura',
        subtitle: 'Racha de 4 Semanas',
        icon: 'local_fire_department',
        dimension: 'General',
        isLocked: streakVal < 4,
        color: 'text-orange-500'
      },
      {
        id: '6',
        title: 'Coleccionista',
        subtitle: '20 Hábitos Totales',
        icon: 'stars',
        dimension: 'General',
        isLocked: totalCount < 20,
        color: 'text-yellow-500'
      },
      {
        id: '7',
        title: 'Leyenda',
        subtitle: '50 Hábitos Totales',
        icon: 'trophy',
        dimension: 'General',
        isLocked: totalCount < 50,
        color: 'text-indigo-500'
      },
      {
        id: '8',
        title: 'Veterano',
        subtitle: 'Nivel 10 Alcanzado',
        icon: 'military_tech',
        dimension: 'General',
        isLocked: weekVal < 10,
        color: 'text-slate-600 dark:text-slate-300'
      }
    ];

    setBadges(newBadges);
  };

  const calculateMilestone = (total: number) => {
    // Simple milestones: 10, 25, 50, 100
    let target = 10;
    let title = "Iniciado";

    if (total >= 10) { target = 25; title = "Aprendiz"; }
    if (total >= 25) { target = 50; title = "Caminante"; }
    if (total >= 50) { target = 100; title = "Maestro"; }

    setNextMilestone({ title, target, current: total });
  };

  const filteredBadges = badges.filter(b => {
    if (filter === 'Todas') return true;
    return b.dimension === filter;
  });

  const getPercentage = () => {
    if (nextMilestone.target === 0) return 0;
    const pct = Math.min(100, Math.round((nextMilestone.current / nextMilestone.target) * 100));
    return pct;
  };

  const unlockedCount = badges.filter(b => !b.isLocked).length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Tu Viaje de Coherencia</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Celebra cada paso hacia tu equilibrio mente, cuerpo y espíritu.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm border border-primary/20">
          {unlockedCount} / {badges.length} Insignias Desbloqueadas
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Racha */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-gray-200/50 dark:shadow-black/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-lg">local_fire_department</span>
              RACHA ACTUAL
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-2">{streak} Semanas</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">¡Mantén el ritmo constante!</p>
          </div>
          <span className="material-symbols-outlined text-orange-500/10 dark:text-surface-highlight/30 text-[120px] absolute -right-6 -bottom-6 pointer-events-none">local_fire_department</span>
        </div>

        {/* Medallas (Total Habits) */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-gray-200/50 dark:shadow-black/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-lg">verified</span>
              MEDALLAS
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-2">{totalMedals}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Hábitos completados exitosamente. </p>
          </div>
          <span className="material-symbols-outlined text-yellow-500/10 dark:text-surface-highlight/30 text-[120px] absolute -right-6 -bottom-6 pointer-events-none">verified</span>
        </div>

        {/* Nivel */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-gray-200/50 dark:shadow-black/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-lg">psychology</span>
              NIVEL
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-2">{String(level).padStart(2, '0')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Basado en tus semanas activas.</p>
          </div>
          <span className="material-symbols-outlined text-purple-500/10 dark:text-surface-highlight/30 text-[120px] absolute -right-6 -bottom-6 pointer-events-none">psychology</span>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/20">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-4 relative z-10">
          <div className="flex gap-4">
            <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-[#1a352f] flex items-center justify-center border border-emerald-200 dark:border-surface-highlight shrink-0">
              <span className="material-symbols-outlined text-emerald-600 dark:text-primary text-3xl">flag</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Próximo Hito: {nextMilestone.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Completa {nextMilestone.target - nextMilestone.current} hábitos más para subir de rango.</p>
            </div>
          </div>
          <span className="text-emerald-700 dark:text-primary font-black text-2xl">{getPercentage()}%</span>
        </div>

        <div className="relative h-6 w-full bg-gray-100 dark:bg-[#11221e] rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full animate-fade-in transition-all duration-1000"
            style={{
              width: `${getPercentage()}%`,
              background: 'repeating-linear-gradient(45deg, #13ecb6, #13ecb6 10px, #0fae85 10px, #0fae85 20px)'
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          <span>{nextMilestone.current} Hábitos</span>
          <span>{nextMilestone.target} Hábitos</span>
        </div>
      </div>

      {/* Main Grid: Badges & Side Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Badges (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Insignias</h2>
            <div className="flex bg-gray-100 dark:bg-[#11221e] p-1 rounded-lg border border-gray-200 dark:border-surface-highlight">
              {['Todas', 'Mente', 'Cuerpo', 'Espíritu'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === f ? 'bg-white dark:bg-surface-highlight text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filteredBadges.map(badge => (
              <div key={badge.id} className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-surface-dark border ${badge.isLocked ? 'border-gray-100 dark:border-surface-highlight opacity-60' : 'border-gray-200 dark:border-surface-highlight hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-[#1a352f]'} transition-all aspect-square text-center group relative shadow-sm dark:shadow-none`}>
                {badge.isLocked && (
                  <div className="absolute top-3 right-3 size-6 rounded-full bg-gray-200 dark:bg-[#11221e] flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-gray-500">lock</span>
                  </div>
                )}
                <div className={`mb-4 ${badge.color}`}>
                  <span className={`material-symbols-outlined text-5xl ${badge.isLocked ? 'text-gray-300 dark:text-gray-600' : 'drop-shadow-[0_0_15px_rgba(19,236,182,0.3)]'}`}>{badge.icon}</span>
                </div>
                <h4 className={`font-bold text-sm mb-1 ${badge.isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-slate-900 dark:text-white'}`}>{badge.title}</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tree & Activity (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Tree Card - Visual Metaphor for Growth */}
          <div className="relative h-64 rounded-3xl overflow-hidden border border-gray-200 dark:border-surface-highlight group shadow-xl">
            <img
              src={getLevelImage(level)}
              alt="Tree of Growth"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            <div className="absolute bottom-4 left-4">
              <div className="bg-primary text-background-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 shadow-lg shadow-primary/20">
                Nivel {level}
              </div>
              <p className="text-white text-sm font-bold tracking-wider">
                {getLevelTitle(level).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Actividad Reciente</h3>
            </div>

            <div className="flex flex-col gap-6 relative">
              {/* Vertical Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-surface-highlight"></div>

              {recentActivity.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">No hay actividad reciente aún.</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-4 relative">
                    <div className={`size-4 rounded-full ring-4 ring-white dark:ring-surface-dark shrink-0 z-10 ${activity.dimension === Dimension.Mind ? 'bg-blue-400' :
                      activity.dimension === Dimension.Body ? 'bg-red-400' : 'bg-purple-400'
                      }`}></div>
                    <div>
                      <p className="text-slate-900 dark:text-white text-sm font-bold leading-none mb-1">{activity.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Completado: {activity.time}</p>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          {/* Quote */}
          <div className="relative pt-6 border-t border-gray-200 dark:border-surface-highlight px-4">
            <span className="material-symbols-outlined text-4xl text-gray-200 dark:text-surface-highlight absolute top-2 left-0 -translate-y-1/2 bg-white dark:bg-background-dark px-2">format_quote</span>
            <p className="text-gray-600 dark:text-gray-300 text-sm italic font-medium leading-relaxed mb-2 text-center">
              "{dailyMessage}"
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs text-center">— Mensaje del día</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Logros;
