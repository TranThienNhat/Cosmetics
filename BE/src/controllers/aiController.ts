import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from 'express';
import deepseek from '../config/deepseek'; // Import client DeepSeek trực tiếp
import openai from '../config/openai';     // Import client OpenAI trực tiếp
import { GoogleGenAI } from '@google/genai';
import ProductModel from '../models/ProductModel';
import ChatIntentService from '../services/chatIntentService';
import ChatKnowledgeModel from '../models/ChatKnowledgeModel';

const geminiAi = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export interface SuggestedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string | null;
  inStock: boolean;
  url: string;
}

// Helper: Chuyển đổi dữ liệu thô từ ProductModel sang DTO SuggestedProduct gọn gàng
function mapToSuggestedProduct(p: any): SuggestedProduct {
  const prices = (p.variants || [])
    .map((v: any) => Number(v.price))
    .filter((pr: number) => !isNaN(pr));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const totalStock = (p.variants || []).reduce(
    (sum: number, v: any) => sum + (Number(v.stock) || 0),
    0
  );
  const brandName = typeof p.brand === 'object' ? (p.brand?.name || '') : (p.brand || '');

  return {
    id: p.id,
    name: p.name,
    brand: brandName,
    category: p.category || '',
    price: minPrice,
    image: p.image_url || null,
    inStock: totalStock > 0,
    url: `/products/${p.id}`,
  };
}

// Helper: Quét và trích xuất danh sách sản phẩm được nhắc đến để hiển thị Card trực quan
function extractSuggestedProducts(
  answer: string,
  liveProducts: any[],
  userMessage?: string
): SuggestedProduct[] {
  const matchedMap = new Map<number, SuggestedProduct>();

  // 1. Quét tìm tất cả các link Markdown /products/:id trong câu trả lời
  const linkRegex = /\/products\/(\d+)/g;
  let match;
  while ((match = linkRegex.exec(answer)) !== null) {
    const pId = parseInt(match[1], 10);
    const found = liveProducts.find((p) => p.id === pId);
    if (found && !matchedMap.has(pId)) {
      matchedMap.set(pId, mapToSuggestedProduct(found));
    }
  }

  // 2. Quét thêm theo tên sản phẩm có mặt trong câu trả lời (nếu AI quên tạo link)
  for (const p of liveProducts) {
    if (matchedMap.size >= 4) break;
    if (matchedMap.has(p.id)) continue;

    const pName = (p.name || '').toLowerCase();
    if (pName.length > 3 && answer.toLowerCase().includes(pName)) {
      matchedMap.set(p.id, mapToSuggestedProduct(p));
    }
  }

  // 3. Nếu vẫn chưa bắt được sản phẩm (hoặc trong tình huống Fallback), tìm theo câu hỏi người dùng
  if (matchedMap.size === 0 && userMessage) {
    const userMsgLower = userMessage.toLowerCase();
    for (const p of liveProducts) {
      if (matchedMap.size >= 3) break;
      const pName = (p.name || '').toLowerCase();
      const brandName = (typeof p.brand === 'object' ? p.brand?.name : p.brand || '').toLowerCase();
      const catName = (p.category || '').toLowerCase();

      if (
        (brandName && brandName.length > 2 && userMsgLower.includes(brandName)) ||
        (catName && catName.length > 2 && userMsgLower.includes(catName)) ||
        pName.split(' ').some((word: string) => word.length > 3 && userMsgLower.includes(word))
      ) {
        matchedMap.set(p.id, mapToSuggestedProduct(p));
      }
    }
  }

  return Array.from(matchedMap.values()).slice(0, 4);
}

