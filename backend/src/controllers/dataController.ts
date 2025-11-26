
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- SETTINGS (Workers, Details, etc) ---
export const getSettings = async (req: any, res: any, next: NextFunction) => {
    try {
        const { key } = req.params;
        const setting = await prisma.settings.findUnique({ where: { key } });
        res.json(setting?.value || []);
    } catch (e) { next(e); }
};

export const updateSettings = async (req: any, res: any, next: NextFunction) => {
    try {
        const { key } = req.params;
        const setting = await prisma.settings.upsert({
            where: { key },
            update: { value: req.body },
            create: { key, value: req.body }
        });
        res.json(setting.value);
    } catch (e) { next(e); }
};

// --- DAILY INPUT ---
export const createDailyInput = async (req: any, res: any, next: NextFunction) => {
    try {
        const { date, content } = req.body;
        const userId = req.user!.id;
        const input = await prisma.dailyInput.create({
            data: {
                date: new Date(date),
                userId: userId,
                content: content
            }
        });
        res.status(201).json(input);
    } catch (e) { next(e); }
};

export const getDailyInputs = async (req: any, res: any, next: NextFunction) => {
    try {
        const inputs = await prisma.dailyInput.findMany({
            orderBy: { date: 'desc' },
            take: 100 // Limit for performance
        });
        // Transform for frontend compatibility if needed
        const formatted = inputs.map((i: any) => ({ 
            ...i.content as object, 
            id: i.id.toString(), 
            workDate: i.date.toISOString().split('T')[0] 
        }));
        res.json(formatted);
    } catch (e) { next(e); }
};

// --- WAREHOUSE ---
export const getBatches = async (req: any, res: any, next: NextFunction) => {
    try {
        const batches = await prisma.warehouse.findMany();
        // Map to frontend structure
        const formatted = batches.map((b: any) => ({
            ...(b.details as object),
            id: b.id.toString(),
            quantity: b.quantity
        }));
        res.json(formatted);
    } catch (e) { next(e); }
};

export const syncBatches = async (req: any, res: any, next: NextFunction) => {
    try {
        const batches: any[] = req.body;
        // Full sync logic (simplified for this example: delete all and recreate)
        // In production, you would use upsert or explicit diffing
        await prisma.warehouse.deleteMany({});
        
        for (const b of batches) {
             const { id, quantity, ...details } = b;
             await prisma.warehouse.create({
                 data: {
                    itemName: details.batchNumber || 'Batch',
                    quantity: quantity,
                    updatedBy: req.user!.id,
                    details: details
                 }
             });
        }
        res.status(200).json({ status: 'synced' });
    } catch (e) { next(e); }
};
