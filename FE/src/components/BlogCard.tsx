import React from "react";
import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { getImageUrl } from "../utils/helpers";

const { Title, Paragraph } = Typography;

interface BlogCardProps {
  blog: any;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <Card
      hoverable
      bordered={false}
      className="h-full shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-xl overflow-hidden group border border-[#f0ece2]"
      bodyStyle={{ padding: "20px" }}
      cover={
        <Link
          to={`/blogs/${blog.id}`}
          className="block overflow-hidden h-56 relative"
        >
          <img
            alt={blog.title}
            src={getImageUrl(blog.cover_image)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Overlay hover */}
          <div className="absolute inset-0 bg-[#2D2D2D]/5 group-hover:bg-transparent transition-colors duration-300"></div>
        </Link>
      }
    >
      <div className="flex items-center gap-4 text-[#555555] text-[11px] uppercase tracking-widest mb-3">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-[#BC8F8F]" />
          {new Date(blog.created_at).toLocaleDateString("vi-VN")}
        </span>
      </div>

      <Title level={4} className="!font-serif !text-lg !mb-3 leading-snug">
        <Link
          to={`/blogs/${blog.id}`}
          className="!text-[#2D2D2D] group-hover:!text-[#BC8F8F] transition-colors duration-300 line-clamp-2 block"
        >
          {blog.title}
        </Link>
      </Title>

      <Paragraph className="!text-[#555555] text-sm mb-5 line-clamp-3 leading-relaxed">
        {blog.content?.replace(/<[^>]*>?/gm, "")}
      </Paragraph>

      <Link
        to={`/blogs/${blog.id}`}
        className="inline-flex items-center gap-2 text-[#BC8F8F] font-bold text-[11px] uppercase tracking-[0.15em] border-b border-[#BC8F8F]/20 pb-1 hover:border-[#BC8F8F] transition-all"
      >
        Xem chi tiết
        <ArrowRight
          size={14}
          className="group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </Card>
  );
};

export default BlogCard;