

const { GoogleGenAI } = require("@google/genai");
const ApiError = require("../utils/ApiError");
const { sleep } = require("../utils/helpers");

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY missing");
      this.ai = null;
      return;
    }

    // ✅ NEW SDK INITIALIZATION
    this.ai = new GoogleGenAI({});
    this.modelName = "gemini-3-flash-preview"; // ✅ ONLY SAFE MODEL RIGHT NOW

    this.rateLimitDelay = 1000;
    this.maxRetries = 3;
  }

  async generateContent(prompt, options = {}) {
    if (!this.ai) {
      throw ApiError.internal("Gemini client not initialized");
    }

    const {
      temperature = 0.7,
      maxRetries = this.maxRetries,
      retryDelay = 2000,
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens: 2048,
          },
        });

        const text = response?.text;

        // 🚨 HARD GUARD (prevents DB crash)
        if (!text || typeof text !== "string" || !text.trim()) {
          throw new Error("Empty Gemini response");
        }

        await sleep(this.rateLimitDelay);
        return text.trim();

      } catch (err) {
        lastError = err;
        console.error(`🔥 Gemini error (${attempt}/${maxRetries}):`, err.message);

        if (attempt < maxRetries) {
          await sleep(retryDelay * attempt);
        }
      }
    }

    this._handleError(lastError);
  }

  _handleError(error) {
    if (!error) {
      throw ApiError.internal("Unknown Gemini error");
    }

    const msg = error.message.toLowerCase();

    if (msg.includes("api key")) {
      throw ApiError.unauthorized("Invalid Gemini API key");
    }

    if (msg.includes("quota") || msg.includes("rate limit")) {
      throw ApiError.serviceUnavailable("Gemini rate limit exceeded");
    }

    if (msg.includes("404") || msg.includes("not found")) {
      throw ApiError.internal("Gemini model not enabled for this API key");
    }

    throw ApiError.internal(`Gemini API error: ${error.message}`);
  }
}

module.exports = new GeminiService();
