import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Delete,
  Patch,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { TransactionsService } from './transactions.service';

/** Optional body for the bulk-sync trigger endpoint. */
class TriggerSyncDto {
  userId?: string;
  since?: string;
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Creates a new transaction
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    const transaction = await this.transactionsService.create(createTransactionDto);
    return {
      success: true,
      data: transaction,
    };
  }

  /**
   * Retrieves paginated list of transactions.
   * Supports filtering by userId, category, assetCode, transactionType, and date range.
   */
  @Get()
  async findAll(@Query() query: QueryTransactionsDto) {
    const result = await this.transactionsService.findAllPaginated(
      query.page,
      query.limit,
      query.sortOrder,
      {
        userId: query.userId,
        category: query.category,
        assetCode: query.assetCode,
        transactionType: query.transactionType,
        startDate: query.startDate,
        endDate: query.endDate,
      },
    );

    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * Retrieves a single transaction by ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const transaction = await this.transactionsService.findById(id);
    return {
      success: true,
      data: transaction,
    };
  }

  /**
   * Updates a transaction
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateTransactionDto>,
  ) {
    const transaction = await this.transactionsService.update(id, updateData);
    return {
      success: true,
      data: transaction,
    };
  }

  /**
   * Deletes a transaction
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.transactionsService.delete(id);
  }

  /**
   * Enqueue a background bulk-sync job.
   * The job is processed asynchronously by AnalyticsProcessor; this endpoint
   * returns the BullMQ job ID immediately so the caller can track progress.
   */
  @Post('sync')
  @HttpCode(202)
  async triggerSync(@Body() body: TriggerSyncDto = {}) {
    const { userId, since } = body;
    return this.transactionsService.triggerBulkSync(userId, since);
  }
}
