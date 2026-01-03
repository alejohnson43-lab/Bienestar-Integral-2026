import React, { useState, useEffect } from 'react';
import { Dimension, Habit, HabitStatus, AssessmentArea } from '../types';
import { EncryptedStorage } from '../utils/storage';
import defaultData from '../assessment_data.json';

const PlanSemanal: React.FC<{ encryptionKey: string; onNavigate?: (page: string) => void }> = ({ encryptionKey, onNavigate }) => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = EncryptedStorage.getItem('bi_weekly_habits', encryptionKey);
    return saved ? saved : [];
  });

  const [assessmentData, setAssessmentData] = useState<AssessmentArea[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [habitsModified, setHabitsModified] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [initialHabits, setInitialHabits] = useState<Habit[]>([]);
  const [planDiarioEnabled, setPlanDiarioEnabled] = useState(false);
  const [nuevoPlanEnabled, setNuevoPlanEnabled] = useState(false);
  const [maintainPlanEnabled, setMaintainPlanEnabled] = useState(false); // New state for "Mantener Plan"

  useEffect(() => {
    if (encryptionKey) {
      const evaluation = EncryptedStorage.getItem('bi_user_evaluation', encryptionKey);
      const master = EncryptedStorage.getItem('bi_master_data', encryptionKey);
      const streak = EncryptedStorage.getItem('bi_streak_count', encryptionKey) || 0;
      const diarioEnabled = EncryptedStorage.getItem('bi_plan_diario_enabled', encryptionKey) || false;
      const nuevoEnabled = EncryptedStorage.getItem('bi_nuevo_plan_enabled', encryptionKey) || false;

      if (evaluation) setAssessmentData(evaluation);
      setAssessmentData(evaluation || []);


      // Prioritize uploaded data (from Admin Update), fallback to local JSON
      if (master && Array.isArray(master) && master.length > 0) {
        console.log("📂 Loading Master Data from Storage (Admin Upload):", master.length, "items");
        setMasterData(master);
      } else {
        console.log("📂 Loading Master Data from local JSON (Default):", defaultData.length, "items");
        setMasterData(defaultData);
      }

      setStreakCount(streak);
      setPlanDiarioEnabled(diarioEnabled);
      setNuevoPlanEnabled(nuevoEnabled);

      const maintainEnabled = EncryptedStorage.getItem('bi_maintain_plan_enabled', encryptionKey) || false;
      setMaintainPlanEnabled(maintainEnabled);
    }
  }, [encryptionKey]);

  useEffect(() => {
    // If we have assessment data and master data, but NO habits, generate them
    if (assessmentData.length > 0 && masterData.length > 0 && habits.length === 0) {
      generatePriorityHabits();
    }

    // Store initial habits when first loaded
    if (habits.length > 0 && initialHabits.length === 0) {
      setInitialHabits(JSON.parse(JSON.stringify(habits)));
    }
  }, [assessmentData, masterData, habits.length]);

  useEffect(() => {
    if (habits.length > 0) {
      EncryptedStorage.setItem('bi_weekly_habits', habits, encryptionKey);
    }
  }, [habits, encryptionKey]);

  const generatePriorityHabits = () => {
    // 1. Calculate average scores per dimension
    const dimensions = [Dimension.Mind, Dimension.Body, Dimension.Spirit];
    const averages = dimensions.map(dim => {
      const dimAreas = assessmentData.filter(a => a.dimension === dim);
      const avg = dimAreas.reduce((sum, a) => sum + (a.score || 0), 0) / (dimAreas.length || 1);
      return { dimension: dim, avg };
    });

    console.log('🔍 Dimension Averages:', averages);

    // 2. Find the dimension with the lowest average
    const lowest = averages.reduce((prev, curr) => (prev.avg <= curr.avg ? prev : curr));

    console.log('📊 Lowest Dimension:', lowest.dimension, 'with avg:', lowest.avg);

    // 3. Filter master data for that dimension and matching scores
    const priorityHabits: Habit[] = assessmentData
      .filter(area => area.dimension === lowest.dimension)
      .map(area => {
        // Normalize names for comparison
        const normalizedAreaName = area.name.trim().toLowerCase().replace(/\s+/g, ' ');

        const matchingMaster = masterData.find(m => {
          const normalizedMasterName = m.name.trim().toLowerCase().replace(/\s+/g, ' ');
          const nameMatch = normalizedMasterName === normalizedAreaName;
          const scoreMatch = m.score === area.score;

          return nameMatch && scoreMatch;
        });

        console.log(`🎯 Area: "${area.name}" (score: ${area.score})`, matchingMaster ? '✓ Found' : '✗ Not found');

        return {
          id: area.id,
          title: area.name,
          description: matchingMaster ? matchingMaster.description : `Hábito para ${area.name} - Score ${area.score}`,
          dimension: area.dimension,
          subDimension: area.name,
          status: HabitStatus.InProgress,
          week: 1,
          isDaily: true,
          dateAdded: new Date().toISOString() // Add current date when habit is generated
        };
      });

    console.log('✅ Generated Habits:', priorityHabits.length);
    setHabits(priorityHabits);
  };

  const generateDailyPlan = () => {
    try {
      console.log('🔄 Generating Daily Plan...');

      // Create daily tasks from weekly habits, excluding deleted ones
      const activeHabits = habits.filter(habit => habit.status !== HabitStatus.Deleted);

      const dailyTasks = activeHabits.map((habit, index) => ({
        id: index + 1,
        title: habit.title,
        subtitle: habit.description,
        dimension: habit.dimension,
        completed: false
      }));

      console.log('📅 Generated Daily Tasks:', dailyTasks.length);

      // Save daily tasks to storage
      EncryptedStorage.setItem('bi_daily_tasks', dailyTasks, encryptionKey);

      // Register ALL habits (including deleted ones) to Pasaporte Habitos
      const weekNumber = EncryptedStorage.getItem('bi_streak_count', encryptionKey) || 1;

      // Force Plan Diario to reload by clearing existing cache for this week
      EncryptedStorage.removeItem(`bi_daily_tasks_week_${weekNumber}`);
      console.log('🧹 Cleared cache for week', weekNumber, 'to force reload');

      const existingPassportHabits = EncryptedStorage.getItem('bi_passport_habits', encryptionKey) || [];

      // Filter out existing entries for THIS week to avoid duplicates if generated multiple times
      const cleanPassportHabits = existingPassportHabits.filter((h: any) => h.week !== `Semana ${weekNumber}`);

      const newPassportEntries = habits.map((habit, index) => ({
        id: `week${weekNumber}_${habit.id}_${Date.now()}`, // Unique ID to avoid collisions
        dimension: habit.dimension,
        subCategory: habit.subDimension,
        title: habit.title,
        description: habit.description,
        status: habit.status === HabitStatus.Completed ? 'Cumplido' :
          habit.status === HabitStatus.Deleted ? 'Eliminado' : 'En proceso',
        week: `Semana ${weekNumber}`,
        icon: habit.dimension === Dimension.Mind ? 'psychology' :
          habit.dimension === Dimension.Body ? 'accessibility_new' : 'self_improvement',
        dateAdded: habit.dateAdded || new Date().toISOString()
      }));

      // Append new entries to existing passport (preserving history of other weeks)
      const updatedPassport = [...cleanPassportHabits, ...newPassportEntries];
      EncryptedStorage.setItem('bi_passport_habits', updatedPassport, encryptionKey);

      console.log('📋 Registered', newPassportEntries.length, 'habits to Pasaporte for week', weekNumber);

      // Navigate to daily plan
      if (onNavigate) {
        onNavigate('daily');
      } else {
        console.error('❌ onNavigate function missing');
      }
    } catch (error) {
      console.error('❌ Error generating plan:', error);
      // Fallback navigation even in error to not block user
      if (onNavigate) onNavigate('daily');
    }
  };

  const handleChangeStrategy = () => {
    // Reset streak to 0
    EncryptedStorage.setItem('bi_streak_count', 0, encryptionKey);

    // Unlock Assessment page
    EncryptedStorage.removeItem('bi_assessment_locked');

    // Enable "Evaluar Bienestar" button by clearing submission state
    EncryptedStorage.removeItem('bi_has_submitted');

    // Clear habits to allow new strategy
    EncryptedStorage.removeItem('bi_weekly_habits');

    // Disable Plan Diario and Nuevo Plan buttons
    EncryptedStorage.setItem('bi_plan_diario_enabled', false, encryptionKey);
    EncryptedStorage.setItem('bi_nuevo_plan_enabled', false, encryptionKey);
    setPlanDiarioEnabled(false);
    setNuevoPlanEnabled(false);
    setMaintainPlanEnabled(false); // Reset this too
    EncryptedStorage.setItem('bi_maintain_plan_enabled', false, encryptionKey);

    console.log('🔄 Strategy changed - Assessment unlocked, buttons disabled, ready for new evaluation');

    // Navigate to assessment
    if (onNavigate) {
      onNavigate('assessment');
    }
  };

  const handleNewPlan = () => {
    const currentAreaNames = habits.map(h => h.subDimension.toLowerCase());
    const sortedAreas = [...assessmentData].sort((a, b) => a.score - b.score);
    const availableAreas = sortedAreas.filter(area => !currentAreaNames.includes(area.name.toLowerCase()));
    const newAreas = availableAreas.slice(0, 4);

    console.log('🆕 Adding new areas:', newAreas.map(a => a.name));

    const newHabits: Habit[] = newAreas.map(area => {
      const normalizedAreaName = area.name.trim().toLowerCase().replace(/\s+/g, ' ');

      const matchingMaster = masterData.find(m => {
        const normalizedMasterName = m.name.trim().toLowerCase().replace(/\s+/g, ' ');
        const nameMatch = normalizedMasterName === normalizedAreaName;
        const scoreMatch = Number(m.score) === Number(area.score); // Ensure number comparison

        // Debug logging for first few items or if match fails
        if (normalizedAreaName.includes('salud emocional')) {
          // console.log(`Checking: '${normalizedMasterName}' vs '${normalizedAreaName}' | Score: ${m.score} vs ${area.score} => ${nameMatch && scoreMatch}`);
        }
        return nameMatch && scoreMatch;
      });

      if (!matchingMaster) {
        console.warn(`⚠️ Match failed for: "${area.name}" (Score: ${area.score})`);
        // Try to find ANY match for this name to see if score is the issue
        const nameOnlyMatch = masterData.find(m => m.name.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedAreaName);
        if (nameOnlyMatch) {
          console.log(`   Found name match but score differed. Available scores:`, masterData.filter(m => m.name.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedAreaName).map(m => m.score));
        } else {
          console.log(`   No name match found in ${masterData.length} master items.`);
        }
      }

      return {
        id: `new_${Date.now()}_${area.id}`,
        title: area.name,
        description: matchingMaster ? matchingMaster.description : `Meta: ${area.name} (Nivel ${area.score})`,
        dimension: area.dimension,
        subDimension: area.name,
        status: HabitStatus.InProgress,
        week: 1,
        isDaily: true,
        dateAdded: new Date().toISOString()
      };
    });

    const upgradedHabits = habits.map(habit => {
      if (habit.status === HabitStatus.Completed) {
        // Find the current level of this habit by matching description
        const currentMasterHabit = masterData.find(m =>
          m.name.trim().toLowerCase() === habit.subDimension.trim().toLowerCase() &&
          m.description.trim() === habit.description.trim()
        );

        let nextScore = 2; // Default fallback if not found
        let currentScore = 1;

        if (currentMasterHabit) {
          currentScore = currentMasterHabit.score;
          nextScore = currentScore + 1;
        } else {
          // Fallback: use assessment score + 1 if description doesn't match (shouldn't happen)
          const assessmentArea = assessmentData.find(a => a.name.toLowerCase() === habit.subDimension.toLowerCase());
          if (assessmentArea) {
            currentScore = assessmentArea.score;
            nextScore = currentScore + 1;
          }
        }

        if (currentScore < 3) {
          const normalizedName = habit.subDimension.trim().toLowerCase().replace(/\s+/g, ' ');
          const upgradedMaster = masterData.find(m => {
            const normalizedMasterName = m.name.trim().toLowerCase().replace(/\s+/g, ' ');
            return normalizedMasterName === normalizedName && m.score === nextScore;
          });

          if (upgradedMaster) {
            console.log(`⬆️ Upgrading "${habit.title}" from level ${currentScore} to ${nextScore}`);
            return {
              ...habit,
              description: upgradedMaster.description,
              status: HabitStatus.InProgress,
              // Optional: track level internally if we added a property later
            };
          }
        }
      }
      return habit;
    });

    const allHabits = [...upgradedHabits, ...newHabits];
    setHabits(allHabits);

    // Enable Plan Diario button
    EncryptedStorage.setItem('bi_plan_diario_enabled', true, encryptionKey);
    setPlanDiarioEnabled(true); // Update UI immediately

    // Disable Nuevo Plan after use
    EncryptedStorage.setItem('bi_nuevo_plan_enabled', false, encryptionKey);
    setNuevoPlanEnabled(false);

    // Disable Mantener Plan (User chose to create a new one)
    EncryptedStorage.setItem('bi_maintain_plan_enabled', false, encryptionKey);
    setMaintainPlanEnabled(false);

    console.log('✨ New plan generated with', allHabits.length, 'habits');
  };

  const handleMaintainPlan = () => {
    // 1. Activate Plan Diario
    EncryptedStorage.setItem('bi_plan_diario_enabled', true, encryptionKey);
    setPlanDiarioEnabled(true);

    // 2. Disable "Nuevo Plan"
    EncryptedStorage.setItem('bi_nuevo_plan_enabled', false, encryptionKey);
    setNuevoPlanEnabled(false);

    // Per user request: Only these two actions. 
    // Navigation and self-disabling removed.
    console.log('🔄 Plan Maintained - Daily Plan Reactivated');
  };

  const updateStatus = (id: string, status: HabitStatus) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, status } : h));
    setHabitsModified(true);
  };

  const getCardStyle = (habit: Habit) => {
    if (habit.status === HabitStatus.Deleted) return 'bg-gray-100 dark:bg-[#1a2c28]/50 border border-gray-200 dark:border-[#23483f]/50 opacity-70 grayscale';
    if (habit.status === HabitStatus.Completed) return 'bg-white dark:bg-surface-dark border-2 border-primary/50 shadow-md shadow-primary/10 dark:shadow-[0_0_15px_rgba(19,236,182,0.1)]';
    return 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/50 dark:hover:border-[#32675a] hover:shadow-lg dark:hover:shadow-none transition-all';
  };

  const completedCount = habits.filter(h => h.status === HabitStatus.Completed).length;
  const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header & Progress */}
      <div className="flex flex-col gap-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Tu Plan Semanal</h1>
            <div className="flex items-center gap-2 text-gray-500 dark:text-text-secondary">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <p className="text-sm md:text-base font-normal">Enfoque: Prioridad en Dimensión con mayor oportunidad de mejora</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-gray-200 dark:border-surface-highlight shadow-sm dark:shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_graph</span>
                <p className="text-slate-900 dark:text-white text-base font-medium">Progreso de la semana</p>
              </div>
              {habits.length > 0 && (
                <p className="text-slate-900 dark:text-white text-sm font-bold bg-gray-100 dark:bg-surface-highlight px-3 py-1 rounded-full">{completedCount}/{habits.length} Completado</p>
              )}
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-surface-highlight overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(19,236,182,0.4)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {habits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {habits.map((habit) => (
            <div key={habit.id} className={`group relative flex flex-col justify-between p-6 rounded-2xl transition-all hover:-translate-y-1 duration-300 ${getCardStyle(habit)}`}>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-500 dark:text-text-secondary text-xs font-bold tracking-widest uppercase">
                  <span className="material-symbols-outlined text-lg">
                    {habit.dimension === Dimension.Mind ? 'psychology' : habit.dimension === Dimension.Body ? 'fitness_center' : 'spa'}
                  </span>
                  <span>{habit.dimension} • {habit.subDimension}</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold leading-snug mb-2 ${habit.status === HabitStatus.Deleted ? 'text-gray-400 dark:text-gray-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {habit.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${habit.status === HabitStatus.Deleted ? 'text-gray-400/70 dark:text-gray-500 line-through' : 'text-gray-600 dark:text-text-secondary'}`}>
                    {habit.description}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className={`mt-auto pt-4 border-t ${habit.status === HabitStatus.Deleted ? 'border-gray-200 dark:border-surface-highlight/50' : 'border-gray-100 dark:border-surface-highlight'}`}>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateStatus(habit.id, HabitStatus.Completed)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${habit.status === HabitStatus.Completed ? 'bg-primary text-background-dark shadow-sm' : 'bg-gray-50 dark:bg-surface-highlight text-gray-500 dark:text-text-secondary hover:bg-emerald-100 dark:hover:bg-[#2d5c50] hover:text-emerald-700 dark:hover:text-white'}`}>
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <span className="text-[10px] font-bold uppercase">Cumplido</span>
                  </button>
                  <button
                    onClick={() => updateStatus(habit.id, HabitStatus.InProgress)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${habit.status === HabitStatus.InProgress ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30' : 'bg-gray-50 dark:bg-surface-highlight text-gray-500 dark:text-text-secondary hover:bg-yellow-50 dark:hover:bg-[#2d5c50] hover:text-yellow-600 dark:hover:text-white'}`}>
                    <span className="material-symbols-outlined text-xl">schedule</span>
                    <span className="text-[10px] font-bold uppercase">En Proceso</span>
                  </button>
                  <button
                    onClick={() => updateStatus(habit.id, HabitStatus.Deleted)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${habit.status === HabitStatus.Deleted ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' : 'bg-gray-50 dark:bg-surface-highlight text-gray-500 dark:text-text-secondary hover:bg-red-50 dark:hover:bg-[#2d5c50] hover:text-red-600 dark:hover:text-white'}`}>
                    <span className="material-symbols-outlined text-xl">delete</span>
                    <span className="text-[10px] font-bold uppercase">Eliminado</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-300 dark:border-surface-highlight text-center px-6">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">assignment_late</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aún no tienes un plan semanal</h3>
          <p className="text-gray-500 dark:text-text-secondary max-w-sm mb-6">
            Completa tu evaluación de bienestar para que podamos generar hábitos personalizados para ti.
          </p>
          <div className="flex flex-col gap-2 text-xs text-gray-400 italic">
            <p>Estado de datos:</p>
            <p>• Evaluación: {assessmentData.length > 0 ? '✓' : '✗'}</p>
            <p>• Datos Maestros: {masterData.length > 0 ? '✓' : '✗'}</p>
          </div>
        </div>
      )}

      {/* Footer Action */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-surface-highlight mb-10 gap-4">
        <div className="flex gap-4">
          <button
            onClick={generateDailyPlan}
            disabled={!planDiarioEnabled}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${planDiarioEnabled
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 hover:translate-y-[-2px] hover:shadow-xl'
              : 'bg-gray-200 dark:bg-surface-highlight text-gray-400 dark:text-text-secondary opacity-60 cursor-not-allowed'
              }`}
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span>Plan Diario</span>
          </button>

          <button
            onClick={handleMaintainPlan}
            disabled={!maintainPlanEnabled}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${maintainPlanEnabled
              ? 'bg-purple-600 dark:bg-purple-700 text-white shadow-lg shadow-purple-900/20 hover:translate-y-[-2px] hover:shadow-xl'
              : 'bg-gray-200 dark:bg-surface-highlight text-gray-400 dark:text-text-secondary opacity-60 cursor-not-allowed hidden md:flex'
              // Using hidden md:flex to hide if disabled on mobile to save space, or just keep it? Request didn't specify. Keeping visible but disabled.
              }`}
          >
            <span className="material-symbols-outlined">replay</span>
            <span>Mantener Plan</span>
          </button>

          <button
            onClick={handleNewPlan}
            disabled={!nuevoPlanEnabled}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${nuevoPlanEnabled
              ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg shadow-blue-900/20 hover:translate-y-[-2px] hover:shadow-xl'
              : 'bg-gray-200 dark:bg-surface-highlight text-gray-400 dark:text-text-secondary opacity-60 cursor-not-allowed'
              }`}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Nuevo Plan</span>
          </button>
        </div>

        <button
          onClick={handleChangeStrategy}
          className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all bg-primary text-background-dark shadow-lg shadow-primary/30 hover:translate-y-[-2px] hover:shadow-xl"
        >
          <span>Cambiar Estrategia</span>
          <span className="material-symbols-outlined">change_circle</span>
        </button>
      </div>
    </div>
  );
};

export default PlanSemanal;
