
import React from 'react';

interface WelcomeProps {
    onEnter: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onEnter }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background-dark">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-2xl flex flex-col items-center text-center gap-8 animate-fade-in relative z-10">
                <div className="flex flex-col gap-4 items-center">
                    <div className="size-20 rounded-full bg-[#00A57C] flex items-center justify-center shrink-0 border border-white/10 shadow-lg mb-4">
                        <span className="text-white font-black text-2xl tracking-tight leading-none">BI</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight text-white">
                        Bienestar Integral
                    </h1>
                    <p className="text-gray-400 text-lg sm:text-xl font-normal leading-relaxed max-w-lg">
                        Tu espacio personal para el crecimiento, la calma y el autodescubrimiento.
                    </p>
                </div>

                <button
                    onClick={onEnter}
                    className="relative flex items-center justify-center overflow-hidden rounded-full bg-primary h-16 px-12 text-background-dark text-lg font-bold tracking-wide hover:bg-[#0fd6a4] hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(19,236,182,0.3)] group mt-8"
                >
                    <span className="z-10 flex items-center gap-2">
                        Comenzar Experiencia
                        <span className="material-symbols-outlined text-[24px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </span>
                </button>

                <div className="flex justify-center gap-2 mt-8 opacity-50">
                    <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;
