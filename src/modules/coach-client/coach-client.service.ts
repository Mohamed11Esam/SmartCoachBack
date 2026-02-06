import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientRequest, ClientRequestDocument } from './schemas/client-request.schema';
import { CoachClient, CoachClientDocument } from './schemas/coach-client.schema';
import { CreateClientRequestDto, RespondToRequestDto, UpdateClientDto } from './dto/create-client-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CoachClientService {
    constructor(
        @InjectModel(ClientRequest.name) private clientRequestModel: Model<ClientRequestDocument>,
        @InjectModel(CoachClient.name) private coachClientModel: Model<CoachClientDocument>,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    // ── Client Actions ──

    async sendRequest(clientId: string, dto: CreateClientRequestDto): Promise<ClientRequestDocument> {
        // Check if already has pending request
        const existing = await this.clientRequestModel.findOne({
            clientId,
            coachId: dto.coachId,
            status: 'pending',
        });

        if (existing) {
            throw new BadRequestException('You already have a pending request with this coach');
        }

        // Check if already a client
        const existingRelation = await this.coachClientModel.findOne({
            clientId,
            coachId: dto.coachId,
            isActive: true,
        });

        if (existingRelation) {
            throw new BadRequestException('You are already a client of this coach');
        }

        const request = new this.clientRequestModel({
            clientId,
            coachId: dto.coachId,
            message: dto.message,
            trainingType: dto.trainingType || 'online',
            status: 'pending',
        });

        const savedRequest = await request.save();

        // Notify coach about new client request
        try {
            const client = await this.usersService.findById(clientId);
            if (client) {
                const clientName = `${client.firstName} ${client.lastName}`;
                await this.notificationsService.notifyClientRequest(
                    dto.coachId,
                    clientName,
                    savedRequest._id.toString(),
                );
            }
        } catch (error) {
            console.error('Failed to send client request notification:', error);
        }

        return savedRequest;
    }

    async cancelRequest(clientId: string, requestId: string): Promise<ClientRequestDocument> {
        const request = await this.clientRequestModel.findById(requestId);

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.clientId.toString() !== clientId) {
            throw new ForbiddenException('You can only cancel your own requests');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException('Can only cancel pending requests');
        }

        request.status = 'canceled';
        return request.save();
    }

    async getMyRequests(clientId: string): Promise<ClientRequestDocument[]> {
        return this.clientRequestModel
            .find({ clientId })
            .populate('coachId', 'firstName lastName email photoUrl')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getMyCoach(clientId: string): Promise<CoachClientDocument | null> {
        return this.coachClientModel
            .findOne({ clientId, isActive: true })
            .populate('coachId', 'firstName lastName email photoUrl')
            .exec();
    }

    // ── Coach Actions ──

    async getPendingRequests(coachId: string): Promise<ClientRequestDocument[]> {
        return this.clientRequestModel
            .find({ coachId, status: 'pending' })
            .populate('clientId', 'firstName lastName email photoUrl fitnessLevel fitnessGoal')
            .sort({ createdAt: -1 })
            .exec();
    }

    async respondToRequest(
        coachId: string,
        requestId: string,
        dto: RespondToRequestDto,
    ): Promise<ClientRequestDocument> {
        const request = await this.clientRequestModel.findById(requestId);

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.coachId.toString() !== coachId) {
            throw new ForbiddenException('You can only respond to your own requests');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException('Request has already been processed');
        }

        request.status = dto.status;
        request.respondedAt = new Date();

        if (dto.status === 'rejected') {
            request.rejectionReason = dto.rejectionReason;
        }

        await request.save();

        // If accepted, create coach-client relationship
        if (dto.status === 'accepted') {
            await this.coachClientModel.create({
                clientId: request.clientId,
                coachId: request.coachId,
                trainingType: request.trainingType,
                isActive: true,
                startDate: new Date(),
                progressPercentage: 0,
            });
        }

        // Notify client about response
        try {
            const coach = await this.usersService.findById(coachId);
            if (coach) {
                const coachName = `${coach.firstName} ${coach.lastName}`;
                if (dto.status === 'accepted') {
                    await this.notificationsService.notifyRequestAccepted(
                        request.clientId.toString(),
                        coachName,
                    );
                } else if (dto.status === 'rejected') {
                    await this.notificationsService.notifyRequestRejected(
                        request.clientId.toString(),
                        coachName,
                        dto.rejectionReason,
                    );
                }
            }
        } catch (error) {
            console.error('Failed to send request response notification:', error);
        }

        return request;
    }

    async getMyClients(coachId: string, activeOnly = true): Promise<CoachClientDocument[]> {
        const query: any = { coachId };
        if (activeOnly) {
            query.isActive = true;
        }

        return this.coachClientModel
            .find(query)
            .populate('clientId', 'firstName lastName email photoUrl fitnessLevel fitnessGoal weight height')
            .sort({ lastActivityAt: -1 })
            .exec();
    }

    async getClientDetails(coachId: string, clientId: string): Promise<CoachClientDocument> {
        const relation = await this.coachClientModel
            .findOne({ coachId, clientId })
            .populate('clientId', 'firstName lastName email photoUrl fitnessLevel fitnessGoal weight height healthConditions')
            .exec();

        if (!relation) {
            throw new NotFoundException('Client not found');
        }

        return relation;
    }

    async updateClient(
        coachId: string,
        clientId: string,
        dto: UpdateClientDto,
    ): Promise<CoachClientDocument> {
        const relation = await this.coachClientModel.findOne({ coachId, clientId });

        if (!relation) {
            throw new NotFoundException('Client not found');
        }

        if (dto.notes !== undefined) relation.notes = dto.notes;
        if (dto.progressPercentage !== undefined) relation.progressPercentage = dto.progressPercentage;
        relation.lastActivityAt = new Date();

        return relation.save();
    }

    async removeClient(coachId: string, clientId: string): Promise<CoachClientDocument> {
        const relation = await this.coachClientModel.findOne({ coachId, clientId });

        if (!relation) {
            throw new NotFoundException('Client not found');
        }

        relation.isActive = false;
        relation.endDate = new Date();

        return relation.save();
    }

    // ── Statistics ──

    async getCoachStats(coachId: string) {
        const totalClients = await this.coachClientModel.countDocuments({ coachId, isActive: true });
        const pendingRequests = await this.clientRequestModel.countDocuments({ coachId, status: 'pending' });

        // Get activity in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeClientsThisWeek = await this.coachClientModel.countDocuments({
            coachId,
            isActive: true,
            lastActivityAt: { $gte: sevenDaysAgo },
        });

        const activityPercentage = totalClients > 0
            ? Math.round((activeClientsThisWeek / totalClients) * 100)
            : 0;

        // Average progress
        const clients = await this.coachClientModel.find({ coachId, isActive: true });
        const avgProgress = clients.length > 0
            ? Math.round(clients.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / clients.length)
            : 0;

        return {
            totalClients,
            pendingRequests,
            activeClientsThisWeek,
            activityPercentage,
            averageProgress: avgProgress,
        };
    }
}
