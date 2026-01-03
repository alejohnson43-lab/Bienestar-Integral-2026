import React, { useState, useEffect } from 'react';
import { Dimension, UserProfile } from '../types';
import { EncryptedStorage } from '../utils/storage';

interface DailyTask {
    id: number;
    title: string;
    subtitle: string;
    dimension: Dimension;
    completed: boolean;
}

interface WeekData {
    [key: string]: {
        tasks: DailyTask[];
        reflections: string;
    };
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const PlanDiario: React.FC<{ user: UserProfile; encryptionKey: string; onNavigate?: (page: string) => void }> = ({ user, encryptionKey, onNavigate }) => {
    const [weekNumber, setWeekNumber] = useState(1);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [todayIndex, setTodayIndex] = useState(0);
    const [weekData, setWeekData] = useState<WeekData>({});
    // Removed local reflections state to use Single Source of Truth (weekData)
    const [hasExportedPDF, setHasExportedPDF] = useState(false);

    // Get current day from system
    useEffect(() => {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const adjustedDay = today === 0 ? 6 : today - 1; // Convert to 0 = Monday
        setCurrentDayIndex(adjustedDay);
        setTodayIndex(adjustedDay);
    }, []);

    // Load week number and data - RUNS ONCE or on Week Change
    useEffect(() => {
        if (encryptionKey) {
            const streak = EncryptedStorage.getItem('bi_streak_count', encryptionKey) || 1;
            setWeekNumber(streak);

            // Load week data
            // Load week data
            const savedWeekData = EncryptedStorage.getItem(`bi_daily_tasks_week_${streak}`, encryptionKey);

            // Reconstruct full week structure to ensure data integrity
            // This prevents "missing day" bugs if storage is partial or corrupt
            // 1. Generate default skeleton
            let tasks = EncryptedStorage.getItem('bi_daily_tasks', encryptionKey);
            if (!tasks || tasks.length === 0) {
                const weeklyHabits = EncryptedStorage.getItem('bi_weekly_habits', encryptionKey) || [];
                tasks = weeklyHabits
                    .filter((h: any) => h.status !== 'deleted')
                    .map((h: any, i: number) => ({
                        id: i + 1,
                        title: h.title,
                        subtitle: h.description,
                        dimension: h.dimension,
                        completed: false
                    }));
            }
            tasks = tasks || [];

            const fullWeekData: WeekData = {};
            DAYS_OF_WEEK.forEach(day => {
                // If saved data exists for this day, use it. Otherwise use default.
                if (savedWeekData && savedWeekData[day]) {
                    fullWeekData[day] = savedWeekData[day];
                } else {
                    fullWeekData[day] = {
                        tasks: tasks.map((t: any, i: number) => ({ ...t, id: i + 1, completed: false })),
                        reflections: ''
                    };
                }
            });

            setWeekData(fullWeekData);
        }
    }, [encryptionKey, weekNumber]); // Removed currentDayIndex dependency

    // Sync reflections removed - UI now reads directly from weekData

    // Save data when it changes
    useEffect(() => {
        if (encryptionKey && Object.keys(weekData).length > 0) {
            EncryptedStorage.setItem(`bi_daily_tasks_week_${weekNumber}`, weekData, encryptionKey);
        }
    }, [weekData, encryptionKey, weekNumber]);

    const toggleTask = (taskId: number) => {
        // Prevent editing future days
        if (currentDayIndex > todayIndex) return;

        const currentDay = DAYS_OF_WEEK[currentDayIndex];
        setWeekData(prev => ({
            ...prev,
            [currentDay]: {
                ...prev[currentDay],
                tasks: prev[currentDay]?.tasks.map(t =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                ) || []
            }
        }));
    };

    const handleReflectionChange = (value: string) => {
        const currentDay = DAYS_OF_WEEK[currentDayIndex];

        // Safety check to ensure we don't crash on initial empty state
        if (!weekData[currentDay]) return;

        setWeekData(prev => ({
            ...prev,
            [currentDay]: {
                ...prev[currentDay],
                reflections: value
            }
        }));
    };

    // Calculate day completion %
    const getDayCompletion = (day: string) => {
        const dayTasks = weekData[day]?.tasks || [];
        if (dayTasks.length === 0) return 0;
        const completed = dayTasks.filter(t => t.completed).length;
        return Math.round((completed / dayTasks.length) * 100);
    };

    // Calculate weekly progress
    const getWeeklyProgress = () => {
        const totalTasks = DAYS_OF_WEEK.reduce((sum, day) => sum + (weekData[day]?.tasks.length || 0), 0);
        const completedTasks = DAYS_OF_WEEK.reduce((sum, day) =>
            sum + (weekData[day]?.tasks.filter(t => t.completed).length || 0), 0);
        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    };

    // Get color based on completion
    const getCompletionColor = (percentage: number) => {
        if (percentage >= 67) return 'bg-emerald-500';
        if (percentage >= 34) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const handleSendReport = () => {
        // Increment streak count (RACHA ACTUAL)
        const currentStreak = EncryptedStorage.getItem('bi_streak_count', encryptionKey) || 1;

        // Remove stored data for the finishing week to ensure privacy/cleanup as requested
        EncryptedStorage.removeItem(`bi_daily_tasks_week_${currentStreak}`);
        setWeekData({});
        // setReflections('') removed
        EncryptedStorage.setItem('bi_streak_count', currentStreak + 1, encryptionKey);

        // Increment week count (SEMANA ACTUAL)
        const currentWeek = EncryptedStorage.getItem('bi_week_count', encryptionKey) || 1;
        EncryptedStorage.setItem('bi_week_count', currentWeek + 1, encryptionKey);

        // Disable Plan Diario button
        EncryptedStorage.setItem('bi_plan_diario_enabled', false, encryptionKey);

        // Enable Nuevo Plan button for next week
        EncryptedStorage.setItem('bi_nuevo_plan_enabled', true, encryptionKey);

        // Enable Mantener Plan button as well
        EncryptedStorage.setItem('bi_maintain_plan_enabled', true, encryptionKey);

        console.log('📊 Report sent - Streak:', currentStreak + 1, 'Week:', currentWeek + 1);

        // Navigate to Plan Semanal (buttons will be active there)
        if (onNavigate) {
            onNavigate('weekly');
        } else {
            alert(`¡Reporte enviado! Racha: ${currentStreak + 1} semanas, Semana: ${currentWeek + 1}`);
        }
    };

    const exportToPDF = () => {
        // Dynamic import to avoid bundling issues
        import('jspdf').then(({ default: jsPDF }) => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPos = 20;

            // Get user info
            const userName = user.name || 'Usuario';
            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Header - Logo/Title
            doc.setFillColor(19, 236, 182); // Primary color
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setTextColor(15, 31, 27); // Dark text
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('Bienestar Integral', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Reporte Semanal', pageWidth / 2, 22, { align: 'center' });

            yPos = 40;

            // User Info Section
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Usuario: ${userName}`, 15, yPos);
            doc.text(`Fecha de generación: ${printDate}`, 15, yPos + 5);
            doc.text(`Semana #${weekNumber}`, 15, yPos + 10);

            yPos += 20;

            // Divider
            doc.setDrawColor(200, 200, 200);
            doc.line(15, yPos, pageWidth - 15, yPos);
            yPos += 10;

            // Weekly Progress Summary
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Progreso General de la Semana', 15, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const weeklyProg = getWeeklyProgress();
            doc.text(`Progreso total: ${weeklyProg}%`, 15, yPos);

            // Progress bar
            const barWidth = 100;
            const barHeight = 6;
            doc.setDrawColor(220, 220, 220);
            doc.rect(15, yPos + 3, barWidth, barHeight);

            // Progress fill
            const fillColor = weeklyProg >= 67 ? [16, 185, 129] : weeklyProg >= 34 ? [234, 179, 8] : [239, 68, 68];
            doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
            doc.rect(15, yPos + 3, (barWidth * weeklyProg) / 100, barHeight, 'F');

            yPos += 18;

            // Daily Breakdown
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Cumplimiento por Día', 15, yPos);
            yPos += 10;

            DAYS_OF_WEEK.forEach((day, index) => {
                const completion = getDayCompletion(day);
                const dayColor = completion >= 67 ? [16, 185, 129] : completion >= 34 ? [234, 179, 8] : [239, 68, 68];

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${day}:`, 20, yPos);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(dayColor[0], dayColor[1], dayColor[2]);
                doc.text(`${completion}%`, 50, yPos);

                // Mini progress bar
                const miniBarWidth = 50;
                doc.setDrawColor(220, 220, 220);
                doc.rect(65, yPos - 3, miniBarWidth, 4);
                doc.setFillColor(dayColor[0], dayColor[1], dayColor[2]);
                doc.rect(65, yPos - 3, (miniBarWidth * completion) / 100, 4, 'F');

                doc.setTextColor(0, 0, 0);
                yPos += 8;

                if (yPos > pageHeight - 30 && index < DAYS_OF_WEEK.length - 1) {
                    doc.addPage();
                    yPos = 20;
                }
            });

            yPos += 5;

            // Task Summary by Dimension
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumen de Actividades', 15, yPos);
            yPos += 10;

            const dimensionSummary = {
                [Dimension.Body]: { total: 0, completed: 0, name: 'Cuerpo' },
                [Dimension.Mind]: { total: 0, completed: 0, name: 'Mente' },
                [Dimension.Spirit]: { total: 0, completed: 0, name: 'Espíritu' }
            };

            DAYS_OF_WEEK.forEach(day => {
                const dayTasks = weekData[day]?.tasks || [];
                dayTasks.forEach(task => {
                    dimensionSummary[task.dimension].total++;
                    if (task.completed) dimensionSummary[task.dimension].completed++;
                });
            });

            Object.values(dimensionSummary).forEach(dim => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${dim.name}:`, 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(`${dim.completed}/${dim.total} completadas`, 50, yPos);
                yPos += 7;
            });

            yPos += 8;

            // Weekly Reflections
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Reflexiones de la Semana', 15, yPos);
            yPos += 8;

            const hasReflections = DAYS_OF_WEEK.some(day => weekData[day]?.reflections);

            if (hasReflections) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');

                DAYS_OF_WEEK.forEach(day => {
                    const reflection = weekData[day]?.reflections;
                    if (reflection && reflection.trim()) {
                        if (yPos > pageHeight - 30) {
                            doc.addPage();
                            yPos = 20;
                        }

                        doc.setFont('helvetica', 'bold');
                        doc.text(`${day}:`, 20, yPos);
                        yPos += 5;

                        doc.setFont('helvetica', 'normal');
                        const lines = doc.splitTextToSize(reflection, pageWidth - 40);
                        lines.forEach((line: string) => {
                            if (yPos > pageHeight - 20) {
                                doc.addPage();
                                yPos = 20;
                            }
                            doc.text(line, 25, yPos);
                            yPos += 4;
                        });
                        yPos += 3;
                    }
                });
            } else {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(150, 150, 150);
                doc.text('Sin reflexiones registradas esta semana.', 20, yPos);
                doc.setTextColor(0, 0, 0);
            }

            // Footer on last page
            const finalPage = doc.internal.pages.length - 1;
            doc.setPage(finalPage);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(120, 120, 120);
            doc.text(
                `Generado por Bienestar Integral - ${printDate}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );

            // Save PDF
            doc.save(`Reporte_Semana_${weekNumber}_${userName.replace(/\s/g, '_')}.pdf`);

            alert('✅ Reporte PDF generado exitosamente');
            setHasExportedPDF(true);
        }).catch(error => {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor, intenta nuevamente.');
        });
    };

    const renderTimelineItem = (day: string, dayIndex: number) => {
        const completion = getDayCompletion(day);
        const colorClass = getCompletionColor(completion);
        const isToday = dayIndex === currentDayIndex;
        const isPast = dayIndex < currentDayIndex;
        const isFuture = dayIndex > currentDayIndex;

        if (isPast || isToday) {
            return (
                <div
                    key={day}
                    onClick={() => setCurrentDayIndex(dayIndex)}
                    className={`flex flex-col gap-2 px-2 py-3 rounded-xl transition-all cursor-pointer ${isToday
                        ? 'bg-primary/10 dark:bg-surface-highlight/50 border border-primary/20 dark:border-surface-highlight'
                        : isPast && dayIndex === currentDayIndex
                            ? 'bg-gray-100 dark:bg-surface-highlight/30 border border-gray-200 dark:border-surface-highlight'
                            : 'opacity-60 hover:opacity-100 border border-transparent hover:bg-gray-50 dark:hover:bg-surface-highlight/20'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`size-6 rounded-full ${isToday && completion > 0 ? colorClass : isPast && completion > 0 ? 'bg-primary' : 'border-2 border-primary'} flex items-center justify-center shrink-0`}>
                            {completion > 0 && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-slate-900 dark:text-white text-sm font-bold">{day}</span>
                            {isToday && <span className="text-primary text-[10px] uppercase tracking-wide font-bold">Hoy</span>}
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-[#11221e] rounded-full overflow-hidden">
                        <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${completion}%` }}></div>
                    </div>
                </div>
            );
        }

        // Future days
        return (
            <div
                key={day}
                onClick={() => setCurrentDayIndex(dayIndex)}
                className={`flex items-center gap-3 px-2 py-3 cursor-pointer rounded-xl transition-all border border-transparent hover:bg-gray-50 dark:hover:bg-surface-highlight/20 ${dayIndex === currentDayIndex ? 'bg-gray-100 dark:bg-surface-highlight/30 border-gray-200 dark:border-surface-highlight' : 'opacity-40 hover:opacity-100'}`}
            >
                <div className="size-6 rounded-full border-2 border-gray-300 dark:border-gray-500 shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-gray-400">lock</span>
                </div>
                <span className="text-slate-900 dark:text-white text-sm font-medium">{day}</span>
            </div>
        );
    };

    const currentDay = DAYS_OF_WEEK[currentDayIndex];
    const currentTasks = weekData[currentDay]?.tasks || [];
    const weeklyProgress = getWeeklyProgress();
    const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="flex flex-col lg:flex-row min-h-full animate-fade-in gap-8 pb-10">
            {/* Sidebar - Timeline */}
            <aside className="hidden lg:flex w-72 flex-col gap-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-full bg-gradient-to-br from-primary via-emerald-600 to-teal-900 flex items-center justify-center shadow-lg shadow-primary/20">
                    </div>
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Semana {weekNumber}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Plan Diario</p>
                    </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-surface-highlight w-full"></div>

                <div className="flex flex-col gap-2">
                    {DAYS_OF_WEEK.map((day, index) => renderTimelineItem(day, index))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-8 min-w-0">
                {/* Mobile Day Selector (Horizontal Scroll) */}
                <div className="lg:hidden mb-6 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-surface-highlight pb-6">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 px-1 uppercase tracking-wider">Seleccionar Día</p>
                    <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x">
                        {DAYS_OF_WEEK.map((day, index) => {
                            const completion = getDayCompletion(day);
                            const isToday = index === currentDayIndex;
                            const isFuture = index > todayIndex; // Use todayIndex for read-only check
                            const colorClass = getCompletionColor(completion);

                            return (
                                <div
                                    key={day}
                                    onClick={() => setCurrentDayIndex(index)}
                                    className={`flex flex-col gap-1 min-w-[80px] p-2 rounded-xl border snap-center text-center cursor-pointer transition-all ${isToday
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-surface-highlight'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{day.substring(0, 3)}</span>
                                    <div className="flex justify-center my-1">
                                        {isFuture ? (
                                            <span className="material-symbols-outlined text-gray-400 text-lg">lock</span>
                                        ) : (
                                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${completion > 0 && !isToday
                                                ? `${colorClass} text-white`
                                                : isToday ? 'bg-primary text-background-dark' : 'bg-gray-100 dark:bg-surface-highlight text-gray-500'
                                                }`}>
                                                {completion > 0 ? <span className="material-symbols-outlined text-sm">check</span> : (index + 1)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight mb-2">Plan Diario</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg capitalize">
                            {todayDate}
                            {currentDayIndex !== todayIndex && (
                                <span className={`ml-2 text-sm font-bold py-1 px-3 rounded-full ${currentDayIndex > todayIndex ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
                                    {currentDayIndex > todayIndex ? 'Futuro (Solo Lectura)' : 'Historial'}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="bg-emerald-100 dark:bg-[#23483f] hover:bg-emerald-200 dark:hover:bg-[#2d5c50] transition-colors text-emerald-800 dark:text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm shrink-0 cursor-pointer shadow-lg shadow-emerald-900/5 dark:shadow-black/20">
                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        Semana {weekNumber}
                    </div>
                </header>

                {/* Progress Card */}
                <section className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-surface-highlight shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-1">Progreso Semanal</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Continúa así para completar tu objetivo semanal.</p>
                        </div>
                        <span className="text-4xl font-black text-primary">{weeklyProgress}%</span>
                    </div>
                    <div className="h-4 w-full bg-gray-100 dark:bg-[#11221e] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${weeklyProgress}%` }}></div>
                    </div>
                </section>

                {/* Tasks Section */}
                <section className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tareas de {currentDay}</h2>
                        <div className="flex gap-2">
                            <span className="bg-emerald-50 dark:bg-[#1a352f] text-emerald-700 dark:text-primary px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                                {currentTasks.filter(t => !t.completed).length} Pendientes
                            </span>
                            <span className="bg-gray-100 dark:bg-[#2a3036] text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                                {currentTasks.filter(t => t.completed).length} Completadas
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Group by dimension */}
                        {[Dimension.Body, Dimension.Mind, Dimension.Spirit].map(dimension => {
                            const dimensionTasks = currentTasks.filter(t => t.dimension === dimension);
                            if (dimensionTasks.length === 0) return null;

                            const dimensionConfig = {
                                [Dimension.Body]: { icon: 'accessibility_new', color: 'emerald', title: 'Cuerpo' },
                                [Dimension.Mind]: { icon: 'psychology', color: 'blue', title: 'Mente' },
                                [Dimension.Spirit]: { icon: 'self_improvement', color: 'purple', title: 'Espíritu' }
                            };

                            const config = dimensionConfig[dimension];

                            return (
                                <div key={dimension} className="flex flex-col gap-4 bg-gray-50 dark:bg-surface-dark/30 rounded-2xl p-4 border border-gray-200 dark:border-surface-highlight/50">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900/50 flex items-center justify-center text-${config.color}-600 dark:text-${config.color}-400`}>
                                                <span className="material-symbols-outlined">{config.icon}</span>
                                            </div>
                                            <h3 className="text-slate-900 dark:text-white font-bold text-xl">{config.title}</h3>
                                        </div>
                                        <span className={`size-6 rounded-full bg-${config.color}-100 dark:bg-[#1a352f] text-${config.color}-700 dark:text-${config.color}-400 text-xs font-bold flex items-center justify-center border border-${config.color}-200 dark:border-${config.color}-900/50`}>
                                            {dimensionTasks.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {dimensionTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => toggleTask(task.id)}
                                                className={`p-4 rounded-xl border transition-all group ${currentDayIndex > todayIndex ? 'cursor-not-allowed opacity-70 grayscale' : 'cursor-pointer'
                                                    } ${task.completed
                                                        ? `bg-${config.color}-50 dark:bg-[#1a2e29]/50 border-${config.color}-200 dark:border-${config.color}-900/30`
                                                        : 'bg-white dark:bg-[#1a2522] border-gray-200 dark:border-surface-highlight hover:border-emerald-400 dark:hover:border-emerald-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`size-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${task.completed
                                                        ? 'bg-primary border-primary'
                                                        : 'border-gray-300 dark:border-gray-500 group-hover:border-primary'
                                                        }`}>
                                                        {task.completed && <span className="material-symbols-outlined text-background-dark text-[16px] font-bold">check</span>}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold mb-1 ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{task.subtitle}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Bottom Actions */}
                <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-surface-highlight p-6 flex flex-col gap-4 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-900 dark:text-white">edit_note</span>
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Reflexión Diaria</h3>
                        </div>
                        <textarea
                            key={currentDayIndex}
                            value={weekData[DAYS_OF_WEEK[currentDayIndex]]?.reflections || ''}
                            onChange={(e) => handleReflectionChange(e.target.value)}
                            disabled={currentDayIndex > todayIndex}
                            className={`w-full flex-1 bg-gray-50 dark:bg-[#11221e] border border-gray-200 dark:border-surface-highlight rounded-xl p-4 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm resize-none ${currentDayIndex > todayIndex ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder={currentDayIndex > todayIndex ? "Podrás escribir tu reflexión cuando llegue este día." : "¿Cómo te sentiste al completar tus tareas hoy? Escribe tus pensamientos aquí..."}
                            rows={4}
                        ></textarea>
                    </div>

                    <div className="lg:col-span-2 bg-emerald-50 dark:bg-[#162e28] rounded-2xl border border-emerald-100 dark:border-surface-highlight p-8 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-sm dark:shadow-none">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <span className="material-symbols-outlined text-[120px] text-slate-900 dark:text-white">event_available</span>
                        </div>
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <span className="material-symbols-outlined text-3xl">event_available</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-1">Finalizar Semana</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Envía tu reporte para desbloquear la siguiente fase.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleSendReport}
                                    disabled={!hasExportedPDF}
                                    className={`w-full font-bold text-sm py-3 px-6 rounded-full transition-all shadow-lg flex items-center justify-center gap-2 group ${hasExportedPDF
                                        ? 'bg-primary hover:bg-[#0fd6a4] text-background-dark shadow-primary/20 cursor-pointer'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                                        }`}
                                    title={!hasExportedPDF ? "Debes exportar el PDF primero" : "Enviar reporte semanal"}
                                >
                                    Enviar Reporte
                                    {hasExportedPDF ? (
                                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">send</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                    )}
                                </button>

                                <button
                                    onClick={exportToPDF}
                                    className="w-full bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-surface-highlight text-slate-900 dark:text-white font-bold text-sm py-3 px-6 rounded-full transition-all border border-gray-200 dark:border-surface-highlight flex items-center justify-center gap-2 group"
                                >
                                    Exportar PDF
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PlanDiario;
