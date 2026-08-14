import OpenAI from 'openai';
import 'dotenv/config';

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error("CRITICAL: Thiếu DEEPSEEK_API_KEY trong file .env!");
}

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
});

export default deepseek;