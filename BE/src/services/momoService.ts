import crypto from "crypto";

interface CreatePaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
  requestType?: string;
}

interface MomoPaymentResult {
  payUrl: string;
  qrCodeUrl?: string;
  deeplink?: string;
  resultCode: number;
  message: string;
  isSimulated?: boolean;
  rawMomoResponse?: any;
  requestBodySent?: any;
}

class MomoService {
  private partnerCode: string;
  private accessKey: string;
  private secretKey: string;
  private endpoint: string;

  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529";
    this.accessKey = process.env.MOMO_ACCESS_KEY || "klm05TvNBzhg7h7j";
    this.secretKey = process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    this.endpoint = process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
  }

  /**
   * Tạo yêu cầu thanh toán MoMo Gateway (payWithATM - Thẻ ATM nội địa / Napas)
   */
  async createPayment({
    orderId,
    amount,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData = "",
    requestType = process.env.MOMO_REQUEST_TYPE || "payWithATM",
  }: CreatePaymentParams): Promise<MomoPaymentResult> {
    const requestId = `${orderId}_${Date.now()}`;

    // Chuẩn hóa orderInfo sang tiếng Việt không dấu để đảm bảo tương thích 100% với chữ ký MoMo
    const cleanOrderInfo = (orderInfo || `Thanh toan don hang ${orderId}`)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9 -]/g, "")
      .trim();

    // Hàm gọi MoMo Gateway với type chỉ định
    const sendMomoRequest = async (type: string) => {
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${cleanOrderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${type}`;
      const signature = crypto
        .createHmac("sha256", this.secretKey)
        .update(rawSignature)
        .digest("hex");

      const requestBody = {
        partnerCode: this.partnerCode,
        partnerName: "Test Merchant",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId,
        orderInfo: cleanOrderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType: type,
        autoCapture: true,
        signature,
        lang: "vi",
      };

      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(8000),
        });
        const data: any = await response.json();
        return { success: data && data.resultCode === 0 && Boolean(data.payUrl), data, requestBody };
      } catch (e: any) {
        return { success: false, error: e.message, requestBody: {} };
      }
    };

    // 1. Thử với requestType được cấu hình (mặc định "payWithATM")
    let result = await sendMomoRequest(requestType);

    // 2. Nếu payWithATM không thành công, thử tiếp với "payWithMethod"
    if (!result.success && requestType !== "payWithMethod") {
      console.warn("MoMo payWithATM rejected, retrying with payWithMethod...", result.data);
      result = await sendMomoRequest("payWithMethod");
    }

    // NẾU MOMO TRẢ VỀ PAYURL HỢP LỆ (resultCode === 0)
    if (result.success && result.data?.payUrl) {
      console.log(">>> Tạo MoMo payUrl thành công:", result.data.payUrl);
      return {
        payUrl: result.data.payUrl,
        qrCodeUrl: result.data.qrCodeUrl,
        deeplink: result.data.deeplink,
        resultCode: result.data.resultCode,
        message: result.data.message || "Tạo liên kết thanh toán MoMo thành công",
        rawMomoResponse: result.data,
        requestBodySent: result.requestBody,
      };
    }

    // NẾU MOMO SANDBOX TỪ CHỐI NHẬP THẺ TRỰC TIẾP TRÊN WEB:
    // Chuyển hướng tới Cổng nhập thẻ MoMo ATM Gateway để người dùng chọn ngân hàng & nhập thẻ test
    let gatewayUrl = `${redirectUrl.replace(/\/momo-return.*$/, "")}/momo-gateway`;
    if (!gatewayUrl.includes("/checkout/momo-gateway")) {
      gatewayUrl = "http://localhost:5173/checkout/momo-gateway";
    }

    console.warn(">>> MoMo Cloud không hỗ trợ nhập thẻ web cho tài khoản test này, chuyển tiếp Cổng MoMo ATM Gateway:", result.data || result.error);
    return {
      payUrl: `${gatewayUrl}?orderId=${encodeURIComponent(orderId)}&amount=${amount}&orderInfo=${encodeURIComponent(cleanOrderInfo)}`,
      resultCode: 0,
      message: "Chuyển tiếp đến cổng thanh toán MoMo ATM để nhập thẻ",
      isSimulated: true,
      rawMomoResponse: result.data,
      requestBodySent: result.requestBody,
    };
  }

  /**
   * Xác thực chữ ký phản hồi từ MoMo
   */
  verifySignature(params: {
    amount: string | number;
    extraData?: string;
    message?: string;
    orderId: string;
    orderInfo?: string;
    orderType?: string;
    partnerCode: string;
    payType?: string;
    requestId: string;
    responseTime?: string | number;
    resultCode: string | number;
    transId?: string | number;
    signature: string;
  }): boolean {
    const {
      amount,
      extraData = "",
      message = "",
      orderId,
      orderInfo = "",
      orderType = "",
      partnerCode,
      payType = "",
      requestId,
      responseTime = "",
      resultCode,
      transId = "",
      signature,
    } = params;

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const generatedSignature = crypto
      .createHmac("sha256", this.secretKey)
      .update(rawSignature)
      .digest("hex");

    return generatedSignature === signature;
  }
}

export default new MomoService();
