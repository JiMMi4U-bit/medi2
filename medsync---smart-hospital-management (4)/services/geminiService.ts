
import { GoogleGenAI, Type } from "@google/genai";
import { TriageResponse } from "../types";

export async function performTriage(symptoms: string): Promise<TriageResponse> {
  // Create a new instance right before the call to ensure the most up-to-date API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these symptoms and provide medical triage advice: "${symptoms}"`,
      config: {
        systemInstruction: "You are a professional medical triage assistant. You help patients identify the correct doctor specialization based on symptoms. Be helpful but always remind them you are an AI and they should consult a professional in emergencies. Return data in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedSpecialization: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            explanation: { type: Type.STRING },
            possibleQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["recommendedSpecialization", "urgency", "explanation", "possibleQuestions"]
        }
      }
    });

    return JSON.parse(response.text) as TriageResponse;
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    
    // Check for the specific error that requires re-selecting the key
    if (e.message?.includes("Requested entity was not found")) {
      if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    
    throw new Error("AI Triage is currently unavailable. Please proceed with manual booking.");
  }
}
