import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
type UserRole = 'UNASSIGNED' | 'USER' | 'NO_ACCESS' | 'ADMIN' | 'SUPERADMIN' | 'GLOBALADMIN';
type AuthProvider = 'FIREBASE' | 'MOCK' | 'COGNITO';
type BusinessCategory = 'GENERAL_STORE' | 'RESTAURANT' | 'SERVICE';
type SubscriptionType = 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
type BusinessStatus = 'PENDING' | 'APPROVED';
type BusinessAssignmentRole = 'OWNER' | 'MANAGER';
type LeadSource = 'WHATSAPP_CLICK' | 'CALL_CLICK' | 'CONTACT_CLICK' | 'PROMOTION_CLICK' | 'PRODUCT_CLICK';
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'LOST';
type PromotionType = 'DISCOUNT' | 'EVENT' | 'ANNOUNCEMENT';
type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED';
type AuditAction =
  | 'USER_PROFILE_UPDATED'
  | 'USER_BASE_ROLE_UPDATED'
  | 'USER_PLATFORM_ROLE_UPDATED'
  | 'USER_STATUS_UPDATED'
  | 'USER_BUSINESS_ROLE_ASSIGNED'
  | 'USER_BUSINESS_ROLE_REMOVED'
  | 'BUSINESS_OWNERSHIP_TRANSFERRED';

interface SeedIdentity {
  provider: AuthProvider;
  externalUserId: string;
  emailVerified: boolean;
  displayName?: string;
}

interface SeedUser {
  key: string;
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  avatarUrl?: string;
  lastAccessAt?: Date;
  createdAt: Date;
  identities: SeedIdentity[];
}

interface SeedBusiness {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  lat: number;
  lng: number;
  zone: string;
  address: string;
  profileImage: string;
  bannerImage: string;
  subscriptionType: SubscriptionType;
  status: BusinessStatus;
  whatsappNumber: string;
  ownerKey: string;
  managerKeys: string[];
  createdAt: Date;
  lastUpdated: Date;
}

interface SeedProduct {
  id: string;
  businessId: string;
  name: string;
  description: string;
  images: string[];
  type: 'simple' | 'configurable';
  configurationSummary?: string;
  price?: number;
  isFeatured: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface SeedPromotion {
  id: string;
  businessId: string;
  title: string;
  description: string;
  type: PromotionType;
  status: PromotionStatus;
  promoPrice: number;
  originalPrice: number;
  startDate: Date;
  endDate: Date;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SeedLead {
  id: string;
  businessId: string;
  name: string;
  source: LeadSource;
  status: LeadStatus;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SeedReview {
  id: string;
  userKey: string;
  businessId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface SeedAuditLog {
  id: string;
  actorKey: string;
  targetKey?: string;
  businessId?: string;
  action: AuditAction;
  metadata?: Prisma.InputJsonValue;
  createdAt: Date;
}

const seedBaseTime = new Date('2026-04-13T16:00:00.000Z');

function hoursAgo(hours: number) {
  return new Date(seedBaseTime.getTime() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return new Date(seedBaseTime.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number) {
  return new Date(seedBaseTime.getTime() + days * 24 * 60 * 60 * 1000);
}

const platformUsers: SeedUser[] = [
  {
    key: 'superadminLuis',
    id: 'superadmin-luis',
    fullName: 'Luis Herrera',
    email: 'luis@encuentralotodo.app',
    role: 'SUPERADMIN',
    isActive: true,
    phone: '18095550001',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(1),
    createdAt: daysAgo(320),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-superadmin-luis',
        emailVerified: true,
        displayName: 'Luis Herrera',
      },
    ],
  },
  {
    key: 'globalCamila',
    id: 'globaladmin-camila',
    fullName: 'Camila Torres',
    email: 'camila@encuentralotodo.app',
    role: 'GLOBALADMIN',
    isActive: true,
    phone: '18095550002',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(7),
    createdAt: daysAgo(280),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-globaladmin-camila',
        emailVerified: true,
        displayName: 'Camila Torres',
      },
    ],
  },
  {
    key: 'adminLaura',
    id: 'admin-laura',
    fullName: 'Laura Mendez',
    email: 'laura@encuentralotodo.app',
    role: 'ADMIN',
    isActive: true,
    phone: '18095550003',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(5),
    createdAt: daysAgo(250),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-admin-laura',
        emailVerified: true,
        displayName: 'Laura Mendez',
      },
    ],
  },
];

const businessUsers: SeedUser[] = [
  {
    key: 'ownerSofia',
    id: 'owner-sofia',
    fullName: 'Sofia Rivas',
    email: 'sofia@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095551001',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(9),
    createdAt: daysAgo(220),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-owner-sofia',
        emailVerified: true,
        displayName: 'Sofia Rivas',
      },
    ],
  },
  {
    key: 'ownerMateo',
    id: 'owner-mateo',
    fullName: 'Mateo Cordero',
    email: 'mateo@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095551002',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(18),
    createdAt: daysAgo(215),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-owner-mateo',
        emailVerified: true,
        displayName: 'Mateo Cordero',
      },
    ],
  },
  {
    key: 'ownerLucia',
    id: 'owner-lucia',
    fullName: 'Lucia Pena',
    email: 'lucia@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095551003',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(12),
    createdAt: daysAgo(190),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-owner-lucia',
        emailVerified: true,
        displayName: 'Lucia Pena',
      },
    ],
  },
  {
    key: 'ownerValentina',
    id: 'owner-valentina',
    fullName: 'Valentina Guzman',
    email: 'valentina@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095551004',
    avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(16),
    createdAt: daysAgo(170),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-owner-valentina',
        emailVerified: true,
        displayName: 'Valentina Guzman',
      },
    ],
  },
  {
    key: 'managerCarlos',
    id: 'manager-carlos',
    fullName: 'Carlos Mena',
    email: 'carlos@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095552001',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(6),
    createdAt: daysAgo(210),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-manager-carlos',
        emailVerified: true,
        displayName: 'Carlos Mena',
      },
    ],
  },
  {
    key: 'managerJulia',
    id: 'manager-julia',
    fullName: 'Julia Herrera',
    email: 'julia@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095552002',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(4),
    createdAt: daysAgo(200),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-manager-julia',
        emailVerified: true,
        displayName: 'Julia Herrera',
      },
    ],
  },
  {
    key: 'managerElena',
    id: 'manager-elena',
    fullName: 'Elena Pichardo',
    email: 'elena@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095552003',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(8),
    createdAt: daysAgo(165),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-manager-elena',
        emailVerified: true,
        displayName: 'Elena Pichardo',
      },
    ],
  },
  {
    key: 'managerDiego',
    id: 'manager-diego',
    fullName: 'Diego Roman',
    email: 'diego@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095552004',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(11),
    createdAt: daysAgo(150),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-manager-diego',
        emailVerified: true,
        displayName: 'Diego Roman',
      },
    ],
  },
  {
    key: 'managerMariana',
    id: 'manager-mariana',
    fullName: 'Mariana Soto',
    email: 'mariana@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095552005',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(3),
    createdAt: daysAgo(145),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-manager-mariana',
        emailVerified: true,
        displayName: 'Mariana Soto',
      },
    ],
  },
];

