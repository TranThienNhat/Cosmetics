import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from 'express';
import deepseek from '../config/deepseek'; // Import client DeepSeek trực tiếp
import openai from '../config/openai';     // Import client OpenAI trực tiếp
import { GoogleGenAI } from '@google/genai';
import ProductModel from '../models/ProductModel';

const geminiAi = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export const AIController = {
  async askGemini(req: Request, res: Response): Promise<Response> {
    let optimizedContext: any[] = [];
    
    try {
      const { userMessage } = req.body;

      if (!userMessage || typeof userMessage !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Vui lòng nhập câu hỏi." });
      }

      // 1. Lấy kho hàng từ MySQL và tối ưu token
      const liveProductsContext = await ProductModel.getProductsForAI();
      optimizedContext = liveProductsContext.map((p: any) => ({
        sp: p.name,
        hang: p.brand,
        variants: p.variants.map((v: any) => ({ mau: v.name, gia: v.price, kho: v.stock }))
      }));

      const systemInstruction = `
Bạn là chuyên viên tư vấn của "Linh Cosmetics". Đây là kho hàng:
${JSON.stringify(optimizedContext)}
Yêu cầu: Dựa hoàn toàn vào kho để trả lời ngắn gọn, lịch sự, dùng icon (🌸, 💄). Nếu kho = 0, báo hết hàng và gợi ý cái khác còn hàng.
`;

      let finalAnswer = "";

      // 2. CHẠY LUỒNG KHÉP KÍN ĐA NỀN TẢNG (DEEPSEEK -> GPT -> GEMINI -> LOCAL)
      try {
        // 🐳 TẦNG 1: GỌI DEEPSEEK TRỰC TIẾP
        console.log("🐋 [TẦNG 1] Đang gọi thẳng DeepSeek API (deepseek-chat)...");
        const completion = await deepseek.chat.completions.create({
          model: 'deepseek-chat', // Tên model chuẩn của hãng DeepSeek
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.6,
          max_tokens: 350
        });
        finalAnswer = completion.choices[0].message.content || "";

      } catch (deepseekError: any) {
        console.warn("⚠️ DeepSeek gặp sự cố. Đang chuyển tầng sang Tầng 2 (GPT)...");
        
        try {
          // 🤖 TẦNG 2: GỌI GPT TRỰC TIẾP
          console.log("🤖 [TẦNG 2] Đang gọi thẳng OpenAI (gpt-4o-mini)...");
          const gptCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Tên model chuẩn của OpenAI
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userMessage }
            ],
            max_tokens: 350
          });
          finalAnswer = gptCompletion.choices[0].message.content || "";

        } catch (openaiError: any) {
          console.warn("⚠️ GPT từ chối. Đang kích hoạt Tầng 3 (Gemini 2.5-Flash)...");
          
          if (!geminiAi) throw new Error("Chuyển tầng Local trực tiếp");

          try {
            // ♊ TẦNG 3: GỌI GEMINI GỐC
            const geminiPrompt = `${systemInstruction}\n\nKhách: "${userMessage}"`;
            const geminiResponse = await geminiAi.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: geminiPrompt,
            });
            finalAnswer = geminiResponse.text || "";
            console.log("✅ [TẦNG DỰ PHÒNG CHÉO] Gemini cứu nguy thành công!");

          } catch (geminiError: any) {
            throw new Error("Sập toàn bộ mạng AI");
          }
        }
      }

      return res.json({ success: true, answer: finalAnswer });

    } catch (error: any) {
      // 🛡️ TẦNG 4: LOCAL FALLBACK (BẢO HIỂM NỘI BỘ MẤT MẠNG)
      console.error("🚨 KÍCH HOẠT THUẬT TOÁN LOCAL FALLBACK ĐỂ TỰ SINH CÂU TRẢ LỜI CỨU BUỔI DEMO 🚨");
      
      const { userMessage } = req.body;
      let localResponse = "✨ Dạ Linh Cosmetics xin chào bạn! 🌸 Hiện tại hệ thống tư vấn thông minh đang bảo trì một chút xíu. ";
      let foundProduct = false;

      if (optimizedContext && optimizedContext.length > 0) {
        for (const p of optimizedContext) {
          const productNameLower = p.sp.toLowerCase();
          const userMessageLower = userMessage.toLowerCase();

          if (userMessageLower.includes(productNameLower) || productNameLower.split(" ").some((word: string) => word.length > 2 && userMessageLower.includes(word))) {
            foundProduct = true;
            localResponse += `Đối với dòng sản phẩm **${p.sp}** mà bạn đang quan tâm, shop đang có sẵn các tùy chọn sau ạ:\n\n`;
            
            p.variants.forEach((v: any) => {
              if (v.kho > 0) {
                localResponse += `* Phiên bản **${v.mau}**: Giá *${v.gia.toLocaleString()}đ* (Còn hàng sẵn tại shop 🛍️)\n`;
              } else {
                localResponse += `* Phiên bản **${v.mau}**: Hiện tại đã tạm hết hàng mất rồi ạ 🌸\n`;
              }
            });
            localResponse += `\nBạn muốn shop ship dòng nào hay cần tư vấn gì thêm không ạ? ✨`;
            break;
          }
        }
      }

      if (!foundProduct) {
        localResponse += `Để được hỗ trợ nhanh nhất về tình trạng kho hàng và các chương trình khuyến mãi, bạn có thể nhắn trực tiếp vào nút **Zalo** ngay bên dưới, nhân viên shop sẽ rep bạn ngay lập tức ạ! 💄✨`;
      }

      return res.json({ success: true, answer: localResponse });
    }
  }
};
