import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, CANVAS_WIDTH, CANVAS_HEIGHT } from "../types";

// Vercel/Vite uses import.meta.env.VITE_ for client-side env vars
const apiKey = import.meta.env.VITE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are a creative Game Level Designer for a 2D Platformer "Obby" (Obstacle Course) game.
Your task is to generate a playable level based on the user's prompt.

**Design Style:**
- Use a **PASTEL Color Palette**.
- Backgrounds should be light and cute (e.g., Sky Blue #E0F7FA, Light Pink #FCE4EC, Mint #E0F2F1).
- Blocks should be colorful but soft (e.g., Lavender, Peach, Baby Blue).
- Hazards are still dangerous, but maybe use Hot Pink or Orange instead of dark red.

Game Config:
- Canvas Size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}.
- Coordinate System: (0,0) is Top-Left.
- Ground is typically around y=${CANVAS_HEIGHT - 50}.
- The Player jumps around 150 pixels high and 200 pixels far.
- 'solid' blocks are safe to stand on.
- 'hazard' blocks kill the player (reset level).
- 'bounce' blocks launch the player high.
- 'goal' block is the win condition.
- Make sure the level is possible to beat.
- IMPORTANT: Return ONLY valid JSON matching the schema.
`;

export const generateLevel = async (prompt: string): Promise<LevelData> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEY in your environment.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a cute pastel level with this theme: ${prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy cute name for the level" },
            description: { type: Type.STRING, description: "Short description" },
            backgroundColor: { type: Type.STRING, description: "Hex color for background (e.g. #E0F7FA)" },
            playerStart: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ["x", "y"]
            },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                  type: { type: Type.STRING, enum: ["solid", "hazard", "goal", "bounce"] },
                  color: { type: Type.STRING, description: "Hex color" }
                },
                required: ["x", "y", "w", "h", "type", "color"]
              }
            }
          },
          required: ["title", "description", "backgroundColor", "playerStart", "blocks"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as LevelData;
    }
    throw new Error("No text returned from AI");
  } catch (error) {
    console.error("Error generating level:", error);
    // Fallback level if AI fails (Pastel themed)
    return {
      title: "Pastel Fallback",
      description: "Could not generate level. Enjoy this pastel world.",
      backgroundColor: "#F3E5F5", // Light Purple
      playerStart: { x: 50, y: 500 },
      blocks: [
        { x: 0, y: 550, w: 800, h: 50, type: 'solid', color: '#CE93D8' }, // Purple
        { x: 300, y: 450, w: 100, h: 20, type: 'solid', color: '#90CAF9' }, // Blue
        { x: 500, y: 350, w: 100, h: 20, type: 'hazard', color: '#F48FB1' }, // Pink
        { x: 700, y: 300, w: 50, h: 50, type: 'goal', color: '#A5D6A7' } // Green
      ]
    };
  }
};