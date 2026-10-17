export interface IntentMatchResult {
  matched: boolean;
  intent?: string;
  response?: string;
  suggestedProducts?: any[];
  quickSuggestions?: string[];
}

/**
 * Loại bỏ dấu tiếng Việt để so khớp pattern không phụ thuộc có/không dấu
 */
export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Kiểm tra xem chuỗi có phải từ vô nghĩa, spam hoặc quá ngắn không
 */
function isGibberishOrTooShort(raw: string, normalized: string): boolean {
  const clean = raw.trim();
  if (clean.length === 0) return true;

  // Chiều dài <= 2 ký tự (ví dụ: "a", "h", "1", "?", ".", "^^")
  if (clean.length <= 2) return true;

  // Lặp lại 1 ký tự: "aaaa", "zzzz", ".....", "????"
  if (/^(.)\1{2,}$/.test(clean)) return true;

  // Các từ cảm thán / spam phổ biến không mang nghĩa câu hỏi mỹ phẩm
  const gibberishWords = [
    "alo", "alooo", "aloooo", "test", "testing", "asdf", "asdffdsa",
    "hehe", "hihi", "huhu", "hic", "hic hic", "kaka", "kkk",
    "uh", "um", "uk", "ukm", "ừ", "ừm", "ờ", "oke", "ok", "oki", "okey",
    "da", "dạ", "rồi", "roi", "chấm", "dot", "xyz", "123", "1234"
  ];

  if (gibberishWords.includes(normalized)) return true;

  return false;
}

export class ChatIntentService {
  /**
   * Phân tích và phát hiện intent câu hỏi trước khi gọi LLM
   */
  static processMessage(userMessage: string, liveProducts: any[] = []): IntentMatchResult {
    const raw = userMessage.trim();
    const normalized = removeVietnameseDiacritics(raw);
    const lower = raw.toLowerCase();

    // 1. KIỂM TRA TIN NHẮN QUÁ NGẮN / VÔ NGHĨA / SPAM
    if (isGibberishOrTooShort(raw, normalized)) {
      return {
        matched: true,
        intent: "GIBBERISH_OR_SHORT",
        response:
          "Dạ em chào nàng! Em là **Linh Beauty Advisor** 🌸. Nàng đang muốn tìm dòng mỹ phẩm chăm sóc da, đồ trang điểm hay cần em tư vấn gì không ạ? Nàng nhắn em câu hỏi cụ thể nhé! ✨",
        quickSuggestions: [
          "Tư vấn da dầu mụn",
          "Kem chống nắng kiềm dầu",
          "Phí giao hàng & Freeship",
          "Sản phẩm bán chạy nhất",
        ],
      };
    }

    // 2. CHÀO HỎI (GREETING)
    const greetingKeywords = [
      "xin chao", "chao shop", "chao ban", "chao em", "hello", "hi shop",
      "chao ad", "hi ad", "hey shop", "good morning", "buoi sang vui ve",
      "chao buoi sang", "chao buoi chieu", "chao buoi toi", "he lo", "helo"
    ];
    if (
      greetingKeywords.some(kw => normalized === kw || normalized.startsWith(kw + " ") || normalized.endsWith(" " + kw)) ||
      (normalized.length <= 8 && (normalized.includes("chao") || normalized.includes("hello") || normalized.includes("hi")))
    ) {
      return {
        matched: true,
        intent: "GREETING",
        response:
          "Em chào nàng xinh đẹp! 🌸 Rất vui được đón tiếp nàng tại **Linh Cosmetics**.\n\nEm là trợ lý làm đẹp độc quyền của shop, sẵn sàng tư vấn liệu trình skincare, chọn màu son hay gợi ý kem chống nắng phù hợp cho nàng. Nàng đang quan tâm đến sản phẩm hay vấn đề da nào hôm nay ạ? ✨💄",
        quickSuggestions: [
          "Routine da dầu mụn",
          "Kem chống nắng best-seller",
          "Chính sách giao hàng",
          "Địa chỉ showroom",
        ],
      };
    }

    // 3. CHÍNH SÁCH GIAO HÀNG & PHÍ SHIP (SHIPPING POLICY)
    const shippingKeywords = [
      "phi ship", "tien ship", "phi van chuyen", "freeship", "mien phi ship",
      "mien phi van chuyen", "giao hang mat bao lau", "bao lau nhan duoc",
      "ship hoa toc", "ship cod", "giao hang nhanh", "thoi gian giao hang",
      "ship ve", "ship bao nhieu", "gia ship", "phi giao hang"
    ];
    if (shippingKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "SHIPPING_POLICY",
        response:
          "Dạ, chính sách giao hàng tại **Linh Cosmetics** vô cùng ưu đãi cho nàng nè: 🚚✨\n\n" +
          "• **MIỄN PHÍ VẬN CHUYỂN (Freeship)**: Áp dụng toàn quốc cho mọi đơn hàng từ **500.000₫** trở lên!\n" +
          "• **Đơn hàng dưới 500.000₫**: Cước phí đồng giá chỉ **30.000₫** trên toàn quốc.\n" +
          "• **Thời gian nhận hàng**:\n" +
          "  - Khu vực nội thành (Hà Nội, TP.HCM): Nhận trong **1 - 2 ngày** làm việc.\n" +
          "  - Các tỉnh thành khác: Nhận trong **2 - 4 ngày** làm việc.\n\n" +
          "📦 Nàng được kiểm tra gói hàng thoải mái trước khi thanh toán cho shipper nha!",
        quickSuggestions: [
          "Phương thức thanh toán",
          "Chính sách đổi trả",
          "Tư vấn kem chống nắng",
        ],
      };
    }

