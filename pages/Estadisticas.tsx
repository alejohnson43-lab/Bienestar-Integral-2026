import React, { useState, useEffect } from 'react';
import { EncryptedStorage } from '../utils/storage';
import { Dimension } from '../types';

interface EstadisticasProps {
    onNavigate: (page: string) => void;
    encryptionKey: string;
}

const Estadisticas: React.FC<EstadisticasProps> = ({ onNavigate, encryptionKey }) => {
    const [stats, setStats] = useState({
        mind: { percent: 0, trend: 0 },
        body: { percent: 0, trend: 0 },
        spirit: { percent: 0, trend: 0 },
        globalAverage: 0
    });

    const [history, setHistory] = useState<any[]>([]);
    const [weekLabels, setWeekLabels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (encryptionKey) {
            calculateStats();
        }
    }, [encryptionKey]);

    const calculateStats = () => {
        try {
            const passportHabits = EncryptedStorage.getItem('bi_passport_habits', encryptionKey) || [];
            if (passportHabits.length === 0) {
                setLoading(false);
                return;
            }

            // 1. Group by Week
            const weekMap = new Map<number, any[]>();
            let maxWeek = 0;

            passportHabits.forEach((h: any) => {
                // Parse "Semana X"
                const match = h.week.match(/Semana (\d+)/);
                const weekNum = match ? parseInt(match[1]) : 1;
                if (weekNum > maxWeek) maxWeek = weekNum;

                if (!weekMap.has(weekNum)) weekMap.set(weekNum, []);
                weekMap.get(weekNum)?.push(h);
            });

            // 2. Calculate Weekly Stats
            const historyData: any[] = [];
            const labels: string[] = [];

            // Iterate from week 1 to maxWeek to fill gaps if any
            for (let i = 1; i <= maxWeek; i++) {
                const habits = weekMap.get(i) || [];
                const total = habits.length;
                const completed = habits.filter((h: any) => h.status === 'Cumplido').length;

                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                // Dimension specific
                const getDimPercent = (dim: Dimension) => {
                    const dimHabits = habits.filter((h: any) => h.dimension === dim);
                    const dimTotal = dimHabits.length;
                    const dimCompleted = dimHabits.filter((h: any) => h.status === 'Cumplido').length;
                    return dimTotal > 0 ? Math.round((dimCompleted / dimTotal) * 100) : 0;
                };

                historyData.push({
                    week: i,
                    global: percent,
                    mind: getDimPercent(Dimension.Mind),
                    body: getDimPercent(Dimension.Body),
                    spirit: getDimPercent(Dimension.Spirit)
                });

                labels.push(`Semana ${i}`);
            }

            setHistory(historyData);
            setWeekLabels(labels);

            // 3. Current vs Previous Stats (KPIs)
            const current = historyData[historyData.length - 1] || { mind: 0, body: 0, spirit: 0, global: 0 };
            const previous = historyData.length > 1 ? historyData[historyData.length - 2] : { mind: 0, body: 0, spirit: 0, global: 0 };

            setStats({
                mind: { percent: current.mind, trend: current.mind - previous.mind },
                body: { percent: current.body, trend: current.body - previous.body },
                spirit: { percent: current.spirit, trend: current.spirit - previous.spirit },
                globalAverage: current.global
            });

            setLoading(false);

        } catch (error) {
            console.error("Error calculating stats:", error);
            setLoading(false);
        }
    };

    const [visibleDimensions, setVisibleDimensions] = useState({
        mind: true,
        body: true,
        spirit: true
    });

    // Helper to generate SVG path from data points
    // Maps value (0-100) to Y coordinates with padding to avoid clipping
    const generatePath = (dataKey: string, height: number, width: number) => {
        if (history.length === 0) return "";

        const paddingY = 20; // 20px padding top and bottom
        const availableHeight = height - (paddingY * 2);

        const pointDistance = width / (Math.max(history.length, 2) - 1);

        const points = history.map((item, index) => {
            const x = index * pointDistance;
            const rawValue = item[dataKey];
            // 100% -> paddingY, 0% -> height - paddingY
            const y = height - paddingY - (rawValue / 100) * availableHeight;
            return `${x},${y}`;
        });

        if (points.length === 1) {
            return `M 0,${points[0].split(',')[1]} L ${width},${points[0].split(',')[1]}`;
        }

        return `M ${points.join(" L ")}`;
    };

    const toggleDimension = (dim: 'mind' | 'body' | 'spirit') => {
        setVisibleDimensions(prev => ({
            ...prev,
            [dim]: !prev[dim]
        }));
    };

    const TrendIndicator = ({ value }: { value: number }) => {
        if (value === 0) return <span className="text-gray-400 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">= 0%</span>;
        const isPositive = value > 0;
        return (
            <span className={`${isPositive ? 'text-emerald-700 dark:text-primary bg-emerald-100 dark:bg-primary/10' : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20'} text-sm font-bold flex items-center mb-1.5 px-2 py-0.5 rounded-full`}>
                <span className="material-symbols-outlined text-sm mr-1">{isPositive ? 'trending_up' : 'trending_down'}</span>
                {isPositive ? '+' : ''}{value}%
            </span>
        );
    };

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate a small delay so the user feels the refresh
        await new Promise(resolve => setTimeout(resolve, 600));
        calculateStats();
        setIsRefreshing(false);
    };

    if (loading) return <div className="p-10 text-center">Cargando estadísticas...</div>;

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-primary text-sm font-bold hover:text-emerald-600 dark:hover:text-white transition-colors w-fit mb-2">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver al Inicio
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Análisis de Progreso</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl leading-relaxed">Visualiza tu coherencia a lo largo del tiempo.</p>
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="bg-gray-100 dark:bg-surface-highlight hover:bg-gray-200 dark:hover:bg-surface-highlight/80 text-slate-900 dark:text-white p-3 rounded-full transition-all active:scale-95"
                        title="Actualizar datos"
                        disabled={isRefreshing}
                    >
                        <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mente */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl p-6 relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-500/30 transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/20">
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-base">psychology</span> Mente
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">{stats.mind.percent}%</span>
                                <TrendIndicator value={stats.mind.trend} />
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-blue-500/10 text-[100px] absolute -right-6 -top-6 pointer-events-none group-hover:scale-110 transition-transform duration-500">psychology</span>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl p-6 relative overflow-hidden group hover:border-red-400 dark:hover:border-purple-500/30 transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/20">
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-red-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-base">accessibility_new</span> Cuerpo
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">{stats.body.percent}%</span>
                                <TrendIndicator value={stats.body.trend} />
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-red-500/10 dark:text-purple-500/10 text-[100px] absolute -right-6 -top-6 pointer-events-none group-hover:scale-110 transition-transform duration-500">accessibility_new</span>
                    </div>
                </div>

                {/* Espiritu */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-400 dark:hover:border-primary/30 transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/20">
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-primary text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-base">self_improvement</span> Espíritu
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">{stats.spirit.percent}%</span>
                                <TrendIndicator value={stats.spirit.trend} />
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500/10 text-[100px] absolute -right-6 -top-6 pointer-events-none group-hover:scale-110 transition-transform duration-500">self_improvement</span>
                    </div>
                </div>
            </div>

            {/* Global Chart */}
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h5 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Coherencia Global</h5>
                        <h3 className="text-slate-900 dark:text-white text-2xl font-bold">Evolución del Promedio General</h3>
                    </div>
                    <div className="bg-gray-100 dark:bg-[#1a352f] border border-gray-200 dark:border-surface-highlight rounded-full px-4 py-1.5 flex items-center gap-2 shadow-inner">
                        <div className="size-2 rounded-full bg-emerald-500 dark:bg-primary animate-pulse shadow-[0_0_8px_#13ecb6]"></div>
                        <span className="text-emerald-700 dark:text-primary text-xs font-bold">Promedio Actual: {stats.globalAverage}%</span>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    {/* Y-Axis Scales */}
                    <div className="flex flex-col justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold text-right h-64 py-[20px]">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0%</span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {history.length > 0 ? (
                            <div className="h-64 w-full min-w-[300px]">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 250" preserveAspectRatio="none">
                                    {/* Grid Lines */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={i} x1="0" y1={20 + ((210) / 4) * i} x2="800" y2={20 + ((210) / 4) * i} className="stroke-gray-100 dark:stroke-[#23483f]" strokeWidth="1" strokeDasharray="6 6" />
                                    ))}

                                    {/* Path */}
                                    <path
                                        d={generatePath('global', 250, 800)}
                                        fill="none"
                                        className="stroke-emerald-500 dark:stroke-[#13ecb6] drop-shadow-[0_0_10px_rgba(19,236,182,0.3)] animate-dash"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Points for last data point */}
                                    {/* This simple circle is just for effect on the last point, requires coordinate calculation or simpler React rendering over SVG */}
                                </svg>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                No hay suficientes datos para generar la gráfica.
                            </div>
                        )}

                        {/* X-Axis Labels */}
                        <div className="flex justify-between mt-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                            {weekLabels.map((label, i) => (
                                <span key={i} className={i % Math.ceil(weekLabels.length / 5) === 0 ? 'block' : 'hidden md:block'}>{label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Chart */}
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                    <div>
                        <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-1">Desglose: Mente, Cuerpo y Espíritu</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Toca las etiquetas para filtrar la gráfica.</p>
                    </div>

                    <div className="flex gap-4 bg-gray-50 dark:bg-[#10221d] p-1.5 rounded-lg border border-gray-200 dark:border-surface-highlight">
                        <button
                            onClick={() => toggleDimension('mind')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${visibleDimensions.mind ? 'bg-white dark:bg-surface-highlight/30 shadow-sm' : 'opacity-50 hover:bg-gray-100 dark:hover:bg-surface-highlight/10'}`}
                        >
                            <div className="size-2.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_5px_#60a5fa]"></div>
                            <span className="text-slate-900 dark:text-white text-xs font-bold">Mente</span>
                        </button>
                        <button
                            onClick={() => toggleDimension('body')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${visibleDimensions.body ? 'bg-white dark:bg-surface-highlight/30 shadow-sm' : 'opacity-50 hover:bg-gray-100 dark:hover:bg-surface-highlight/10'}`}
                        >
                            <div className="size-2.5 rounded-full bg-red-500 dark:bg-purple-400 shadow-[0_0_5px_#c084fc]"></div>
                            <span className="text-slate-900 dark:text-white text-xs font-bold">Cuerpo</span>
                        </button>
                        <button
                            onClick={() => toggleDimension('spirit')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${visibleDimensions.spirit ? 'bg-white dark:bg-surface-highlight/30 shadow-sm' : 'opacity-50 hover:bg-gray-100 dark:hover:bg-surface-highlight/10'}`}
                        >
                            <div className="size-2.5 rounded-full bg-emerald-500 dark:bg-primary shadow-[0_0_5px_#13ecb6]"></div>
                            <span className="text-slate-900 dark:text-white text-xs font-bold">Espíritu</span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    {/* Y-Axis Scales */}
                    <div className="flex flex-col justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold text-right h-64 py-[20px]">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0%</span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {history.length > 0 ? (
                            <div className="h-64 w-full min-w-[300px]">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 250" preserveAspectRatio="none">
                                    {/* Grid Lines */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={i} x1="0" y1={20 + ((210) / 4) * i} x2="800" y2={20 + ((210) / 4) * i} className="stroke-gray-100 dark:stroke-[#23483f]" strokeWidth="1" strokeDasharray="6 6" />
                                    ))}

                                    {/* Mente (Blue) */}
                                    {visibleDimensions.mind && (
                                        <path
                                            d={generatePath('mind', 250, 800)}
                                            fill="none"
                                            className="stroke-blue-500 dark:stroke-[#60a5fa] animate-fade-in"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* Cuerpo (Red/Purple) */}
                                    {visibleDimensions.body && (
                                        <path
                                            d={generatePath('body', 250, 800)}
                                            fill="none"
                                            className="stroke-red-500 dark:stroke-[#c084fc] animate-fade-in"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* Spirit (Green) */}
                                    {visibleDimensions.spirit && (
                                        <path
                                            d={generatePath('spirit', 250, 800)}
                                            fill="none"
                                            className="stroke-emerald-500 dark:stroke-[#13ecb6] animate-fade-in"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                </svg>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                Registra más actividad para ver el desglose.
                            </div>
                        )}

                        {/* X-Axis Labels */}
                        <div className="flex justify-between mt-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                            {weekLabels.map((label, i) => (
                                <span key={i} className={i % Math.ceil(weekLabels.length / 5) === 0 ? 'block' : 'hidden md:block'}>{label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Estadisticas;
