import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Request,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoachClientService } from './coach-client.service';
import {
    CreateClientRequestDto,
    RespondToRequestDto,
    UpdateClientDto,
} from './dto/create-client-request.dto';

@ApiTags('Coach-Client')
@Controller('coach-client')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CoachClientController {
    constructor(private readonly coachClientService: CoachClientService) {}

    // ══════════════════════════════════════════════════════════════════════════════
    // CLIENT ENDPOINTS (for customers)
    // ══════════════════════════════════════════════════════════════════════════════

    @Post('request')
    @ApiOperation({ summary: 'Send a coaching request to a coach (Customer)' })
    async sendRequest(@Request() req, @Body() dto: CreateClientRequestDto) {
        return this.coachClientService.sendRequest(req.user.userId, dto);
    }

    @Delete('request/:requestId')
    @ApiOperation({ summary: 'Cancel a pending request (Customer)' })
    async cancelRequest(@Request() req, @Param('requestId') requestId: string) {
        return this.coachClientService.cancelRequest(req.user.userId, requestId);
    }

    @Get('my-requests')
    @ApiOperation({ summary: 'Get all my coaching requests (Customer)' })
    async getMyRequests(@Request() req) {
        return this.coachClientService.getMyRequests(req.user.userId);
    }

    @Get('my-coach')
    @ApiOperation({ summary: 'Get my current coach (Customer)' })
    async getMyCoach(@Request() req) {
        return this.coachClientService.getMyCoach(req.user.userId);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // COACH ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════════

    @Get('pending-requests')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get pending client requests (Coach)' })
    async getPendingRequests(@Request() req) {
        return this.coachClientService.getPendingRequests(req.user.userId);
    }

    @Put('request/:requestId/respond')
    @Roles('Coach')
    @ApiOperation({ summary: 'Accept or reject a client request (Coach)' })
    async respondToRequest(
        @Request() req,
        @Param('requestId') requestId: string,
        @Body() dto: RespondToRequestDto,
    ) {
        return this.coachClientService.respondToRequest(req.user.userId, requestId, dto);
    }

    @Get('my-clients')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get all my clients (Coach)' })
    async getMyClients(
        @Request() req,
        @Query('activeOnly') activeOnly?: string,
    ) {
        const active = activeOnly !== 'false';
        return this.coachClientService.getMyClients(req.user.userId, active);
    }

    @Get('client/:clientId')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get client details (Coach)' })
    async getClientDetails(
        @Request() req,
        @Param('clientId') clientId: string,
    ) {
        return this.coachClientService.getClientDetails(req.user.userId, clientId);
    }

    @Put('client/:clientId')
    @Roles('Coach')
    @ApiOperation({ summary: 'Update client notes/progress (Coach)' })
    async updateClient(
        @Request() req,
        @Param('clientId') clientId: string,
        @Body() dto: UpdateClientDto,
    ) {
        return this.coachClientService.updateClient(req.user.userId, clientId, dto);
    }

    @Delete('client/:clientId')
    @Roles('Coach')
    @ApiOperation({ summary: 'Remove a client (Coach)' })
    async removeClient(
        @Request() req,
        @Param('clientId') clientId: string,
    ) {
        return this.coachClientService.removeClient(req.user.userId, clientId);
    }

    @Get('stats')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get coach dashboard statistics (Coach)' })
    async getCoachStats(@Request() req) {
        return this.coachClientService.getCoachStats(req.user.userId);
    }
}
