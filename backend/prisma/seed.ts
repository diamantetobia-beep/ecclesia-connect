import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // ---------- 1. CRÉER LES RÔLES ----------
  const membre = await prisma.role.upsert({
    where: { name: 'Membre' },
    update: {},
    create: { name: 'Membre' },
  });

  const responsable = await prisma.role.upsert({
    where: { name: 'Responsable' },
    update: {},
    create: { name: 'Responsable' },
  });

  const superAdmin = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin' },
  });

  console.log('✅ Rôles créés :');
  console.log(`   - ${membre.name} (ID: ${membre.id})`);
  console.log(`   - ${responsable.name} (ID: ${responsable.id})`);
  console.log(`   - ${superAdmin.name} (ID: ${superAdmin.id})`);

  // ---------- 2. CRÉER LE SUPER ADMIN ----------
  const adminEmail = 'admin@eglise.com';
  const adminPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      photoUrl: null,
      roleId: superAdmin.id,
    },
  });

  console.log(`✅ Super Admin créé : ${adminEmail} (mot de passe : ${adminPassword})`);

  // ---------- 3. CRÉER LE SALON "📢 GÉNÉRAL" (POUR LA MESSAGERIE) ----------
  // Récupérer tous les utilisateurs existants (y compris ceux créés avant ce seed)
  const allUsers = await prisma.user.findMany();

  // Créer ou mettre à jour le salon "Général"
  const generalGroup = await prisma.conversation.upsert({
    where: { id: 'general' },
    update: {},
    create: {
      id: 'general',
      type: 'group',
      name: '📢 Général',
    },
  });

  console.log(`✅ Salon "Général" créé (ID: ${generalGroup.id})`);

  // Ajouter tous les utilisateurs existants au salon "Général"
  let addedCount = 0;
  for (const user of allUsers) {
    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: 'general',
          userId: user.id,
        },
      },
      update: {},
      create: {
        conversationId: 'general',
        userId: user.id,
      },
    });
    addedCount++;
  }

  console.log(`✅ ${addedCount} utilisateurs ajoutés au salon "Général".`);

  // ---------- 4. (OPTIONNEL) CRÉER UN UTILISATEUR DE TEST ----------
  // Décommente si tu veux un membre de test supplémentaire
  /*
  const testUser = await prisma.user.upsert({
    where: { email: 'test@eglise.com' },
    update: {},
    create: {
      email: 'test@eglise.com',
      password: await bcrypt.hash('Test123!', 10),
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      roleId: membre.id,
    },
  });
  console.log(`✅ Utilisateur test créé : test@eglise.com (mot de passe : Test123!)`);
  */

  console.log('✅ Seed terminé avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });