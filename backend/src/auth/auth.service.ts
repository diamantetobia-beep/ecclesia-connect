import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ---------- INSCRIPTION ----------
  async register(email: string, password: string, firstName: string, lastName: string, photoUrl?: string) {
    // Vérifier si l'email existe déjà
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Cet email est déjà utilisé.');
    }

    // Récupérer le rôle "Membre"
    const role = await this.prisma.role.findUnique({ where: { name: 'Membre' } });
    if (!role) {
      throw new BadRequestException('Le rôle "Membre" n\'existe pas. Exécute le seed.');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur (inactif par défaut)
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        photoUrl: photoUrl || null,
        roleId: role.id,
        isActive: false,
      },
      include: { role: true },
    });

    const { password: _, ...result } = user;
    return {
      message: 'Inscription réussie. En attente de validation par le Super Admin.',
      user: result,
    };
  }

  // ---------- CONNEXION ----------
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est en attente de validation par l\'administrateur.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role.name };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  // ---------- ACTIVATION DU COMPTE (réservé au Super Admin) ----------
  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    if (user.isActive) {
      return { message: 'Ce compte est déjà actif.' };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    const { password, ...result } = updated;
    return { message: 'Compte activé avec succès.', user: result };
  }

  // ---------- REJET D'UN COMPTE (réservé au Super Admin) ----------
  async rejectUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }
    if (user.isActive) {
      throw new BadRequestException('Ce compte est déjà actif.');
    }
    // Supprimer le compte (ou le marquer comme rejeté si tu préfères)
    return this.prisma.user.delete({ where: { id: userId } });
  }

  // ---------- RÉCUPÉRATION DU PROFIL ----------
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }
    const { password, ...result } = user;
    return result;
  }

  // ---------- MISE À JOUR DU PROFIL ----------
  async updateProfile(userId: string, data: any) {
    const {
      firstName,
      lastName,
      gender,
      birthDate,
      phone,
      neighborhood,
      profession,
      studies,
      talents,
      ministry,
      interests,
    } = data;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phone || null,
        neighborhood: neighborhood || null,
        profession: profession || null,
        studies: studies || null,
        talents: talents || null,
        ministry: ministry || null,
        interests: interests || null,
      },
      include: { role: true },
    });
  }

  // ---------- LISTE DES UTILISATEURS (pour l'admin) ----------
  async getUsers() {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}