import { Request, Response } from "express";
import { execFile } from "child_process";
import path from "path";
import { HTTP_STATUS } from "../constants/httpStatus";

const ML_ENGINE_DIR = path.join(__dirname, "../../ml_engine");

// Simple in-memory cache to prevent spawning heavy Python processes on every rapid request
const cache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const runPythonScript = (scriptName: string, args: string[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ML_ENGINE_DIR, scriptName);
    
    // Execute python with UTF-8 env
    execFile(
      "python",
      [scriptPath, ...args],
      {
        cwd: ML_ENGINE_DIR,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        maxBuffer: 10 * 1024 * 1024 // 10MB
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[ML Engine Error - ${scriptName}]:`, stderr || error.message);
          return reject(error);
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (parseErr) {
          console.error(`[ML Engine Parse Error - ${scriptName}]:`, stdout);
          reject(parseErr);
        }
      }
    );
  });
};

export const getRevenueForecast = async (req: Request, res: Response): Promise<Response> => {
  try {
    const days = (req.query.days as string) || "30";
    const cacheKey = `revenue_forecast_${days}`;

    if (cache[cacheKey] && cache[cacheKey].expiry > Date.now()) {
      return res.json({ success: true, data: cache[cacheKey].data, cached: true });
    }

    const data = await runPythonScript("revenue_forecasting.py", [days]);
    if (!data.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(data);
    }

    cache[cacheKey] = { data, expiry: Date.now() + CACHE_TTL };
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Revenue Forecast Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi chạy mô hình Random Forest dự báo doanh thu",
      error: error.message
    });
  }
};

export const getDemandForecast = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cacheKey = "demand_forecast";
    if (cache[cacheKey] && cache[cacheKey].expiry > Date.now()) {
      return res.json({ success: true, data: cache[cacheKey].data, cached: true });
    }

    const data = await runPythonScript("demand_forecasting.py");
    if (!data.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(data);
    }

    cache[cacheKey] = { data, expiry: Date.now() + CACHE_TTL };
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Demand Forecast Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi phân tích dự báo nhu cầu mỹ phẩm",
      error: error.message
    });
  }
};

export const getFrequentlyBoughtTogether = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = req.params.productId || (req.query.productId as string);
    const cacheKey = `fbt_${productId || "all"}`;

    if (cache[cacheKey] && cache[cacheKey].expiry > Date.now()) {
      return res.json({ success: true, data: cache[cacheKey].data, cached: true });
    }

    const args = productId ? [productId] : [];
    const data = await runPythonScript("frequently_bought_together.py", args);
    if (!data.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(data);
    }

    cache[cacheKey] = { data, expiry: Date.now() + CACHE_TTL };
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Frequently Bought Together Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi khai phá tập luật mua kèm (Apriori)",
      error: error.message
    });
  }
};

export const getCartRecommendations = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productIds } = req.body;
    const targetId = Array.isArray(productIds) && productIds.length > 0 ? String(productIds[0]) : "";
    
    const data = await runPythonScript("frequently_bought_together.py", targetId ? [targetId] : []);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Cart Recommendations Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi gợi ý sản phẩm cho giỏ hàng",
      error: error.message
    });
  }
};

export const getTrendAnalysis = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cacheKey = "trend_analysis";
    if (cache[cacheKey] && cache[cacheKey].expiry > Date.now()) {
      return res.json({ success: true, data: cache[cacheKey].data, cached: true });
    }

    const data = await runPythonScript("trend_analysis.py");
    if (!data.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(data);
    }

    cache[cacheKey] = { data, expiry: Date.now() + CACHE_TTL };
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Trend Analysis Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi máy chủ khi phân tích xu hướng mỹ phẩm",
      error: error.message
    });
  }
};

export const retrainAndRefresh = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Clear in-memory cache
    Object.keys(cache).forEach((k) => delete cache[k]);

    // Run ML scripts concurrently
    const [revenue, demand, trends] = await Promise.all([
      runPythonScript("revenue_forecasting.py", ["30"]),
      runPythonScript("demand_forecasting.py"),
      runPythonScript("trend_analysis.py")
    ]);

    return res.json({
      success: true,
      message: "Huấn luyện lại toàn bộ mô hình AI và cập nhật cache thành công!",
      data: { revenue, demand, trends }
    });
  } catch (error: any) {
    console.error("Retrain Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi khi huấn luyện lại mô hình AI",
      error: error.message
    });
  }
};