export const AIController = {
  async askGemini(req: Request, res: Response): Promise<Response> {
    let liveProductsContext: any[] = [];
    
    try {
      const { userMessage } = req.body;

      if (!userMessage || typeof userMessage !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Vui lòng nhập câu hỏi." });
      }

      // 1. Lấy kho hàng thực tế từ MySQL kèm theo ID, brand, ảnh, giá và phân loại
      liveProductsContext = await ProductModel.getProductsForAI();

      // 1.1 NHẬN DIỆN INTENT & PHẢN HỒI NHANH (Tránh gọi LLM tốn kém hoặc trả lời vô nghĩa)
      const intentResult = ChatIntentService.processMessage(userMessage, liveProductsContext);
      if (intentResult.matched && intentResult.response) {
        console.log(`⚡ [Intent Engine] Khớp Intent '${intentResult.intent}'. Phản hồi trực tiếp không cần gọi LLM.`);
        const matchedProducts = extractSuggestedProducts(
          intentResult.response,
          liveProductsContext,
          userMessage
        );
        return res.json({
          success: true,
          intent: intentResult.intent,
          answer: intentResult.response,
          products: matchedProducts,
          quickSuggestions: intentResult.quickSuggestions || [],
          source: "intent_engine",
        });
      }

      // 1.2 KIỂM TRA BỘ NHỚ TRI THỨC (CÂU HỎI TƯƠNG TỰ ĐÃ ĐƯỢC LLM TRẢ LỜI TRƯỚC ĐÓ)
      const knowledgeResult = await ChatKnowledgeModel.findSimilarKnowledge(userMessage, 0.70);
      if (knowledgeResult.match && knowledgeResult.match.response) {
        console.log(
          `⚡ [Knowledge Memory] Tìm thấy câu trả lời tương tự từ bộ nhớ (ID: ${knowledgeResult.match.id}, Độ tương đồng: ${Math.round(knowledgeResult.similarity * 100)}%). Tái sử dụng câu trả lời không cần gọi LLM!`
        );
        const matchedProducts = extractSuggestedProducts(
          knowledgeResult.match.response,
          liveProductsContext,
          userMessage
        );
        return res.json({
          success: true,
          intent: knowledgeResult.match.intent || "BEAUTY_ADVICE",
          answer: knowledgeResult.match.response,
          products: matchedProducts,
          quickSuggestions: knowledgeResult.match.quick_suggestions || [],
          source: "knowledge_memory",
          similarity: knowledgeResult.similarity,
          knowledgeId: knowledgeResult.match.id,
        });
      }

      const productCatalogForAI = liveProductsContext.map((p: any) => {
        const prices = (p.variants || [])
          .map((v: any) => Number(v.price))
          .filter((pr: number) => !isNaN(pr));
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const totalStock = (p.variants || []).reduce(
          (sum: number, v: any) => sum + (Number(v.stock) || 0),
          0
        );
        const brandName = typeof p.brand === 'object' ? (p.brand?.name || '') : (p.brand || '');

        return {
          id: p.id,
          ten: p.name,
          hang: brandName,
          danh_muc: p.category || '',
          gia: minPrice,
          con_hang: totalStock > 0,
          link: `/products/${p.id}`,
          phan_loai: (p.variants || []).map((v: any) => ({
            ten: v.name,
            gia: Number(v.price),
            kho: Number(v.stock)
          }))
        };
      });

      // 2. Prompt điều hướng sản phẩm chi tiết & chuẩn xác
      const systemInstruction = `
Bạn là "Linh Beauty Advisor" - Trợ lý tư vấn sắc đẹp và mỹ phẩm độc quyền của "Linh Cosmetics".
Dưới đây là danh mục sản phẩm và tình trạng kho hàng thực tế của cửa hàng:
${JSON.stringify(productCatalogForAI)}

QUY TẮC TƯ VẤN QUAN TRỌNG:
1. Luôn dùng giọng điệu ấm áp, chuyên nghiệp, duyên dáng và tận tình (sử dụng icon dễ thương: 🌸, 💄, ✨, 🛍️).
2. TƯ VẤN & ĐIỀU HƯỚNG SẢN PHẨM (BẮT BUỘC):
   - Khi bạn nhắc đến, tư vấn hoặc gợi ý bất kỳ sản phẩm nào từ kho hàng, BẮT BUỘC phải đính kèm đường link Markdown dẫn thẳng đến sản phẩm đó theo cú pháp:
     [Tên sản phẩm](/products/{id})
     Ví dụ: "Em gợi ý chị tham khảo dòng son **[Son Thỏi Lì MAC Matte Lipstick](/products/9)** (giá từ 480.000₫) nha! 💄"
   - Tuyệt đối chỉ dùng đúng {id} số thực tế trong kho hàng ở trên, không được tự tạo ID sai.
3. Nếu sản phẩm hết hàng (con_hang = false hoặc kho = 0), hãy thông báo khéo léo và đề xuất sản phẩm thay thế cùng danh mục còn hàng.
4. Trả lời súc tích, đi thẳng vào ưu điểm và giá của sản phẩm, giúp khách dễ dàng chọn lựa.
5. Cuối câu trả lời, hãy đính kèm lời mời nhấn vào tên sản phẩm để xem chi tiết và mua hàng ngay.
`;

      let finalAnswer = "";

      // 3. CHẠY LUỒNG KHÉP KÍN ĐA NỀN TẢNG (DEEPSEEK -> GPT -> GEMINI -> LOCAL)
      try {
        // 🐳 TẦNG 1: GỌI DEEPSEEK TRỰC TIẾP
        console.log("🐋 [TẦNG 1] Đang gọi thẳng DeepSeek API (deepseek-chat)...");
        const completion = await deepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.6,
          max_tokens: 500
        });
        finalAnswer = completion.choices[0].message.content || "";

      } catch (deepseekError: any) {
        console.warn("⚠️ DeepSeek gặp sự cố. Đang chuyển tầng sang Tầng 2 (GPT)...");
        
        try {
          // 🤖 TẦNG 2: GỌI GPT TRỰC TIẾP
          console.log("🤖 [TẦNG 2] Đang gọi thẳng OpenAI (gpt-4o-mini)...");
          const gptCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userMessage }
            ],
            max_tokens: 500
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

      // 4. Trích xuất danh sách sản phẩm được gợi ý
      let suggestedProducts = extractSuggestedProducts(finalAnswer, liveProductsContext, userMessage);

      // Nếu AI tư vấn có sản phẩm nhưng vô tình quên đính kèm link Markdown, tự động chèn thêm phần link ở cuối
      if (suggestedProducts.length > 0 && !finalAnswer.includes("/products/")) {
        finalAnswer += `\n\n🛍️ **Xem chi tiết sản phẩm được gợi ý:**\n` +
          suggestedProducts.map(p => `👉 **[${p.name}](/products/${p.id})** - ${p.brand ? p.brand + ' | ' : ''}${p.price.toLocaleString('vi-VN')}₫`).join('\n');
      }

      // 5. TỰ ĐỘNG LƯU TRỮ CÂU HỎI & CÂU TRẢ LỜI VÀO CƠ SỞ TRI THỨC (ĐỂ TÁI SỬ DỤNG VÀ HUẤN LUYỆN MODEL)
      ChatKnowledgeModel.saveKnowledge({
        user_query: userMessage,
        response: finalAnswer,
        intent: "BEAUTY_ADVICE",
        suggested_products: suggestedProducts,
        source: "llm",
      }).catch((err) => console.warn("Lỗi khi lưu tri thức Chatbot:", err));

      return res.json({
        success: true,
        answer: finalAnswer,
        products: suggestedProducts,
        source: "llm",
      });

    } catch (error: any) {
      // 🛡️ TẦNG 4: LOCAL FALLBACK THÔNG MINH KÈM LINK & PRODUCTS
      console.error("🚨 KÍCH HOẠT THUẬT TOÁN LOCAL FALLBACK ĐỂ TỰ SINH CÂU TRẢ LỜI CỨU BUỔI DEMO 🚨");
      
      const { userMessage } = req.body;
      const matched = extractSuggestedProducts("", liveProductsContext, userMessage);
      let localResponse = "✨ Dạ Linh Cosmetics xin chào bạn! 🌸 Cảm ơn bạn đã nhắn tin cho shop. ";

      if (matched.length > 0) {
        localResponse += `Dựa trên câu hỏi của bạn, shop xin gợi ý các dòng sản phẩm chất lượng cao đang sẵn hàng tại shop:\n\n`;
        matched.forEach((p) => {
          localResponse += `🌸 **[${p.name}](/products/${p.id})**\n`;
          localResponse += `* Thương hiệu: **${p.brand || 'Chính hãng'}** | Danh mục: **${p.category || 'Mỹ phẩm'}**\n`;
          localResponse += `* Giá từ: **${p.price.toLocaleString('vi-VN')}₫** (${p.inStock ? 'Còn hàng sẵn tại shop 🛍️' : 'Tạm hết hàng'})\n`;
          localResponse += `* 👉 **[Bấm vào đây để xem chi tiết & đặt hàng ➜](/products/${p.id})**\n\n`;
        });
        localResponse += `Bạn có thể bấm trực tiếp vào tên sản phẩm ở trên để chuyển đến trang xem chi tiết và đặt hàng nhé! 💄✨`;
      } else {
        localResponse += `Hiện tại shop có rất nhiều dòng sản phẩm chăm sóc da, trang điểm và nước hoa chính hãng.\n\n` +
          `👉 Bạn có thể xem toàn bộ tại **[Danh mục sản phẩm](/products)** hoặc liên hệ qua Zalo để nhân viên shop hỗ trợ ngay lập tức ạ! 💄`;
      }

      return res.json({
        success: true,
        answer: localResponse,
        products: matched
      });
    }
  },

  // =========================================================================
  // CÁC ENDPOINT QUẢN LÝ TRI THỨC VÀ HUẤN LUYỆN MODEL RIÊNG CHO ADMIN
  // =========================================================================

  // Lấy danh sách câu hỏi - câu trả lời trong cơ sở tri thức
  async getKnowledgeBase(req: Request, res: Response): Promise<Response> {
    try {
      const { page, limit, search, intent, source, is_active } = req.query;
      const data = await ChatKnowledgeModel.getKnowledgeList({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
        intent: intent as string,
        source: source as string,
        is_active: is_active as string,
      });
      return res.json({ success: true, ...data });
    } catch (error: any) {
      console.error("Get Knowledge Base Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi lấy danh sách tri thức",
      });
    }
  },

  // Thống kê bộ nhớ tri thức Chatbot
  async getKnowledgeStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await ChatKnowledgeModel.getKnowledgeStats();
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("Get Knowledge Stats Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi lấy thống kê tri thức",
      });
    }
  },

  // Thêm một mẫu câu hỏi & câu trả lời thủ công
  async createKnowledge(req: Request, res: Response): Promise<Response> {
    try {
      const { user_query, response, intent, source } = req.body;
      if (!user_query || !response) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Vui lòng nhập đầy đủ câu hỏi và câu trả lời",
        });
      }

      const id = await ChatKnowledgeModel.saveKnowledge({
        user_query: user_query.trim(),
        response: response.trim(),
        intent: intent?.trim() || "BEAUTY_ADVICE",
        source: source || "manual",
      });

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Thêm tri thức thành công",
        id,
      });
    } catch (error: any) {
      console.error("Create Knowledge Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi tạo tri thức",
      });
    }
  },

  // Cập nhật câu hỏi / câu trả lời
  async updateKnowledge(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID không hợp lệ" });
      }

      const { user_query, response, intent, is_active, source } = req.body;
      const ok = await ChatKnowledgeModel.updateKnowledge(id, {
        user_query,
        response,
        intent,
        is_active,
        source,
      });

      if (!ok) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy bản ghi tri thức" });
      }

      return res.json({ success: true, message: "Cập nhật tri thức thành công" });
    } catch (error: any) {
      console.error("Update Knowledge Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi cập nhật tri thức",
      });
    }
  },

  // Bật/tắt trạng thái sử dụng của tri thức
  async toggleKnowledge(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID không hợp lệ" });
      }

      const ok = await ChatKnowledgeModel.toggleActive(id);
      if (!ok) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy bản ghi" });
      }

      return res.json({ success: true, message: "Chuyển trạng thái tri thức thành công" });
    } catch (error: any) {
      console.error("Toggle Knowledge Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi đổi trạng thái",
      });
    }
  },

  // Xóa tri thức
  async deleteKnowledge(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID không hợp lệ" });
      }

      const ok = await ChatKnowledgeModel.deleteKnowledge(id);
      if (!ok) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy bản ghi để xóa" });
      }

      return res.json({ success: true, message: "Xóa tri thức thành công" });
    } catch (error: any) {
      console.error("Delete Knowledge Error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi xóa tri thức",
      });
    }
  },

  // Xuất file dataset huấn luyện model riêng (JSONL / CSV)
  async exportDataset(req: Request, res: Response): Promise<void> {
    try {
      const format = (req.query.format as string) === "csv" ? "csv" : "jsonl";
      const dataset = await ChatKnowledgeModel.exportTrainingDataset(format);

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `linh_cosmetics_chat_dataset_${timestamp}.${format}`;

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader(
        "Content-Type",
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/x-jsonlines; charset=utf-8"
      );
      res.send(dataset);
    } catch (error: any) {
      console.error("Export Dataset Error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi máy chủ khi xuất dataset",
      });
    }
  },
};
