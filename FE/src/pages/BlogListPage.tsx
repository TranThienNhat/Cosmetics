import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Typography,
  Spin,
  Breadcrumb,
  Pagination,
  Card,
  Input,
  Button,
} from "antd";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import api from "../utils/api";
import BlogCard from "../components/BlogCard";

const { Title, Text, Paragraph } = Typography;

const BlogListPage: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 6,
    total: 0,
  });

  const fetchBlogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get("/blogs", {
        params: {
          page,
          limit: pagination.pageSize,
        },
      });

      const apiData = response.data.data;
      const apiMeta = response.data.meta;

      setBlogs(apiData || []);
      setPagination((prev) => ({
        ...prev,
        current: apiMeta.page,
        total: apiMeta.total,
      }));
    } catch (error) {
      console.error("Lỗi tải bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <Spin size="large" className="!text-[#BC8F8F]" />
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Breadcrumb - Đồng bộ với BlogDetail */}
        <Breadcrumb
          className="mb-12 text-[11px] uppercase tracking-[0.2em]"
          items={[
            {
              title: (
                <Link
                  to="/"
                  className="hover:!text-[#BC8F8F] text-[#555555] transition-colors"
                >
                  Trang chủ
                </Link>
              ),
            },
            {
              title: (
                <span className="text-[#BC8F8F] font-bold">Blog làm đẹp</span>
              ),
            },
          ]}
        />

        {/* Header Section */}
        <div className="text-center mb-24">
          <Text className="text-[#BC8F8F] uppercase tracking-[0.4em] font-bold text-[10px] mb-4 block">
            Linh Cosmetics Journal
          </Text>
          <Title
            level={1}
            className="!font-serif !text-4xl md:!text-6xl !text-[#2D2D2D] !mb-8 !font-medium"
          >
            Câu chuyện làm đẹp
          </Title>
          <div className="w-16 h-[1.5px] bg-[#BC8F8F]/40 mx-auto mb-8"></div>
          <Paragraph className="text-[#555555] font-serif text-lg md:text-xl max-w-2xl mx-auto leading-relaxed italic opacity-80">
            "Khám phá những bí quyết chăm sóc da khoa học và hành trình kiến tạo
            vẻ đẹp bền vững."
          </Paragraph>
        </div>

        {/* Blog Grid */}
        {blogs.length > 0 ? (
          <>
            <Row gutter={[32, 56]}>
              {blogs.map((blog) => (
                <Col xs={24} md={12} lg={8} key={blog.id}>
                  {/* Hiệu ứng hover đồng bộ với trang Home/Register */}
                  <div className="h-full transition-all duration-500 hover:translate-y-[-10px]">
                    <BlogCard blog={blog} />
                  </div>
                </Col>
              ))}
            </Row>

            {/* Pagination - Custom Rosy Brown Theme */}
            <div className="flex justify-center mt-28">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page) => {
                  fetchBlogs(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                showSizeChanger={false}
                className="custom-pagination-rosy"
              />
            </div>
          </>
        ) : (
          <Card className="text-center py-24 bg-white/40 border-dashed border-[#BC8F8F]/20 rounded-3xl shadow-sm">
            <Text className="italic font-serif text-[#555555]">
              Chuyên mục đang được cập nhật những nội dung mới nhất...
            </Text>
          </Card>
        )}

        {/* Newsletter Section - Styled like Register Card */}
        <div className="mt-40">
          <Card className="max-w-4xl mx-auto shadow-sm border-0 rounded-[2.5rem] overflow-hidden relative bg-white border border-[#f0ece2]">
            {/* Soft Background Decoration */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#BC8F8F]/5 rounded-full blur-[80px] -z-0 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#BC8F8F]/3 rounded-full blur-[60px] -z-0 -translate-x-1/4 translate-y-1/4"></div>

            <div className="relative z-10 p-10 md:p-20 text-center">
              <Title
                level={2}
                className="!font-serif !text-[#2D2D2D] !mb-4 !text-3xl"
              >
                Tham gia cùng chúng tôi
              </Title>
              <Paragraph className="text-[#555555] mb-12 max-w-md mx-auto text-[15px] leading-relaxed">
                Nhận những kiến thức chăm sóc da chuyên sâu và ưu đãi độc quyền
                từ Linh Cosmetics.
              </Paragraph>

              <div className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    size="large"
                    placeholder="Email của bạn..."
                    prefix={
                      <Mail size={18} className="text-[#BC8F8F]/50 mr-2" />
                    }
                    className="h-14 rounded-2xl border-[#f0ece2] focus:border-[#BC8F8F] hover:border-[#BC8F8F]/50 bg-[#FDFBF7]/50"
                  />
                  <Button
                    type="primary"
                    size="large"
                    className="h-14 px-10 rounded-2xl font-bold flex items-center justify-center gap-2 !bg-[#BC8F8F] !border-[#BC8F8F] hover:!opacity-90 transition-opacity uppercase tracking-widest text-xs"
                  >
                    GỬI <ArrowRight size={16} />
                  </Button>
                </div>
                <Text className="text-[10px] text-[#555555]/50 mt-8 block uppercase tracking-[0.25em] font-medium">
                  Bảo mật thông tin — Không tin nhắn rác
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Global Style Overrides for Pagination */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-pagination-rosy .ant-pagination-item-active {
          border-color: #BC8F8F !important;
          background-color: transparent !important;
        }
        .custom-pagination-rosy .ant-pagination-item-active a {
          color: #BC8F8F !important;
        }
        .custom-pagination-rosy .ant-pagination-item:hover {
          border-color: #BC8F8F !important;
        }
        .custom-pagination-rosy .ant-pagination-item:hover a {
          color: #BC8F8F !important;
        }
      `,
        }}
      />
    </div>
  );
};

export default BlogListPage;
