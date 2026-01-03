import React, { useState, useEffect } from 'react';
import { Dimension } from '../types';
import { EncryptedStorage } from '../utils/storage';

interface HabitEntry {
    id: string;
    dimension: Dimension;
    subCategory: string;
    title: string;
    description: string;
    status: 'En proceso' | 'Cumplido' | 'Eliminado';
    week: string;
    icon: string;
    dateAdded: string; // ISO date string for tracking in statistics
}

const MOCK_HABITS: HabitEntry[] = [
    { id: '1', dimension: Dimension.Mind, subCategory: 'Salud Mental', title: 'Practica la gratitud', description: '3 min diarios • Escribir 3 cosas positivas', status: 'En proceso', week: 'Semana 4', icon: 'psychology', dateAdded: '2024-01-15' },
    { id: '2', dimension: Dimension.Body, subCategory: 'Movimiento', title: 'Caminar al aire libre', description: '30 min • Paso moderado', status: 'Cumplido', week: 'Semana 1', icon: 'directions_run', dateAdded: '2024-01-08' },
    { id: '3', dimension: Dimension.Spirit, subCategory: 'Meditación', title: 'Meditación guiada', description: '10 min • Enfoque en respiración', status: 'En proceso', week: 'Semana 3', icon: 'self_improvement', dateAdded: '2024-01-12' },
    { id: '4', dimension: Dimension.Mind, subCategory: 'Lectura', title: 'Leer 5 páginas', description: 'Antes de dormir', status: 'Eliminado', week: 'Semana 2', icon: 'menu_book', dateAdded: '2024-01-10' },
    { id: '5', dimension: Dimension.Body, subCategory: 'Nutrición', title: 'Hidratación consciente', description: 'Beber 2L de agua diarios', status: 'Cumplido', week: 'Semana 4', icon: 'water_drop', dateAdded: '2024-01-14' },
    { id: '6', dimension: Dimension.Spirit, subCategory: 'Conexión', title: 'Llamar a un amigo', description: 'Fortalecer vínculos', status: 'En proceso', week: 'Semana 4', icon: 'call', dateAdded: '2024-01-16' },
    { id: '7', dimension: Dimension.Body, subCategory: 'Descanso', title: 'Desconexión digital', description: '1h antes de dormir', status: 'En proceso', week: 'Semana 4', icon: 'bedtime', dateAdded: '2024-01-13' },
    { id: '8', dimension: Dimension.Mind, subCategory: 'Aprendizaje', title: 'Podcast educativo', description: 'Escuchar durante el trayecto', status: 'Cumplido', week: 'Semana 3', icon: 'headphones', dateAdded: '2024-01-11' },
];

