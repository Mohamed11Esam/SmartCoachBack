import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const product = new this.productModel(createProductDto);
        return product.save();
    }

    async findAll(query: any = {}): Promise<Product[]> {
        const filter: any = { isActive: true };

        if (query.category) {
            filter.category = query.category;
        }

        if (query.search) {
            filter.$text = { $search: query.search };
        }

        if (query.minPrice || query.maxPrice) {
            filter.price = {};
            if (query.minPrice) filter.price.$gte = Number(query.minPrice);
            if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
        }

        if (query.inStock === 'true') {
            filter.stock = { $gt: 0 };
        }

        let queryBuilder = this.productModel.find(filter);

        // Sorting
        if (query.sortBy) {
            const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
            queryBuilder = queryBuilder.sort({ [query.sortBy]: sortOrder });
        } else {
            queryBuilder = queryBuilder.sort({ createdAt: -1 });
        }

        // Pagination
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        queryBuilder = queryBuilder.skip((page - 1) * limit).limit(limit);

        return queryBuilder.exec();
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async delete(id: string): Promise<void> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Product not found');
        }
    }

    async getCategories(): Promise<string[]> {
        return ['supplements', 'equipment', 'apparel', 'accessories'];
    }

    async addReview(productId: string, userId: string, rating: number, review: string): Promise<Product> {
        const product = await this.productModel.findById(productId).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Add review
        product.ratings.push({
            userId: userId as any,
            rating,
            review,
            createdAt: new Date(),
        });

        // Recalculate average rating
        const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
        product.averageRating = totalRating / product.ratings.length;
        product.reviewCount = product.ratings.length;

        return product.save();
    }

    async updateStock(productId: string, quantity: number): Promise<Product> {
        const product = await this.productModel.findById(productId).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        product.stock += quantity;
        if (product.stock < 0) product.stock = 0;

        return product.save();
    }
}
