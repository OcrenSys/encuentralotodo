// Prisma client types are generated after `prisma generate`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

import { marketplaceSeed } from '../packages/types/src/lib/mocks';

const prisma = new PrismaClient();

async function main() {
  await prisma.userIdentity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.review.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.businessManager.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  for (const user of marketplaceSeed.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive ?? true,
        identities: {
          create: {
            provider: 'MOCK',
            externalUserId: user.id,
            email: user.email,
            emailVerified: true,
            displayName: user.fullName,
            avatarUrl: user.avatarUrl,
          },
        },
      },
    });
  }

  for (const business of marketplaceSeed.businesses) {
    await prisma.business.create({
      data: {
        id: business.id,
        name: business.name,
        description: business.description,
        category: business.category,
        lat: business.location.lat,
        lng: business.location.lng,
        zone: business.location.zone,
        address: business.location.address,
        profileImage: business.images.profile,
        bannerImage: business.images.banner,
        subscriptionType: business.subscriptionType,
        status: business.status,
        whatsappNumber: business.whatsappNumber,
        ownerId: business.ownerId,
        managers: {
          create: business.managers.map((userId) => ({ userId })),
        },
      },
    });
  }

  for (const product of marketplaceSeed.products) {
    await prisma.product.create({
      data: {
        id: product.id,
        businessId: product.businessId,
        name: product.name,
        description: product.description,
        images: product.images,
        price: product.price,
        isFeatured: product.isFeatured,
      },
    });
  }

  for (const promotion of marketplaceSeed.promotions) {
    await prisma.promotion.create({
      data: {
        id: promotion.id,
        businessId: promotion.businessId,
        title: promotion.title,
        description: promotion.description,
        promoPrice: promotion.promoPrice,
        originalPrice: promotion.originalPrice,
        validUntil: new Date(promotion.validUntil),
        image: promotion.image,
      },
    });
  }

  for (const lead of marketplaceSeed.leads) {
    await prisma.lead.create({
      data: {
        id: lead.id,
        name: lead.name,
        source: lead.source,
        status: lead.status,
        summary: lead.summary,
        businessId: lead.businessId,
        updatedAt: new Date(lead.updatedAt),
      },
    });
  }

  for (const review of marketplaceSeed.reviews) {
    await prisma.review.create({
      data: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        userId: review.userId,
        businessId: review.businessId,
        createdAt: new Date(review.createdAt),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });