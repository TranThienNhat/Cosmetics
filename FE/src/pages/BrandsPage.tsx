import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Spin, Breadcrumb, Button } from "antd";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../utils/api";
import { getImageUrl } from "../utils/helpers";

const { Title, Text, Paragraph } = Typography;

const BrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get("/brands");
        setBrands(response.data.data || []);
      } catch (error) {
        console.error("Lỗi tải thương hiệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spin size="large" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Breadcrumb */}
        <Breadcrumb 
          className="mb-12 text-gray text-xs"
          items={[
            { title: <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link> }, 
            { title: "Thương hiệu" }
          ]} 
        />
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <Text className="text-primary uppercase tracking-[0.2em] font-bold text-xs mb-3 block">
            Linh Partners
          </Text>
          <Title level={2} className="!font-serif !text-4xl md:!text-5xl !text-charcoal !mb-6">
            Những người bạn đồng hành
          </Title>
          <div className="w-12 h-1 bg-primary/30 mx-auto rounded-full mb-6"></div>
          <Paragraph className="text-gray italic font-serif text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            "Tại Linh, chúng tôi chỉ hợp tác với những thương hiệu trân quý vẻ đẹp tự nhiên và sự an lành của làn da bạn."
          </Paragraph>
        </div>

        {/* Brand Grid */}
        <Row gutter={[24, 32]}>
          {brands.map((brand) => (
            <Col xs={24} sm={12} md={8} lg={6} key={brand.id}>
              {/* QUAN TRỌNG: Truyền state fromBrandPage để ProductsPage hiển thị Description */}
              <Link 
                to={`/products?brand_id=${brand.id}`} 
                state={{ fromBrandPage: true }} 
                className="block h-full"
              >
                <Card
                  hoverable
                  className="border border-gray/10 shadow-sm h-full rounded-2xl overflow-hidden group bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  bodyStyle={{ padding: '24px' }}
                  cover={
                    <div className="h-48 overflow-hidden bg-gray/5 flex items-center justify-center p-8 relative border-b border-gray/5">
                      {/* Logo thương hiệu */}
                      <img
                        alt={brand.name}
                        src={getImageUrl(brand.image_url)}
                        className="max-w-full max-h-full object-contain grayscale opacity-60 transition-all duration-700 ease-in-out group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    </div>
                  }
                >
                  <div className="text-center">
                    <Title level={4} className="!font-serif !mb-5 text-charcoal group-hover:text-primary transition-colors line-clamp-1">
                      {brand.name}
                    </Title>
                    
                    <Button 
                      block 
                      className="rounded-lg border-primary text-primary font-medium h-10 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-colors"
                    >
                      Khám phá <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        {/* Call to action cuối trang */}
        <div className="mt-24 p-10 md:p-16 bg-white rounded-2xl text-center border border-gray/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          
          <Title level={3} className="!font-serif mb-4 text-charcoal">Bạn muốn tìm một cái tên khác?</Title>
          <Paragraph className="text-gray mb-8 max-w-md mx-auto leading-relaxed">
            Nếu thương hiệu yêu thích của bạn chưa có mặt, đừng ngần ngại gửi lời nhắn cho chúng tôi nhé!
          </Paragraph>
          <Link to="/contact">
            <Button 
              size="large" 
              className="rounded-lg border-charcoal text-charcoal px-10 h-12 font-medium hover:!border-primary hover:!text-primary transition-colors bg-transparent"
            >
              Gửi yêu cầu cho Linh
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;