import { GoogleGenAI } from "@google/genai";
import { AgentType, OrchestratorDecision, AgentResponse } from '../types';
import { ORCHESTRATOR_SYSTEM_PROMPT, AGENT_PROMPTS } from './prompts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We use 'gemini-2.5-flash' as the standard model for these tasks per system guidelines
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Strips Markdown code block formatting from a string to extract JSON.
 */
const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

/**
 * Step 1: Orchestrator Logic
 * Decides which agent should handle the user's query.
 */
export const orchestrateQuery = async (userMessage: string): Promise<OrchestratorDecision> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `User Query: "${userMessage}"`,
      config: {
        systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT,
        responseMimeType: "application/json", 
        temperature: 0.1, // Low temperature for deterministic classification
      },
    });

    const text = response.text || "{}";
    const cleanedText = cleanJsonString(text);
    const decision = JSON.parse(cleanedText) as OrchestratorDecision;
    
    // Fallback if model hallucinates an invalid agent
    if (!Object.values(AgentType).includes(decision.agent)) {
        return {
            agent: AgentType.PATIENT_AGENT,
            reason: "Fallback: Agent returned invalid type.",
            parameters: {}
        }
    }

    return decision;
  } catch (error) {
    console.error("Orchestrator Error:", error);
    // Default fallback
    return {
      agent: AgentType.PATIENT_AGENT,
      reason: "Error in orchestration, defaulting to Patient Services.",
      parameters: {}
    };
  }
};

/**
 * Step 2: Sub-Agent Logic
 * Executes the specific agent's persona.
 */
export const runSubAgent = async (
  agentType: AgentType, 
  userMessage: string, 
  contextParams: Record<string, any>
): Promise<AgentResponse> => {
  try {
    const systemPrompt = AGENT_PROMPTS[agentType];
    const prompt = `
      Context Parameters from Orchestrator: ${JSON.stringify(contextParams)}
      User Query: "${userMessage}"
      
      Respond strictly in the JSON format defined in your system instruction.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.4, // Balanced for creative but structured responses
      },
    });

    const text = response.text || "{}";
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText) as AgentResponse;
  } catch (error) {
    console.error(`Error in ${agentType}:`, error);
    return {
      message: "I apologize, but I encountered a system error while processing your request. Please contact the administration desk directly.",
      next_steps: ["Contact Support"]
    };
  }
};
