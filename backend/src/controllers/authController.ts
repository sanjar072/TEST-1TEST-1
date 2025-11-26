import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

const signTokens = (id: number, role: string) => {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
  });
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return next(new AppError('Email already in use', 400));

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role || 'WORKER',
      },
    });

    // Don't send password back
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      status: 'success',
      data: { user: userWithoutPassword },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return next(new AppError('Please provide email and password', 400));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.role);

    // Update refresh token in DB
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
    });

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return next(new AppError('No refresh token provided', 401));

        // Verify token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
        } catch (e) {
            return next(new AppError('Invalid refresh token', 403));
        }

        // Check if user exists and token matches DB
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user || user.refreshToken !== refreshToken) {
            return next(new AppError('Invalid refresh token', 403));
        }

        const tokens = signTokens(user.id, user.role);
        
        // Rotate refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        res.status(200).json({
            status: 'success',
            ...tokens
        });

    } catch (err) {
        next(err);
    }
};