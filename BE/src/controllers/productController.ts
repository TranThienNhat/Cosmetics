import { HTTP_STATUS } from "../constants/httpStatus";
import { Request, Response } from "express";
import Product, { ProductVariant } from "../models/ProductModel";
import fs from "fs";
import path from "path";
import pool from "../config/db";

const deleteFile = async (filePath: string | undefined | null) => {
  if (!filePath) return;
  try {
    const cleanedPath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;
    const fullPath = path.join(process.cwd(), cleanedPath);
    await fs.promises.unlink(fullPath).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
  } catch (err) {
    console.error(">>> Lỗi xóa file:", err);
  }
};

const parseJsonArray = (value: unknown, fieldName: string): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      throw new Error(`Định dạng ${fieldName} không hợp lệ`);
    }
  }

  throw new Error(`${fieldName} phải là một danh sách`);
};

const cleanupUploadedFiles = (files: Express.Multer.File[] | undefined) => {
  files?.forEach((file) => {
    void deleteFile(`/uploads/products/${file.filename}`);
  });
};

const normalizeArrayField = (value: unknown): string[] => {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
};

const buildVariantUpdateQuery = (variants: any[], productId: number) => {
  const ids = variants.map((variant) => variant.id);
  const caseSql = ids.map(() => "WHEN ? THEN ?").join(" ");
  const valuesFor = (field: string) => variants.flatMap((variant) => [variant.id, variant[field]]);

  return {
    sql: `
      UPDATE product_variants
      SET variant_name = CASE id ${caseSql} ELSE variant_name END,
          price = CASE id ${caseSql} ELSE price END,
          stock_quantity = CASE id ${caseSql} ELSE stock_quantity END,
          image_url = CASE id ${caseSql} ELSE image_url END
      WHERE product_id = ? AND id IN (?)
    `,
    values: [
      ...valuesFor("variant_name"),
      ...valuesFor("price"),
      ...valuesFor("stock_quantity"),
      ...valuesFor("image_url"),
      productId,
      ids,
    ],
  };
};

// --- 1. LẤY DANH SÁCH ---
export const index = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const search = (req.query.search as string) || (req.query.keyword as string);
    const category_id = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
    const brand_id = req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined;
    const status = req.query.status as string;

    const where: any = {};
    if (category_id) where.category_id = category_id;
    if (brand_id) where.brand_id = brand_id;

    // LOGIC KIỂM TRA ROLE ĐỂ ẨN/HIỆN:
    const showAllProducts = (req as any).showAllProducts;

    if (showAllProducts) {
      // Nếu là Admin/Staff: Cho phép lọc theo status truyền lên, nếu không truyền gì (hoặc truyền 'all') thì xem hết
      if (status && status !== "all") {
        where.status = status;
      }
    } else {
      // Nếu là User thường hoặc Khách: Bắt buộc ép cứng chỉ lấy 'active'
      where.status = "active";
    }

    // Lấy thêm min_price và max_price từ query
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;

    // Gọi hàm findAll
    const products = await Product.findAll({
      where,
      search,
      limit,
      offset,
      minPrice,
      maxPrice,
      orderBy: "id",
      orderDir: "DESC",
    });

    const total = await Product.count({
      where,
      search,
      minPrice,
      maxPrice,
    } as any);

    return res.json({
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(">>> Error index:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server" });
  }
};

// --- 2. TẠO MỚI ---
export const create = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const files = req.files as Express.Multer.File[] | undefined;
  const connection = await pool.getConnection();

  try {
    const { name, slug, category_id, brand_id, description, status } = req.body;
    const variants = parseJsonArray(req.body.variants, "variants");

    if (!name) throw new Error("Tên sản phẩm là bắt buộc");
    if (!category_id || isNaN(Number(category_id))) {
      throw new Error("Danh mục sản phẩm không hợp lệ");
    }

    await connection.beginTransaction();

    const [productResult]: any = await connection.execute(
      `INSERT INTO products
        (name, slug, category_id, brand_id, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug || `${Date.now()}`,
        Number(category_id),
        brand_id && brand_id !== "null" ? Number(brand_id) : null,
        description || null,
        status || "active",
      ],
    );
    const productId = productResult.insertId;

    for (const v of variants) {
      const priceNum = Number(v.price);
      const stockNum = Number(v.stock_quantity);

      await connection.execute(
        `INSERT INTO product_variants
          (product_id, variant_name, price, stock_quantity, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [
          productId,
          v.variant_name || v.name || "Mặc định",
          isNaN(priceNum) ? 0 : priceNum,
          isNaN(stockNum) ? 0 : stockNum,
          v.image_url || null,
        ],
      );
    }

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await connection.execute(
          `INSERT INTO product_galleries
            (product_id, image_url, is_main, sort_order)
           VALUES (?, ?, ?, ?)`,
          [productId, `/uploads/products/${files[i].filename}`, i === 0 ? 1 : 0, i],
        );
      }
    }

    await connection.commit();
    return res.status(HTTP_STATUS.CREATED).json({ message: "Thành công", id: productId });
  } catch (error: any) {
    await connection.rollback();
    cleanupUploadedFiles(files);

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  } finally {
    connection.release();
  }
};

