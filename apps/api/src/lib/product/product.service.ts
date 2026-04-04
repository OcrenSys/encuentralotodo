import { TRPCError } from '@trpc/server';
import type {
    CreateProductInput,
    DeleteProductInput,
    GetProductByIdInput,
    ImportManagedProductDraft,
    ImportManagedProductsInput,
    ListManagedProductsInput,
    ManagedProductListItem,
    ManagementListResult,
    ProductType,
    UpdateProductInput,
    UserProfile,
} from 'types';

import { canManageBusiness } from '../business/business-access';
import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import { mapProduct } from './product.mappers';
import type {
    ProductRepositoryPort,
    RepositoryProductWithBusinessRecord,
} from './product.repository';

interface ProductServiceDependencies {
    repository: ProductRepositoryPort;
    businessRepository: BusinessRepositoryPort;
    currentUser: UserProfile | null;
}

function escapeCsvCell(value: string | number | boolean | null | undefined) {
    const normalizedValue = value == null ? '' : String(value);
    return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function toCsvDate(value: Date) {
    return value.toISOString();
}

function buildImportValidationMessage(rowNumber: number, message: string) {
    return `Fila ${rowNumber}: ${message}`;
}

function normalizeConfigurationSummary(value: string | null | undefined) {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : undefined;
}

export class ProductService {
    private readonly repository: ProductRepositoryPort;
    private readonly businessRepository: BusinessRepositoryPort;
    private readonly currentUser: UserProfile | null;

    constructor({ repository, businessRepository, currentUser }: ProductServiceDependencies) {
        this.repository = repository;
        this.businessRepository = businessRepository;
        this.currentUser = currentUser;
    }

    async listByBusiness(businessId: string) {
        const business = await this.businessRepository.findBusinessAccessById(businessId);
        if (!business) {
            return [];
        }

        const products = await this.repository.listByBusiness(businessId);
        return this.applyVisibility(products.map(mapProduct), business.subscriptionType);
    }

    async listManaged(input: ListManagedProductsInput): Promise<ManagementListResult<ManagedProductListItem>> {
        const currentUser = this.currentUser;
        if (!currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        const includeAllBusinesses = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN' || currentUser.role === 'GLOBALADMIN';
        const result = await this.repository.listManaged(input, currentUser.id, includeAllBusinesses);

        return {
            items: result.items.map((product) => ({
                ...mapProduct(product),
                businessName: product.business.name,
                businessStatus: product.business.status,
            })),
            page: input.page,
            pageSize: input.pageSize,
            total: result.total,
            totalPages: Math.max(1, Math.ceil(result.total / input.pageSize)),
        };
    }

    async exportManagedCsv(input: ListManagedProductsInput) {
        const currentUser = this.currentUser;
        if (!currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        const includeAllBusinesses = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN' || currentUser.role === 'GLOBALADMIN';
        const products = await this.repository.listManagedForExport(input, currentUser.id, includeAllBusinesses);
        const header = [
            'id',
            'businessId',
            'businessName',
            'businessStatus',
            'name',
            'description',
            'price',
            'isFeatured',
            'image1',
            'image2',
            'image3',
            'lastUpdated',
            'createdAt',
        ];
        const rows = products.map((product) => [
            product.id,
            product.businessId,
            product.business.name,
            product.business.status,
            product.name,
            product.description,
            product.price ?? '',
            product.isFeatured,
            product.images[0] ?? '',
            product.images[1] ?? '',
            product.images[2] ?? '',
            toCsvDate(product.lastUpdated),
            toCsvDate(product.createdAt),
        ]);
        const content = [header, ...rows]
            .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
            .join('\n');
        const fileSuffix = new Date().toISOString().slice(0, 10);

        return {
            content,
            fileName: `catalogo-productos-${fileSuffix}.csv`,
            mimeType: 'text/csv;charset=utf-8;',
        };
    }

    async previewManagedImport(input: ImportManagedProductsInput) {
        const validation = await this.validateManagedImport(input);

        return {
            businessCount: validation.businessCount,
            errors: validation.errors,
            totalItems: input.items.length,
            valid: validation.errors.length === 0,
        };
    }

    async importManaged(input: ImportManagedProductsInput) {
        const validation = await this.validateManagedImport(input);

        if (validation.errors.length > 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: validation.errors.join(' | '),
            });
        }

        const createdProducts = await this.repository.createMany(
            input.items.map((item) => this.toCreateProductInput(item.product, input.businessId)),
        );

        return {
            importedCount: createdProducts.length,
        };
    }

    async getById(input: GetProductByIdInput) {
        const product = await this.repository.findById(input.productId);
        return product ? mapProduct(product) : null;
    }

    async create(input: CreateProductInput) {
        const business = await this.requireBusinessAccess(input.businessId);
        this.ensureBusinessCanBeManaged(business);
        await this.ensureFeaturedRulesForCreate(business, input.isFeatured);

        this.assertValidProductShape(input.type, input.configurationSummary, input.price);

        const product = await this.repository.create({
            ...input,
            configurationSummary: input.type === 'configurable'
                ? normalizeConfigurationSummary(input.configurationSummary)
                : undefined,
            price: input.type === 'configurable' ? undefined : input.price,
        });
        return mapProduct(product);
    }

    async update(input: UpdateProductInput) {
        const product = await this.requireProductWithAccess(input.productId);
        this.ensureBusinessCanBeManaged(product.business);

        const nextIsFeatured = input.isFeatured ?? product.isFeatured;
        await this.ensureFeaturedRulesForUpdate(product, nextIsFeatured);

        const nextType = input.type ?? product.type;
        const nextConfigurationSummary = input.configurationSummary === undefined
            ? product.configurationSummary ?? undefined
            : normalizeConfigurationSummary(input.configurationSummary);
        const nextPrice = input.price === undefined
            ? product.price ?? undefined
            : input.price ?? undefined;

        this.assertValidProductShape(nextType, nextConfigurationSummary, nextPrice);

        const updatedProduct = await this.repository.update(input.productId, {
            name: input.name,
            description: input.description,
            images: input.images,
            type: nextType,
            configurationSummary: nextType === 'configurable'
                ? nextConfigurationSummary ?? null
                : null,
            price: nextType === 'configurable' ? null : nextPrice ?? null,
            isFeatured: input.isFeatured,
        });

        if (!updatedProduct) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
        }

        return mapProduct(updatedProduct);
    }

    async delete(input: DeleteProductInput) {
        const product = await this.requireProductWithAccess(input.productId);
        this.ensureBusinessCanBeManaged(product.business);

        const deletedProduct = await this.repository.delete(input.productId);
        if (!deletedProduct) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
        }

        return mapProduct(deletedProduct);
    }

    private async requireBusinessAccess(businessId: string) {
        const business = await this.businessRepository.findBusinessAccessById(businessId);
        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        return business;
    }

    private async validateManagedImport(input: ImportManagedProductsInput) {
        const currentUser = this.currentUser;
        if (!currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        const errors: string[] = [];
        const business = await this.businessRepository.findBusinessAccessById(input.businessId);

        if (!business) {
            input.items.forEach((row) => {
                errors.push(buildImportValidationMessage(row.rowNumber, 'El negocio seleccionado no existe.'));
            });

            return {
                businessCount: 0,
                errors,
            };
        }

        if (!canManageBusiness(currentUser, { ownerId: business.ownerId, managers: business.managers })) {
            input.items.forEach((row) => {
                errors.push(buildImportValidationMessage(row.rowNumber, 'No tienes acceso para importar productos en este negocio.'));
            });

            return {
                businessCount: 0,
                errors,
            };
        }

        let featuredCount = await this.repository.countFeaturedByBusiness(input.businessId);

        for (const item of input.items) {
            if (business.subscriptionType === 'FREE_TRIAL' && !item.product.isFeatured) {
                errors.push(buildImportValidationMessage(item.rowNumber, 'FREE_TRIAL solo permite productos destacados.'));
                continue;
            }

            if (business.subscriptionType === 'FREE_TRIAL' && item.product.isFeatured) {
                featuredCount += 1;

                if (featuredCount > 5) {
                    errors.push(buildImportValidationMessage(item.rowNumber, 'FREE_TRIAL permite un máximo de 5 productos destacados.'));
                }
            }
        }

        return {
            businessCount: 1,
            errors,
        };
    }

    private toCreateProductInput(product: ImportManagedProductDraft, businessId: string): CreateProductInput {
        return {
            businessId,
            description: product.description,
            images: product.images,
            isFeatured: product.isFeatured,
            name: product.name,
            price: product.price,
            type: 'simple',
        };
    }

    private assertValidProductShape(type: ProductType, configurationSummary: string | undefined, price: number | undefined) {
        if (type === 'configurable') {
            if (!configurationSummary) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Los productos configurables requieren un resumen breve visible en catálogo.',
                });
            }

            if (price !== undefined) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Los productos configurables no usan un precio fijo todavía.',
                });
            }
        }
    }

    private async requireProductWithAccess(productId: string) {
        const product = await this.repository.findByIdWithBusiness(productId);
        if (!product) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
        }

        return product;
    }

    private ensureBusinessCanBeManaged(business: Pick<RepositoryBusinessAccessRecord, 'ownerId' | 'managers'> | RepositoryProductWithBusinessRecord['business']) {
        if (!this.currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        if (!canManageBusiness(this.currentUser, { ownerId: business.ownerId, managers: business.managers.map((manager) => typeof manager === 'string' ? manager : manager.userId) })) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Business access required.' });
        }
    }

    private async ensureFeaturedRulesForCreate(business: RepositoryBusinessAccessRecord, isFeatured: boolean) {
        if (business.subscriptionType === 'FREE_TRIAL' && !isFeatured) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'FREE_TRIAL solo permite productos destacados.' });
        }

        if (business.subscriptionType === 'FREE_TRIAL' && isFeatured) {
            const featuredCount = await this.repository.countFeaturedByBusiness(business.id);
            if (featuredCount >= 5) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'FREE_TRIAL permite un máximo de 5 productos destacados.' });
            }
        }
    }

    private async ensureFeaturedRulesForUpdate(product: RepositoryProductWithBusinessRecord, nextIsFeatured: boolean) {
        if (product.business.subscriptionType === 'FREE_TRIAL' && !nextIsFeatured) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'FREE_TRIAL solo permite productos destacados.' });
        }

        if (product.business.subscriptionType === 'FREE_TRIAL' && nextIsFeatured && !product.isFeatured) {
            const featuredCount = await this.repository.countFeaturedByBusiness(product.businessId);
            if (featuredCount >= 5) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'FREE_TRIAL permite un máximo de 5 productos destacados.' });
            }
        }
    }

    private applyVisibility<T extends { isFeatured: boolean }>(products: T[], subscriptionType: RepositoryBusinessAccessRecord['subscriptionType']) {
        if (subscriptionType === 'FREE_TRIAL') {
            return products.filter((product) => product.isFeatured).slice(0, 5);
        }

        if (subscriptionType === 'PREMIUM') {
            return products.slice(0, 12);
        }

        return products;
    }
}