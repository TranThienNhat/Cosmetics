import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/ai/ask
 */
router.post('/ask', AIController.askGemini);

/**
 * @routes  Quản lý Tri thức Chatbot & Xuất Dataset Huấn Luyện (Admin)
 */
router.get('/knowledge', authenticate, requireAdmin, AIController.getKnowledgeBase);
router.get('/knowledge/stats', authenticate, requireAdmin, AIController.getKnowledgeStats);
router.get('/knowledge/export', authenticate, requireAdmin, AIController.exportDataset);
router.post('/knowledge', authenticate, requireAdmin, AIController.createKnowledge);
router.put('/knowledge/:id', authenticate, requireAdmin, AIController.updateKnowledge);
router.patch('/knowledge/:id/toggle', authenticate, requireAdmin, AIController.toggleKnowledge);
router.delete('/knowledge/:id', authenticate, requireAdmin, AIController.deleteKnowledge);

export default router;