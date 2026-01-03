
import React, { useState } from 'react';

interface LoginProps {
    onLogin: (pin: string) => boolean; // Return success/fail
    onClearData: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onClearData }) => {
    const [pin, setPin] = useState(['', '', '', '', '', '', '', '']);
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError('');

        // Auto focus next
        if (value && index < 7) {
            const nextInput = document.getElementById(`login-pin-${index + 1}`);
            nextInput?.focus();
        }

        // Auto submit if complete
        if (newPin.every(d => d !== '')) {
            const enteredPin = newPin.join('');
            // Attempt login synchronously
            const success = onLogin(enteredPin);
            if (!success) {
                setError('PIN incorrecto o datos corruptos');
                // Clear pin on error for security? Or just let them retry.
                // Leaving it allows user to fix one digit.
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`login-pin-${index - 1}`);
            prevInput?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark backdrop-blur-sm">
            <div className="relative w-full max-w-lg flex flex-col bg-surface-dark border border-surface-highlight rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
                    {/* Lock Icon */}
                    <div
                        className="size-20 rounded-full bg-surface-highlight flex items-center justify-center mb-6 shadow-lg shadow-primary/10 border-2 border-primary"
                    >
                        <span className="material-symbols-outlined text-primary text-4xl">lock</span>
                    </div>

                    <h2 className="text-white tracking-tight text-3xl font-bold leading-tight mb-2">Bienvenido de nuevo</h2>
                    <p className="text-text-secondary text-sm font-normal leading-relaxed max-w-sm mx-auto">
                        Tus datos están encriptados con seguridad alta. Ingresa tu PIN para desbloquearlos.
                    </p>
                </div>

                <div className="px-6 sm:px-8 py-4 w-full flex flex-col items-center">
                    <div className="flex justify-center gap-1 sm:gap-2 mb-6 w-full overflow-x-auto py-2">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                id={`login-pin-${index}`}
                                className={`w-8 h-12 sm:w-10 sm:h-14 text-center bg-[#1a352f] border ${error ? 'border-red-500 text-red-400' : 'border-surface-highlight text-white'} rounded-lg text-xl font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner placeholder-white/10`}
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={1}
                                type={showPin ? "text" : "password"}
                                placeholder="•"
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm font-bold mb-4 animate-bounce">
                            {error}
                        </p>
                    )}

                    <div
                        className="flex items-center gap-2 mb-8 cursor-pointer group select-none"
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
                        onClick={onClearData}
                        className="text-gray-500 hover:text-red-400 text-xs transition-colors flex items-center gap-1 mt-4"
                    >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        Olvidé mi PIN / Reiniciar todo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
