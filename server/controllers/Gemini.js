import { GoogleGenerativeAI } from "@google/generative-ai";
import { createError } from "../error.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

export const generateContent = async (req, res, next) => {
  try {
    const { prompt, model = "gemini-pro", maxOutputTokens = 1200 } = req.body;

    if (!prompt) {
      return next(createError(400, "Prompt is required"));
    }

    if (!GEMINI_API_KEY) {
      return next(
        createError(
          500,
          "Gemini API key is not configured. Please set GEMINI_API_KEY or REACT_APP_GEMINI_API_KEY environment variable."
        )
      );
    }

    // Try multiple models in order
    const modelsToTry = ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    const modelToUse = modelsToTry.includes(model) ? model : modelsToTry[0];

    let lastError = null;
    let genAI = null;
    let selectedModel = null;

    // Try each model until one works
    for (const modelName of modelsToTry) {
      try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        selectedModel = genAI.getGenerativeModel({ model: modelName });
        
        const result = await selectedModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          return res.status(200).json({
            success: true,
            text: text.trim(),
            model: modelName,
          });
        }
      } catch (err) {
        lastError = err;
        // If it's not a 404 (model not found), break and return error
        const errorMessage = err.message || err.toString();
        if (!errorMessage.includes("404") && !errorMessage.includes("not found")) {
          break;
        }
        // Otherwise, try next model
        continue;
      }
    }

    // If we get here, all models failed
    const errorMessage =
      lastError?.message ||
      lastError?.toString() ||
      "Failed to generate content from Gemini API";

    return next(
      createError(
        500,
        `Gemini API error: ${errorMessage}. Tried models: ${modelsToTry.join(", ")}`
      )
    );
  } catch (err) {
    return next(createError(500, err.message || "Internal server error"));
  }
};

