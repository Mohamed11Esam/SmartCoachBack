export interface BaseRepositoryInterface<T> {
    create(dto: T | any): Promise<T>;
    findOneById(id: string): Promise<T>;
    findOneByCondition(condition: any): Promise<T | null>;
    findAll(): Promise<T[]>;
    update(id: string, dto: any): Promise<T>;
    softDelete(id: string): Promise<boolean>;
    permanentlyDelete(id: string): Promise<boolean>;
}
