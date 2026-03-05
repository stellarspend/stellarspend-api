# Implementation Plan: Savings Goals with Progress Tracking

## Overview

This implementation plan breaks down the savings goals feature into discrete coding tasks. The approach follows the existing service/controller pattern in the codebase, integrating with TypeScript, Jest, and fast-check for property-based testing. Tasks are ordered to build incrementally, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up database entity and repository
  - Create SavingsGoal entity with TypeORM decorators
  - Define all fields: id, userId, name, targetAmount, currentAmount, progress, isCompleted, timestamps
  - Set up repository with basic CRUD operations
  - Add database migration for savings_goals table
  - _Requirements: 5.1_

- [ ] 2. Implement core service methods
  - [x] 2.1 Implement createGoal method
    - Validate targetAmount > 0
    - Initialize currentAmount to 0, progress to 0, isCompleted to false
    - Associate goal with userId
    - Persist to database and return created goal
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 2.2 Write property test for valid goal creation
    - **Property 1: Valid Goal Creation**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.3 Write property test for invalid target amount rejection
    - **Property 2: Invalid Target Amount Rejection**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.4 Write property test for goal creation invariants
    - **Property 3: Goal Creation Invariants**
    - **Validates: Requirements 1.3, 1.5**
  
  - [ ]* 2.5 Write property test for user association
    - **Property 4: User Association**
    - **Validates: Requirements 1.4**
  
  - [ ]* 2.6 Write unit tests for createGoal edge cases
    - Test zero and negative target amounts
    - Test missing required fields
    - _Requirements: 1.2_

- [ ] 3. Implement goal retrieval
  - [x] 3.1 Implement findGoalsByUser method
    - Query database for goals matching userId
    - Return array of goals with all fields
    - Handle empty results (return empty array)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 3.2 Write property test for goal retrieval authorization
    - **Property 5: Goal Retrieval Authorization**
    - **Validates: Requirements 2.1, 2.4**
  
  - [ ]* 3.3 Write unit tests for retrieval edge cases
    - Test user with no goals returns empty array
    - Test goals include all required fields
    - _Requirements: 2.3_

- [ ] 4. Implement progress calculation
  - [x] 4.1 Implement calculateProgress method
    - Calculate: (currentAmount / targetAmount) * 100
    - Round to 2 decimal places
    - Handle edge cases: currentAmount = 0 returns 0%, currentAmount = targetAmount returns 100%
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.2 Write property test for progress calculation correctness
    - **Property 9: Progress Calculation Correctness**
    - **Validates: Requirements 3.4, 4.1**
  
  - [ ]* 4.3 Write property test for progress rounding precision
    - **Property 10: Progress Rounding Precision**
    - **Validates: Requirements 4.4**
  
  - [ ]* 4.4 Write unit tests for progress edge cases
    - Test progress = 0% when currentAmount = 0
    - Test progress = 100% when currentAmount = targetAmount
    - Test rounding behavior with specific decimal values
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement contribution updates
  - [x] 6.1 Implement addContribution method
    - Validate contribution amount > 0
    - Validate currentAmount + contribution <= targetAmount
    - Verify goal ownership (userId matches)
    - Update currentAmount
    - Recalculate progress using calculateProgress
    - Set isCompleted = true if currentAmount === targetAmount
    - Persist updated goal to database
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1_
  
  - [ ]* 6.2 Write property test for valid contribution updates
    - **Property 6: Valid Contribution Updates Amount**
    - **Validates: Requirements 3.1**
  
  - [ ]* 6.3 Write property test for contribution exceeding target
    - **Property 7: Contribution Exceeding Target Rejected**
    - **Validates: Requirements 3.2**
  
  - [ ]* 6.4 Write property test for invalid contribution rejection
    - **Property 8: Invalid Contribution Rejection**
    - **Validates: Requirements 3.3**
  
  - [ ]* 6.5 Write unit tests for contribution edge cases
    - Test contribution that exactly reaches target (isCompleted = true)
    - Test zero and negative contributions
    - Test contribution exceeding target by various amounts
    - _Requirements: 3.2, 3.3, 3.5_

- [ ] 7. Implement authorization checks
  - [x] 7.1 Implement validateGoalOwnership method
    - Query goal by ID
    - Check if goal.userId matches provided userId
    - Return boolean or throw authorization error
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 7.2 Write property test for authorization enforcement
    - **Property 12: Authorization Enforcement**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ]* 7.3 Write unit tests for authorization scenarios
    - Test accessing own goal succeeds
    - Test accessing other user's goal fails
    - Test modifying other user's goal fails
    - _Requirements: 6.1, 6.2_

- [ ] 8. Implement controller endpoints
  - [x] 8.1 Implement POST /savings/goals endpoint
    - Extract userId from authenticated request
    - Validate CreateGoalDto
    - Call service.createGoal
    - Return 201 Created with GoalResponseDto
    - Handle validation errors (400)
    - _Requirements: 1.1, 1.2_
  
  - [x] 8.2 Implement GET /savings/goals endpoint
    - Extract userId from authenticated request
    - Call service.findGoalsByUser
    - Return 200 OK with array of GoalResponseDto
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 8.3 Implement PATCH /savings/goals/:id/contribution endpoint
    - Extract userId from authenticated request
    - Extract goalId from URL params
    - Validate UpdateContributionDto
    - Call service.addContribution
    - Return 200 OK with updated GoalResponseDto
    - Handle validation errors (400), authorization errors (403), not found (404)
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2_
  
  - [ ]* 8.4 Write unit tests for controller endpoints
    - Test successful requests return correct status codes
    - Test error responses have correct format
    - Test authentication/authorization integration
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 9. Implement persistence round-trip validation
  - [ ]* 9.1 Write property test for persistence round-trip
    - **Property 11: Persistence Round-Trip**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 10. Add error handling and DTOs
  - [x] 10.1 Create DTO classes
    - CreateGoalDto with validation decorators
    - UpdateContributionDto with validation decorators
    - GoalResponseDto for consistent responses
    - ErrorResponse interface
    - _Requirements: 1.1, 3.1_
  
  - [x] 10.2 Implement error handling
    - Add try-catch blocks in controller methods
    - Map service errors to appropriate HTTP status codes
    - Return consistent error response format
    - Log errors appropriately
    - _Requirements: 1.2, 3.2, 3.3, 6.2_
  
  - [ ]* 10.3 Write unit tests for error handling
    - Test validation error responses
    - Test authorization error responses
    - Test database error handling
    - _Requirements: 1.2, 3.2, 3.3, 6.2_

- [x] 11. Final checkpoint - Integration and verification
  - Ensure all tests pass (unit and property tests)
  - Verify all 12 correctness properties are implemented
  - Verify test coverage meets 90% minimum
  - Ensure no database connections in unit tests (use mocks)
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation
- All tests should use mock isolation (no real database connections)
- Minimum 100 iterations per property test
