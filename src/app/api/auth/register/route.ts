import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateEmailToken } from '@/lib/auth';
import { RegisterData } from '@/types';
import { isValidEmail, isValidPassword } from '@/utils';
import { EmailService } from '@/services/email';

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Base de données non disponible. Vérifiez votre configuration.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { nom, prenom, email, username, password }: RegisterData = body;

    if (!nom || !prenom || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 chiffre' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    
    const emailToken = generateEmailToken();

    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        username,
        password: hashedPassword,
        emailToken,
        isEmailVerified: false,
      },
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

    const verificationUrl = `${process.env.URL_MAIL || 'http://localhost:3000'}/verify-email?token=${emailToken}`;
    
    const emailResult = await EmailService.sendVerificationEmail(email, {
      name: `${prenom} ${nom}`,
      verificationUrl,
    });

    if (!emailResult.success) {
      console.error('Erreur envoi email de vérification:', emailResult.error);
    }

    return NextResponse.json(
      { 
        message: 'Utilisateur créé avec succès. Vérifiez votre email pour activer votre compte.',
        user 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
