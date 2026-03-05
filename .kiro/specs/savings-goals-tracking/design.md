# Design Document: Savings Goals with Progress Tracking

## Overview

This feature implements a savings goals management system that allows users to create financial savings targets, track contributions, and monitor progress. The system integrates with the existing financial application architecture using TypeScript, following the established service/controller pattern with Jest for testing.

The design focuses on data integrity, accurate progress calculation, and proper authorization to ensure users can only access their own goals. The implementation will add new endpoints to the savings module while maintaining consistency with existing modules (budgets, transactions, users).

## Architecture

The savings goals feature follows the existing layered architecture:

```
Controller Layer (savings.controller.ts)
    ↓
Service Layer (savings.service.ts)
    ↓
Repository Layer (TypeORM entities)
    ↓
Database (PostgreSQL/MySQL)
```

The controller handles HTTP requests and validation, the service contains business logic and progress calculations, and the repository manages data persistence. This separation ensures testability and maintainability.

## Components and Interfaces

### SavingsGoal Entity

```typescript
interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DTOs (Data Transfer Objects)

```typescript
interface CreateGoalDto {
  name: string;
  targetAmount: number;
}

interface UpdateContributionDto {
  goalId: string;
  amount: number;
}

interface GoalResponseDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### SavingsController

```typescript
class SavingsController {
  // POST /savings/goals
  async createGoal(userId: string, dto: CreateGoalDto): Promise<GoalResponseDto>
  
  // GET /savings/goals
  async getGoals(userId: string): Promise<GoalResponseDto[]>
  
  // PATCH /savings/goals/:id/contribution
  async updateContribution(userId: string, goalId: string, dto: UpdateContributionDto): Promise<GoalResponseDto>
}
```

### SavingsService

```typescript
class SavingsService {
  async createGoal(userId: string, name: string, targetAmount: number): Promise<SavingsGoal>
  
  async findGoalsByUser(userId: string): Promise<SavingsGoal[]>
  
  async addContribution(userId: string, goalId: string, amount: number): Promise<SavingsGoal>
  
  calculateProgress(currentAmount: number, targetAmount: number): number
  
  validateGoalOwnership(userId: string, goalId: string): Promise<boolean>
}
```

## Data Models

### Database Schema

```sql
CREATE TABLE savings_goals (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  progress DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id)
);
```

### Validation Rules

- `targetAmount`: Must be greater than 0
- `currentAmount`: Must be >= 0 and <= targetAmount
- `contribution amount`: Must be greater than 0
- `currentAmount + contribution`: Must not exceed targetAmount
- `progress`: Calculated value, range [0, 100], rounded to 2 decimal places

### Progress Calculation

```
progress = (currentAmount / targetAmount) * 100
rounded to 2 decimal places
```

When `currentAmount === targetAmount`, set `isCompleted = true`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid Goal Creation

*For any* valid goal name and positive target amount, creating a goal should succeed and return a goal with the specified target amount.

**Validates: Requirements 1.1**

### Property 2: Invalid Target Amount Rejection

*For any* target amount less than or equal to zero, attempting to create a goal should be rejected with a validation error.

**Validates: Requirements 1.2**

### Property 3: Goal Creation Invariants

*For any* newly created goal, the goal should have currentAmount initialized to 0, a unique identifier, and all required fields (name, targetAmount, progress, isCompleted, timestamps).

**Validates: Requirements 1.3, 1.5**

### Property 4: User Association

*For any* authenticated user creating a goal, the created goal should be associated with that user's ID.

**Validates: Requirements 1.4**

### Property 5: Goal Retrieval Authorization

*For any* user with multiple goals and other users with their own goals, retrieving goals should return exactly the goals belonging to the requesting user and no goals from other users.

**Validates: Requirements 2.1, 2.4**

### Property 6: Valid Contribution Updates Amount

*For any* goal and valid contribution amount (positive and would not exceed target), adding the contribution should increase the currentAmount by exactly the contribution amount.

**Validates: Requirements 3.1**

### Property 7: Contribution Exceeding Target Rejected

*For any* goal where currentAmount + contribution > targetAmount, the contribution should be rejected with an error.

**Validates: Requirements 3.2**

### Property 8: Invalid Contribution Rejection

*For any* contribution amount less than or equal to zero, the contribution should be rejected with a validation error.

**Validates: Requirements 3.3**

### Property 9: Progress Calculation Correctness

*For any* goal with currentAmount and targetAmount, the progress should equal (currentAmount / targetAmount) * 100, and should be recalculated correctly after any contribution.

**Validates: Requirements 3.4, 4.1**

### Property 10: Progress Rounding Precision

*For any* goal, the progress percentage should be rounded to exactly two decimal places.

**Validates: Requirements 4.4**

### Property 11: Persistence Round-Trip

*For any* goal that is created or updated with a contribution, retrieving the goal immediately afterward should return the same data (create-retrieve or update-retrieve round-trip).

**Validates: Requirements 5.1, 5.2**

### Property 12: Authorization Enforcement

*For any* user attempting to access or modify a goal that does not belong to them, the operation should be rejected with an authorization error.

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Validation Errors

- **Invalid Target Amount**: Return 400 Bad Request with message "Target amount must be greater than 0"
- **Invalid Contribution**: Return 400 Bad Request with message "Contribution amount must be greater than 0"
- **Contribution Exceeds Target**: Return 400 Bad Request with message "Contribution would exceed target amount"
- **Missing Required Fields**: Return 400 Bad Request with field-specific error messages

### Authorization Errors

- **Unauthorized Access**: Return 403 Forbidden with message "You do not have permission to access this goal"
- **Goal Not Found**: Return 404 Not Found with message "Goal not found"

### Database Errors

- **Connection Failure**: Return 500 Internal Server Error with generic message (log details internally)
- **Constraint Violation**: Return 400 Bad Request with appropriate message
- **Concurrent Update Conflict**: Retry operation or return 409 Conflict

### Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases (empty goals list, goal completion at 100%, zero progress), and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized test data

### Property-Based Testing

We will use **fast-check** (TypeScript property-based testing library) to implement property tests. Each property test will:

- Run a minimum of 100 iterations with randomized inputs
- Reference the corresponding design document property
- Use the tag format: **Feature: savings-goals-tracking, Property N: [property text]**

Example property test structure:

```typescript
import * as fc from 'fast-check';

describe('Property Tests - Savings Goals', () => {
  it('Property 1: Valid Goal Creation', () => {
    // Feature: savings-goals-tracking, Property 1: Valid goal creation
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.float({ min: 0.01, max: 1000000 }),
        async (name, targetAmount) => {
          const goal = await service.createGoal(userId, name, targetAmount);
          expect(goal.targetAmount).toBe(targetAmount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus

Unit tests should focus on:

- Specific examples demonstrating correct behavior (e.g., creating a goal with $1000 target)
- Edge cases: empty goals list, goal completion when reaching 100%, zero progress on new goals
- Integration between controller and service layers
- Error handling for specific scenarios
- Mock isolation to ensure no database connections in unit tests

### Test Coverage Goals

- Minimum 90% code coverage for service and controller
- All 12 correctness properties implemented as property-based tests
- Edge cases covered by unit tests
- Error paths tested for all validation and authorization scenarios
