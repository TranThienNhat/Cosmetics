import React, { useState } from "react";
import { Upload, Button, message, Image } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import api from "../utils/api";
import { getImageUrl } from "../utils/helpers";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  maxSize?: number; // MB
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxSize = 5,
  accept = "image/*",
}) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(value || "");

  // Update imageUrl when value prop changes
  React.useEffect(() => {
    setImageUrl(value || "");
  }, [value]);

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(`/upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = response.data.data.url;
      setImageUrl(uploadedUrl);
      onChange?.(uploadedUrl);
      message.success("Upload ảnh thành công!");
    } catch (error: any) {
      console.error("Upload error:", error);
      message.error(error.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setImageUrl("");
    onChange?.("");
  };

  const beforeUpload = (file: File) => {
    // Kiểm tra định dạng file
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ có thể upload file ảnh!");
      return false;
    }

    // Kiểm tra kích thước file
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`Ảnh phải nhỏ hơn ${maxSize}MB!`);
      return false;
    }

    // Upload file
    handleUpload(file);
    return false; // Prevent default upload
  };

  const uploadProps: UploadProps = {
    beforeUpload,
    showUploadList: false,
    accept,
  };

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <div className="relative inline-block">
          <Image
            src={getImageUrl(imageUrl)}
            alt="Uploaded"
            width={200}
            height={200}
            className="object-cover rounded-lg border"
            fallback="/placeholder-image.jpg"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white shadow-md"
            size="small"
          />
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={loading}
              className="border-primary text-primary hover:bg-primary hover:text-white">
              {loading ? "Đang upload..." : "Chọn ảnh"}
            </Button>
          </Upload>
          <p className="text-gray-500 mt-2 text-sm">
            Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa {maxSize}MB)
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
