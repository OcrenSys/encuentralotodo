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
    name: 'Mercado Casa Norte',
    description: 'Tienda de conveniencia con basicos de despensa seleccionados, kits de reposicion para oficina y entrega rapida por WhatsApp en toda la Zona Norte.',
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
    description: 'Cocina casual enfocada en bowls de almuerzo, wraps y entregas corporativas reservadas directamente por WhatsApp.',
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
    name: 'Estudio Barrio Fit',
    description: 'Estudio boutique de entrenamiento con clases funcionales, complementos de nutricion y paquetes de bienestar corporativo.',
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
    description: 'Cafe urbano con bandejas de brunch, suscripciones de desayuno para oficinas y catering para reuniones de ultima hora.',
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
    name: 'Impresos Aura',
    description: 'Estudio agil de diseno e impresion para menus, kits de marca, stickers y rotulacion comercial.',
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
    name: 'Mercado Colonial Expres',
    description: 'Mercado compacto para la Zona Colonial con canastas listas para llevar, bebidas y kits para estadias cortas.',
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
    description: 'Operador de servicios tecnicos a domicilio para electrodomesticos, mantenimiento de HVAC y visitas preventivas.',
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
    description: 'Cocina de produccion para planes semanales de almuerzo de oficina, bandejas ejecutivas y cuentas recurrentes de catering.',
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
    description: 'Mercado saludable de conveniencia con ensaladas, jugos y reposiciones rapidas de despensa para oficinas cercanas.',
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
    name: 'Paquete familiar de cereal y granola',
    description: 'Combo semanal de desayuno con cereal, granola y leche de larga duracion para cocinas de oficina.',
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
    name: 'Kit de reposicion de limpieza para oficina',
    description: 'Reposicion practica con detergente, desinfectante, guantes y limpiador de superficies para equipos pequenos.',
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
    name: 'Reposicion de estacion de snacks',
    description: 'Reposicion surtida para rincones de cafe con porciones dulces y saladas para oficinas medianas.',
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
    name: 'Bowl criollo a la parrilla',
    description: 'Bowl de arroz con proteina a la parrilla, vegetales asados y salsa de la casa para horas pico de almuerzo.',
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
    name: 'Wrap de pollo picante',
    description: 'Wrap fresco con pollo sazonado, lechuga y aderezo de cilantro.',
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
    name: 'Combo ejecutivo de almuerzo',
    description: 'Combo de alto volumen con bowl, bebida y postre para pedidos corporativos.',
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
    name: 'Pase semanal funcional',
    description: 'Pase de siete dias con acceso a clases y evaluacion inicial.',
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
    name: 'Plan corporativo de bienestar',
    description: 'Paquete mensual configurable de bienestar para equipos pequenos y grupos de liderazgo.',
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Incluye evaluacion inicial, cupos para clases, consultorias de nutricion y resumen de participacion.',
    isFeatured: false,
    createdAt: daysAgo(84),
    lastUpdated: hoursAgo(34),
  },
  {
    id: 'prod-ruta-brunch-box',
    businessId: 'biz-cafe-ruta-12',
    name: 'Caja de brunch para reuniones',
    description: 'Surtido de pasteles, cafe y vasos de fruta para reuniones matutinas.',
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
    name: 'Caja de croissants para oficina',
    description: 'Croissants dulces y salados empacados para desayunos de equipo.',
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
    name: 'Suscripcion de carrito de cafe',
    description: 'Servicio recurrente de cafe para oficinas que necesitan apoyo continuo de cafe preparado.',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Elige dias de servicio, tamano de cafetera, extras de pasteleria y franjas de apoyo con barista.',
    isFeatured: true,
    createdAt: daysAgo(80),
    lastUpdated: hoursAgo(48),
  },
  {
    id: 'prod-aura-sticker-pack',
    businessId: 'biz-estudio-aura',
    name: 'Paquete comercial de stickers',
    description: 'Lote de stickers laminados para empaques, etiquetas y material de mostrador.',
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
    name: 'Kit inicial de marca',
    description: 'Paquete inicial configurable para nuevos negocios que necesitan material coherente de marca.',
    images: ['https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Actualizacion de logo, un arte de rotulacion, hoja de stickers y adaptacion de menu o volante.',
    isFeatured: true,
    createdAt: daysAgo(74),
    lastUpdated: hoursAgo(52),
  },
  {
    id: 'prod-colonial-basket',
    businessId: 'biz-mercado-colonial',
    name: 'Canasta de bienvenida colonial',
    description: 'Canasta de bienvenida con snacks, bebidas y esenciales rapidos para estadias cortas.',
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
    name: 'Bandeja ejecutiva de almuerzo para 10',
    description: 'Bandeja corporativa balanceada con montaje para reuniones de directorio.',
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
    name: 'Plan recurrente de comidas para oficina',
    description: 'Plan recurrente configurable para equipos que necesitan menus semanales y franjas de entrega.',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
    type: 'configurable',
    configurationSummary: 'Rotacion semanal personalizada, preferencias alimentarias, dias de servicio y notas de distribucion.',
    isFeatured: true,
    createdAt: daysAgo(112),
    lastUpdated: hoursAgo(58),
  },
  {
    id: 'prod-verde-salad-pack',
    businessId: 'biz-verde-rapido',
    name: 'Paquete listo de ensaladas',
    description: 'Paquete fresco de ensaladas para almuerzos rapidos con aderezo y toppings incluidos.',
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
    name: 'Par de jugos prensados en frio',
    description: 'Set de dos botellas de jugo para retiro el mismo dia o entrega en oficina.',
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
    title: 'Combo de entrega en 30 minutos',
    description: 'Combo con descuento para reposiciones de despensa de oficina pedidas antes de las 2 PM.',
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
    title: 'Semana de snacks de regreso a la oficina',
    description: 'Campana vencida usada para reactivar cuentas recurrentes de snacks para oficina.',
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
    title: 'Almuerzo ejecutivo express',
    description: 'Combo de almuerzo activo para pedidos de oficina entre semana de 11 AM a 2 PM.',
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
    title: 'Vista previa de catering para reuniones',
    description: 'Anuncio en borrador preparado para sesiones de degustacion con oficinas pequenas.',
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
    title: 'Semana de prueba con evaluacion',
    description: 'Evento para nuevos clientes con evaluacion inicial y entrada guiada a clases.',
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
    title: 'Combo de brunch para oficina',
    description: 'Entrega de desayuno seleccionada para equipos que reservan reuniones recurrentes.',
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
    title: 'Sprint de renovacion de marca',
    description: 'Campana vencida de corta duracion para rediseno de menus y produccion de stickers comerciales.',
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
    title: 'Lanzamiento de bandejas corporativas',
    description: 'Precios de lanzamiento para compradores primerizos de bandejas de almuerzo para oficina.',
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
    title: 'Muestra de semana saludable',
    description: 'Campana en borrador para un catalogo ligero mientras el negocio en prueba gratuita valida la demanda.',
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
    title: 'Lanzamiento suave para aliados anfitriones',
    description: 'Comunicacion en borrador para atraer hoteles boutique y anfitriones de estadias cortas antes de la aprobacion.',
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
    summary: 'Solicito precios para reposicion de despensa y entrega el mismo dia para una oficina de 12 personas.',
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'lead-casa-whatsapp-02',
    businessId: 'biz-casa-norte',
    name: 'Andrea Tejada',
    source: 'WHATSAPP_CLICK',
    status: 'CONTACTED',
    summary: 'Necesita un combo recurrente de limpieza y snacks para un piso de coworking.',
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(14),
  },
  {
    id: 'lead-casa-profile-03',
    businessId: 'biz-casa-norte',
    name: 'Paula Infante',
    source: 'CONTACT_CLICK',
    status: 'QUALIFIED',
    summary: 'Pidio una cotizacion para reposiciones semanales de despensa para reuniones en dos sucursales.',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(20),
  },
  {
    id: 'lead-casa-form-04',
    businessId: 'biz-casa-norte',
    name: 'Rafael Aristy',
    source: 'CONTACT_CLICK',
    status: 'CLOSED',
    summary: 'Se convirtio en un pequeno contrato mensual de despensa tras una prueba de dos semanas.',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    id: 'lead-sabor-whatsapp-01',
    businessId: 'biz-sabor-urbano',
    name: 'Julio Pena',
    source: 'WHATSAPP_CLICK',
    status: 'QUALIFIED',
    summary: 'Solicito rotacion de menu y precios para un equipo de 25 personas.',
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(10),
  },
  {
    id: 'lead-sabor-promo-02',
    businessId: 'biz-sabor-urbano',
    name: 'Mariela Soto',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Pregunto si el combo ejecutivo aplica para pedidos semanales recurrentes.',
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(12),
  },
  {
    id: 'lead-sabor-form-03',
    businessId: 'biz-sabor-urbano',
    name: 'Daniel Acosta',
    source: 'CONTACT_CLICK',
    status: 'CONTACTED',
    summary: 'Necesita opciones vegetarianas y sin gluten para el almuerzo del equipo todos los viernes.',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  },
  {
    id: 'lead-fit-profile-01',
    businessId: 'biz-barrio-fit',
    name: 'Carla Jimenez',
    source: 'CONTACT_CLICK',
    status: 'NEW',
    summary: 'Interesada en un paquete de bienestar para una startup remota que visita la oficina dos veces por semana.',
    createdAt: hoursAgo(11),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'lead-fit-whatsapp-02',
    businessId: 'biz-barrio-fit',
    name: 'Nathaly Perdomo',
    source: 'WHATSAPP_CLICK',
    status: 'QUALIFIED',
    summary: 'Pidio precios para un programa funcional de 3 meses para cohortes de liderazgo.',
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(18),
  },
  {
    id: 'lead-ruta-form-01',
    businessId: 'biz-cafe-ruta-12',
    name: 'Samuel Mateo',
    source: 'CONTACT_CLICK',
    status: 'CONTACTED',
    summary: 'Solicito bandejas recurrentes de desayuno para sesiones de planificacion de los martes.',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(21),
  },
  {
    id: 'lead-cocina-promo-01',
    businessId: 'biz-cocina-central',
    name: 'Giselle Ramirez',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Pregunto si el precio de lanzamiento puede cubrir bandejas vegetarianas y altas en proteina.',
    createdAt: hoursAgo(22),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'lead-cocina-profile-02',
    businessId: 'biz-cocina-central',
    name: 'Orlando Veloz',
    source: 'CONTACT_CLICK',
    status: 'CONTACTED',
    summary: 'Necesita entrega semanal de almuerzo para una oficina legal con asistencia rotativa.',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(16),
  },
  {
    id: 'lead-cocina-whatsapp-03',
    businessId: 'biz-cocina-central',
    name: 'Lorena Taveras',
    source: 'WHATSAPP_CLICK',
    status: 'CLOSED',
    summary: 'Cerro un piloto recurrente de almuerzos por 4 semanas tras una sesion de degustacion exitosa.',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    id: 'lead-verde-promo-01',
    businessId: 'biz-verde-rapido',
    name: 'Paola Nunez',
    source: 'PROMOTION_CLICK',
    status: 'NEW',
    summary: 'Interesada en alternativas de despensa enfocadas en salud para el equipo de una agencia boutique.',
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
    comment: 'La entrega fue rapida y el combo de despensa fue exactamente lo que nuestra oficina necesitaba.',
    createdAt: daysAgo(10),
  },
  {
    id: 'review-casa-paola',
    userKey: 'customerPaola',
    businessId: 'biz-casa-norte',
    rating: 4,
    comment: 'Confiable para pedidos recurrentes de snacks, aunque los cambios deberian avisarse con mas anticipacion.',
    createdAt: daysAgo(7),
  },
  {
    id: 'review-sabor-eduardo',
    userKey: 'customerEduardo',
    businessId: 'biz-sabor-urbano',
    rating: 5,
    comment: 'El combo ejecutivo llego caliente y los tamanos de las porciones fueron consistentes.',
    createdAt: daysAgo(8),
  },
  {
    id: 'review-sabor-mariela',
    userKey: 'customerMariela',
    businessId: 'biz-sabor-urbano',
    rating: 3,
    comment: 'Buen sabor, pero una entrega se retraso durante una hora pico de almuerzo.',
    createdAt: daysAgo(4),
  },
  {
    id: 'review-fit-valeria',
    userKey: 'customerValeria',
    businessId: 'biz-barrio-fit',
    rating: 5,
    comment: 'La evaluacion y el seguimiento fueron muy estructurados, no solo una clase de prueba generica.',
    createdAt: daysAgo(6),
  },
  {
    id: 'review-fit-rafael',
    userKey: 'customerRafael',
    businessId: 'biz-barrio-fit',
    rating: 4,
    comment: 'Buena calidad de entrenamiento e instrucciones claras para quienes asistian por primera vez.',
    createdAt: daysAgo(12),
  },
  {
    id: 'review-ruta-ana',
    userKey: 'customerAna',
    businessId: 'biz-cafe-ruta-12',
    rating: 5,
    comment: 'Las bandejas de desayuno llegaron impecables y a tiempo para nuestra reunion con clientes.',
    createdAt: daysAgo(5),
  },
  {
    id: 'review-ruta-paola',
    userKey: 'customerPaola',
    businessId: 'biz-cafe-ruta-12',
    rating: 4,
    comment: 'Muy buen programa de cafe, aunque me gustaria una opcion adicional de pasteleria en el combo.',
    createdAt: daysAgo(3),
  },
  {
    id: 'review-aura-mariela',
    userKey: 'customerMariela',
    businessId: 'biz-estudio-aura',
    rating: 5,
    comment: 'La entrega de impresion fue rapida y las sugerencias de marca fueron practicas.',
    createdAt: daysAgo(11),
  },
  {
    id: 'review-cocina-eduardo',
    userKey: 'customerEduardo',
    businessId: 'biz-cocina-central',
    rating: 5,
    comment: 'La entrega recurrente de almuerzos simplifico la operacion de nuestro equipo y el menu se mantuvo variado.',
    createdAt: daysAgo(9),
  },
  {
    id: 'review-cocina-valeria',
    userKey: 'customerValeria',
    businessId: 'biz-cocina-central',
    rating: 4,
    comment: 'Buena calidad y montaje, pero una bandeja vegetariana estuvo poco sazonada.',
    createdAt: daysAgo(2),
  },
  {
    id: 'review-verde-paola',
    userKey: 'customerPaola',
    businessId: 'biz-verde-rapido',
    rating: 4,
    comment: 'Productos frescos y un catalogo enfocado que funciona bien para snacks saludables de oficina.',
    createdAt: daysAgo(1),
  },
];

