import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function verifyTokenFromRequest(request: any): Promise<User | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Import dynamique de prisma pour éviter les problèmes de circular import
    const { prisma } = await import('@/lib/prisma');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        username: true,
        isEmailVerified: true,
        createdAt: true,
      }
    });

    return user;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
}

export function generateEmailToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
