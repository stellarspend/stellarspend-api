import { Body, Controller, Get, Post, Query, UseGuards, Req, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { ExportTransactionsDto } from './dto/export-transactions.dto';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';

interface AuthenticatedRequest {
  user?: {
    userId: string;
  };
}

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new Stellar transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({ status: 201, description: 'Transaction recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions' })
  findAll(@Query() query: QueryTransactionsDto) {
    return { message: 'Transactions list', query };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export transaction history as CSV' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO 8601 format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601 format)' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file containing transaction history',
    content: {
      'text/csv': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async export(
    @Query() query: ExportTransactionsDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse optional date filters
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Generate CSV content
    const csvContent = await this.transactionsService.exportToCsv(userId, startDate, endDate);

    // Set response headers for CSV download
    const filename = `transactions_${userId}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send CSV response
    return res.send(csvContent);
  }
}
