import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { BaseRepositoryInterface } from '../interfaces/base.repository.interface';
import { NotFoundException } from '@nestjs/common';

export abstract class BaseAbstractRepository<T extends Document>
    implements BaseRepositoryInterface<T> {
    constructor(private readonly model: Model<T>) { }

    async create(dto: any): Promise<T> {
        const createdItem = new this.model(dto as any);
        return createdItem.save();
    }

    async findOneById(id: string): Promise<T> {
        const item = await this.model.findById(id).exec();
        if (!item) {
            throw new NotFoundException(`Item with id ${id} not found`);
        }
        return item;
    }

    async findOneByCondition(condition: FilterQuery<T>): Promise<T | null> {
        return this.model.findOne(condition).exec();
    }

    async findAll(): Promise<T[]> {
        return this.model.find().exec();
    }

    async update(id: string, dto: UpdateQuery<T>): Promise<T> {
        const item = await this.model
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();
        if (!item) {
            throw new NotFoundException(`Item with id ${id} not found`);
        }
        return item;
    }

    async softDelete(id: string): Promise<boolean> {
        const deleteItem = await this.model
            .findByIdAndUpdate(id, { deleted_at: new Date() })
            .exec();
        if (!deleteItem) {
            throw new NotFoundException(`Item with id ${id} not found`);
        }
        return true;
    }

    async permanentlyDelete(id: string): Promise<boolean> {
        const deleteItem = await this.model.findByIdAndDelete(id).exec();
        if (!deleteItem) {
            throw new NotFoundException(`Item with id ${id} not found`);
        }
        return true;
    }
}
