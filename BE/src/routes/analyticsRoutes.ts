import { Router } from "express";
import {
  getRevenueForecast,
  getDemandForecast,
  getFrequentlyBoughtTogether,
  getCartRecommendations,
  getTrendAnalysis,
  retrainAndRefresh,
} from "../controllers/analyticsController";

const router = Router();

// 1. Dự báo doanh thu (Random Forest Regressor)
router.get("/revenue-forecast", getRevenueForecast);

// 2. Dự báo nhu cầu mỹ phẩm & Quản trị tồn kho
router.get("/demand-forecast", getDemandForecast);

// 3. Gợi ý món mua kèm (Frequently Bought Together / Apriori)
router.get("/frequently-bought-together", getFrequentlyBoughtTogether);
router.get("/frequently-bought-together/:productId", getFrequentlyBoughtTogether);
router.post("/cart-recommendations", getCartRecommendations);

// 4. Phân tích xu hướng mỹ phẩm
router.get("/trends", getTrendAnalysis);

// 5. Huấn luyện lại và làm mới dữ liệu
router.post("/retrain", retrainAndRefresh);

export default router;
