import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmailToken } from '@/lib/auth';
import { EmailService } from '@/services/email';
import { isValidEmail } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Si cet email existe et n\'est pas vérifié, un email de vérification a été envoyé.' },
        { status: 200 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Cet email est déjà vérifié' },
        { status: 400 }
      );
    }

    // Générer un nouveau token
    const emailToken = generateEmailToken();

    // Mettre à jour le token dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: { emailToken }
    });

    // Envoyer l'email de vérification
    const verificationUrl = `${process.env.URL_MAIL || 'http://localhost:3000'}/verify-email?token=${emailToken}`;
    
    const emailResult = await EmailService.sendVerificationEmail(email, {
      name: `${user.prenom} ${user.nom}`,
      verificationUrl,
    });

    if (!emailResult.success) {
      console.error('Erreur envoi email de vérification:', emailResult.error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Email de vérification envoyé avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors du renvoi de l\'email de vérification:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

