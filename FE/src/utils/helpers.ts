const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const STATIC_URL = import.meta.env.VITE_UPLOAD_URL || `${API_BASE}/uploads`;

export const DEFAULT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23FAF3EC'/%3E%3Cpath d='M60 140l30-40 25 30 35-45 30 55H60z' fill='%23BC8F8F' opacity='0.35'/%3E%3Ccircle cx='90' cy='75' r='14' fill='%23BC8F8F' opacity='0.45'/%3E%3Ctext x='100' y='170' font-family='sans-serif' font-size='12' fill='%23806060' text-anchor='middle' opacity='0.6'%3ELinh Cosmetics%3C/text%3E%3C/svg%3E";

export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }

  const cleanPath = imagePath.trim();

  // Nếu là URL đầy đủ (http/https hoặc data:)
  if (cleanPath.startsWith("http") || cleanPath.startsWith("data:")) {
    return cleanPath;
  }

  // Nếu đã có /uploads prefix (từ upload API)
  if (cleanPath.startsWith("/uploads")) {
    return `${API_BASE}${cleanPath}`;
  }

  // Nếu chỉ là filename
  return `${STATIC_URL}/${cleanPath}`;
};

export const formatCurrency = (
  amount: number | string | null | undefined
): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "0 ₫";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numAmount);
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
