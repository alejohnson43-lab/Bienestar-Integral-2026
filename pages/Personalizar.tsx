import React, { useState, useEffect } from 'react';
import { EncryptedStorage } from '../utils/storage';
import { Dimension } from '../types';
import defaultData from "../assessment_data.json";

interface PersonalizarProps {
    onNavigate: (page: string) => void;
    encryptionKey: string;
}

interface AssessmentItem {
    id: string;
    name: string;
    description: string;
    dimension: string;
    score: number;
}

const Personalizar: React.FC<PersonalizarProps> = ({ onNavigate, encryptionKey }) => {
    const [items, setItems] = useState<AssessmentItem[]>([]);
    const [activeTab, setActiveTab] = useState<Dimension | 'ALL'>('ALL');
    const [hasChanges, setHasChanges] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, [encryptionKey]);

    const loadData = () => {
        // Try to load from storage first
        const stored = EncryptedStorage.getItem('bi_master_data', encryptionKey);

        if (stored && Array.isArray(stored) && stored.length > 0) {
            setItems(stored);
        } else {
            // Fallback to default JSON
            setItems(defaultData as AssessmentItem[]);
        }
        setHasChanges(false);
    };

    const handleDescriptionChange = (id: string, newDescription: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, description: newDescription } : item
        ));
        setHasChanges(true);
    };

    const handleSave = () => {
        EncryptedStorage.setItem('bi_master_data', items, encryptionKey);
        setHasChanges(false);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };

    const handleRestore = () => {
        if (window.confirm('¿Estás seguro de que quieres volver a la configuración original? Se perderán todos tus cambios.')) {
            EncryptedStorage.removeItem('bi_master_data');
            // Reload defaults
            setItems(defaultData as AssessmentItem[]);
            setHasChanges(false);
        }
    };

    const filteredItems = activeTab === 'ALL'
        ? items
        : items.filter(i => i.dimension === activeTab);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-primary text-sm font-bold hover:text-emerald-600 dark:hover:text-white transition-colors w-fit mb-2">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver al Inicio
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Personalizar</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl leading-relaxed">Adapta la aplicación a tu realidad editando las descripciones de los hábitos y evaluaciones.</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 italic">Todas las descripciones están diseñadas de menos a mayor complejidad, lo que aumenta tu oportunidad de lograr establecer un hábito.</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setActiveTab('ALL')}
                    className={`px - 4 py - 2 rounded - full text - xs font - bold whitespace - nowrap transition - all ${activeTab === 'ALL' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-gray-100 dark:bg-surface-highlight text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-highlight/80'} `}
                >
                    Todas
                </button>
                <button
                    onClick={() => setActiveTab(Dimension.Mind)}
                    className={`px - 4 py - 2 rounded - full text - xs font - bold whitespace - nowrap transition - all flex items - center gap - 2 ${activeTab === Dimension.Mind ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-surface-highlight text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-highlight/80'} `}
                >
                    <span className="material-symbols-outlined text-base">psychology</span> Mente
                </button>
                <button
                    onClick={() => setActiveTab(Dimension.Body)}
                    className={`px - 4 py - 2 rounded - full text - xs font - bold whitespace - nowrap transition - all flex items - center gap - 2 ${activeTab === Dimension.Body ? 'bg-red-600 dark:bg-purple-600 text-white shadow-lg shadow-red-500/30 dark:shadow-purple-500/30' : 'bg-gray-100 dark:bg-surface-highlight text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-highlight/80'} `}
                >
                    <span className="material-symbols-outlined text-base">accessibility_new</span> Cuerpo
                </button>
                <button
                    onClick={() => setActiveTab(Dimension.Spirit)}
                    className={`px - 4 py - 2 rounded - full text - xs font - bold whitespace - nowrap transition - all flex items - center gap - 2 ${activeTab === Dimension.Spirit ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 dark:bg-surface-highlight text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-highlight/80'} `}
                >
                    <span className="material-symbols-outlined text-base">self_improvement</span> Espíritu
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <span className={`text - xs font - bold px - 2 py - 1 rounded uppercase tracking - wider ${item.dimension === 'Mente' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                    item.dimension === 'Cuerpo' ? 'bg-red-100 dark:bg-purple-900/30 text-red-700 dark:text-purple-400' :
                                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    } `}>
                                    {item.dimension}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">{item.name}</span>
                            </div>
                            <div className="flex gap-1">
                                {[...Array(item.score)].map((_, i) => (
                                    <div key={i} className={`size - 2 rounded - full ${item.dimension === 'Mente' ? 'bg-blue-400' :
                                        item.dimension === 'Cuerpo' ? 'bg-red-400 dark:bg-purple-400' :
                                            'bg-emerald-400'
                                        } `}></div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                value={item.description}
                                onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#10221d] border border-gray-200 dark:border-surface-highlight rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none min-h-[80px]"
                            />
                            <div className="absolute right-3 bottom-3 pointer-events-none text-gray-400 text-xs">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fixed Action Bar */}
            {/* Fixed Action Bar */}
            <div className={`fixed bottom-0 left-0 w-full bg-white/80 dark:bg-[#0a1612]/90 backdrop-blur-md border-t border-gray-200 dark:border-surface-highlight p-4 z-50 transition-transform duration-300 ${hasChanges ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
                    <span className="text-slate-900 dark:text-white font-bold">Tienes cambios sin guardar</span>
                    <div className="flex gap-4">
                        <button
                            onClick={loadData}
                            className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-xl bg-primary text-background-dark font-bold hover:bg-[#0fd6a4] transition-all transform hover:scale-105"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>

            {/* Restore Default Button (Bottom of page) */}
            <div className="flex justify-center mt-8 pb-10">
                <button
                    onClick={handleRestore}
                    className="flex items-center gap-2 text-red-500/70 hover:text-red-500 dark:text-red-400/50 dark:hover:text-red-400 text-sm font-bold transition-colors px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <span className="material-symbols-outlined">restart_alt</span>
                    Restaurar Configuración Original
                </button>
            </div>

            {/* Success Toast */}
            {showSaveSuccess && (
                <div className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in z-50">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-bold">¡Cambios guardados con éxito!</span>
                </div>
            )}
        </div>
    );
};

export default Personalizar;
