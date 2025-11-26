
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

// Bypass PrismaClient type check if generated client is missing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
  };
}

export const protect = async (req: any, res: any, next: NextFunction) => {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    
    // Check if user still exists
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    req.user = {
      id: currentUser.id,
      role: currentUser.role,
      email: currentUser.email
    };
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
