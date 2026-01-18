import { IsString, IsNotEmpty } from 'class-validator';

export class DeviceTokenDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}
