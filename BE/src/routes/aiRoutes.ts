import { Router } from 'express';
import { AIController } from '../controllers/aiController';
// import { authMiddleware } from '../middlewares/authMiddleware'; // Mở ra nếu bạn muốn chặn đăng nhập

const router = Router();

/**
 * @route   POST /api/ai/ask
 */
router.post('/ask', AIController.askGemini);

export default router;