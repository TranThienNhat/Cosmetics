import OpenAI from 'openai';
import 'dotenv/config';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("CRITICAL: Thiếu cấu hình OPENAI_API_KEY trong file .env!");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;