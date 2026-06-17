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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { TriggerSyncDto } from './dto/trigger-sync.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or validation error' })
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    const transaction = await this.transactionsService.create(createTransactionDto);
    return {
      success: true,
      data: transaction,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 400, description: 'Invalid transaction ID format' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const transaction = await this.transactionsService.findById(id);
    return {
      success: true,
      data: transaction,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID', format: 'uuid' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or transaction ID' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction ID format' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.transactionsService.delete(id);
  }

  @Post('sync')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue a background bulk-sync job' })
  @ApiBody({ type: TriggerSyncDto })
  @ApiResponse({ status: 202, description: 'Sync job enqueued; returns BullMQ job ID' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async triggerSync(@Body() body: TriggerSyncDto = {}) {
    const { userId, since } = body;
    return this.transactionsService.triggerBulkSync(userId, since);
  }
}
