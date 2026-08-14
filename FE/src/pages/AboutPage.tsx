import React from "react";
import { Typography, Row, Col, Button, Divider, Card } from "antd";
import { Heart, Sparkles, Leaf, ShieldCheck, ArrowRight, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <Card className="border-0 shadow-lg p-4 sm:p-10 rounded-2xl">
          
          {/* 1. HERO SECTION */}
          <div className="text-center mb-20 mt-6">
            <Text className="text-primary uppercase tracking-[0.3em] font-bold text-xs mb-4 block">
              Since 2024 • Linh Cosmetics
            </Text>
            <Title level={1} className="!font-serif !text-4xl md:!text-5xl !text-charcoal !mb-6 leading-tight">
              Đánh thức vẻ đẹp <br /> <span className="italic text-primary">thuần khiết</span> của nàng
            </Title>
            <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full mb-6"></div>
            <Paragraph className="text-gray text-base md:text-lg italic font-serif leading-relaxed max-w-2xl mx-auto">
              "Tại Linh, chúng tôi tin rằng mỹ phẩm không chỉ để trang điểm, <br className="hidden md:block"/> 
              mà là để tôn vinh câu chuyện riêng của mỗi người phụ nữ."
            </Paragraph>
          </div>

          {/* 2. CÂU CHUYỆN THƯƠNG HIỆU */}
          <Row gutter={[48, 48]} className="items-center mb-24">
            <Col xs={24} lg={12}>
              <div className="relative p-2">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1974&auto=format&fit=crop" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    alt="Câu chuyện của Linh"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-primary/10 rounded-full blur-2xl -z-10"></div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="space-y-5">
                <Title level={2} className="!font-serif !text-3xl text-charcoal">Câu chuyện từ tâm hồn</Title>
                <Paragraph className="text-gray text-base leading-relaxed">
                  Linh Cosmetics ra đời từ những ngày đầu đông năm 2024, bắt nguồn từ khát khao tìm kiếm những giá trị thực trong ngành làm đẹp. Chúng tôi không theo đuổi những xu hướng chớp nhoáng, Linh chọn đồng hành cùng bạn trong hành trình chăm sóc bản thân bền vững.
                </Paragraph>
                <Paragraph className="text-gray text-base leading-relaxed">
                  Mỗi sản phẩm tại Linh đều được tuyển chọn khắt khe, từ thành phần thiên nhiên lành tính đến bao bì tinh tế, mang lại trải nghiệm vỗ về làn da và tâm trí sau những giờ làm việc mệt mỏi.
                </Paragraph>
                <Link to="/products" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-all mt-2 group">
                  Khám phá bộ sưu tập <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Col>
          </Row>

          {/* 3. GIÁ TRỊ CỐT LÕI */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <Title level={2} className="!font-serif !text-3xl text-charcoal">Triết lý của Linh</Title>
              <Text className="text-gray italic">Những giá trị tạo nên sự khác biệt</Text>
            </div>
            
            <Row gutter={[24, 24]}>
              {[
                { 
                  icon: <Leaf className="text-primary" size={28} />, 
                  title: "Thuần Khiết", 
                  desc: "Cam kết 100% nguyên liệu an toàn, minh bạch và lành tính cho mọi làn da nhạy cảm nhất." 
                },
                { 
                  icon: <Heart className="text-primary" size={28} />, 
                  title: "Yêu Bản Thân", 
                  desc: "Khuyến khích bạn dành ít nhất 15 phút mỗi ngày để lắng nghe và vỗ về làn da." 
                },
                { 
                  icon: <ShieldCheck className="text-primary" size={28} />, 
                  title: "Trách Nhiệm", 
                  desc: "Nói không với thử nghiệm trên động vật và ưu tiên vật liệu đóng gói thân thiện môi trường." 
                }
              ].map((item, idx) => (
                <Col xs={24} md={8} key={idx}>
                  <div className="bg-background/50 border border-gray/10 rounded-2xl p-8 text-center h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                      {item.icon}
                    </div>
                    <Title level={4} className="!font-serif mb-3 text-charcoal">{item.title}</Title>
                    <Text className="text-gray leading-relaxed block text-sm">{item.desc}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* 4. QUOTE TRÂN TRỌNG */}
          <div className="bg-primary rounded-2xl p-10 md:p-16 text-center text-white mb-20 relative overflow-hidden shadow-lg shadow-primary/20">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Sparkles size={100} />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <Title level={3} className="!text-white !font-serif mb-6 leading-relaxed">
                "Mỗi người phụ nữ là một bông hoa độc bản, và chúng tôi ở đây để giúp bạn tỏa hương."
              </Title>
              <Divider className="border-white/30 w-16 mx-auto my-6" />
              <Text className="uppercase tracking-[0.2em] text-[10px] font-bold text-white/90">
                Lời từ đội ngũ Linh
              </Text>
            </div>
          </div>

          {/* 5. KÊNH KẾT NỐI */}
          <div className="text-center mb-6">
            <Title level={3} className="!font-serif mb-8 text-charcoal">Ghé thăm ngôi nhà của Linh</Title>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="large" 
                className="rounded-lg border-gray/30 text-charcoal hover:!text-primary hover:!border-primary h-12 px-8 flex items-center justify-center gap-2 bg-transparent"
              >
                <Instagram size={18} /> @Linh.cosmetics
              </Button>
              <Link to="/products" className="w-full sm:w-auto">
                <Button 
                  type="primary" 
                  size="large" 
                  className="w-full bg-primary border-primary hover:bg-primary/90 rounded-lg h-12 px-10 text-base font-medium shadow-sm"
                >
                  Mua sắm ngay
                </Button>
              </Link>
            </div>
          </div>

        </Card>

        {/* Nút Quay về trang chủ ở ngoài Card */}
        <div className="text-center mt-8">
          <Link to="/" className="text-gray hover:text-primary text-sm transition-colors">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;