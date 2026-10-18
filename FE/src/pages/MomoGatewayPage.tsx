import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Typography,
  Input,
  Tag,
  Modal,
  message,
  Divider,
  Row,
  Col,
} from "antd";
import {
  CreditCardOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  LockOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "../utils/helpers";
import api from "../utils/api";

const { Title, Text, Paragraph } = Typography;

interface BankOption {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

const VIETNAM_BANKS: BankOption[] = [
  { id: "vcb", name: "Vietcombank", shortName: "VCB", color: "#006837" },
  { id: "tcb", name: "Techcombank", shortName: "TCB", color: "#E31837" },
  { id: "bidv", name: "BIDV", shortName: "BIDV", color: "#0A3B72" },
  { id: "ctg", name: "VietinBank", shortName: "CTG", color: "#0055A5" },
  { id: "mbb", name: "MB Bank", shortName: "MBB", color: "#003399" },
  { id: "acb", name: "ACB", shortName: "ACB", color: "#005BAA" },
  { id: "vpb", name: "VPBank", shortName: "VPB", color: "#008853" },
  { id: "stb", name: "Sacombank", shortName: "STB", color: "#004B87" },
  { id: "tpb", name: "TPBank", shortName: "TPB", color: "#5F259F" },
  { id: "vba", name: "Agribank", shortName: "VBA", color: "#8A1424" },
  { id: "hdb", name: "HDBank", shortName: "HDB", color: "#ED1B24" },
  { id: "vib", name: "VIB", shortName: "VIB", color: "#004F9F" },
];

const MomoGatewayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("orderId") || "ORD-" + Date.now();
  const amountStr = searchParams.get("amount") || "0";
  const amount = Number(amountStr) || 0;
  const orderInfo =
    searchParams.get("orderInfo") || `Thanh toan don hang ${orderId} qua MoMo ATM`;

  // Form states
  const [selectedBank, setSelectedBank] = useState<string>("vcb");
  const [cardNumber, setCardNumber] = useState<string>("9704 0000 0000 0018");
  const [cardHolder, setCardHolder] = useState<string>("NGUYEN VAN A");
  const [issueDate, setIssueDate] = useState<string>("03/07");

  // Modal OTP states
  const [otpModalVisible, setOtpModalVisible] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>("000000");
  const [countdown, setCountdown] = useState<number>(120);
  const [processing, setProcessing] = useState<boolean>(false);

  // Đếm ngược OTP khi mở modal
  useEffect(() => {
    let timer: any;
    if (otpModalVisible && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpModalVisible, countdown]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length > 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setIssueDate(raw);
  };

  const handleAutoFillTest = () => {
    setCardNumber("9704 0000 0000 0018");
    setCardHolder("NGUYEN VAN A");
    setIssueDate("03/07");
    message.success("Đã điền thông tin Thẻ ATM Test mẫu (Napas/MoMo Sandbox)!");
  };

  const handleProceedOtp = () => {
    const rawNumber = cardNumber.replace(/\s/g, "");
    if (rawNumber.length < 12) {
      message.error("Vui lòng nhập số thẻ ATM hợp lệ (tối thiểu 12-16 số)");
      return;
    }
    if (!cardHolder.trim()) {
      message.error("Vui lòng nhập tên chủ thẻ in trên mặt thẻ");
      return;
    }
    if (issueDate.length < 5) {
      message.error("Vui lòng nhập ngày phát hành/hết hạn thẻ (MM/YY)");
      return;
    }

    setCountdown(120);
    setOtpModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!otpValue.trim()) {
      message.error("Vui lòng nhập mã OTP xác thực");
      return;
    }

    try {
      setProcessing(true);
      const generatedTransId = `MOMO_ATM_${Date.now()}`;

      // Gọi xác nhận về BE
      try {
        await api.post("/orders/momo-return-confirm", {
          orderId,
          resultCode: 0,
          transId: generatedTransId,
        });
      } catch (beErr) {
        console.warn("Lỗi đồng bộ BE trực tiếp (sẽ chuyển tiếp qua URL return):", beErr);
      }

      message.success("Giao dịch thanh toán Thẻ ATM thành công!");
      // Chuyển tiếp tới trang kết quả MoMo Return
      setTimeout(() => {
        navigate(
          `/checkout/momo-return?orderId=${encodeURIComponent(
            orderId
          )}&resultCode=0&amount=${amount}&transId=${generatedTransId}&message=${encodeURIComponent(
            "Giao dịch thanh toán Thẻ ATM nội địa thành công qua Cổng MoMo Gateway"
          )}`
        );
      }, 1000);
    } catch (err) {
      message.error("Có lỗi xảy ra khi xử lý giao dịch. Vui lòng thử lại!");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    navigate(
      `/checkout/momo-return?orderId=${encodeURIComponent(
        orderId
      )}&resultCode=1006&amount=${amount}&message=${encodeURIComponent(
        "Khách hàng đã hủy giao dịch trên cổng thanh toán Thẻ ATM MoMo"
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF2F8]/40 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* HEADER CỔNG THANH TOÁN MOMO & NAPAS */}
        <div className="bg-gradient-to-r from-[#D82D8B] via-[#c22179] to-[#911658] text-white p-5 sm:p-6 rounded-3xl shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#D82D8B] flex items-center justify-center font-bold text-xl shadow-md">
                m
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
                    Cổng Thanh Toán MoMo Gateway
                  </h1>
                  <Tag className="bg-white/20 text-white border-0 text-[11px] rounded-full px-2 py-0.5">
                    Sandbox Test
                  </Tag>
                </div>
                <p className="text-white/80 text-xs sm:text-sm m-0 mt-0.5">
                  Thanh toán qua Thẻ ATM nội địa / Napas trực tuyến
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none">
              <span className="text-white/80 text-xs block">Tổng tiền thanh toán</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI: FORM CHỌN NGÂN HÀNG & NHẬP THẺ */}
          <Col xs={24} lg={15}>
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white">
              {/* BƯỚC 1: CHỌN NGÂN HÀNG */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BankOutlined className="text-primary text-base" />
                    <Text strong className="text-charcoal text-sm sm:text-base">
                      1. Chọn ngân hàng phát hành thẻ ATM
                    </Text>
                  </div>
                  <span className="text-xs text-gray-400">12 ngân hàng Napas</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {VIETNAM_BANKS.map((b) => {
                    const isSelected = selectedBank === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBank(b.id)}
                        className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-[#D82D8B] bg-[#FDF2F8] shadow-sm ring-2 ring-[#D82D8B]/30 font-bold text-[#D82D8B]"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <div
                          className="w-7 h-7 mx-auto mb-1.5 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
                          style={{ backgroundColor: b.color }}
                        >
                          {b.shortName.slice(0, 3)}
                        </div>
                        <span className="text-xs block truncate leading-tight">
                          {b.shortName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Divider className="my-5" />

              {/* BƯỚC 2: NHẬP THÔNG TIN THẺ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCardOutlined className="text-primary text-base" />
                    <Text strong className="text-charcoal text-sm sm:text-base">
                      2. Nhập thông tin thẻ ATM
                    </Text>
                  </div>

                  <Button
                    type="link"
                    size="small"
                    onClick={handleAutoFillTest}
                    className="text-[#D82D8B] p-0 font-medium text-xs flex items-center gap-1"
                  >
                    <ThunderboltOutlined />
                    Nạp thẻ test nhanh
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Số thẻ ATM (16 chữ số) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      size="large"
                      prefix={<CreditCardOutlined className="text-gray-400" />}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="9704 0000 0000 0018"
                      className="rounded-xl h-12 font-mono text-base"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Tên in trên thẻ (không dấu) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      size="large"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      className="rounded-xl h-12 font-mono uppercase text-base"
                    />
                  </div>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Ngày phát hành / Hết hạn (MM/YY) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        size="large"
                        value={issueDate}
                        onChange={handleIssueDateChange}
                        placeholder="03/07"
                        className="rounded-xl h-12 font-mono text-base"
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Cổng bảo mật Napas
                      </label>
                      <div className="h-12 rounded-xl bg-gray-50 border border-gray-200 px-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 text-green-700 font-medium">
                          <SafetyCertificateOutlined className="text-green-600" />
                          Chuẩn PCI-DSS
                        </span>
                        <Tag color="green" className="m-0 rounded border-0 text-[10px]">
                          256-bit SSL
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* NÚT TIẾP TỤC */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={handleProceedOtp}
                    className="flex-1 h-12 sm:h-13 rounded-xl bg-[#D82D8B] hover:!bg-[#b82274] border-[#D82D8B] font-semibold text-base shadow-md"
                  >
                    Tiếp tục thanh toán • {formatCurrency(amount)}
                  </Button>

                  <Button
                    size="large"
                    onClick={handleCancelPayment}
                    className="h-12 sm:h-13 rounded-xl border-gray-300 hover:border-gray-400 text-gray-600 text-sm"
                  >
                    Hủy giao dịch
                  </Button>
                </div>
              </div>
            </Card>
          </Col>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG & THÔNG TIN TEST */}
          <Col xs={24} lg={9}>
            {/* THẺ TÓM TẮT GIAO DỊCH */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white mb-5">
              <h3 className="text-charcoal font-bold text-base mb-4 flex items-center gap-2">
                <LockOutlined className="text-[#D82D8B]" />
                Thông tin đơn hàng
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                  <span className="text-gray-400 text-xs">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-charcoal">{orderId}</span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                  <span className="text-gray-400 text-xs">Đơn vị nhận tiền:</span>
                  <span className="font-semibold text-charcoal">Linh Cosmetics</span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                  <span className="text-gray-400 text-xs">Kênh thanh toán:</span>
                  <span className="text-charcoal font-medium">MoMo ATM (Napas)</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-600 font-medium">Số tiền thanh toán:</span>
                  <span className="text-xl font-extrabold text-[#D82D8B] font-serif">
                    {formatCurrency(amount)}
                  </span>
                </div>
              </div>
            </Card>

            {/* BẢNG THÔNG TIN THẺ TEST SANDBOX */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-[#FAF3EC]/80 border-dashed border-[#BC8F8F]/40">
              <div className="flex items-center gap-2 text-[#BC8F8F] font-bold text-sm mb-2.5">
                <SafetyCertificateOutlined className="text-lg" />
                <span>Thẻ ATM Test Sandbox (Napas):</span>
              </div>
              <Paragraph className="text-xs text-gray-500 mb-3 leading-relaxed">
                Môi trường thử nghiệm cho phép thanh toán giả lập với thẻ test chính thức mà không bị trừ tiền thật.
              </Paragraph>

              <div className="bg-white/80 p-3 rounded-xl border border-[#BC8F8F]/20 text-xs space-y-1.5 font-mono text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Số thẻ:</span>
                  <strong className="text-charcoal">9704 0000 0000 0018</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Chủ thẻ:</span>
                  <strong className="text-charcoal">NGUYEN VAN A</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Ngày PH:</span>
                  <strong className="text-charcoal">03/07</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Mã OTP:</span>
                  <strong className="text-[#D82D8B]">000000</strong>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Trạng thái kết nối:</span>
                <Tag color="success" className="m-0 border-0 text-[10px]">
                  Sẵn sàng thanh toán
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* MODAL NHẬP MÃ OTP NGÂN HÀNG (BƯỚC 3) */}
      <Modal
        open={otpModalVisible}
        onCancel={() => setOtpModalVisible(false)}
        footer={null}
        centered
        width={440}
        className="rounded-3xl overflow-hidden"
      >
        <div className="text-center pt-4 pb-2 px-2">
          <div className="w-16 h-16 rounded-2xl bg-[#D82D8B]/10 flex items-center justify-center mx-auto text-[#D82D8B] text-2xl mb-4">
            <LockOutlined />
          </div>

          <Title level={4} className="!font-bold !m-0 !mb-1 text-charcoal">
            Xác thực giao dịch OTP
          </Title>
          <Text className="text-gray-500 text-xs block mb-5">
            Ngân hàng đã gửi mã OTP tới số điện thoại đăng ký thẻ của bạn (Mã test mặc định:{" "}
            <strong className="text-[#D82D8B]">000000</strong>)
          </Text>

          <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Đơn vị thụ hưởng:</span>
              <strong className="text-charcoal">Linh Cosmetics</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mã đơn hàng:</span>
              <strong className="font-mono text-charcoal">{orderId}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Số tiền:</span>
              <strong className="text-base text-[#D82D8B] font-bold">
                {formatCurrency(amount)}
              </strong>
            </div>
          </div>

          <div className="mb-5 text-left">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Nhập mã OTP xác nhận (6 chữ số):
            </label>
            <Input
              size="large"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center font-mono text-2xl tracking-widest h-14 rounded-xl font-bold"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Hiệu lực còn lại: {countdown}s</span>
              <span
                onClick={() => {
                  setCountdown(120);
                  setOtpValue("000000");
                  message.info("Đã tạo lại mã OTP test 000000");
                }}
                className="text-[#D82D8B] cursor-pointer hover:underline"
              >
                Gửi lại mã
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button
              size="large"
              onClick={() => setOtpModalVisible(false)}
              className="flex-1 h-12 rounded-xl border-gray-300 text-gray-600"
            >
              Quay lại
            </Button>
            <Button
              type="primary"
              size="large"
              loading={processing}
              onClick={handleConfirmPayment}
              className="flex-1 h-12 rounded-xl bg-[#D82D8B] hover:!bg-[#b82274] border-[#D82D8B] font-bold shadow-md"
            >
              Xác nhận thanh toán
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MomoGatewayPage;
