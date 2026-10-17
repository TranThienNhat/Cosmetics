import { BaseModel } from "../core/BaseModel";
import { IChatKnowledge } from "../interfaces/ChatKnowledge";
import { removeVietnameseDiacritics } from "../services/chatIntentService";

// Danh sách từ dừng (Stopwords) thông thường trong tiếng Việt
const STOP_WORDS = new Set([
  "la", "va", "thi", "ma", "o", "voi", "cho", "cua", "nhung", "cac",
  "mot", "hai", "ba", "nay", "do", "kia", "ay", "nao", "sao", "gi",
  "co", "khong", "the", "duoc", "chua", "roi", "rat", "qua", "lam",
  "minh", "toi", "em", "anh", "chi", "shop", "ad", "ban", "nhe", "nha", "a", "da"
]);

// Danh sách từ khóa đặc trưng mỹ phẩm / tình trạng da để kiểm tra đối sánh chính xác
const COSMETIC_KEY_TERMS = [
  "kem duong", "kem chong nang", "son moi", "son thoi", "son tint",
  "serum", "toner", "nuoc hoa hong", "nuoc tay trang", "dau tay trang",
  "sua rua mat", "tay te bao chet", "mat na", "kem mat", "tri mun",
  "da dau", "da kho", "da hon hop", "da mun", "da nhay cam", "lao hoa",
  "nam", "tan nhang", "phuc hoi", "cap am", "trang da", "giam nhon", "se khit"
];

class ChatKnowledgeModel extends BaseModel<IChatKnowledge> {
  constructor() {
    super("chat_knowledge_base");
  }

