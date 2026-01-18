export interface BaseFactoryInterface<T> {
    create(dto: any): T;
}