const customerUsers: SeedUser[] = [
  {
    key: 'customerAna',
    id: 'user-ana',
    fullName: 'Ana Mercado',
    email: 'ana@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095553001',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(2),
    createdAt: daysAgo(130),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-user-ana',
        emailVerified: true,
        displayName: 'Ana Mercado',
      },
    ],
  },
  {
    key: 'customerPaola',
    id: 'customer-paola',
    fullName: 'Paola Cruz',
    email: 'paola@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095553002',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(14),
    createdAt: daysAgo(118),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-customer-paola',
        emailVerified: true,
        displayName: 'Paola Cruz',
      },
    ],
  },
  {
    key: 'customerEduardo',
    id: 'customer-eduardo',
    fullName: 'Eduardo Molina',
    email: 'eduardo@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095553003',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(22),
    createdAt: daysAgo(112),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-customer-eduardo',
        emailVerified: true,
        displayName: 'Eduardo Molina',
      },
    ],
  },
  {
    key: 'customerValeria',
    id: 'customer-valeria',
    fullName: 'Valeria Santos',
    email: 'valeria@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095553004',
    avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(26),
    createdAt: daysAgo(110),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-customer-valeria',
        emailVerified: true,
        displayName: 'Valeria Santos',
      },
    ],
  },
  {
    key: 'customerRafael',
    id: 'customer-rafael',
    fullName: 'Rafael Paredes',
    email: 'rafael@encuentralotodo.app',
    role: 'USER',
    isActive: false,
    phone: '18095553005',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: daysAgo(45),
    createdAt: daysAgo(100),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-customer-rafael',
        emailVerified: true,
        displayName: 'Rafael Paredes',
      },
    ],
  },
  {
    key: 'customerMariela',
    id: 'customer-mariela',
    fullName: 'Mariela Soto',
    email: 'mariela@encuentralotodo.app',
    role: 'USER',
    isActive: true,
    phone: '18095553006',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    lastAccessAt: hoursAgo(36),
    createdAt: daysAgo(92),
    identities: [
      {
        provider: 'FIREBASE',
        externalUserId: 'firebase-customer-mariela',
        emailVerified: true,
        displayName: 'Mariela Soto',
      },
    ],
  },
];

const allSeedUsers = [...platformUsers, ...businessUsers, ...customerUsers];