  /**
   * Chuẩn hóa văn bản câu hỏi: chữ thường, bỏ dấu tiếng Việt, lọc ký tự đặc biệt
   */
  public normalizeQuery(text: string): string {
    return removeVietnameseDiacritics(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Trích xuất tập hợp từ khóa có nghĩa
   */
  public extractKeywords(text: string): Set<string> {
    const normalized = this.normalizeQuery(text);
    const words = normalized.split(" ").filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
    return new Set(words);
  }

  /**
   * Tính độ tương đồng Dice's Coefficient giữa 2 câu hỏi (0.0 -> 1.0)
   */
  public calculateSimilarity(queryA: string, queryB: string): number {
    const normA = this.normalizeQuery(queryA);
    const normB = this.normalizeQuery(queryB);

    // 1. Trùng khớp chính xác sau chuẩn hóa
    if (normA === normB) return 1.0;

    // 2. Chứa toàn bộ câu của nhau
    if (normA.includes(normB) || normB.includes(normA)) {
      const minLen = Math.min(normA.length, normB.length);
      const maxLen = Math.max(normA.length, normB.length);
      if (minLen / maxLen >= 0.8) return 0.95;
    }

    const setA = this.extractKeywords(queryA);
    const setB = this.extractKeywords(queryB);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersectionCount = 0;
    for (const word of setA) {
      if (setB.has(word)) {
        intersectionCount++;
      }
    }

    // Công thức Dice's Coefficient
    const dice = (2 * intersectionCount) / (setA.size + setB.size);

    // Kiểm tra các cụm từ mỹ phẩm quan trọng (Key terms consistency)
    // Nếu cả 2 đều nhắc đến 1 sản phẩm cụ thể (ví dụ: kem chống nắng vs son môi), phải đồng nhất
    for (const term of COSMETIC_KEY_TERMS) {
      const inA = normA.includes(term);
      const inB = normB.includes(term);
      if (inA !== inB) {
        // Một câu hỏi về kem chống nắng nhưng câu kia về son môi -> phạt điểm tương đồng
        return dice * 0.4;
      }
    }

    return dice;
  }

  /**
   * Tìm kiếm câu trả lời tương tự nhất đã được lưu trong cơ sở tri thức
   */
  async findSimilarKnowledge(
    userQuery: string,
    threshold: number = 0.70
  ): Promise<{ match: IChatKnowledge | null; similarity: number }> {
    const normUserQuery = this.normalizeQuery(userQuery);
    if (!normUserQuery || normUserQuery.length < 3) {
      return { match: null, similarity: 0 };
    }

    // 1. Lấy danh sách các câu hỏi đang active
    const [rows]: any = await this.db.query(
      `SELECT * FROM chat_knowledge_base WHERE is_active = 1 ORDER BY use_count DESC LIMIT 200`
    );

    let bestMatch: IChatKnowledge | null = null;
    let highestScore = 0;

    for (const row of rows) {
      const score = this.calculateSimilarity(userQuery, row.user_query);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = row;
      }
    }

    if (highestScore >= threshold && bestMatch) {
      // Tăng số lần sử dụng tri thức
      await this.db.query(
        `UPDATE chat_knowledge_base SET use_count = use_count + 1, updated_at = NOW() WHERE id = ?`,
        [bestMatch.id]
      );

      // Parse JSON fields if string
      const matchedRecord: IChatKnowledge = {
        ...bestMatch,
        suggested_products:
          typeof bestMatch.suggested_products === "string"
            ? JSON.parse(bestMatch.suggested_products)
            : bestMatch.suggested_products,
        quick_suggestions:
          typeof bestMatch.quick_suggestions === "string"
            ? JSON.parse(bestMatch.quick_suggestions)
            : bestMatch.quick_suggestions,
      };

      return { match: matchedRecord, similarity: highestScore };
    }

    return { match: null, similarity: highestScore };
  }

  /**
   * Lưu câu hỏi & câu trả lời mới vào cơ sở tri thức để tái sử dụng
   */
  async saveKnowledge(data: {
    user_query: string;
    response: string;
    intent?: string;
    suggested_products?: any;
    quick_suggestions?: any;
    source?: "llm" | "intent_engine" | "manual" | "trained";
  }): Promise<number> {
    const norm = this.normalizeQuery(data.user_query);

    // Kiểm tra xem đã có câu hỏi tương tự >= 90% chưa
    const existing = await this.findSimilarKnowledge(data.user_query, 0.90);
    if (existing.match && existing.match.id) {
      // Đã có câu hỏi gần như giống hệt -> Cập nhật câu trả lời tốt hơn và tăng use_count
      await this.db.query(
        `UPDATE chat_knowledge_base 
         SET response = ?, suggested_products = ?, quick_suggestions = ?, use_count = use_count + 1, updated_at = NOW()
         WHERE id = ?`,
        [
          data.response,
          JSON.stringify(data.suggested_products || []),
          JSON.stringify(data.quick_suggestions || []),
          existing.match.id,
        ]
      );
      return existing.match.id;
    }

    // Nếu chưa có, insert bản ghi tri thức mới
    const [result]: any = await this.db.query(
      `INSERT INTO chat_knowledge_base 
       (user_query, normalized_query, intent, response, suggested_products, quick_suggestions, source, use_count, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        data.user_query.trim(),
        norm,
        data.intent || "BEAUTY_ADVICE",
        data.response,
        JSON.stringify(data.suggested_products || []),
        JSON.stringify(data.quick_suggestions || []),
        data.source || "llm",
      ]
    );

    return result.insertId;
  }

  /**
   * Lấy danh sách tri thức cho Admin quản lý
   */
  async getKnowledgeList(params: {
    page?: number;
    limit?: number;
    search?: string;
    intent?: string;
    source?: string;
    is_active?: string;
  }): Promise<{ list: IChatKnowledge[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: any[] = [];

    if (params.search && params.search.trim()) {
      whereClauses.push("(user_query LIKE ? OR response LIKE ?)");
      const term = `%${params.search.trim()}%`;
      values.push(term, term);
    }

    if (params.intent && params.intent !== "ALL") {
      whereClauses.push("intent = ?");
      values.push(params.intent);
    }

    if (params.source && params.source !== "ALL") {
      whereClauses.push("source = ?");
      values.push(params.source);
    }

    if (params.is_active !== undefined && params.is_active !== "ALL") {
      whereClauses.push("is_active = ?");
      values.push(params.is_active === "1" ? 1 : 0);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows]: any = await this.db.query(
      `SELECT COUNT(*) as total FROM chat_knowledge_base ${whereSQL}`,
      values
    );
    const total = countRows[0]?.total || 0;

    const [rows]: any = await this.db.query(
      `SELECT * FROM chat_knowledge_base ${whereSQL} ORDER BY use_count DESC, id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const list = rows.map((r: any) => ({
      ...r,
      suggested_products: typeof r.suggested_products === "string" ? JSON.parse(r.suggested_products) : r.suggested_products,
      quick_suggestions: typeof r.quick_suggestions === "string" ? JSON.parse(r.quick_suggestions) : r.quick_suggestions,
    }));

    return {
      list,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Thống kê tổng quan tri thức Chatbot
   */
  async getKnowledgeStats(): Promise<{
    totalRecords: number;
    totalHitCount: number;
    activeRecords: number;
    topIntents: any[];
    sourceBreakdown: any[];
  }> {
    const [summaryRows]: any = await this.db.query(`
      SELECT 
        COUNT(*) as totalRecords,
        COALESCE(SUM(use_count), 0) as totalHitCount,
        COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) as activeRecords
      FROM chat_knowledge_base
    `);

    const [intentRows]: any = await this.db.query(`
      SELECT intent, COUNT(*) as count, SUM(use_count) as hits
      FROM chat_knowledge_base
      GROUP BY intent
      ORDER BY hits DESC
      LIMIT 10
    `);

    const [sourceRows]: any = await this.db.query(`
      SELECT source, COUNT(*) as count, SUM(use_count) as hits
      FROM chat_knowledge_base
      GROUP BY source
    `);

    return {
      totalRecords: Number(summaryRows[0]?.totalRecords || 0),
      totalHitCount: Number(summaryRows[0]?.totalHitCount || 0),
      activeRecords: Number(summaryRows[0]?.activeRecords || 0),
      topIntents: intentRows,
      sourceBreakdown: sourceRows,
    };
  }

  /**
   * Cập nhật bản ghi tri thức
   */
  async updateKnowledge(id: number, data: Partial<IChatKnowledge>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.user_query !== undefined) {
      fields.push("user_query = ?");
      values.push(data.user_query.trim());
      fields.push("normalized_query = ?");
      values.push(this.normalizeQuery(data.user_query));
    }
    if (data.response !== undefined) {
      fields.push("response = ?");
      values.push(data.response.trim());
    }
    if (data.intent !== undefined) {
      fields.push("intent = ?");
      values.push(data.intent.trim());
    }
    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(data.is_active ? 1 : 0);
    }
    if (data.source !== undefined) {
      fields.push("source = ?");
      values.push(data.source);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result]: any = await this.db.query(
      `UPDATE chat_knowledge_base SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * Bật / tắt trạng thái kích hoạt
   */
  async toggleActive(id: number): Promise<boolean> {
    const [result]: any = await this.db.query(
      `UPDATE chat_knowledge_base SET is_active = IF(is_active = 1, 0, 1), updated_at = NOW() WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Xóa tri thức
   */
  async deleteKnowledge(id: number): Promise<boolean> {
    const [result]: any = await this.db.query(
      `DELETE FROM chat_knowledge_base WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Xuất dataset huấn luyện mô hình riêng (Fine-tuning Dataset)
   * Định dạng chuẩn OpenAI Fine-Tuning / LLaMA ChatML JSONL
   */
  async exportTrainingDataset(format: "jsonl" | "csv" | "json" = "jsonl"): Promise<string> {
    const [rows]: any = await this.db.query(
      `SELECT user_query, response, intent FROM chat_knowledge_base WHERE is_active = 1 ORDER BY use_count DESC`
    );

    const systemPrompt = "Bạn là Linh Beauty Advisor - Trợ lý tư vấn sắc đẹp và mỹ phẩm độc quyền của Linh Cosmetics. Luôn tư vấn duyên dáng, tận tâm và gợi ý sản phẩm phù hợp kèm link Markdown.";

    if (format === "jsonl") {
      const lines = rows.map((r: any) => {
        const item = {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: r.user_query },
            { role: "assistant", content: r.response },
          ],
          metadata: {
            intent: r.intent,
          },
        };
        return JSON.stringify(item);
      });
      return lines.join("\n");
    }

    if (format === "csv") {
      const header = '"instruction","input","output","intent"\n';
      const lines = rows.map((r: any) => {
        const cleanInstruction = `"${systemPrompt.replace(/"/g, '""')}"`;
        const cleanInput = `"${(r.user_query || "").replace(/"/g, '""')}"`;
        const cleanOutput = `"${(r.response || "").replace(/"/g, '""')}"`;
        const cleanIntent = `"${(r.intent || "").replace(/"/g, '""')}"`;
        return `${cleanInstruction},${cleanInput},${cleanOutput},${cleanIntent}`;
      });
      return header + lines.join("\n");
    }

    return JSON.stringify(rows, null, 2);
  }
}

export default new ChatKnowledgeModel();