// --- 3. CẬP NHẬT ---
export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    slug,
    category_id,
    brand_id,
    description,
    status,
    variants: variantsStr,
  } = req.body;
  const files = req.files as Express.Multer.File[];

  const connection = await pool.getConnection();
  const filesToDeleteAfterCommit: string[] = [];

  try {
    const productId = Number(id);
    if (isNaN(productId) || productId <= 0) {
      cleanupUploadedFiles(files);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "ID sản phẩm không hợp lệ" });
    }

    // ĐÃ XÓA DÒNG "await compressImages(files);" VÌ ĐÃ CÓ MIDDLEWARE XỬ LÝ TRƯỚC ĐÓ

    const incomingVariants = parseJsonArray(variantsStr, "variants");
    const keepImages = [
      ...normalizeArrayField(req.body.existing_images),
      ...normalizeArrayField(req.body["existing_images[]"]),
    ];

    await connection.beginTransaction();

    // 2. Kiểm tra sản phẩm
    const [currentRows]: any = await connection.execute(
      "SELECT * FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [productId]
    );
    const current = currentRows[0];
    if (!current) {
      await connection.rollback();
      cleanupUploadedFiles(files);
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Sản phẩm không tồn tại" });
    }

    // 3. TỐI ƯU: Truy vấn song song dữ liệu Variants và Galleries hiện tại
    const [
      [existingVariants],
      [oldGalleries]
    ]: any = await Promise.all([
      connection.execute("SELECT id FROM product_variants WHERE product_id = ?", [productId]),
      connection.execute("SELECT * FROM product_galleries WHERE product_id = ?", [productId])
    ]);

    // 4. Cập nhật thông tin cơ bản
    await connection.execute(
      `UPDATE products
       SET name = ?, slug = ?, category_id = ?, brand_id = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        name || current.name,
        slug || current.slug,
        category_id ? Number(category_id) : current.category_id,
        brand_id && brand_id !== "null" ? Number(brand_id) : null,
        description ?? current.description,
        status || current.status,
        productId,
      ]
    );

    // --- XỬ LÝ VARIANT ---
    const existingIds: number[] = existingVariants.map((v: any) => Number(v.id));
    const incomingIds = incomingVariants.filter((v: any) => v.id).map((v: any) => Number(v.id));

    const idsToDelete = existingIds.filter((exId: number) => !incomingIds.includes(exId));
    
    const dbTasks: Promise<any>[] = [];

    if (idsToDelete.length > 0) {
      dbTasks.push(
        connection.query("DELETE FROM product_variants WHERE product_id = ? AND id IN (?)", [productId, idsToDelete])
          .catch(() => { throw new Error("Không thể xóa biến thể vì đang tồn tại trong giỏ hàng hoặc đơn hàng."); })
      );
    }

    const variantsToInsert: any[][] = [];
    const variantsToUpdate: any[] = [];

    for (const v of incomingVariants) {
      const priceNum = Number(v.price);
      const stockNum = Number(v.stock_quantity);

      const variantData = {
        product_id: productId,
        variant_name: v.variant_name || v.name || "Mặc định",
        price: isNaN(priceNum) ? 0 : priceNum,
        stock_quantity: isNaN(stockNum) ? 0 : stockNum,
        image_url: v.image_url || null,
      };

      if (v.id && existingIds.includes(Number(v.id))) {
        variantsToUpdate.push({ id: Number(v.id), ...variantData });
      } else {
        variantsToInsert.push([
          variantData.product_id, variantData.variant_name, variantData.price,
          variantData.stock_quantity, variantData.image_url
        ]);
      }
    }

    if (variantsToUpdate.length > 0) {
      const variantUpdate = buildVariantUpdateQuery(variantsToUpdate, productId);
      dbTasks.push(connection.query(variantUpdate.sql, variantUpdate.values));
    }
    if (variantsToInsert.length > 0) {
      dbTasks.push(
        connection.query(
          `INSERT INTO product_variants (product_id, variant_name, price, stock_quantity, image_url) VALUES ?`,
          [variantsToInsert]
        )
      );
    }

    // --- XỬ LÝ GALLERY ---
    const galleriesToDelete = oldGalleries.filter((g: any) => {
      const isKeptById = keepImages.includes(String(g.id));
      const isKeptByUrl = keepImages.some(url => url.includes(g.image_url));
      return !isKeptById && !isKeptByUrl;
    });

    if (galleriesToDelete.length > 0) {
      filesToDeleteAfterCommit.push(...galleriesToDelete.map((g: any) => g.image_url));
      dbTasks.push(
        connection.query("DELETE FROM product_galleries WHERE product_id = ? AND id IN (?)", [
          productId,
          galleriesToDelete.map((g: any) => g.id),
        ])
      );
    }

    // Await tất cả các tác vụ DELETE/UPDATE Variants và DELETE Galleries cùng lúc
    await Promise.all(dbTasks);

    const remainingCount = oldGalleries.length - galleriesToDelete.length;
    let currentSortOrder = remainingCount;
    const hasExistingMain = oldGalleries
      .filter((g: any) => !galleriesToDelete.some((del: any) => del.id === g.id))
      .some((g: any) => g.is_main === 1);

    if (files && files.length > 0) {
      const galleryRows = files.map((file, i) => [
        productId,
        `/uploads/products/${file.filename}`,
        !hasExistingMain && i === 0 ? 1 : 0,
        currentSortOrder + i,
      ]);
      await connection.query(
        `INSERT INTO product_galleries (product_id, image_url, is_main, sort_order) VALUES ?`,
        [galleryRows]
      );
    }

    const [[finalGalleries]]: any = await connection.execute(
      "SELECT id, is_main FROM product_galleries WHERE product_id = ? ORDER BY sort_order ASC",
      [productId]
    );

    if (finalGalleries && finalGalleries.length > 0 && !finalGalleries.some((g: any) => g.is_main === 1)) {
      await connection.execute("UPDATE product_galleries SET is_main = 1 WHERE id = ?", [finalGalleries[0].id]);
    }

    await connection.commit();

    // Dọn dẹp file RÁC KHÔNG block luồng phản hồi
    filesToDeleteAfterCommit.forEach((filePath) => { deleteFile(filePath); });

    return res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
    });

  } catch (error: any) {
    await connection.rollback();
    cleanupUploadedFiles(files);
    console.error("Lỗi cập nhật sản phẩm:", error);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Lỗi server trong quá trình cập nhật",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};
export const addVariant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Lấy product_id từ URL dạng /products/:id/variants

    // 1. ÉP KIỂU VÀ CHẶN NGAY LỖI NaN CỦA PRODUCT_ID
    const productIdNum = Number(id);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          "Yêu cầu thất bại: ID sản phẩm gốc không hợp lệ hoặc bị truyền lên dạng NaN!",
      });
    }

    // 2. Kiểm tra xem sản phẩm gốc thực sự có tồn tại trong DB không
    const product = await Product.findById(productIdNum);
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Sản phẩm gốc không tồn tại",
      });
    }

    const { variant_name, price, stock_quantity, image_url } = req.body;

    // 3. Ép kiểu an toàn cho price và stock_quantity như cũ
    const priceNum = Number(price);
    const stockNum = Number(stock_quantity);

    const variantData = {
      product_id: productIdNum, // Đã bảo đảm là số chuẩn, không lo dính NaN
      variant_name: variant_name || "Mặc định",
      price: isNaN(priceNum) ? 0 : priceNum,
      stock_quantity: isNaN(stockNum) ? 0 : stockNum,
      image_url: image_url || null,
    };

    // 4. Gọi model để lưu vào Database
    const newVariant = await ProductVariant.create(variantData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Thêm biến thể mới thành công!",
      data: newVariant,
    });
  } catch (error: any) {
    console.error(">>> Lỗi khi thêm biến thể đơn lẻ:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Lỗi hệ thống khi thêm biến thể",
    });
  }
};

// --- 4. CHI TIẾT ---
export const show = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const showAllProducts = (req as any).showAllProducts;

    const product = await Product.findWithVariants(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Sản phẩm không tồn tại hoặc đã bị xóa",
      });
    }

    if (product.status !== "active" && !showAllProducts) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Bạn không có quyền xem sản phẩm này",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(">>> Error in Product Show:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi hệ thống khi lấy chi tiết sản phẩm",
    });
  }
};

// --- 5. XÓA ---
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.execute("SELECT deleted_at FROM products WHERE id = ?", [id]);

    if (rows.length === 0 || rows[0].deleted_at !== null) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Không tìm thấy sản phẩm hoặc sản phẩm đã được xóa trước đó" });
    }

    await pool.execute(
      "UPDATE products SET deleted_at = NOW(), status = 'hidden' WHERE id = ?",
      [id]
    );

    return res.json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Lỗi server khi thực hiện xóa" });
  }
};
export const allVariants = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        pv.id, 
        p.name as product_name, 
        pv.variant_name, 
        pv.price, 
        pv.stock_quantity
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.name ASC
    `);

    // Trả về bọc trong object success và data để đồng bộ với FE
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error(">>> Error allVariants:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi lấy danh sách biến thể",
      error: error.message,
    });
  }
};