    // 4. PHƯƠNG THỨC THANH TOÁN (PAYMENT METHODS)
    const paymentKeywords = [
      "phuong thuc thanh toan", "thanh toan the nao", "thanh toan bang gi",
      "co quet the khong", "co nhan momo khong", "chuyen khoan", "thanh toan momo",
      "thanh toan khi nhan hang", "tra tien the nao", "tra tien mat", "tra tien momo"
    ];
    if (paymentKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "PAYMENT_METHODS",
        response:
          "Dạ, **Linh Cosmetics** hỗ trợ 2 phương thức thanh toán an toàn và tiện lợi nhất: 💳✨\n\n" +
          "💵 **1. Thanh toán khi nhận hàng (COD)**: Nàng nhận hàng, kiểm tra sản phẩm ưng ý rồi mới thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.\n\n" +
          "📱 **2. Ví điện tử MoMo (Khuyên dùng)**: Quét mã QR MoMo hoặc thanh toán qua App MoMo siêu tốc, cực kỳ bảo mật và có cơ hội nhận voucher hoàn tiền từ MoMo!\n\n" +
          "Nàng có thể chọn phương thức mình thích ngay tại bước **[Thanh toán](/checkout)** nhé! 🌸",
        quickSuggestions: [
          "Chính sách Freeship",
          "Sản phẩm bán chạy nhất",
          "Chính sách bảo hành đổi trả",
        ],
      };
    }

    // 5. ĐỊA CHỈ & SHOWROOM (STORE LOCATION)
    const locationKeywords = [
      "dia chi", "shop o dau", "cua hang o dau", "chi nhanh", "showroom",
      "den xem hang", "den mua truc tiep", "vi tri shop", "o ha noi khong",
      "o tphcm khong", "dia chi cua hang", "dia chi shop"
    ];
    if (locationKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "STORE_LOCATION",
        response:
          "Dạ, nàng có thể ghé thăm và trải nghiệm trực tiếp các sản phẩm làm đẹp tại hệ thống showroom của **Linh Cosmetics** nha: 📍🌸\n\n" +
          "🏢 **Showroom Hà Nội**: Số 25 Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội.\n" +
          "🏢 **Showroom TP.HCM**: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh.\n" +
          "⏰ **Giờ mở cửa**: 8:30 - 22:00 (mở cửa tất cả các ngày trong tuần, kể cả Lễ, Tết).\n\n" +
          "Nàng cũng có thể xem bản đồ và để lại lời nhắn tại trang **[Liên hệ](/contact)** nhé!",
        quickSuggestions: [
          "Số điện thoại hotline",
          "Chính sách Freeship",
          "Sản phẩm bán chạy",
        ],
      };
    }

    // 6. CHÍNH SÁCH ĐỔI TRẢ & BẢO HÀNH (RETURN POLICY)
    const returnKeywords = [
      "doi tra", "chinh sach doi tra", "tra hang", "hang loi", "bi loi",
      "hang vo", "vo nut", "di ung", "hang gia", "hang fake", "den tien",
      "bao hanh", "doi hang the nao"
    ];
    if (returnKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "RETURN_POLICY",
        response:
          "Dạ, nàng hoàn toàn yên tâm khi mua sắm tại **Linh Cosmetics** ạ: 🛡️✨\n\n" +
          "• **Cam kết 100% Chính hãng**: Đền bù gấp đôi (**200% giá trị**) nếu phát hiện hàng giả, hàng nhái.\n" +
          "• **Đổi trả miễn phí trong 7 ngày**: Áp dụng khi sản phẩm bị lỗi từ nhà sản xuất, bể vỡ trong quá trình vận chuyển hoặc giao không đúng mẫu đã đặt.\n" +
          "• **Hỗ trợ tận tình**: Nàng chỉ cần giữ lại bao bì và liên hệ hotline **1900 1234** hoặc nhắn tin cho shop để được đổi mới tận nhà nhanh chóng!",
        quickSuggestions: [
          "Hotline hỗ trợ CSKH",
          "Phương thức thanh toán",
          "Phí vận chuyển",
        ],
      };
    }

    // 7. HƯỚNG DẪN XEM ĐƠN HÀNG (ORDER_REDIRECT) - Khách hỏi đơn hàng hoặc gửi mã ORD
    const orderKeywords = [
      "kiem tra don", "tra cuu don", "don hang cua toi", "xem don hang",
      "khi nao giao don", "trang thai don hang", "don hang den dau",
      "don hang ord", "huy don hang", "theo doi don", "ma don hang", "ma don"
    ];
    const isOrderCode = /\bord[-\s]?\d+/i.test(raw);
    if (isOrderCode || orderKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "ORDER_REDIRECT",
        response:
          "Dạ, em là trợ lý tư vấn sắc đẹp và mỹ phẩm nên không thể tra cứu dữ liệu đơn hàng nội bộ trực tiếp trong khung chat này ạ! 🌸\n\n" +
          "👉 Để xem tình trạng và tiến độ giao hàng, nàng hãy bấm vào mục **[Đơn hàng của tôi](/orders)** trên website nha.\n\n" +
          "Nếu cần hỗ trợ gấp về đơn hàng, nàng liên hệ ngay Hotline **1900 1234** để được các bạn CSKH hỗ trợ trực tiếp tức thì nhé! 🛍️\n\n" +
          "Nàng có cần em tư vấn thêm về sản phẩm dưỡng da hay mỹ phẩm làm đẹp nào không nè? ✨💄",
        quickSuggestions: [
          "Sản phẩm bán chạy nhất",
          "Tư vấn kem chống nắng",
          "Chính sách giao hàng",
          "Hotline chăm sóc khách hàng",
        ],
      };
    }

    // 8. LIÊN HỆ & TỔNG ĐÀI HOTLINE (CONTACT HOTLINE)
    const contactKeywords = [
      "hotline", "so dien thoai", "sdt", "tong dai", "cham soc khach hang",
      "cskh", "so dt", "gap nhan vien", "gap tu van vien", "so hotline"
    ];
    if (contactKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "CONTACT_HOTLINE",
        response:
          "Dạ, nàng có thể liên hệ trực tiếp với đội ngũ chăm sóc khách hàng của **Linh Cosmetics** qua các kênh sau: 📞🌸\n\n" +
          "☎️ **Hotline miễn phí**: **1900 1234** (Hoạt động từ 8:00 - 22:00 hàng ngày)\n" +
          "💬 **Chat Zalo**: Nàng bấm vào biểu tượng Zalo màu xanh ở góc phải màn hình để chat trực tiếp với nhân viên tư vấn.\n" +
          "📧 **Email**: cskh@linhcosmetics.vn\n\n" +
          "Tụi em luôn sẵn sàng lắng nghe và hỗ trợ nàng tốt nhất ạ!",
        quickSuggestions: [
          "Địa chỉ cửa hàng",
          "Chính sách giao hàng",
          "Chính sách đổi trả",
        ],
      };
    }

    // 9. KHUYẾN MÃI & VOUCHER (PROMOTIONS)
    const promoKeywords = [
      "khuyen mai", "voucher", "ma giam gia", "coupon", "sale", "uu dai",
      "giam gia gi khong", "dang giam gia", "co ma giam", "deal hot"
    ];
    if (promoKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "PROMOTIONS",
        response:
          "Dạ, hiện tại **Linh Cosmetics** đang có những chương trình ưu đãi rất hấp dẫn nè nàng: 🎁✨\n\n" +
          "• **Freeship toàn quốc**: Áp dụng tự động cho đơn hàng từ **500.000₫**.\n" +
          "• **Mã giảm giá độc quyền**: Giảm thêm từ 5% - 15% khi áp dụng mã tại bước xem Giỏ hàng.\n" +
          "• **Ưu đãi thành viên**: Tích điểm nâng hạng và nhận quà sinh nhật đặc biệt.\n\n" +
          "Nàng khám phá ngay hàng ngàn deal mỹ phẩm xịn tại mục **[Sản phẩm](/products)** nha! 🛍️",
        quickSuggestions: [
          "Sản phẩm bán chạy nhất",
          "Kem chống nắng giá tốt",
          "Chính sách Freeship",
        ],
      };
    }

    // 10. THƯƠNG HIỆU PHÂN PHỐI (BRANDS INQUIRY)
    const brandKeywords = [
      "thuong hieu", "co nhung hang nao", "hang gi", "brand nao",
      "cac hang my pham", "hang co san", "hang my pham nao"
    ];
    if (brandKeywords.some(kw => normalized.includes(kw))) {
      return {
        matched: true,
        intent: "BRANDS_INQUIRY",
        response:
          "Dạ, **Linh Cosmetics** là đối tác phân phối chính hãng của các thương hiệu mỹ phẩm và dược mỹ phẩm hàng đầu: 💄🌿\n\n" +
          "• **Dược mỹ phẩm chăm sóc da**: La Roche-Posay, Cerave, Vichy, Paula's Choice, Bioderma, Cosrx.\n" +
          "• **Trang điểm thời thượng**: MAC, L'Oréal Paris, Maybelline, 3CE, Romand.\n" +
          "• **Chống nắng & Dưỡng ẩm**: Anessa, Innisfree, Klairs, Skin1004.\n\n" +
          "Nàng bấm xem trọn bộ danh sách tại trang **[Thương hiệu](/brands)** nhé! ✨",
        quickSuggestions: [
          "Sản phẩm La Roche-Posay",
          "Sản phẩm MAC",
          "Sản phẩm bán chạy",
        ],
      };
    }

    // 11. SẢN PHẨM BÁN CHẠY NHẤT (BEST SELLERS)
    const bestSellerKeywords = [
      "ban chay", "hot nhat", "san pham hot", "mon nao duoc chuong",
      "best seller", "top san pham", "nhieu nguoi mua", "san pham noi bat"
    ];
    if (bestSellerKeywords.some(kw => normalized.includes(kw))) {
      // Lấy 3 sản phẩm đầu tiên từ kho làm gợi ý mẫu
      const topProducts = liveProducts.slice(0, 3);
      let listMarkdown = "";
      topProducts.forEach((p, idx) => {
        listMarkdown += `\n${idx + 1}. **[${p.name}](/products/${p.id})**`;
        if (p.variants && p.variants.length > 0) {
          listMarkdown += ` - giá chỉ từ **${Number(p.variants[0].price).toLocaleString("vi-VN")}₫**`;
        }
      });

      return {
        matched: true,
        intent: "BEST_SELLERS",
        response:
          `Dạ, đây là những siêu phẩm **Best-Seller** đang được các nàng yêu thích và săn đón nhiều nhất tại Linh Cosmetics ạ: 🌸✨${listMarkdown}\n\n` +
          "Nàng bấm vào tên sản phẩm ở trên hoặc xem các thẻ sản phẩm bên dưới để xem chi tiết và rinh ngay nhé! 🛍️",
      };
    }

    // KHÔNG KHỚP INTENT CƠ BẢN -> Chuyển tiếp sang LLM thông minh
    return {
      matched: false,
    };
  }
}

export default ChatIntentService;
