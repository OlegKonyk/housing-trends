import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    @InjectQueue('data-sync') private dataSyncQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async triggerSync(source?: string) {
    this.logger.log(`Triggering data sync for source: ${source || 'all'}`);
    
    const job = await this.dataSyncQueue.add('sync', {
      source: source || 'all',
      timestamp: new Date().toISOString(),
    });

    return {
      jobId: job.id,
      status: 'queued',
      message: `Data sync job queued for ${source || 'all sources'}`,
    };
  }

  async getSyncStatus() {
    const [active, waiting, completed, failed] = await Promise.all([
      this.dataSyncQueue.getActiveCount(),
      this.dataSyncQueue.getWaitingCount(),
      this.dataSyncQueue.getCompletedCount(),
      this.dataSyncQueue.getFailedCount(),
    ]);

    const recentLogs = await this.prisma.dataSyncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return {
      queue: {
        active,
        waiting,
        completed,
        failed,
      },
      recentSyncs: recentLogs,
    };
  }
}
