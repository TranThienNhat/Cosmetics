import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Kiểm tra lỗi thiếu API Key ngay khi khởi động ứng dụng
if (!process.env.GEMINI_API_KEY) {
  throw new Error("CRITICAL: Thiếu cấu hình GEMINI_API_KEY trong file .env!");
}

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export default ai;