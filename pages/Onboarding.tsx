import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (name: string, pin: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '', '', '']); // 8 digit pin
  const [showPin, setShowPin] = useState(false);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto focus next
    if (value && index < 7) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const finish = () => {
    if (pin.every(d => d !== '')) {
      onComplete(name, pin.join(''));
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background-dark">
        {/* Background Decor */}
        <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[520px] flex flex-col gap-8 animate-fade-in relative z-10">
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white">
              Bienvenido a tu espacio de calma
            </h2>
            <p className="text-gray-400 text-lg font-normal leading-relaxed">
              Para comenzar este viaje juntos, nos gustaría saber cómo dirigirmos a ti.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl bg-surface-dark p-6 sm:p-8 shadow-xl border border-surface-highlight">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-none text-gray-300" htmlFor="name-input">
                ¿Cómo te gustaría que te llamemos?
              </label>
              <div className="relative group">
                <input
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex w-full rounded-xl border border-surface-highlight bg-background-dark px-4 h-14 text-base text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200"
                  id="name-input"
                  placeholder="Escribe tu nombre aquí"
                  type="text"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined">edit</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">info</span>
              <p className="text-sm text-gray-300 leading-normal">
                Usaremos esto únicamente para personalizar tus mensajes de bienvenida y guiarte en tu proceso.
              </p>
            </div>

            <button
              onClick={() => name && setStep(2)}
              disabled={!name}
              className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary h-14 px-8 text-background-dark text-base font-bold tracking-wide hover:bg-[#0fd6a4] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
            >
              <span className="z-10 flex items-center gap-2">
                Continuar
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </span>
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <div className="h-1.5 w-8 rounded-full bg-primary"></div>
            <div className="h-1.5 w-2 rounded-full bg-surface-highlight"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-lg flex flex-col bg-surface-dark border border-surface-highlight rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
          <div className="size-16 rounded-full bg-surface-highlight flex items-center justify-center mb-6 shadow-lg shadow-primary/10 border border-white/5">
            <span className="material-symbols-outlined text-primary text-3xl">lock</span>
          </div>
          <h2 className="text-white tracking-tight text-2xl font-bold leading-tight mb-3">Establecer PIN de Seguridad</h2>
          <p className="text-text-secondary text-sm font-normal leading-relaxed max-w-sm mx-auto">
            Es necesario configurar un PIN de 8 dígitos para cifrar/descifrar los datos en este dispositivo.
          </p>
        </div>

        <div className="px-6 sm:px-8 py-4 w-full flex flex-col items-center">
          <div className="flex justify-center gap-1 sm:gap-2 mb-6 w-full overflow-x-auto py-2">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                className="w-8 h-12 sm:w-10 sm:h-14 text-center bg-[#1a352f] border border-surface-highlight rounded-lg text-white text-xl font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner placeholder-white/10"
                inputMode="numeric"
                maxLength={1}
                type={showPin ? "text" : "password"}
                placeholder="•"
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          <div
            className="flex items-center gap-2 mb-6 cursor-pointer group select-none"
            onClick={() => setShowPin(!showPin)}
          >
            <span className="material-symbols-outlined text-text-secondary text-sm group-hover:text-primary transition-colors">
              {showPin ? 'visibility_off' : 'visibility'}
            </span>
            <span className="text-text-secondary text-xs font-medium group-hover:text-primary transition-colors">
              Mostrar PIN momentáneamente
            </span>
          </div>

          <button
            onClick={finish}
            disabled={pin.some(d => d === '')}
            className="w-full flex items-center justify-center rounded-xl h-12 bg-primary text-background-dark text-sm font-bold tracking-wide hover:bg-[#0fd6a3] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(19,236,182,0.15)] mb-4"
          >
            Confirmar PIN
          </button>

          <button onClick={() => setStep(1)} className="text-text-secondary text-xs hover:text-white mb-2">
            Volver
          </button>
        </div>

        <div className="bg-surface-highlight/30 py-2 px-4 flex items-center justify-center gap-2 border-t border-surface-highlight">
          <span className="material-symbols-outlined text-emerald-500 text-[16px]">shield</span>
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Encriptación Local AES-256</span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
