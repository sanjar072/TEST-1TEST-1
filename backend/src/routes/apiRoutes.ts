
import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as dataController from '../controllers/dataController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const { PrismaClient } = require('@prisma/client');
const router = Router();
const prisma = new PrismaClient();

// AUTH
router.post('/auth/register', protect, restrictTo('ADMIN'), authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);

// USERS (Admin Only)
router.get('/users', protect, restrictTo('ADMIN'), async (req: any, res: any) => {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true }});
    res.json(users);
});
router.delete('/users/:id', protect, restrictTo('ADMIN'), async (req: any, res: any) => {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) }});
    res.status(204).send();
});

// SETTINGS (Workers, Details, Products List)
router.get('/settings/:key', protect, dataController.getSettings);
router.post('/settings/:key', protect, restrictTo('ADMIN', 'MANAGER'), dataController.updateSettings);

// DAILY INPUT (Work Logs)
router.get('/daily', protect, dataController.getDailyInputs);
router.post('/daily', protect, restrictTo('ADMIN', 'MANAGER', 'WORKER'), dataController.createDailyInput);

// WAREHOUSE
router.get('/warehouse', protect, dataController.getBatches);
router.post('/warehouse', protect, restrictTo('ADMIN', 'MANAGER'), dataController.syncBatches);

export default router;