const auditLogs: SeedAuditLog[] = [
  {
    id: 'audit-user-role-laura',
    actorKey: 'superadminLuis',
    targetKey: 'adminLaura',
    action: 'USER_PLATFORM_ROLE_UPDATED',
    metadata: { fromRole: 'USER', toRole: 'ADMIN', reason: 'Cobertura operativa de la plataforma' },
    createdAt: daysAgo(40),
  },
  {
    id: 'audit-user-profile-mateo',
    actorKey: 'superadminLuis',
    targetKey: 'ownerMateo',
    action: 'USER_PROFILE_UPDATED',
    metadata: { fields: ['telefono', 'avatarUrl'] },
    createdAt: daysAgo(18),
  },
  {
    id: 'audit-base-role-valentina',
    actorKey: 'globalCamila',
    targetKey: 'ownerValentina',
    action: 'USER_BASE_ROLE_UPDATED',
    metadata: { fromRole: 'SIN_ASIGNAR', toRole: 'USER' },
    createdAt: daysAgo(26),
  },
  {
    id: 'audit-status-rafael',
    actorKey: 'superadminLuis',
    targetKey: 'customerRafael',
    action: 'USER_STATUS_UPDATED',
    metadata: { fromActive: true, toActive: false, reason: 'Cuenta de prueba inactiva conservada para cubrir historial' },
    createdAt: daysAgo(5),
  },
  {
    id: 'audit-assign-carlos-casa',
    actorKey: 'ownerSofia',
    targetKey: 'managerCarlos',
    businessId: 'biz-casa-norte',
    action: 'USER_BUSINESS_ROLE_ASSIGNED',
    metadata: { role: 'GERENTE' },
    createdAt: daysAgo(33),
  },
  {
    id: 'audit-assign-elena-cocina',
    actorKey: 'ownerLucia',
    targetKey: 'managerElena',
    businessId: 'biz-cocina-central',
    action: 'USER_BUSINESS_ROLE_ASSIGNED',
    metadata: { role: 'GERENTE' },
    createdAt: daysAgo(29),
  },
  {
    id: 'audit-remove-diego-colonial',
    actorKey: 'ownerMateo',
    targetKey: 'managerDiego',
    businessId: 'biz-mercado-colonial',
    action: 'USER_BUSINESS_ROLE_REMOVED',
    metadata: { role: 'GERENTE', reason: 'Rotacion de personal antes de la aprobacion' },
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
      reason: 'Consolidacion del portafolio de Ruta 12',
    },
    createdAt: daysAgo(21),
  },
  {
    id: 'audit-assign-mariana-fit',
    actorKey: 'globalCamila',
    targetKey: 'managerMariana',
    businessId: 'biz-barrio-fit',
    action: 'USER_BUSINESS_ROLE_ASSIGNED',
    metadata: { role: 'GERENTE', reason: 'Apoyo de apertura para estudio premium plus' },
    createdAt: daysAgo(14),
  },
];