const businesses: SeedBusiness[] = [
  {
    id: 'biz-casa-norte',
    name: 'Casa Norte Market',
    description: 'General store with curated pantry basics, office restock kits, and fast WhatsApp delivery across Zona Norte.',
    category: 'GENERAL_STORE',
    lat: 18.4861,
    lng: -69.9312,
    zone: 'Zona Norte',
    address: 'Av. Charles Summer 42, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM_PLUS',
    status: 'APPROVED',
    whatsappNumber: '18095550101',
    ownerKey: 'ownerSofia',
    managerKeys: ['managerCarlos', 'managerJulia'],
    createdAt: daysAgo(160),
    lastUpdated: hoursAgo(6),
  },
  {
    id: 'biz-sabor-urbano',
    name: 'Sabor Urbano',
    description: 'Casual kitchen focused on lunch bowls, wraps, and corporate drop-offs booked directly from WhatsApp.',
    category: 'RESTAURANT',
    lat: 18.4702,
    lng: -69.9078,
    zone: 'Naco',
    address: 'Calle Fantino Falco 11, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM',
    status: 'APPROVED',
    whatsappNumber: '18095550102',
    ownerKey: 'ownerSofia',
    managerKeys: ['managerCarlos'],
    createdAt: daysAgo(148),
    lastUpdated: hoursAgo(14),
  },
  {
    id: 'biz-barrio-fit',
    name: 'Barrio Fit Studio',
    description: 'Boutique training studio with functional classes, nutrition add-ons, and corporate wellness bundles.',
    category: 'SERVICE',
    lat: 18.4745,
    lng: -69.8881,
    zone: 'Piantini',
    address: 'Calle Federico Geraldino 88, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM_PLUS',
    status: 'APPROVED',
    whatsappNumber: '18095550104',
    ownerKey: 'ownerValentina',
    managerKeys: ['managerMariana'],
    createdAt: daysAgo(126),
    lastUpdated: hoursAgo(20),
  },
  {
    id: 'biz-cafe-ruta-12',
    name: 'Cafe Ruta 12',
    description: 'Urban cafe with brunch trays, office breakfast subscriptions, and short-notice meeting catering.',
    category: 'RESTAURANT',
    lat: 18.4669,
    lng: -69.9423,
    zone: 'Evaristo Morales',
    address: 'Calle Rafael Augusto Sanchez 12, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM',
    status: 'APPROVED',
    whatsappNumber: '18095550105',
    ownerKey: 'ownerLucia',
    managerKeys: ['managerDiego'],
    createdAt: daysAgo(120),
    lastUpdated: hoursAgo(28),
  },
  {
    id: 'biz-estudio-aura',
    name: 'Estudio Aura Print',
    description: 'Fast-turn design and print studio for menus, branded kits, stickers, and retail signage.',
    category: 'SERVICE',
    lat: 18.4623,
    lng: -69.9145,
    zone: 'Gazcue',
    address: 'Av. Independencia 170, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM_PLUS',
    status: 'APPROVED',
    whatsappNumber: '18095550106',
    ownerKey: 'ownerMateo',
    managerKeys: ['managerElena'],
    createdAt: daysAgo(114),
    lastUpdated: hoursAgo(40),
  },
  {
    id: 'biz-mercado-colonial',
    name: 'Mercado Colonial Express',
    description: 'Compact market serving the Colonial Zone with grab-and-go baskets, drinks, and short-stay kits.',
    category: 'GENERAL_STORE',
    lat: 18.4717,
    lng: -69.8859,
    zone: 'Zona Colonial',
    address: 'Calle El Conde 52, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM',
    status: 'PENDING',
    whatsappNumber: '18095550107',
    ownerKey: 'ownerMateo',
    managerKeys: [],
    createdAt: daysAgo(30),
    lastUpdated: hoursAgo(12),
  },
  {
    id: 'biz-fixit-pro',
    name: 'FixIt Pro Servicios',
    description: 'Home technical service operator for appliances, HVAC maintenance, and preventive visits.',
    category: 'SERVICE',
    lat: 18.4567,
    lng: -69.9524,
    zone: 'Bella Vista',
    address: 'Av. Sarasota 101, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'FREE_TRIAL',
    status: 'PENDING',
    whatsappNumber: '18095550103',
    ownerKey: 'ownerValentina',
    managerKeys: ['managerDiego'],
    createdAt: daysAgo(18),
    lastUpdated: hoursAgo(8),
  },
  {
    id: 'biz-cocina-central',
    name: 'Cocina Central RD',
    description: 'Production kitchen for weekly office lunch plans, executive trays, and recurring catering accounts.',
    category: 'RESTAURANT',
    lat: 18.4431,
    lng: -69.9642,
    zone: 'Mirador Sur',
    address: 'Av. Anacaona 24, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'PREMIUM_PLUS',
    status: 'APPROVED',
    whatsappNumber: '18095550108',
    ownerKey: 'ownerLucia',
    managerKeys: ['managerJulia', 'managerElena'],
    createdAt: daysAgo(156),
    lastUpdated: hoursAgo(50),
  },
  {
    id: 'biz-verde-rapido',
    name: 'Verde Rapido',
    description: 'Healthy convenience market with salads, juices, and quick pantry refills for nearby offices.',
    category: 'GENERAL_STORE',
    lat: 18.4684,
    lng: -69.9169,
    zone: 'Ensanche Julieta',
    address: 'Calle Cub Scouts 21, Santo Domingo',
    profileImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
    subscriptionType: 'FREE_TRIAL',
    status: 'APPROVED',
    whatsappNumber: '18095550109',
    ownerKey: 'ownerLucia',
    managerKeys: [],
    createdAt: daysAgo(42),
    lastUpdated: hoursAgo(18),
  },
];

