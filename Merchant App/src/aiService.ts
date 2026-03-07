import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function scanMenuFromImage(base64Image: string) {
    const ts = new Date().toLocaleTimeString();
    console.log(`[Scanner ${ts}] Service started. Image Length: ${base64Image?.length}`);

    if (!API_KEY) {
        throw new Error(`[Scanner ${ts}] Error: API Key is missing from .env`);
    }

    // We found that gemini-2.5-flash bypasses your quota limits
    const modelId = "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelId });

    const prompt = `
        List the food items from this menu.
        Return ONLY a JSON array of objects with keys: name, price, category, description.
        If no price is found, use 0. 
        For the 'category' key, use the exact section headings/categories as they appear on the menu (e.g., "Mains", "Sides", etc.). Do not use a generic category if the menu has a specific heading.
        Example: [{"name": "Steak", "price": 25, "category": "Mains", "description": "Grilled NY strip"}]
    `;

    try {
        console.log(`[Scanner ${ts}] Calling Google API (${modelId})...`);

        const parts = base64Image.split(",");
        const data = parts.length > 1 ? parts[1] : parts[0];
        const mimeType = base64Image.match(/^data:([^;]+);/)?.[1] || "image/jpeg";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text().trim();
        console.log(`[Scanner ${ts}] Raw response:`, text);

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error(`[Scanner ${ts}] Failed: No JSON found in response.`);
        }

        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`[Scanner ${ts}] Successfully parsed ${parsed.length} items.`);
        return parsed;

    } catch (error: any) {
        console.error(`[Scanner ${ts}] RAW API ERROR:`, error);

        let displayMessage = error.message || "An unknown error occurred during the scan.";

        if (error.status === 429 || error.message?.includes("429")) {
            displayMessage = "Google API Quota reached (429). Billing details may still be syncing. Please try again soon.";
        } else if (error.response?.data?.error?.message) {
            displayMessage = `Google Error: ${error.response.data.error.message}`;
        }

        throw new Error(displayMessage);
    }
}