const PasaporteHabitos: React.FC<{ onNavigate: (page: string) => void; encryptionKey: string }> = ({ onNavigate, encryptionKey }) => {
    const [filter, setFilter] = useState('Todos');
    const [habits, setHabits] = useState<HabitEntry[]>([]);
    const [weekCount, setWeekCount] = useState(1);
    const [stats, setStats] = useState({ completed: 0, inProgress: 0, deleted: 0 });

    // Load habits from storage
    useEffect(() => {
        if (encryptionKey) {
            const passportHabits = EncryptedStorage.getItem('bi_passport_habits', encryptionKey) || [];

            // Use global week count for the display card
            const globalWeek = EncryptedStorage.getItem('bi_week_count', encryptionKey) || 1;
            setWeekCount(globalWeek);

            // For demo/dev purposes, merge if you want, but strictly speaking we should prioritize storage
            // const allHabits = [...MOCK_HABITS, ...passportHabits];
            // Using logic from other pages: source of truth from storage
            // If storage is empty, fallback to mock is acceptable for demo, but let's stick to storage primarily or merge if needed.
            // Based on user request "Registra la información... en la lista", assuming we want to see what's in storage.
            // Let's use storage + mock if storage is empty to avoid empty screen initially? 
            // Better to follow pattern: load storage.
            // Better to follow pattern: load storage.
            // BUG FIX: Removed fallback to MOCK_HABITS to allow "Reiniciar historia" to work correctly.
            // If storage is empty (after reset), the list should be empty.
            setHabits(passportHabits);

            // Calculate stats
            setStats({
                completed: passportHabits.filter((h: any) => h.status === 'Cumplido').length,
                inProgress: passportHabits.filter((h: any) => h.status === 'En proceso').length,
                deleted: passportHabits.filter((h: any) => h.status === 'Eliminado').length
            });

        } else {
            // If no encryption key (logged out/error), show empty or mock? 
            // Safer to show empty to avoid confusion, or keep mock for dev preview only if really needed.
            // For consistency with "Reiniciar", let's clear it or keep mock ONLY if NOT logged in.
            // But here we are likely logged in but key might be missing momentarily? 
            // In this app context, if no key, we probably shouldn't show user data.
            setHabits([]);
            setStats({ completed: 0, inProgress: 0, deleted: 0 });
        }
    }, [encryptionKey]);

    const filteredHabits = habits.filter(h => {
        if (filter === 'Todos') return true;
        if (filter === 'Cumplidos') return h.status === 'Cumplido';
        if (filter === 'En proceso') return h.status === 'En proceso';
        if (filter === 'Eliminados') return h.status === 'Eliminado';
        return true;
    });

    // Helper for status styles
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'En proceso': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20';
            case 'Cumplido': return 'text-emerald-700 dark:text-primary bg-emerald-100 dark:bg-primary/10 border-emerald-200 dark:border-primary/20';
            case 'Eliminado': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 border-red-200 dark:border-red-400/20';
            default: return 'text-gray-400';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'En proceso': return 'bg-yellow-500 dark:bg-yellow-400';
            case 'Cumplido': return 'bg-emerald-600 dark:bg-primary';
            case 'Eliminado': return 'bg-red-500 dark:bg-red-400';
            default: return 'bg-gray-400';
        }
    }

    const getDimensionIcon = (dim: Dimension) => {
        switch (dim) {
            case Dimension.Mind: return { color: 'text-blue-600 dark:text-primary', bg: 'bg-blue-100 dark:bg-[#1a2e29]' };
            case Dimension.Body: return { color: 'text-red-600 dark:text-blue-400', bg: 'bg-red-100 dark:bg-[#1a252a]' };
            case Dimension.Spirit: return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-[#251a2a]' };
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in h-full pb-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-primary text-sm font-bold hover:text-emerald-600 dark:hover:text-white transition-colors w-fit mb-2">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver al Inicio
                </button>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Pasaporte de Hábitos</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl leading-relaxed">Gestiona tu viaje hacia el bienestar integral. Aquí puedes ver el historial de todas las actividades sugeridas y tu progreso semanal.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Card 1 */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-emerald-300 dark:hover:border-primary/30 transition-colors rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-44 shadow-lg shadow-gray-200/50 dark:shadow-lg dark:shadow-black/20">
                    <div className="flex justify-between items-start z-10">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            SEMANA ACTUAL
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-100 dark:text-surface-highlight text-[80px] opacity-50 dark:opacity-20 absolute -top-2 -right-2 pointer-events-none">calendar_month</span>
                    <div className="z-10">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white block mb-4">Semana {weekCount}</span>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-[#11221e] rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_10px_rgba(19,236,182,0.4)]"></div>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div
                    onClick={() => setFilter(filter === 'Cumplidos' ? 'Todos' : 'Cumplidos')}
                    className={`bg-white dark:bg-surface-dark border transition-all rounded-2xl p-6 flex flex-col justify-between h-44 shadow-lg shadow-gray-200/50 dark:shadow-lg dark:shadow-black/20 cursor-pointer group ${filter === 'Cumplidos' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-surface-highlight hover:border-emerald-300 dark:hover:border-primary/30'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-background-dark text-sm font-bold">check</span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-bold group-hover:text-primary transition-colors">Cumplidas</span>
                    </div>
                    <div>
                        <span className="text-5xl font-bold text-slate-900 dark:text-white block mb-1">{stats.completed}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Actividades finalizadas</span>
                    </div>
                </div>

                {/* Card 3 */}
                <div
                    onClick={() => setFilter(filter === 'En proceso' ? 'Todos' : 'En proceso')}
                    className={`bg-white dark:bg-surface-dark border transition-all rounded-2xl p-6 flex flex-col justify-between h-44 shadow-lg shadow-gray-200/50 dark:shadow-lg dark:shadow-black/20 cursor-pointer group ${filter === 'En proceso' ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-200 dark:border-surface-highlight hover:border-yellow-300 dark:hover:border-yellow-400/30'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-background-dark text-sm font-bold">more_horiz</span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-bold group-hover:text-yellow-500 transition-colors">En proceso</span>
                    </div>
                    <div>
                        <span className="text-5xl font-bold text-slate-900 dark:text-white block mb-1">{stats.inProgress}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Activas esta semana</span>
                    </div>
                </div>

                {/* Card 4 */}
                <div
                    onClick={() => setFilter(filter === 'Eliminados' ? 'Todos' : 'Eliminados')}
                    className={`bg-white dark:bg-surface-dark border transition-all rounded-2xl p-6 flex flex-col justify-between h-44 shadow-lg shadow-gray-200/50 dark:shadow-lg dark:shadow-black/20 cursor-pointer group ${filter === 'Eliminados' ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 dark:border-surface-highlight hover:border-red-300 dark:hover:border-red-400/30'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-red-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-background-dark text-sm font-bold">delete</span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-bold group-hover:text-red-500 transition-colors">Eliminadas</span>
                    </div>
                    <div>
                        <span className="text-5xl font-bold text-slate-900 dark:text-white block mb-1">{stats.deleted}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Descartadas del plan</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {['Todos', 'En proceso', 'Cumplidos', 'Eliminados'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-primary text-background-dark shadow-md shadow-primary/20' : 'bg-white dark:bg-surface-dark text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface-highlight border border-gray-100 dark:border-transparent'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* List / Table */}
            <div className="flex-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-3xl overflow-hidden flex flex-col min-h-[500px] shadow-xl shadow-gray-200/50 dark:shadow-2xl dark:shadow-black/20">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-200 dark:border-surface-highlight bg-gray-50 dark:bg-[#1a2522] text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    <div className="col-span-4 md:col-span-3">Dimensión</div>
                    <div className="col-span-4 md:col-span-4">Actividad Sugerida</div>
                    <div className="col-span-2 md:col-span-3 text-center md:text-left">Estado</div>
                    <div className="col-span-2 md:col-span-2 text-right md:text-left">Ruta</div>
                </div>

                {/* Scrollable Rows */}
                <div className="flex-1 overflow-y-auto">
                    {filteredHabits.map((habit) => {
                        const dimStyles = getDimensionIcon(habit.dimension);
                        const statusStyle = getStatusStyle(habit.status);
                        const statusDot = getStatusDot(habit.status);

                        return (
                            <div key={habit.id} className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-100 dark:border-surface-highlight/40 hover:bg-gray-50 dark:hover:bg-surface-highlight/10 transition-colors items-center group">
                                {/* Dimension */}
                                <div className="col-span-4 md:col-span-3 flex items-center gap-4">
                                    <div className={`size-10 rounded-full ${dimStyles.bg} flex items-center justify-center shrink-0`}>
                                        <span className={`material-symbols-outlined ${dimStyles.color}`}>{habit.icon}</span>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-slate-900 dark:text-white font-bold text-sm">{habit.dimension}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">{habit.subCategory}</p>
                                    </div>
                                </div>

                                {/* Activity */}
                                <div className="col-span-4 md:col-span-4">
                                    <p className="text-slate-900 dark:text-white font-bold text-sm mb-1 line-clamp-1">{habit.title}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">{habit.description}</p>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 md:col-span-3 flex justify-center md:justify-start">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] md:text-xs font-bold whitespace-nowrap ${statusStyle}`}>
                                        <div className={`size-1.5 rounded-full ${statusDot}`}></div>
                                        <span className="hidden md:inline">{habit.status}</span>
                                    </div>
                                </div>

                                {/* Route & Action */}
                                <div className="col-span-2 md:col-span-2 flex items-center justify-end md:justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span className="material-symbols-outlined text-lg">show_chart</span>
                                        <span className="text-xs font-medium hidden md:inline">{habit.week}</span>
                                    </div>
                                    <button className="text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Pagination Footer */}
                <div className="border-t border-gray-200 dark:border-surface-highlight p-4 flex justify-between items-center bg-gray-50 dark:bg-[#1a2522] text-xs text-gray-500 dark:text-gray-400">
                    <span>Mostrando {filteredHabits.length} de 18 hábitos</span>
                    <div className="flex gap-2">
                        <button className="size-8 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="size-8 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-surface-highlight hover:text-slate-900 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasaporteHabitos;
