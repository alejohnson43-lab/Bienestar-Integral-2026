import React, { useState, useEffect } from 'react';
import { AssessmentArea, Dimension } from '../types';
import { analyzeAssessment } from '../services/gemini';

interface AssessmentProps {
  onComplete: () => void;
  encryptionKey: string;
}

import { EncryptedStorage } from '../utils/storage';

import defaultData from '../assessment_data.json';

const Assessment: React.FC<AssessmentProps> = ({ onComplete, encryptionKey }) => {
  const [masterData, setMasterData] = useState<any[]>([]);
  const [areas, setAreas] = useState<AssessmentArea[]>([]);

  const [hasSubmitted, setHasSubmitted] = useState(() => {
    return EncryptedStorage.getItem('bi_has_submitted', encryptionKey) || false;
  });

  const [lastSubmittedAreas, setLastSubmittedAreas] = useState<AssessmentArea[]>([]);

  // Load master data logic
  useEffect(() => {
    if (encryptionKey) {
      const stored = EncryptedStorage.getItem('bi_master_data', encryptionKey);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setMasterData(stored);
        console.log('📚 Master Data Loaded (Custom):', stored.length, 'entries');
      } else {
        // Fallback to JSON
        setMasterData(defaultData);
        console.log('📚 Master Data Loaded (Default):', defaultData.length, 'entries');
      }
    }
  }, [encryptionKey]);

  // Generate areas from master data
  useEffect(() => {
    if (masterData.length > 0 && areas.length === 0) {
      // Extract unique area names per dimension
      const uniqueAreas = new Map<string, AssessmentArea>();

      masterData.forEach((item, index) => {
        const key = `${item.dimension}_${item.name}`;
        if (!uniqueAreas.has(key)) {
          uniqueAreas.set(key, {
            id: `area_${index}`,
            name: item.name,
            description: '',
            dimension: item.dimension as Dimension,
            score: 0
          });
        }
      });

      const generatedAreas = Array.from(uniqueAreas.values());

      // Try to load saved evaluation
      const saved = EncryptedStorage.getItem('bi_user_evaluation', encryptionKey);
      if (saved && Array.isArray(saved)) {
        // Merge saved scores with generated areas
        const mergedAreas = generatedAreas.map(area => {
          const savedArea = saved.find(s =>
            s.name.toLowerCase() === area.name.toLowerCase() &&
            s.dimension === area.dimension
          );
          return savedArea ? { ...area, score: savedArea.score } : area;
        });
        setAreas(mergedAreas);
        setLastSubmittedAreas(mergedAreas);
      } else {
        setAreas(generatedAreas);
        setLastSubmittedAreas(generatedAreas);
      }

      console.log('✨ Generated Areas:', generatedAreas.length);
    }
  }, [masterData, encryptionKey]);

  // Save areas when they change
  useEffect(() => {
    if (areas.length > 0) {
      EncryptedStorage.setItem('bi_user_evaluation', areas, encryptionKey);
    }
  }, [areas, encryptionKey]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Check if assessment is locked
  useEffect(() => {
    if (encryptionKey) {
      const locked = EncryptedStorage.getItem('bi_assessment_locked', encryptionKey) || false;
      setIsLocked(locked);
    }
  }, [encryptionKey]);

  const handleScore = (id: string, score: number) => {
    setAreas(prev => prev.map(area => area.id === id ? { ...area, score } : area));
  };

  // Check if evaluation has changed since last submit
  const hasChangedSinceSubmit = () => {
    return areas.some(area => {
      const lastArea = lastSubmittedAreas.find(la => la.id === area.id);
      return area.score !== lastArea?.score;
    });
  };

  const completedCount = areas.filter(a => a.score > 0).length;
  const progress = (completedCount / areas.length) * 100;

  // Calculate dimension averages
  const getDimensionAvg = (dimension: Dimension) => {
    const dimAreas = areas.filter(a => a.dimension === dimension);
    const total = dimAreas.reduce((sum, a) => sum + (a.score || 0), 0);
    return dimAreas.length > 0 ? (total / dimAreas.length).toFixed(1) : '0.0';
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Save all data explicitly
      EncryptedStorage.setItem('bi_user_evaluation', areas, encryptionKey);
      EncryptedStorage.setItem('bi_has_submitted', true, encryptionKey);
      EncryptedStorage.setItem('bi_streak_count', 1, encryptionKey);
      EncryptedStorage.setItem('bi_plan_diario_enabled', true, encryptionKey);
      EncryptedStorage.setItem('bi_assessment_locked', true, encryptionKey);
      EncryptedStorage.setItem('bi_nuevo_plan_enabled', false, encryptionKey);
      EncryptedStorage.removeItem('bi_weekly_habits'); // Reset habits

      setHasSubmitted(true);
      setLastSubmittedAreas(areas);
      setIsLocked(true); // Update local state immediately to reflect lock

      console.log('✅ Evaluación enviada correctamente.');

      // Proceed after delay
      setTimeout(() => {
        setIsSubmitting(false);
        onComplete();
      }, 1000);

    } catch (error) {
      console.error("❌ Error al enviar evaluación:", error);
      setIsSubmitting(false);
      alert("Hubo un error al guardar tu evaluación. Por favor intenta de nuevo.");
    }
  };

  const renderSection = (dimension: Dimension, colorClass: string, icon: string) => (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-2">
        <span className={`material-symbols-outlined ${colorClass} text-2xl`}>{icon}</span>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{dimension}</h3>
        <div className="ml-auto bg-gray-100 dark:bg-surface-highlight px-3 py-1 rounded-lg">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Promedio: {getDimensionAvg(dimension)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {areas.filter(a => a.dimension === dimension).map(area => (
          <div key={area.id} className="group bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight hover:border-primary/50 dark:hover:border-[#32675a] rounded-xl p-5 transition-all shadow-sm dark:shadow-none">
            <div className="mb-4">
              <h4 className="text-slate-900 dark:text-white font-semibold text-lg mb-1">{area.name}</h4>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleScore(area.id, 1)}
                className={`flex-1 py-2 rounded-lg border transition-all flex flex-col items-center gap-1 group/btn ${area.score === 1
                  ? 'bg-red-100 dark:bg-rating-bad/20 border-red-200 dark:border-rating-bad text-red-600 dark:text-rating-bad'
                  : 'bg-gray-50 dark:bg-[#11221e] border-transparent hover:border-red-200 dark:hover:border-rating-bad/50 text-gray-400 hover:text-red-500 dark:hover:text-rating-bad'
                  }`}
              >
                <span className={`material-symbols-outlined text-xl ${area.score === 1 ? 'filled' : ''}`}>sentiment_dissatisfied</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">Malo</span>
              </button>
              <button
                onClick={() => handleScore(area.id, 2)}
                className={`flex-1 py-2 rounded-lg border transition-all flex flex-col items-center gap-1 group/btn ${area.score === 2
                  ? 'bg-yellow-100 dark:bg-rating-avg/20 border-yellow-200 dark:border-rating-avg text-yellow-600 dark:text-rating-avg'
                  : 'bg-gray-50 dark:bg-[#11221e] border-transparent hover:border-yellow-200 dark:hover:border-rating-avg/50 text-gray-400 hover:text-yellow-600 dark:hover:text-rating-avg'
                  }`}
              >
                <span className={`material-symbols-outlined text-xl ${area.score === 2 ? 'filled' : ''}`}>sentiment_neutral</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">Regular</span>
              </button>
              <button
                onClick={() => handleScore(area.id, 3)}
                className={`flex-1 py-2 rounded-lg border transition-all flex flex-col items-center gap-1 group/btn ${area.score === 3
                  ? 'bg-emerald-100 dark:bg-rating-good/20 border-emerald-200 dark:border-rating-good text-emerald-600 dark:text-rating-good'
                  : 'bg-gray-50 dark:bg-[#11221e] border-transparent hover:border-emerald-200 dark:hover:border-rating-good/50 text-gray-400 hover:text-emerald-500 dark:hover:text-rating-good'
                  }`}
              >
                <span className={`material-symbols-outlined text-xl ${area.score === 3 ? 'filled' : ''}`}>sentiment_satisfied</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">Bien</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );



  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      {isLocked ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Evaluación Completada</h2>
          <p className="text-gray-600 dark:text-text-secondary max-w-md mb-6">
            Ya has completado tu evaluación de bienestar. Tu plan semanal está activo.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para modificar tu estrategia, ve a <strong>Plan Semanal</strong>
          </p>
        </div>
      ) : areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="size-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6">
            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No hay datos de evaluación</h2>
          <p className="text-gray-600 dark:text-text-secondary max-w-md mb-6">
            El administrador debe subir el archivo <code className="bg-gray-100 dark:bg-surface-highlight px-2 py-1 rounded text-sm">assessment_data.json</code> para que puedas completar tu evaluación.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dirígete a <strong>Configuración → Actualización (Admin)</strong>
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-gray-200 dark:border-surface-highlight sticky top-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur z-20 pt-2">
            <div className="flex flex-col gap-3 max-w-2xl">
              <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                Evaluación de Bienestar
              </h2>
              <p className="text-gray-600 dark:text-text-secondary text-base md:text-lg font-normal leading-relaxed">
                Califica tu estado actual para encontrar tu equilibrio. Sé honesto contigo mismo.
              </p>
            </div>
            <div className="w-full md:w-auto min-w-[280px] bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-surface-highlight shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">Progreso</span>
                <span className="text-sm font-bold text-primary">{completedCount}/{areas.length}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-[#11221e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(19,236,182,0.4)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {renderSection(Dimension.Mind, 'text-blue-500 dark:text-blue-400', 'psychology')}
            {renderSection(Dimension.Body, 'text-red-500 dark:text-red-400', 'cardiology')}
            {renderSection(Dimension.Spirit, 'text-yellow-500 dark:text-yellow-400', 'self_improvement')}
          </div>

          {/* Floating Action */}
          <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30 pointer-events-none">
            <div className="w-full max-w-md pointer-events-auto shadow-2xl">
              <button
                onClick={handleSubmit}
                disabled={completedCount < areas.length || isSubmitting || (hasSubmitted && !hasChangedSinceSubmit())}
                className="group disabled:opacity-50 disabled:cursor-not-allowed w-full h-14 bg-emerald-600 dark:bg-surface-highlight text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:bg-emerald-500 dark:hover:bg-primary dark:hover:text-background-dark hover:shadow-[0_0_30px_rgba(19,236,182,0.4)] border border-white/10"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">refresh</span>
                    Analizando...
                  </>
                ) : (
                  <>
                    <span>Evaluar Bienestar</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
              {completedCount < areas.length && (
                <p className="text-xs text-center text-gray-500 mt-2 font-medium bg-white/80 dark:bg-black/60 py-1 rounded backdrop-blur-md">
                  Completa las {areas.length} áreas para finalizar
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Assessment;
