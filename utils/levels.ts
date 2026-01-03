
export const getLevelTitle = (weekCount: number): string => {
    if (weekCount <= 5) return "🌱 Semilla";
    if (weekCount <= 10) return "🌿 Brote";
    if (weekCount <= 15) return "🔍 Buscador";
    if (weekCount <= 20) return "👣 Caminante";
    if (weekCount <= 30) return "🧗 Escalador";
    if (weekCount <= 40) return "⚔️ Guerrero";
    if (weekCount <= 50) return "🛡️ Guardián";
    if (weekCount <= 60) return "🧘 Maestro";
    if (weekCount <= 75) return "🦉 Sabio";
    return "👑 Leyenda";
};

export const getLevelImage = (weekCount: number): string => {
    // Unsplash images representing growth stages
    if (weekCount <= 5) return "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2674&auto=format&fit=crop"; // Seed/Sprout (Existing) or similar
    if (weekCount <= 10) return "https://images.unsplash.com/photo-1594903337968-3cb2ae342ae9?q=80&w=2670&auto=format&fit=crop"; // Small plant
    if (weekCount <= 15) return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop"; // Forest path (Buscador)
    if (weekCount <= 20) return "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2670&auto=format&fit=crop"; // Hiking/Walker (Caminante)
    if (weekCount <= 30) return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670&auto=format&fit=crop"; // Mountains (Escalador)
    if (weekCount <= 40) return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop"; // Strength/Workout (Guerrero)
    if (weekCount <= 50) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2673&auto=format&fit=crop"; // Lighthouse/Beach (Guardian - Steady)
    if (weekCount <= 60) return "https://images.unsplash.com/photo-1528747045269-390fe33c19f2?q=80&w=2670&auto=format&fit=crop"; // Zen/Balance (Maestro)
    if (weekCount <= 75) return "https://images.unsplash.com/photo-1519681393784-d8e5b5a45742?q=80&w=2670&auto=format&fit=crop"; // Ancient Tree/Wisdom (Sabio)
    return "https://images.unsplash.com/photo-1519681393784-d8e5b5a45742?q=80&w=2670&auto=format&fit=crop"; // Starry Night/Peak (Leyenda)
};
