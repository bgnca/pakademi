
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates a comprehensive training plan using Gemini 3 Pro with Search Grounding.
 * It searches for real-world instructors and their contact info.
 */
export const generateTrainingPlan = async (title: string, briefContent: string, preferences: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Psikoloji alanında uzman bir eğitim tasarımcısısın. 
            Aşağıdaki detaylara göre profesyonel bir eğitim müfredatı oluştur ve bu konuda uzman GERÇEK eğitmenler bul:
            Eğitim Adı: ${title}
            Kısa İçerik: ${briefContent}
            Özel Tercihler/Hedef Kitle: ${preferences}

            GÖREVİN:
            1. Google Search kullanarak bu konuda Türkiye'de veya dünyada uzmanlığı olan GERÇEK isimleri araştır.
            2. Bu kişilerin ünvanlarını, uzmanlık alanlarını ve varsa halka açık iletişim bilgilerini (LinkedIn, e-posta, web sitesi) bul.
            3. Yanıtını iki bölümden oluştur: 
               A) Eğitim Müfredatı (Modüller halinde)
               B) Önerilen Eğitmenler (JSON formatında bir liste olarak, her biri ad, ünvan, uzmanlık ve iletişim bilgilerini içermeli).

            ÖNEMLİ: Eğitmen listesini yanıtın en sonunda şu formatta ver:
            ---INSTRUCTORS_JSON_START---
            [{"name": "...", "title": "...", "specialty": "...", "email": "...", "phone": "..."}]
            ---INSTRUCTORS_JSON_END---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 4000 }
            }
        });

        // Extract grounding metadata for display if needed
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return {
            text: response.text,
            sources: sources
        };
    } catch (error) {
        console.error("AI Planning Error:", error);
        return { text: "Üzgünüm, eğitim planı şu an oluşturulamadı.", sources: [] };
    }
};

/**
 * Common AI utilities remains the same...
 */
export const generateAIResponse = async (prompt: string, contextData: string, useThinking: boolean = false) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `Sen PsyEdu Manager asistanısın. Şirket verileri: ${contextData}. Türkçe yanıt ver. Psikoloji eğitimi sektöründe profesyonel bir dil kullan.`;
    const modelId = useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("AI Response Error:", error);
    return "Hata oluştu.";
  }
};

export const analyzeGoals = async (trainingTitle: string, goals: any, content: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Eğitim: ${trainingTitle}, İçerik: ${content}, Hedefler: ${JSON.stringify(goals)}. Bu hedefleri analiz et.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { thinkingConfig: { thinkingBudget: 2000 } }
        });
        return response.text;
    } catch (error) { return "Analiz hatası."; }
};

export const analyzeRisksAndWarnings = async (context: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analiz et ve riskleri JSON döndür: ${context}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { severity: { type: Type.STRING }, message: { type: Type.STRING } },
                        required: ['severity', 'message']
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (error) { return []; }
};

export const analyzeAdPerformance = async (campaigns: any[]) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analiz et: ${JSON.stringify(campaigns)}`,
        });
        return response.text || '';
    } catch (error) { return "Analiz hatası."; }
};

export const generateCertificateImage = async (base64Template: string, participantName: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Template, mimeType: 'image/png' } },
                    { text: `İsim ekle: ${participantName}` }
                ]
            }
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : null;
    } catch (error) { return null; }
};

export const parseResumeFromDocument = async (base64Str: string, mimeType: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ inlineData: { data: base64Str, mimeType } }, { text: "Parse resume JSON." }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                        experiences: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, company: { type: Type.STRING }, dates: { type: Type.STRING }, description: { type: Type.STRING } } } },
                        educations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { degree: { type: Type.STRING }, school: { type: Type.STRING }, dates: { type: Type.STRING } } } }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) { return null; }
};
