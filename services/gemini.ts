import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // 1. Try Local Storage (User provided key)
  const localKey = localStorage.getItem('bi_api_key');
  if (localKey && localKey.length > 10) return localKey;

  // 2. Try Environment Variables (Dev/Deploy provided key)
  const envKey = process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY;

  if (!envKey) {
    console.warn("GEMINI_API_KEY is missing/undefined in process.env and localStorage");
    return "";
  }

  return envKey;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const OFFLINE_TIPS = [
  "Respira profundamente tres veces y conecta con tu interior.",
  "Bebe un vaso de agua antes de tu próxima comida.",
  "Tómate 5 minutos para estirar tu cuerpo.",
  "Agradece por tres cosas pequeñas hoy.",
  "La consistencia es más importante que la intensidad.",
  "Escucha a tu cuerpo, él sabe lo que necesita.",
  "Desconecta de las pantallas una hora antes de dormir."
];

const OFFLINE_QUOTES = [
  "La constancia es el puente entre tus metas y tus logros.",
  "Cree que puedes y ya estarás a medio camino.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "No cuentes los días, haz que los días cuenten.",
  "La única forma de hacer un gran trabajo es amar lo que haces.",
  "Tu bienestar es una prioridad, no un lujo.",
  "Cada paso cuenta, por pequeño que sea."
];

const getRandomOffline = (list: string[]) => list[Math.floor(Math.random() * list.length)];

export const generateDailyTip = async (userName: string, focusArea: string): Promise<string> => {
  if (!navigator.onLine) {
    return getRandomOffline(OFFLINE_TIPS);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Generate a short, inspiring daily wellness tip for ${userName}, focusing on ${focusArea}. Keep it under 20 words.Language: Spanish.`,
    });
    return response.text?.trim() || getRandomOffline(OFFLINE_TIPS);
  } catch (error) {
    console.error("Error generating tip:", error);
    return getRandomOffline(OFFLINE_TIPS);
  }
};

export const generateMotivationalQuote = async (): Promise<string> => {
  if (!navigator.onLine) {
    return getRandomOffline(OFFLINE_QUOTES);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Generate a short, inspiring benevolent quote about perseverance, wellness, or mindfulness.Keep it under 25 words.Language: Spanish.Just the quote text.`,
    });
    return response.text?.trim() || getRandomOffline(OFFLINE_QUOTES);
  } catch (error) {
    console.error("Error generating quote:", error);
    return getRandomOffline(OFFLINE_QUOTES);
  }
};

export const analyzeAssessment = async (scores: any): Promise<string> => {
  if (!navigator.onLine) return "Has dado el primer paso hacia el bienestar. Enfócate en mejorar tu descanso esta semana.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Analyze these wellness scores(1 - 3 scale): ${JSON.stringify(scores)}. Provide a brief 2 - sentence encouraging summary and one key area to focus on.Language: Spanish.`,
    });
    return response.text?.trim() || "Has dado el primer paso hacia el bienestar. Enfócate en mejorar tu descanso esta semana.";
  } catch (error) {
    console.error("Error analyzing assessment:", error);
    return "Gran trabajo completando tu evaluación. Revisa tus resultados para ver dónde puedes mejorar.";
  }
};

export const askWellnessCoach = async (query: string): Promise<string> => {
  if (!navigator.onLine) return "Sin conexión a internet. Por favor verifica tu red para hablar con Aura.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a helpful, empathetic wellness coach named 'Aura'. Answer briefly and supportively in Spanish."
      }
    });
    return response.text?.trim() || "Lo siento, no puedo conectarme con mi sabiduría interior en este momento. Intenta de nuevo más tarde.";
  } catch (error) {
    console.error("Error asking coach:", error);
    return "Hubo un error al procesar tu consulta.";
  }
};
