const { verifyToken } = require('../lib/auth');
const { prisma } = require('../lib/prisma');

async function authMiddleware(req, res, next) {
  try {
    // ici on récupère le token du header Authorization
    // car on envoie le token dans le header Authorization en tant que Bearer token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // puis on récupère l'utilisateur dans la bdd
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        username: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // on ajoute l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { authMiddleware };


