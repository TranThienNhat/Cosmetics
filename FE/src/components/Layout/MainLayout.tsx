import React, { useState, useRef, useEffect } from "react";
import {
  Layout,
  Menu,
  Badge,
  Dropdown,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Card,
  Avatar,
  List,
  Drawer,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  InboxOutlined,
  SearchOutlined,
  SettingOutlined,
  InstagramOutlined,
  FacebookOutlined,
  CustomerServiceOutlined,
  CloseOutlined,
  SendOutlined,
  ThunderboltOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import api from "../../utils/api";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();

  // Số hiển thị ở icon giỏ hàng = số item/biến thể trong giỏ
  // Không tính tổng quantity của từng sản phẩm
  const { items } = useCart();
  const cartItemCount = items.length;

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- State xử lý cho AI Chatbox ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInputValue, setChatInputValue] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      text: "✨ Xin chào! Mình là trợ lý ảo của **Linh Cosmetics**. Bạn cần tư vấn về sản phẩm mỹ phẩm hay routine chăm sóc da nào hôm nay ạ? 🌸",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống đáy khi có tin nhắn mới hoặc đang loading
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading, chatOpen]);

  // Hàm xử lý gửi tin nhắn lên API backend
  const handleSendChatMessage = async () => {
    if (!chatInputValue.trim() || chatLoading) return;

    const userText = chatInputValue.trim();
    setChatInputValue("");

    // 1. Thêm tin nhắn của User vào khung chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: userText,
      },
    ]);

    setChatLoading(true);

    try {
      // 2. Gọi API Express kết hợp GPT/Gemini Fallback
      const response = await api.post("/ai/ask", {
        userMessage: userText,
      });

      const data = response.data;

      if (data.success) {
        // 3. Thêm câu trả lời của AI vào khung chat
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "ai",
            text: data.answer,
          },
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Chat error:", error);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "❌ Hệ thống bận một chút, bạn có thể thử lại câu hỏi sau vài giây nhé!",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchModalVisible(false);
      setSearchValue("");
    }
  };

  const menuItems = [
    {
      key: "/",
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: "/brands",
      label: <Link to="/brands">Thương hiệu</Link>,
    },
    {
      key: "/products",
      label: <Link to="/products">Sản phẩm</Link>,
    },
    {
      key: "/blogs",
      label: <Link to="/blogs">Blog làm đẹp</Link>,
    },
    {
      key: "/about",
      label: <Link to="/about">Giới thiệu</Link>,
    },
    {
      key: "/contact",
      label: <Link to="/contact">Liên hệ</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: "orders",
      label: (
        <Link to="/orders" className="flex items-center gap-2 py-1">
          <InboxOutlined style={{ fontSize: 16 }} />
          <span>Đơn hàng của tôi</span>
        </Link>
      ),
    },
    ...(user?.role === "admin" || user?.role === "staff"
      ? [
          {
            key: "admin",
            label: (
              <Link to="/admin" className="flex items-center gap-2 py-1">
                <SettingOutlined style={{ fontSize: 16 }} />
                <span>Quản trị hệ thống</span>
              </Link>
            ),
          },
        ]
      : []),
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      label: (
        <span className="flex items-center gap-2 text-red-500 py-1 hover:text-red-600 transition-colors">
          <LogoutOutlined style={{ fontSize: 16 }} />
          <span>Đăng xuất</span>
        </span>
      ),
      onClick: logout,
    },
  ];

  return (
    <Layout className="min-h-screen bg-[#FDFBF7]">
      {/* --- HEADER --- */}
      <Header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 h-16 sm:h-20 flex items-center px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger button for mobile */}
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center p-1 text-gray-700 hover:text-[#BC8F8F]"
              aria-label="Menu"
            />
            <Link to="/" className="flex items-center">
              <Title
                level={3}
                className="!mb-0 !text-[#2D2D2D] font-serif tracking-tighter !text-xl sm:!text-2xl"
              >
                Linh Cosmetics
              </Title>
            </Link>
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="flex-1 justify-center bg-transparent border-none hidden md:flex font-medium"
          />

          <Space size={window.innerWidth < 640 ? "small" : "middle"}>
            <Button
              type="text"
              icon={<SearchOutlined style={{ fontSize: 18 }} />}
              onClick={() => setSearchModalVisible(true)}
              className="p-1 sm:p-2"
              aria-label="Tìm kiếm"
            />

            <Badge count={cartItemCount} color="#BC8F8F" size="small">
              <Button
                type="text"
                icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
                onClick={() => navigate("/cart")}
                className="p-1 sm:p-2"
                aria-label="Giỏ hàng"
              />
            </Badge>

            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  className="flex items-center gap-1 sm:gap-2 font-medium px-2"
                >
                  <UserOutlined style={{ fontSize: 18 }} />
                  <span className="hidden lg:inline">{user?.name}</span>
                </Button>
              </Dropdown>
            ) : (
              <Link to="/login">
                <Button
                  type="primary"
                  className="bg-[#BC8F8F] border-none rounded-full px-3 sm:px-6 h-8 sm:h-9 text-xs sm:text-sm hover:!bg-[#a37676]"
                >
                  Đăng nhập
                </Button>
              </Link>
            )}
          </Space>
        </div>
      </Header>

      {/* --- MOBILE DRAWER NAVIGATION --- */}
      <Drawer
        title={
          <div className="flex items-center justify-between w-full">
            <span className="font-serif text-lg text-charcoal font-bold tracking-tight">
              Linh Cosmetics
            </span>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={typeof window !== "undefined" && window.innerWidth < 360 ? "85%" : 300}
        bodyStyle={{ padding: 0 }}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="p-4 space-y-1">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems.map((item) => ({
                ...item,
                onClick: () => setMobileMenuOpen(false),
              }))}
              className="border-none font-medium"
            />

            <div className="pt-4 border-t border-gray-100 px-4 space-y-2">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                    <Avatar icon={<UserOutlined />} className="bg-[#BC8F8F]" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-charcoal truncate">{user?.name}</div>
                      <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <InboxOutlined style={{ fontSize: 16 }} />
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  {(user?.role === "admin" || user?.role === "staff") && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-primary font-medium py-2 px-2 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <SettingOutlined style={{ fontSize: 16 }} />
                      <span>Quản trị hệ thống</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 py-2 px-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                  >
                    <LogoutOutlined style={{ fontSize: 16 }} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button block type="primary" className="bg-[#BC8F8F] border-none rounded-xl h-10 mb-2 font-medium">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button block className="rounded-xl h-10 font-medium">
                      Đăng ký tài khoản
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-[#FDFBF7] text-xs text-gray-500 space-y-2">
            <div>Hotline: 1900 1234</div>
            <div>Email: admin@linhcosmetics.vn</div>
            <div className="text-[10px] text-gray-400">© 2026 Linh Cosmetics</div>
          </div>
        </div>
      </Drawer>

      {/* --- BODY CONTENT --- */}
      <Content className="flex-1">{children}</Content>

      {/* --- FOOTER --- */}
      <Footer className="bg-[#2D2D2D] text-white/70 py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <Title level={5} className="!text-white !mb-1 !font-serif">
              Linh Cosmetics
            </Title>

            <p className="text-sm italic leading-relaxed text-white/60">
              "Vẻ đẹp bắt đầu từ sự chăm sóc tâm hồn và làn da."
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Khám phá
            </h4>

            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  to="/products"
                  className="hover:text-[#BC8F8F] transition-colors"
                >
                  Tất cả sản phẩm
                </Link>
              </li>

              <li>
                <Link
                  to="/blogs"
                  className="hover:text-[#BC8F8F] transition-colors"
                >
                  Bí quyết làm đẹp
                </Link>
              </li>

              <li>
                <Link
                  to="/brands"
                  className="hover:text-[#BC8F8F] transition-colors"
                >
                  Thương hiệu nổi bật
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Liên hệ
            </h4>

            <div className="space-y-1.5 text-sm">
              <p>Hotline: 1900 1234</p>
              <p>Email: admin@linhcosmetics.vn</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Theo dõi chúng tôi
            </h4>

            <div className="flex items-center gap-2">
              <a
                href="https://www.facebook.com/linncosmetic"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#BC8F8F] hover:border-[#BC8F8F] transition-all duration-300 text-white"
              >
                <FacebookOutlined style={{ fontSize: 16 }} />
              </a>

              <a
                href="https://www.instagram.com/ilnh02"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#BC8F8F] hover:border-[#BC8F8F] transition-all duration-300 text-white"
              >
                <InstagramOutlined style={{ fontSize: 16 }} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-6 pt-4 text-center text-[11px] text-white/40">
          © 2026 Linh Cosmetics. All rights reserved.
        </div>
      </Footer>

      {/* ======================================================== */}
      {/* ACTION FLOATING GÓC PHẢI DƯỚI */}
      {/* ======================================================== */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col gap-3 items-end">
        {chatOpen ? (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <Space>
                    <Avatar
                      style={{ backgroundColor: "#BC8F8F" }}
                      icon={<ThunderboltOutlined />}
                    />

                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        Trợ lý Linh Cosmetics AI
                      </div>

                      <div className="text-[11px] text-green-500 font-normal">
                        Đang hoạt động tự động
                      </div>
                    </div>
                  </Space>

                  <Button
                    type="text"
                    shape="circle"
                    icon={<CloseOutlined style={{ fontSize: 14 }} className="text-gray-400 hover:text-gray-600" />}
                    onClick={() => setChatOpen(false)}
                  />
                </div>
              }
              className="shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-w-[calc(100vw-32px)]"
              style={{
                width: 380,
                maxHeight: "calc(100vh - 100px)",
                height: 480,
                borderRadius: "20px",
              }}
              bodyStyle={{
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                height: "calc(100% - 65px)",
                maxHeight: "calc(100vh - 165px)",
                overflow: "hidden",
              }}
            >
              {/* Khu vực danh sách tin nhắn */}
              <div className="flex-1 overflow-y-auto pr-1 mb-3 space-y-3">
                <List
                  dataSource={chatMessages}
                  renderItem={(item: ChatMessage) => {
                    const isAI = item.sender === "ai";

                    return (
                      <div
                        className={`flex ${
                          isAI ? "justify-start" : "justify-end"
                        } mb-3`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            isAI
                              ? "bg-gray-100 text-gray-800 rounded-tl-none"
                              : "bg-[#BC8F8F] text-white rounded-tr-none"
                          }`}
                        >
                          {isAI ? (
                            <div className="markdown-body">
                              <ReactMarkdown>{item.text}</ReactMarkdown>
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">
                              {item.text}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />

                {chatLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-gray-100 text-gray-400 text-xs px-4 py-2 rounded-2xl rounded-tl-none italic animate-pulse">
                      Trợ lý đang kiểm tra kho hàng...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Vùng nhập văn bản */}
              <div className="border-t border-gray-100 pt-3">
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Hỏi về sản phẩm, da liễu..."
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    onPressEnter={handleSendChatMessage}
                    disabled={chatLoading}
                    size="large"
                    className="rounded-l-xl border-gray-200 focus:border-[#BC8F8F] focus:shadow-none text-sm"
                    style={{
                      height: "40px",
                    }}
                  />

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendChatMessage}
                    loading={chatLoading}
                    size="large"
                    className="bg-[#BC8F8F] border-none rounded-r-xl hover:!bg-[#a37676] flex items-center justify-center"
                    style={{
                      height: "40px",
                      width: "45px",
                    }}
                  />
                </Space.Compact>
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* Nút bật Chat AI */}
            <Button
              type="primary"
              shape="circle"
              onClick={() => setChatOpen(true)}
              className="!w-12 !h-12 sm:!w-14 sm:!h-14 border-none shadow-xl transition-all duration-300 hover:scale-105 !bg-gradient-to-r from-[#BC8F8F] to-[#d4afaf] flex items-center justify-center"
              icon={<CustomerServiceOutlined className="!text-xl sm:!text-2xl text-white" />}
            />

            {/* Nút liên hệ qua Zalo */}
            <a
              href="https://zalo.me/0334523154"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0068FF] rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform overflow-hidden animate-in fade-in"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                alt="Zalo"
                className="w-7 h-7 sm:w-8 sm:h-8"
              />
            </a>
          </>
        )}
      </div>

      {/* --- MODAL TÌM KIẾM --- */}
      <Modal
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        centered
      >
        <Input
          placeholder="Bạn tìm gì hôm nay?"
          size="large"
          prefix={<SearchOutlined style={{ fontSize: 18 }} />}
          value={searchValue}
          onPressEnter={handleSearch}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </Modal>
    </Layout>
  );
};

export default MainLayout;