function mergeUserMaps(...maps: Array<Record<string, string>>) {
  return Object.assign({}, ...maps);
}

function requireUserId(userIdsByKey: Record<string, string>, userKey: string) {
  const userId = userIdsByKey[userKey];
  if (!userId) {
    throw new Error(`Falta el mapeo del usuario sembrado para ${userKey}.`);
  }

  return userId;
}

function assertBusinessRelationships() {
  const knownUserKeys = new Set(allSeedUsers.map((user) => user.key));

  for (const business of businesses) {
    if (!knownUserKeys.has(business.ownerKey)) {
      throw new Error(`El negocio ${business.id} referencia un propietario desconocido ${business.ownerKey}.`);
    }

    const managerSet = new Set<string>();
    for (const managerKey of business.managerKeys) {
      if (!knownUserKeys.has(managerKey)) {
        throw new Error(`El negocio ${business.id} referencia un gerente desconocido ${managerKey}.`);
      }

      if (managerKey === business.ownerKey) {
        throw new Error(`El negocio ${business.id} no puede asignar al propietario como gerente.`);
      }

      if (managerSet.has(managerKey)) {
        throw new Error(`El negocio ${business.id} repite al gerente ${managerKey}.`);
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
    { entidad: 'usuarios', sembrados: seededCounts.users, total: totalUsers },
    { entidad: 'identidadesDeUsuario', sembrados: seededCounts.identities, total: totalIdentities },
    { entidad: 'negocios', sembrados: seededCounts.businesses, total: totalBusinesses },
    { entidad: 'rolesUsuarioNegocio', sembrados: seededCounts.userBusinessRoles, total: totalRoles },
    { entidad: 'gerentesDeNegocio', sembrados: seededCounts.businessManagers, total: totalManagers },
    { entidad: 'productos', sembrados: seededCounts.products, total: totalProducts },
    { entidad: 'promociones', sembrados: seededCounts.promotions, total: totalPromotions },
    { entidad: 'leads', sembrados: seededCounts.leads, total: totalLeads },
    { entidad: 'resenas', sembrados: seededCounts.reviews, total: totalReviews },
    { entidad: 'registrosDeAuditoria', sembrados: seededCounts.auditLogs, total: totalAuditLogs },
  ]);

  console.log('Distribucion por estado de negocio:', {
    APROBADOS: businesses.filter((business) => business.status === 'APPROVED').length,
    PENDIENTES: businesses.filter((business) => business.status === 'PENDING').length,
  });

  console.log('Distribucion por estado de promocion:', {
    ACTIVAS: promotions.filter((promotion) => promotion.status === 'ACTIVE').length,
    BORRADOR: promotions.filter((promotion) => promotion.status === 'DRAFT').length,
    VENCIDAS: promotions.filter((promotion) => promotion.status === 'EXPIRED').length,
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