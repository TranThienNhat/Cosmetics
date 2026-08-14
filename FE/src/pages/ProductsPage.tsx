import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Typography, Spin, Pagination, Select, Input, Empty, Breadcrumb } from "antd";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { SearchOutlined, FilterOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import api from "../utils/api";
import { getImageUrl, formatCurrency, DEFAULT_PLACEHOLDER_IMAGE } from "../utils/helpers";

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;
const { Option } = Select;

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // State dữ liệu
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // State bộ lọc
  const [, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [appliedPriceRange] = useState<[number, number]>([0, 10000000]);

  // Kiểm tra điều kiện hiển thị thông tin thương hiệu
  // Phải có state 'fromBrandPage' truyền từ BrandsPage và có brand_id trên URL
  const selectedBrandId = searchParams.get("brand_id");
  const shouldShowBrandInfo = location.state?.fromBrandPage && selectedBrandId;
  const currentBrand = brands.find(b => b.id === Number(selectedBrandId));

  // 1. Khởi tạo dữ liệu (Danh mục & Thương hiệu)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get("/categories"),
          api.get("/brands")
        ]);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu lọc:", error);
      }
    };
    loadInitialData();
  }, []);

  // 2. Lắng nghe thay đổi từ URL và gọi API lấy sản phẩm
  useEffect(() => {
    loadProducts();
    const page = searchParams.get("page");
    if (page) setCurrentPage(Number(page));
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: searchParams.get("page") || 1,
        limit: pageSize,
        min_price: appliedPriceRange[0],
        max_price: appliedPriceRange[1],
        search: searchParams.get("search") || undefined,
        category_id: searchParams.get("category_id") || undefined,
        brand_id: searchParams.get("brand_id") || undefined,
      };

      const response = await api.get("/products", { params });
      setProducts(response.data.data || []);
      setTotal(response.data.meta?.total || 0);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm xử lý thay đổi bộ lọc
  const handleFilterChange = (key: string, value: any) => {
    const newParams = new URLSearchParams(searchParams);

    if (value !== undefined && value !== null && value !== "") {
      newParams.set(key, value.toString());
    } else {
      newParams.delete(key);
    }

    // Chỉ reset về trang 1 khi đổi bộ lọc, không reset khi đang chuyển trang
    if (key !== "page") {
      newParams.set("page", "1");
    }

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setCurrentPage(1);
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">

        {/* Breadcrumb */}
        <Breadcrumb
          className="mb-6 uppercase tracking-widest text-[10px] text-gray"
          items={[
            { title: <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link> },
            { title: shouldShowBrandInfo && currentBrand ? <Link to="/brands" className="hover:text-primary transition-colors">Thương hiệu</Link> : "Cửa hàng" },
            shouldShowBrandInfo && currentBrand ? { title: currentBrand.name } : null
          ].filter(Boolean) as any}
        />

        {/* Header Section: Hiển thị linh hoạt */}
        <div className="mb-12">
          {shouldShowBrandInfo && currentBrand ? (
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
              <div className="relative z-10">
                <Text className="text-primary uppercase tracking-[0.2em] font-bold text-xs mb-3 block">Chuyên mục thương hiệu</Text>
                <Title level={1} className="!text-charcoal !mb-6 !font-serif !text-4xl md:!text-5xl tracking-tight">
                  {currentBrand.name}
                </Title>
                {currentBrand.description && (
                  <Paragraph className="text-gray italic font-serif text-lg md:text-xl max-w-3xl leading-relaxed border-l-2 border-primary/20 pl-6">
                    {currentBrand.description}
                  </Paragraph>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center md:text-left">
              <Title level={1} className="!text-charcoal !mb-3 !font-serif !text-4xl tracking-tight">Bộ sưu tập Linh</Title>
              <Text className="text-gray italic font-serif text-base">Khám phá những sản phẩm làm đẹp cao cấp được tuyển chọn kỹ lưỡng.</Text>
            </div>
          )}
        </div>

        <Row gutter={[32, 32]}>
          {/* SIDEBAR BỘ LỌC */}
          <Col xs={24} lg={6}>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm space-y-8 sticky top-28 border border-gray/10">
              <div className="flex items-center justify-between border-b border-gray/10 pb-4">
                <Title level={4} className="!mb-0 !font-serif flex items-center gap-2 text-charcoal">
                  <FilterOutlined style={{ fontSize: 16, color: "#BC8F8F" }} /> Bộ lọc
                </Title>
                <Button type="link" onClick={clearFilters} className="text-gray hover:text-primary p-0 flex items-center gap-1 text-xs transition-colors">
                  <ReloadOutlined style={{ fontSize: 11 }} /> Làm mới
                </Button>
              </div>

              {/* Tìm kiếm */}
              <div>
                <label className="block text-charcoal font-bold mb-3 text-[10px] uppercase tracking-widest text-gray">Tìm kiếm sản phẩm</label>
                <Input
                  placeholder="Nhập tên sản phẩm..."
                  prefix={<SearchOutlined style={{ fontSize: 14, color: "#9ca3af" }} />}
                  className="rounded-lg border-gray/20 bg-background h-11 focus:border-primary focus:shadow-none"
                  value={searchParams.get("search") || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              {/* Lọc theo Thương hiệu */}
              {!shouldShowBrandInfo && (
                <div>
                  <label className="block text-charcoal font-bold mb-3 text-[10px] uppercase tracking-widest text-gray">Thương hiệu</label>
                  <Select
                    placeholder="Tất cả thương hiệu"
                    className="w-full"
                    value={searchParams.get("brand_id") ? Number(searchParams.get("brand_id")) : undefined}
                    onChange={(val) => handleFilterChange("brand_id", val)}
                    allowClear
                  >
                    {brands.map((b) => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                  </Select>
                </div>
              )}

              {/* Lọc theo Danh mục */}
              <div>
                <label className="block text-charcoal font-bold mb-3 text-[10px] uppercase tracking-widest text-gray">Danh mục</label>
                <Select
                  placeholder="Chọn danh mục"
                  className="w-full"
                  value={searchParams.get("category_id") ? Number(searchParams.get("category_id")) : undefined}
                  onChange={(val) => handleFilterChange("category_id", val)}
                  allowClear
                >
                  {categories.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </div>
            </div>
          </Col>

          {/* DANH SÁCH SẢN PHẨM */}
          <Col xs={24} lg={18}>
            {loading ? (
              <div className="text-center py-32"><Spin size="large" className="text-primary" /></div>
            ) : products.length > 0 ? (
              <>
                <Row gutter={[24, 32]}>
                  {products.map((product) => (
                    <Col key={product.id} xs={24} sm={12} xl={8}>
                      <Card
                        hoverable
                        className="border border-gray/10 shadow-sm h-full rounded-2xl overflow-hidden group flex flex-col bg-white hover:shadow-lg transition-all duration-300"
                        bodyStyle={{ padding: '20px' }}
                        cover={
                          <Link to={`/products/${product.id}`}>
                            <div className="h-72 overflow-hidden bg-gray/5 p-1 border-b border-gray/5">
                              <img
                                alt={product.name}
                                src={getImageUrl(product.thumb_image)}
                                onError={(e: any) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_PLACEHOLDER_IMAGE;
                                }}
                                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                          </Link>
                        }
                      >
                        <div className="flex flex-col h-full">
                          <Meta
                            title={
                              <Link to={`/products/${product.id}`} className="text-charcoal hover:text-primary line-clamp-1 font-serif text-lg transition-colors">
                                {product.name}
                              </Link>
                            }
                            description={
                              <div className="mt-2 flex flex-col gap-4">
                                <Text className="text-primary font-medium text-lg">
                                  {formatCurrency(Number(product.min_price || 0))}
                                </Text>
                                <Link to={`/products/${product.id}`} className="w-full mt-auto">
                                  <Button
                                    block
                                    className="rounded-lg border-primary text-primary h-10 font-medium flex items-center justify-center gap-2 hover:!bg-primary hover:!text-white transition-colors"
                                  >
                                    Xem chi tiết <RightOutlined style={{ fontSize: 12 }} />
                                  </Button>
                                </Link>
                              </div>
                            }
                          />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <div className="flex justify-center mt-16">
                  <Pagination
                    current={Number(searchParams.get("page") || 1)}
                    total={total}
                    pageSize={pageSize}
                    onChange={(page) => {
                      handleFilterChange("page", page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    showSizeChanger={false}
                  />
                </div>
              </>
            ) : (
              <Card className="text-center py-24 border border-gray/10 shadow-sm rounded-2xl bg-white">
                <Empty
                  description={<Text className="text-gray italic font-serif text-base">Không tìm thấy sản phẩm phù hợp.</Text>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Button
                  type="primary"
                  className="mt-8 bg-primary border-primary rounded-lg h-11 px-8 font-medium hover:!bg-primary/90 transition-all"
                  onClick={clearFilters}
                >
                  Xóa bộ lọc
                </Button>
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProductsPage;