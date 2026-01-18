import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'List/search products' })
    @ApiQuery({ name: 'category', required: false, enum: ['supplements', 'equipment', 'apparel', 'accessories'] })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'minPrice', required: false })
    @ApiQuery({ name: 'maxPrice', required: false })
    @ApiQuery({ name: 'inStock', required: false })
    @ApiQuery({ name: 'sortBy', required: false })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Products list returned' })
    async findAll(@Query() query: any) {
        return this.productsService.findAll(query);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Get product categories' })
    @ApiResponse({ status: 200, description: 'Categories list returned' })
    async getCategories() {
        return this.productsService.getCategories();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product details' })
    @ApiResponse({ status: 200, description: 'Product details returned' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new product (Admin only)' })
    @ApiResponse({ status: 201, description: 'Product created' })
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a product (Admin only)' })
    @ApiResponse({ status: 200, description: 'Product updated' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a product (Admin only)' })
    @ApiResponse({ status: 200, description: 'Product deleted' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async delete(@Param('id') id: string) {
        await this.productsService.delete(id);
        return { message: 'Product deleted successfully' };
    }

    @Post(':id/review')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a review to a product' })
    @ApiResponse({ status: 200, description: 'Review added' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async addReview(
        @Param('id') id: string,
        @Body() body: { rating: number; review: string },
        @Request() req,
    ) {
        return this.productsService.addReview(id, req.user.userId, body.rating, body.review);
    }
}
