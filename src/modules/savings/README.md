# Savings Goals Module

This module implements savings goals tracking functionality for the StellarSpend API.

## Overview

The savings goals module allows users to:
- Create savings goals with target amounts
- Track contributions toward goals
- Monitor progress as a percentage
- Mark goals as completed when target is reached

## Architecture

The module follows the repository pattern with the following components:

### Entity: SavingsGoal

Defined in `src/common/test-utils/fixtures.ts`:

```typescript
interface SavingsGoal {
  id: string;                // UUID identifier
  userId: string;            // User who owns the goal
  name: string;              // Goal name/description
  targetAmount: number;      // Target amount to save
  currentAmount: number;     // Current amount saved
  progress: number;          // Progress percentage (0-100)
  isCompleted: boolean;      // Whether goal is completed
  createdAt: Date;           // Creation timestamp
  updatedAt: Date;           // Last update timestamp
}
```

### Repository Interface: SavingsGoalRepository

Defined in `src/modules/savings/savings.service.ts`:

```typescript
interface SavingsGoalRepository {
  find(): Promise<SavingsGoal[]>;
  findOne(id: string): Promise<SavingsGoal | null>;
  findByUserId(userId: string): Promise<SavingsGoal[]>;
  create(goal: Partial<SavingsGoal>): Promise<SavingsGoal>;
  update(id: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal>;
  delete(id: string): Promise<boolean>;
}
```

### Service: SavingsService

The service layer (`src/modules/savings/savings.service.ts`) implements business logic:

- **createGoal**: Creates a new savings goal with validation
- **findGoalsByUser**: Retrieves all goals for a specific user
- **addContribution**: Adds money to a goal and updates progress
- **calculateProgress**: Calculates progress percentage
- **validateGoalOwnership**: Ensures user owns the goal

## Database Schema

Database migrations are provided in the `migrations/` directory:

- `001_create_savings_goals_table.sql` - MySQL/MariaDB version
- `001_create_savings_goals_table_postgres.sql` - PostgreSQL version

### Table: savings_goals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID/VARCHAR(36) | PRIMARY KEY | Unique identifier |
| user_id | UUID/VARCHAR(36) | NOT NULL, FK | User who owns the goal |
| name | VARCHAR(255) | NOT NULL | Goal name |
| target_amount | DECIMAL(10,2) | NOT NULL, > 0 | Target amount |
| current_amount | DECIMAL(10,2) | DEFAULT 0, >= 0 | Current saved amount |
| progress | DECIMAL(5,2) | DEFAULT 0, 0-100 | Progress percentage |
| is_completed | BOOLEAN | DEFAULT FALSE | Completion status |
| created_at | TIMESTAMP | DEFAULT NOW | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW | Last update time |

### Indexes

- `idx_savings_goals_user_id` on `user_id` for efficient user queries

### Constraints

- Foreign key on `user_id` references `users(id)` with CASCADE delete
- Check constraint: `target_amount > 0`
- Check constraint: `current_amount >= 0`
- Check constraint: `progress >= 0 AND progress <= 100`

## Testing

### Mock Repository

A mock implementation is provided for testing in `src/common/mocks/savings-repository.mock.ts`:

```typescript
const repository = new MockSavingsGoalRepository();
const service = new SavingsService(repository);
```

### Test Fixtures

Test data helpers are available in `src/common/test-utils/fixtures.ts`:

```typescript
import { createTestSavingsGoal, createTestSavingsGoalList } from '../../common/test-utils/fixtures';

const goal = createTestSavingsGoal({ targetAmount: 5000 });
const goals = createTestSavingsGoalList(5);
```

### Running Tests

```bash
npm test -- src/modules/savings/savings.service.spec.ts
```

## Validation Rules

### Goal Creation
- `userId`: Required, must be valid UUID
- `name`: Required, minimum 2 characters
- `targetAmount`: Required, must be > 0, max 2 decimal places

### Contributions
- `amount`: Required, must be > 0, max 2 decimal places
- `currentAmount + amount`: Must not exceed `targetAmount`
- User must own the goal (authorization check)

### Progress Calculation
- Formula: `(currentAmount / targetAmount) * 100`
- Rounded to 2 decimal places
- Range: 0-100

## Error Handling

The service throws custom errors:

- **ValidationError**: Invalid input data
- **NotFoundError**: Goal doesn't exist
- **AuthorizationError**: User doesn't own the goal

## Usage Example

```typescript
import { SavingsService } from './savings.service';
import { MockSavingsGoalRepository } from '../../common/mocks/savings-repository.mock';

// Setup
const repository = new MockSavingsGoalRepository();
const service = new SavingsService(repository);

// Create a goal
const goal = await service.createGoal(
  '123e4567-e89b-12d3-a456-426614174000',
  'Emergency Fund',
  1000.00
);

// Add contribution
const updated = await service.addContribution(
  '123e4567-e89b-12d3-a456-426614174000',
  goal.id,
  250.00
);

console.log(updated.progress); // 25.00
console.log(updated.isCompleted); // false

// Get all user goals
const goals = await service.findGoalsByUser('123e4567-e89b-12d3-a456-426614174000');
```

## Requirements Mapping

This implementation satisfies:

- **Requirement 5.1**: Data persistence with database entity and repository
- Database schema with all required fields
- CRUD operations through repository interface
- Migration scripts for database setup
- Mock repository for testing without database connections

## Next Steps

To integrate with a real database:

1. Install database driver (e.g., `pg` for PostgreSQL, `mysql2` for MySQL)
2. Run the appropriate migration script from `migrations/`
3. Implement a concrete repository class that connects to the database
4. Inject the concrete repository into the service
5. Configure database connection in application configuration
