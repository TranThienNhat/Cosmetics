import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Typography,
  Spin,
  Breadcrumb,
  Divider,
  Tag,
  Button,
  Space,
  Card,
} from "antd";
import { CalendarOutlined, ArrowLeftOutlined, ShareAltOutlined } from "@ant-design/icons";
import api from "../utils/api";
import { getImageUrl } from "../utils/helpers";

const { Title, Paragraph, Text } = Typography;

const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/blogs/${id}`);
        setBlog(response.data);
      } catch (error) {
        console.error("Lỗi tải bài viết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <Spin size="large" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <Title level={3} className="!font-serif !text-[#2D2D2D]">
          Bài viết không tồn tại
        </Title>

        <Link to="/blogs">
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            className="mt-4 !bg-[#BC8F8F] !border-[#BC8F8F]"
          >
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-3 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          className="mb-4 sm:mb-8 text-[11px] uppercase tracking-[0.15em]"
          items={[
            {
              title: (
                <Link
                  to="/"
                  className="hover:!text-[#BC8F8F] text-[#555555]"
                >
                  Trang chủ
                </Link>
              ),
            },
            {
              title: (
                <Link
                  to="/blogs"
                  className="hover:!text-[#BC8F8F] text-[#555555]"
                >
                  Blog làm đẹp
                </Link>
              ),
            },
            {
              title: (
                <span className="text-[#BC8F8F] font-bold">
                  Chi tiết
                </span>
              ),
            },
          ]}
        />

        <Card className="shadow-sm border-0 rounded-xl overflow-hidden bg-white" bodyStyle={{ padding: "16px sm: 24px" }}>
          {/* Cover Image */}
          <div className="relative h-[200px] sm:h-[320px] md:h-[460px] w-full overflow-hidden rounded-lg mb-6 sm:mb-8">
            <img
              src={getImageUrl(blog.cover_image)}
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-[1.5s] hover:scale-105"
            />
          </div>

          <div className="px-1 sm:px-4 md:px-8">
            {/* Meta Info */}
            <Space className="mb-4 sm:mb-6 flex-wrap" size="middle">
              <Tag className="border-0 rounded-full px-4 m-0 uppercase text-[10px] font-bold bg-[#BC8F8F]/10 text-[#BC8F8F]">
                Linh Cosmetics
              </Tag>

              <Text className="text-[12px] text-[#555555] flex items-center gap-2">
                <CalendarOutlined style={{ fontSize: 14, color: "#BC8F8F" }} />
                {new Date(blog.created_at).toLocaleDateString("vi-VN")}
              </Text>
            </Space>

            {/* Title */}
            <Title
              level={1}
              className="!font-serif !mb-6 sm:!mb-10 !leading-[1.3] !text-[#2D2D2D] !text-2xl sm:!text-3xl md:!text-4xl"
            >
              {blog.title}
            </Title>

            <Divider className="my-6 sm:my-10 border-[#f0ece2]" />

            {/* Main Content */}
            <div
              className="prose prose-stone max-w-none 
              whitespace-pre-line
              prose-p:text-[#555555] prose-p:leading-[1.8] prose-p:text-[16px] prose-p:mb-6
              prose-headings:font-serif prose-headings:text-[#2D2D2D]
              prose-img:rounded-xl prose-img:shadow-sm
              prose-strong:text-[#2D2D2D]
              prose-blockquote:border-[#BC8F8F] prose-blockquote:bg-[#BC8F8F]/5 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            <Divider className="my-12 border-[#f0ece2]" />

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-4">
              <Link to="/blogs">
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  className="flex items-center !text-[#BC8F8F] font-bold text-xs uppercase tracking-widest hover:translate-x-[-6px] transition-transform p-0"
                >
                  Quay lại bài viết
                </Button>
              </Link>

              <div className="flex items-center gap-4 bg-[#FDFBF7] px-6 py-3 rounded-full border border-[#f0ece2]">
                <Text className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#555555]">
                  Chia sẻ
                </Text>

                <div className="w-[1px] h-4 bg-[#BC8F8F]/20"></div>

                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  className="hover:!bg-[#BC8F8F]/10 flex items-center justify-center"
                  icon={<ShareAltOutlined style={{ fontSize: 16, color: "#BC8F8F" }} />}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 mb-12">
          <Paragraph className="!text-[#555555]/60 text-xs italic font-serif">
            — Tận tâm vì vẻ đẹp của bạn —
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;