const products: SeedProduct[] = [
  {
    id: 'prod-casa-cereal-pack',
    businessId: 'biz-casa-norte',
    name: 'Cereal and granola family pack',
    description: 'Weekly breakfast bundle with cereal, granola, and shelf-stable milk for office kitchens.',
    images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e2?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 12.5,
    isFeatured: true,
    createdAt: daysAgo(120),
    lastUpdated: hoursAgo(16),
  },
  {
    id: 'prod-casa-cleaning-kit',
    businessId: 'biz-casa-norte',
    name: 'Office cleaning restock kit',
    description: 'Practical restock with detergent, disinfectant, gloves, and surface cleaner for small teams.',
    images: ['https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 19.9,
    isFeatured: true,
    createdAt: daysAgo(118),
    lastUpdated: hoursAgo(20),
  },
  {
    id: 'prod-casa-snack-station',
    businessId: 'biz-casa-norte',
    name: 'Snack station refill',
    description: 'Assorted refill for coffee corners with sweet and savory portions for medium offices.',
    images: ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 35.75,
    isFeatured: false,
    createdAt: daysAgo(105),
    lastUpdated: hoursAgo(28),
  },
  {
    id: 'prod-sabor-bowl',
    businessId: 'biz-sabor-urbano',
    name: 'Bowl criollo grill',
    description: 'Rice bowl with grilled protein, roasted vegetables, and house sauce for lunch rushes.',
    images: ['https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 8.9,
    isFeatured: true,
    createdAt: daysAgo(110),
    lastUpdated: hoursAgo(24),
  },
  {
    id: 'prod-sabor-wrap',
    businessId: 'biz-sabor-urbano',
    name: 'Wrap spicy chicken',
    description: 'Fresh wrap with seasoned chicken, lettuce, and cilantro dressing.',
    images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 7.5,
    isFeatured: false,
    createdAt: daysAgo(108),
    lastUpdated: hoursAgo(26),
  },
  {
    id: 'prod-sabor-office-combo',
    businessId: 'biz-sabor-urbano',
    name: 'Executive lunch combo',
    description: 'High-volume lunch combo with bowl, drink, and dessert for corporate orders.',
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 12.25,
    isFeatured: true,
    createdAt: daysAgo(90),
    lastUpdated: hoursAgo(32),
  },
  {
    id: 'prod-fit-week-pass',
    businessId: 'biz-barrio-fit',
    name: 'Functional weekly pass',
    description: 'Seven-day pass with class access and onboarding assessment.',
    images: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 24,
    isFeatured: true,
    createdAt: daysAgo(88),
    lastUpdated: hoursAgo(30),
  },
  {
    id: 'prod-fit-corporate-plan',
    businessId: 'biz-barrio-fit',
    name: 'Corporate wellness plan',
    description: 'Configurable monthly wellness package for small teams and leadership groups.',
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Includes kickoff assessment, class seats, nutrition office hours, and engagement recap.',
    isFeatured: false,
    createdAt: daysAgo(84),
    lastUpdated: hoursAgo(34),
  },
  {
    id: 'prod-ruta-brunch-box',
    businessId: 'biz-cafe-ruta-12',
    name: 'Brunch box for meetings',
    description: 'Assorted pastries, coffee, and fruit cups for morning meetings.',
    images: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 26,
    isFeatured: true,
    createdAt: daysAgo(94),
    lastUpdated: hoursAgo(36),
  },
  {
    id: 'prod-ruta-croissant-box',
    businessId: 'biz-cafe-ruta-12',
    name: 'Croissant office box',
    description: 'Sweet and savory croissants packed for team breakfasts.',
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 21.5,
    isFeatured: false,
    createdAt: daysAgo(92),
    lastUpdated: hoursAgo(42),
  },
  {
    id: 'prod-ruta-coffee-subscription',
    businessId: 'biz-cafe-ruta-12',
    name: 'Coffee cart subscription',
    description: 'Recurring coffee service for offices that need recurring brewed coffee support.',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Choose service days, brewer size, pastry add-ons, and barista support windows.',
    isFeatured: true,
    createdAt: daysAgo(80),
    lastUpdated: hoursAgo(48),
  },
  {
    id: 'prod-aura-sticker-pack',
    businessId: 'biz-estudio-aura',
    name: 'Commercial sticker pack',
    description: 'Laminated sticker batch for packaging, labels, and counter takeaways.',
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 32,
    isFeatured: true,
    createdAt: daysAgo(76),
    lastUpdated: hoursAgo(44),
  },
  {
    id: 'prod-aura-brand-kit',
    businessId: 'biz-estudio-aura',
    name: 'Brand starter kit',
    description: 'Configurable starter package for new businesses that need cohesive collateral.',
    images: ['https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Logo refresh, one signage layout, sticker sheet, and menu or flyer adaptation.',
    isFeatured: true,
    createdAt: daysAgo(74),
    lastUpdated: hoursAgo(52),
  },
  {
    id: 'prod-colonial-basket',
    businessId: 'biz-mercado-colonial',
    name: 'Colonial stay basket',
    description: 'Welcome basket with snacks, drinks, and quick essentials for short stays.',
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 28,
    isFeatured: false,
    createdAt: daysAgo(12),
    lastUpdated: hoursAgo(14),
  },
  {
    id: 'prod-cocina-executive-tray',
    businessId: 'biz-cocina-central',
    name: 'Executive lunch tray for 10',
    description: 'Balanced corporate lunch tray with setup for boardroom meetings.',
    images: ['https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 68,
    isFeatured: true,
    createdAt: daysAgo(116),
    lastUpdated: hoursAgo(54),
  },
  {
    id: 'prod-cocina-corporate-plan',
    businessId: 'biz-cocina-central',
    name: 'Recurring office meal plan',
    description: 'Configurable recurring plan for teams that need weekly menus and delivery slots.',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Custom weekly rotation, dietary flags, service days, and distribution notes.',
    isFeatured: true,
    createdAt: daysAgo(112),
    lastUpdated: hoursAgo(58),
  },
  {
    id: 'prod-verde-salad-pack',
    businessId: 'biz-verde-rapido',
    name: 'Ready salad pack',
    description: 'Fresh salad pack for quick lunches with dressing and toppings included.',
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 9.25,
    isFeatured: false,
    createdAt: daysAgo(20),
    lastUpdated: hoursAgo(16),
  },
  {
    id: 'prod-verde-juice-pair',
    businessId: 'biz-verde-rapido',
    name: 'Cold-pressed juice pair',
    description: 'Two-bottle juice set for same-day pickup or office drop-off.',
    images: ['https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80'],
    type: 'simple',
    price: 11.4,
    isFeatured: false,
    createdAt: daysAgo(16),
    lastUpdated: hoursAgo(12),
  },
];

const promotions: SeedPromotion[] = [
  {
    id: 'promo-casa-delivery-boost',
    businessId: 'biz-casa-norte',
    title: '30-minute delivery bundle',
    description: 'Discounted delivery bundle for office pantry refills ordered before 2 PM.',
    type: 'DISCOUNT',
    status: 'ACTIVE',
    promoPrice: 24.9,
    originalPrice: 31.5,
    startDate: daysAgo(4),
    endDate: daysFromNow(10),
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(10),
  },
  {
    id: 'promo-casa-back-to-office',
    businessId: 'biz-casa-norte',
    title: 'Back to office snack week',
    description: 'Expired campaign used to reactivate recurring office snack accounts.',
    type: 'ANNOUNCEMENT',
    status: 'EXPIRED',
    promoPrice: 29,
    originalPrice: 36,
    startDate: daysAgo(24),
    endDate: daysAgo(5),
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: 'promo-sabor-executive-lunch',
    businessId: 'biz-sabor-urbano',
    title: 'Executive lunch express',
    description: 'Active lunch combo for weekday office orders between 11 AM and 2 PM.',
    type: 'DISCOUNT',
    status: 'ACTIVE',
    promoPrice: 10.5,
    originalPrice: 13.9,
    startDate: daysAgo(3),
    endDate: daysFromNow(7),
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(9),
    updatedAt: hoursAgo(16),
  },
  {
    id: 'promo-sabor-meeting-catering',
    businessId: 'biz-sabor-urbano',
    title: 'Meeting catering preview',
    description: 'Draft announcement prepared for small office tasting sessions.',
    type: 'ANNOUNCEMENT',
    status: 'DRAFT',
    promoPrice: 0,
    originalPrice: 0,
    startDate: daysFromNow(5),
    endDate: daysFromNow(14),
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(18),
  },
  {
    id: 'promo-fit-trial-week',
    businessId: 'biz-barrio-fit',
    title: 'Trial week plus assessment',
    description: 'New client event with onboarding assessment and guided class entry.',
    type: 'EVENT',
    status: 'ACTIVE',
    promoPrice: 19,
    originalPrice: 28,
    startDate: daysAgo(2),
    endDate: daysFromNow(9),
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(21),
  },
  {
    id: 'promo-ruta-brunch-office',
    businessId: 'biz-cafe-ruta-12',
    title: 'Brunch office bundle',
    description: 'Curated breakfast drop for teams booking recurring meetings.',
    type: 'ANNOUNCEMENT',
    status: 'ACTIVE',
    promoPrice: 26,
    originalPrice: 34,
    startDate: daysAgo(1),
    endDate: daysFromNow(6),
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(24),
  },
  {
    id: 'promo-aura-brand-refresh',
    businessId: 'biz-estudio-aura',
    title: 'Brand refresh sprint',
    description: 'Expired short-run campaign for menu redesign and retail sticker production.',
    type: 'DISCOUNT',
    status: 'EXPIRED',
    promoPrice: 59,
    originalPrice: 82,
    startDate: daysAgo(19),
    endDate: daysAgo(2),
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(24),
    updatedAt: daysAgo(2),
  },
  {
    id: 'promo-cocina-launch',
    businessId: 'biz-cocina-central',
    title: 'Corporate tray launch',
    description: 'Live event pricing for first-time office lunch tray buyers.',
    type: 'EVENT',
    status: 'ACTIVE',
    promoPrice: 89,
    originalPrice: 115,
    startDate: daysAgo(5),
    endDate: daysFromNow(8),
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(11),
    updatedAt: hoursAgo(30),
  },
  {
    id: 'promo-verde-healthy-week',
    businessId: 'biz-verde-rapido',
    title: 'Healthy week sampler',
    description: 'Draft campaign for a light catalog while the free trial business validates demand.',
    type: 'DISCOUNT',
    status: 'DRAFT',
    promoPrice: 8.5,
    originalPrice: 11,
    startDate: daysFromNow(3),
    endDate: daysFromNow(12),
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'promo-colonial-soft-launch',
    businessId: 'biz-mercado-colonial',
    title: 'Soft launch for host partners',
    description: 'Draft communication to attract boutique hotels and short-stay hosts before approval.',
    type: 'ANNOUNCEMENT',
    status: 'DRAFT',
    promoPrice: 0,
    originalPrice: 0,
    startDate: daysFromNow(7),
    endDate: daysFromNow(20),
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(9),
  },
];

const leads: SeedLead[] = [
  {
    id: 'lead-casa-promo-01',
    businessId: 'biz-casa-norte',
    name: 'Valentina Guzman',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Asked for pantry refill pricing and same-day delivery for a 12-person office.',
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'lead-casa-whatsapp-02',
    businessId: 'biz-casa-norte',
    name: 'Andrea Tejada',
    source: 'WHATSAPP_CLICK',
    status: 'CONTACTED',
    summary: 'Needs a recurring cleaning and snack bundle for a coworking floor.',
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(14),
  },
  {
    id: 'lead-casa-profile-03',
    businessId: 'biz-casa-norte',
    name: 'Paula Infante',
    source: 'CONTACT_CLICK',
    status: 'QUALIFIED',
    summary: 'Requested a quote for weekly meeting pantry restocks across two branches.',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(20),
  },
  {
    id: 'lead-casa-form-04',
    businessId: 'biz-casa-norte',
    name: 'Rafael Aristy',
    source: 'CONTACT_CLICK',
    status: 'CLOSED',
    summary: 'Converted into a small monthly pantry contract after a two-week trial.',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    id: 'lead-sabor-whatsapp-01',
    businessId: 'biz-sabor-urbano',
    name: 'Julio Pena',
    source: 'WHATSAPP_CLICK',
    status: 'QUALIFIED',
    summary: 'Requested menu rotation and pricing for a team of 25 people.',
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(10),
  },
  {
    id: 'lead-sabor-promo-02',
    businessId: 'biz-sabor-urbano',
    name: 'Mariela Soto',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Asked whether the executive combo applies to standing weekly orders.',
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(12),
  },
  {
    id: 'lead-sabor-form-03',
    businessId: 'biz-sabor-urbano',
    name: 'Daniel Acosta',
    source: 'CONTACT_CLICK',
    status: 'CONTACTED',
    summary: 'Needs vegetarian and gluten-free options for team lunch every Friday.',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  },
  {
    id: 'lead-fit-profile-01',
    businessId: 'biz-barrio-fit',
    name: 'Carla Jimenez',
    source: 'CONTACT_CLICK',
    status: 'NEW',
    summary: 'Interested in a wellness package for a remote-first startup visiting the office twice per week.',
    createdAt: hoursAgo(11),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'lead-fit-whatsapp-02',
    businessId: 'biz-barrio-fit',
    name: 'Nathaly Perdomo',
    source: 'WHATSAPP_CLICK',
    status: 'QUALIFIED',
    summary: 'Asked for pricing on a 3-month functional program for leadership cohorts.',
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(18),
  },
  {
    id: 'lead-ruta-form-01',
    businessId: 'biz-cafe-ruta-12',
    name: 'Samuel Mateo',
    source: 'CONTACT_CLICK',
    status: 'CONTACTED',
    summary: 'Requested recurring breakfast trays for Tuesday planning sessions.',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(21),
  },
  {
    id: 'lead-cocina-promo-01',
    businessId: 'biz-cocina-central',
    name: 'Giselle Ramirez',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Asked whether the launch pricing can cover vegetarian and high-protein trays.',
    createdAt: hoursAgo(22),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'lead-cocina-profile-02',
    businessId: 'biz-cocina-central',
    name: 'Orlando Veloz',
    source: 'CONTACT_CLICK',
    status: 'CONTACTED',
    summary: 'Needs weekly lunch delivery for a legal office with rotating attendance.',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(16),
  },
  {
    id: 'lead-cocina-whatsapp-03',
    businessId: 'biz-cocina-central',
    name: 'Lorena Taveras',
    source: 'WHATSAPP_CLICK',
    status: 'CLOSED',
    summary: 'Closed a 4-week recurring lunch pilot after a successful tasting session.',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    id: 'lead-verde-promo-01',
    businessId: 'biz-verde-rapido',
    name: 'Paola Nunez',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Interested in health-focused pantry alternatives for a boutique agency team.',
    createdAt: hoursAgo(26),
    updatedAt: hoursAgo(12),
  },
];

const reviews: SeedReview[] = [
  {
    id: 'review-casa-ana',
    userKey: 'customerAna',
    businessId: 'biz-casa-norte',
    rating: 5,
    comment: 'Fast delivery and the pantry bundle was exactly what our office needed.',
    createdAt: daysAgo(10),
  },
  {
    id: 'review-casa-paola',
    userKey: 'customerPaola',
    businessId: 'biz-casa-norte',
    rating: 4,
    comment: 'Reliable for recurring snack orders, though substitutions should be messaged sooner.',
    createdAt: daysAgo(7),
  },
  {
    id: 'review-sabor-eduardo',
    userKey: 'customerEduardo',
    businessId: 'biz-sabor-urbano',
    rating: 5,
    comment: 'The executive combo arrived hot and the portion sizes were consistent.',
    createdAt: daysAgo(8),
  },
  {
    id: 'review-sabor-mariela',
    userKey: 'customerMariela',
    businessId: 'biz-sabor-urbano',
    rating: 3,
    comment: 'Good flavor, but one delivery window slipped during a busy lunch hour.',
    createdAt: daysAgo(4),
  },
  {
    id: 'review-fit-valeria',
    userKey: 'customerValeria',
    businessId: 'biz-barrio-fit',
    rating: 5,
    comment: 'The assessment and follow-up were very structured, not just a generic trial class.',
    createdAt: daysAgo(6),
  },
  {
    id: 'review-fit-rafael',
    userKey: 'customerRafael',
    businessId: 'biz-barrio-fit',
    rating: 4,
    comment: 'Strong coaching quality and clear onboarding instructions for first-time attendees.',
    createdAt: daysAgo(12),
  },
  {
    id: 'review-ruta-ana',
    userKey: 'customerAna',
    businessId: 'biz-cafe-ruta-12',
    rating: 5,
    comment: 'The breakfast trays arrived polished and on time for our client meeting.',
    createdAt: daysAgo(5),
  },
  {
    id: 'review-ruta-paola',
    userKey: 'customerPaola',
    businessId: 'biz-cafe-ruta-12',
    rating: 4,
    comment: 'Very good coffee program, though I would like one more pastry option in the bundle.',
    createdAt: daysAgo(3),
  },
  {
    id: 'review-aura-mariela',
    userKey: 'customerMariela',
    businessId: 'biz-estudio-aura',
    rating: 5,
    comment: 'The print turnaround was fast and the branding suggestions were practical.',
    createdAt: daysAgo(11),
  },
  {
    id: 'review-cocina-eduardo',
    userKey: 'customerEduardo',
    businessId: 'biz-cocina-central',
    rating: 5,
    comment: 'Recurring lunch delivery simplified operations for our team and the menu stayed varied.',
    createdAt: daysAgo(9),
  },
  {
    id: 'review-cocina-valeria',
    userKey: 'customerValeria',
    businessId: 'biz-cocina-central',
    rating: 4,
    comment: 'Good quality and setup, but one vegetarian tray was under-seasoned.',
    createdAt: daysAgo(2),
  },
  {
    id: 'review-verde-paola',
    userKey: 'customerPaola',
    businessId: 'biz-verde-rapido',
    rating: 4,
    comment: 'Fresh products and a focused catalog that works well for healthy office snacks.',
    createdAt: daysAgo(1),
  },
];

const auditLogs: SeedAuditLog[] = [
  {
    id: 'audit-user-role-laura',
    actorKey: 'superadminLuis',
    targetKey: 'adminLaura',
    action: 'USER_PLATFORM_ROLE_UPDATED',
    metadata: { fromRole: 'USER', toRole: 'ADMIN', reason: 'Platform operations coverage' },
    createdAt: daysAgo(40),
  },
  {
    id: 'audit-user-profile-mateo',
    actorKey: 'superadminLuis',
    targetKey: 'ownerMateo',
    action: 'USER_PROFILE_UPDATED',
    metadata: { fields: ['phone', 'avatarUrl'] },
    createdAt: daysAgo(18),
  },
  {
    id: 'audit-base-role-valentina',
    actorKey: 'globalCamila',
    targetKey: 'ownerValentina',
    action: 'USER_BASE_ROLE_UPDATED',
    metadata: { fromRole: 'UNASSIGNED', toRole: 'USER' },
    createdAt: daysAgo(26),
  },
  {
    id: 'audit-status-rafael',
    actorKey: 'superadminLuis',
    targetKey: 'customerRafael',
    action: 'USER_STATUS_UPDATED',
    metadata: { fromActive: true, toActive: false, reason: 'Dormant test account preserved for history coverage' },
    createdAt: daysAgo(5),
  },
  {
    id: 'audit-assign-carlos-casa',
    actorKey: 'ownerSofia',
    targetKey: 'managerCarlos',
    businessId: 'biz-casa-norte',
    action: 'USER_BUSINESS_ROLE_ASSIGNED',
    metadata: { role: 'MANAGER' },
    createdAt: daysAgo(33),
  },
  {
    id: 'audit-assign-elena-cocina',
    actorKey: 'ownerLucia',
    targetKey: 'managerElena',
    businessId: 'biz-cocina-central',
    action: 'USER_BUSINESS_ROLE_ASSIGNED',
    metadata: { role: 'MANAGER' },
    createdAt: daysAgo(29),
  },
  {
    id: 'audit-remove-diego-colonial',
    actorKey: 'ownerMateo',
    targetKey: 'managerDiego',
    businessId: 'biz-mercado-colonial',
    action: 'USER_BUSINESS_ROLE_REMOVED',
    metadata: { role: 'MANAGER', reason: 'Staff rotation before approval' },
    createdAt: daysAgo(3),
  },
  {
    id: 'audit-transfer-ruta',
    actorKey: 'superadminLuis',
    targetKey: 'ownerLucia',
    businessId: 'biz-cafe-ruta-12',
    action: 'BUSINESS_OWNERSHIP_TRANSFERRED',
    metadata: {
      fromUserEmail: 'valentina@encuentralotodo.app',
      toUserEmail: 'lucia@encuentralotodo.app',
      reason: 'Route 12 portfolio consolidation',
    },
    createdAt: daysAgo(21),
  },
  {
    id: 'audit-assign-mariana-fit',
    actorKey: 'globalCamila',
    targetKey: 'managerMariana',
    businessId: 'biz-barrio-fit',
    action: 'USER_BUSINESS_ROLE_ASSIGNED',
    metadata: { role: 'MANAGER', reason: 'Opening support for premium-plus studio' },
    createdAt: daysAgo(14),
  },
];

function mergeUserMaps(...maps: Array<Record<string, string>>) {
  return Object.assign({}, ...maps);
}

function requireUserId(userIdsByKey: Record<string, string>, userKey: string) {
  const userId = userIdsByKey[userKey];
  if (!userId) {
    throw new Error(`Missing seeded user mapping for ${userKey}.`);
  }

  return userId;
}

function assertBusinessRelationships() {
  const knownUserKeys = new Set(allSeedUsers.map((user) => user.key));

  for (const business of businesses) {
    if (!knownUserKeys.has(business.ownerKey)) {
      throw new Error(`Business ${business.id} references unknown owner ${business.ownerKey}.`);
    }

    const managerSet = new Set<string>();
    for (const managerKey of business.managerKeys) {
      if (!knownUserKeys.has(managerKey)) {
        throw new Error(`Business ${business.id} references unknown manager ${managerKey}.`);
      }

      if (managerKey === business.ownerKey) {
        throw new Error(`Business ${business.id} cannot assign the owner as a manager.`);
      }

      if (managerSet.has(managerKey)) {
        throw new Error(`Business ${business.id} repeats manager ${managerKey}.`);
      }

      managerSet.add(managerKey);
    }
  }
}

async function upsertUsers(users: SeedUser[]) {
  const userIdsByKey: Record<string, string> = {};

  for (const user of users) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          {
            email: {
              equals: user.email,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const data = {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      lastAccessAt: user.lastAccessAt ?? null,
    };

    const savedUser = existingUser
      ? await prisma.user.update({
        where: { id: existingUser.id },
        data,
        select: { id: true },
      })
      : await prisma.user.create({
        data: {
          id: user.id,
          ...data,
          createdAt: user.createdAt,
        },
        select: { id: true },
      });

    userIdsByKey[user.key] = savedUser.id;
  }

  return userIdsByKey;
}

async function seedPlatformUsers() {
  return upsertUsers(platformUsers);
}

async function seedBusinessUsers() {
  return upsertUsers(businessUsers);
}

async function seedCustomerUsers() {
  return upsertUsers(customerUsers);
}

async function seedUserIdentities(userIdsByKey: Record<string, string>) {
  let identityCount = 0;

  for (const user of allSeedUsers) {
    const userId = requireUserId(userIdsByKey, user.key);

    for (const identity of user.identities) {
      await prisma.userIdentity.upsert({
        where: {
          provider_externalUserId: {
            provider: identity.provider,
            externalUserId: identity.externalUserId,
          },
        },
        update: {
          email: user.email,
          emailVerified: identity.emailVerified,
          displayName: identity.displayName ?? user.fullName,
          avatarUrl: user.avatarUrl ?? null,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        create: {
          provider: identity.provider,
          externalUserId: identity.externalUserId,
          email: user.email,
          emailVerified: identity.emailVerified,
          displayName: identity.displayName ?? user.fullName,
          avatarUrl: user.avatarUrl ?? null,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
      identityCount += 1;
    }
  }

  return identityCount;
}

async function resetBusinessDomainData() {
  await prisma.auditLog.deleteMany();
  await prisma.userBusinessRole.deleteMany();
  await prisma.businessManager.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.business.deleteMany();
}

async function seedBusinesses(userIdsByKey: Record<string, string>) {
  const businessRows = businesses.map((business) => ({
    id: business.id,
    name: business.name,
    description: business.description,
    category: business.category,
    lat: business.lat,
    lng: business.lng,
    zone: business.zone,
    address: business.address,
    profileImage: business.profileImage,
    bannerImage: business.bannerImage,
    subscriptionType: business.subscriptionType,
    status: business.status,
    whatsappNumber: business.whatsappNumber,
    ownerId: requireUserId(userIdsByKey, business.ownerKey),
    createdAt: business.createdAt,
    lastUpdated: business.lastUpdated,
  }));

  await prisma.business.createMany({ data: businessRows });
  return businessRows.length;
}

async function seedBusinessMemberships(userIdsByKey: Record<string, string>) {
  const userBusinessRoles: Array<{
    userId: string;
    businessId: string;
    role: BusinessAssignmentRole;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  const businessManagers: Array<{ businessId: string; userId: string }> = [];

  for (const business of businesses) {
    const createdAt = new Date(Math.min(business.createdAt.getTime(), business.lastUpdated.getTime()));

    userBusinessRoles.push({
      userId: requireUserId(userIdsByKey, business.ownerKey),
      businessId: business.id,
      role: 'OWNER',
      createdAt,
      updatedAt: business.lastUpdated,
    });

    for (const managerKey of business.managerKeys) {
      const managerUserId = requireUserId(userIdsByKey, managerKey);

      userBusinessRoles.push({
        userId: managerUserId,
        businessId: business.id,
        role: 'MANAGER',
        createdAt,
        updatedAt: business.lastUpdated,
      });

      businessManagers.push({
        businessId: business.id,
        userId: managerUserId,
      });
    }
  }

  await prisma.userBusinessRole.createMany({ data: userBusinessRoles });

  if (businessManagers.length > 0) {
    await prisma.businessManager.createMany({ data: businessManagers });
  }

  return {
    userBusinessRoleCount: userBusinessRoles.length,
    businessManagerCount: businessManagers.length,
  };
}

async function seedProducts() {
  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.id,
      businessId: product.businessId,
      name: product.name,
      description: product.description,
      images: product.images,
      type: product.type,
      configurationSummary: product.configurationSummary ?? null,
      price: product.type === 'configurable' ? null : product.price ?? null,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      lastUpdated: product.lastUpdated,
    })),
  });

  return products.length;
}

async function seedPromotions() {
  await prisma.promotion.createMany({
    data: promotions.map((promotion) => ({
      id: promotion.id,
      businessId: promotion.businessId,
      title: promotion.title,
      description: promotion.description,
      type: promotion.type,
      status: promotion.status,
      promoPrice: promotion.promoPrice,
      originalPrice: promotion.originalPrice,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      image: promotion.image,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    })),
  });

  return promotions.length;
}

async function seedLeads() {
  await prisma.lead.createMany({
    data: leads.map((lead) => ({
      id: lead.id,
      businessId: lead.businessId,
      name: lead.name,
      source: lead.source,
      status: lead.status,
      summary: lead.summary,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    })),
  });

  return leads.length;
}

async function seedReviews(userIdsByKey: Record<string, string>) {
  await prisma.review.createMany({
    data: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      businessId: review.businessId,
      userId: requireUserId(userIdsByKey, review.userKey),
      createdAt: review.createdAt,
    })),
  });

  return reviews.length;
}

async function seedAuditLogs(userIdsByKey: Record<string, string>) {
  await prisma.auditLog.createMany({
    data: auditLogs.map((auditLog) => ({
      id: auditLog.id,
      actorUserId: requireUserId(userIdsByKey, auditLog.actorKey),
      targetUserId: auditLog.targetKey ? requireUserId(userIdsByKey, auditLog.targetKey) : null,
      businessId: auditLog.businessId ?? null,
      action: auditLog.action,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
    })),
  });

  return auditLogs.length;
}

async function logSeedSummary(seededCounts: {
  users: number;
  identities: number;
  businesses: number;
  userBusinessRoles: number;
  businessManagers: number;
  products: number;
  promotions: number;
  leads: number;
  reviews: number;
  auditLogs: number;
}) {
  const [
    totalUsers,
    totalIdentities,
    totalBusinesses,
    totalRoles,
    totalManagers,
    totalProducts,
    totalPromotions,
    totalLeads,
    totalReviews,
    totalAuditLogs,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.userIdentity.count(),
    prisma.business.count(),
    prisma.userBusinessRole.count(),
    prisma.businessManager.count(),
    prisma.product.count(),
    prisma.promotion.count(),
    prisma.lead.count(),
    prisma.review.count(),
    prisma.auditLog.count(),
  ]);

  console.table([
    { entity: 'users', seeded: seededCounts.users, total: totalUsers },
    { entity: 'userIdentities', seeded: seededCounts.identities, total: totalIdentities },
    { entity: 'businesses', seeded: seededCounts.businesses, total: totalBusinesses },
    { entity: 'userBusinessRoles', seeded: seededCounts.userBusinessRoles, total: totalRoles },
    { entity: 'businessManagers', seeded: seededCounts.businessManagers, total: totalManagers },
    { entity: 'products', seeded: seededCounts.products, total: totalProducts },
    { entity: 'promotions', seeded: seededCounts.promotions, total: totalPromotions },
    { entity: 'leads', seeded: seededCounts.leads, total: totalLeads },
    { entity: 'reviews', seeded: seededCounts.reviews, total: totalReviews },
    { entity: 'auditLogs', seeded: seededCounts.auditLogs, total: totalAuditLogs },
  ]);

  console.log('Business status distribution:', {
    APPROVED: businesses.filter((business) => business.status === 'APPROVED').length,
    PENDING: businesses.filter((business) => business.status === 'PENDING').length,
  });

  console.log('Promotion status distribution:', {
    ACTIVE: promotions.filter((promotion) => promotion.status === 'ACTIVE').length,
    DRAFT: promotions.filter((promotion) => promotion.status === 'DRAFT').length,
    EXPIRED: promotions.filter((promotion) => promotion.status === 'EXPIRED').length,
  });
}

async function main() {
  assertBusinessRelationships();

  const platformUserIds = await seedPlatformUsers();
  const businessUserIds = await seedBusinessUsers();
  const customerUserIds = await seedCustomerUsers();
  const userIdsByKey = mergeUserMaps(platformUserIds, businessUserIds, customerUserIds);

  const identityCount = await seedUserIdentities(userIdsByKey);

  await resetBusinessDomainData();

  const businessCount = await seedBusinesses(userIdsByKey);
  const membershipCounts = await seedBusinessMemberships(userIdsByKey);
  const productCount = await seedProducts();
  const promotionCount = await seedPromotions();
  const leadCount = await seedLeads();
  const reviewCount = await seedReviews(userIdsByKey);
  const auditLogCount = await seedAuditLogs(userIdsByKey);

  await logSeedSummary({
    users: allSeedUsers.length,
    identities: identityCount,
    businesses: businessCount,
    userBusinessRoles: membershipCounts.userBusinessRoleCount,
    businessManagers: membershipCounts.businessManagerCount,
    products: productCount,
    promotions: promotionCount,
    leads: leadCount,
    reviews: reviewCount,
    auditLogs: auditLogCount,
  });
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