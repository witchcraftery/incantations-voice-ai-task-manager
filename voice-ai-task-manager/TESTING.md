# Testing Documentation

## Overview
This document outlines the testing infrastructure and automated tests implemented for the Voice AI Task Manager application.

## Testing Framework Setup

### Jest Unit Tests
- **Framework**: Jest with TypeScript support via ts-jest
- **Test Environment**: jsdom for DOM simulation
- **Location**: `src/components/__tests__/`
- **Configuration**: `jest.config.json`

### Test Coverage
Unit tests have been created for the following components:

#### 1. TaskCard Component (`TaskCard.test.tsx`)
- Renders task information correctly
- Handles task status changes (pending, completed, etc.)
- Manages priority levels and styling
- Tests task completion toggle functionality
- Validates due date display and overdue states
- Tests tag display and management
- Verifies project information display
- Tests selection checkbox functionality

#### 2. ConversationSidebar Component (`ConversationSidebar.test.tsx`)
- Renders conversation list correctly
- Tests conversation selection and highlighting
- Validates search functionality
- Tests conversation editing (title changes)
- Verifies conversation deletion
- Tests minimized/expanded states
- Validates date grouping functionality
- Tests empty states and error handling

#### 3. AIStatusIndicator Component (`AIStatusIndicator.test.tsx`)
- Tests different AI status states (online, offline, error, loading)
- Validates correct styling for each status
- Tests provider and model information display
- Verifies custom className application

#### 4. VoiceControls Component (`VoiceControls.test.tsx`)
- Tests voice toggle functionality
- Validates microphone button states
- Tests listening and processing states
- Verifies transcript display
- Tests permission handling
- Validates keyboard shortcuts

### Cypress Integration Tests
- **Framework**: Cypress for end-to-end testing
- **Configuration**: `cypress.config.ts`
- **Location**: `cypress/e2e/`

#### 1. Sidebar Toggle Persistence (`sidebar-persistence.cy.ts`)
- Tests sidebar state persistence across page refreshes
- Validates localStorage integration for sidebar state
- Tests mobile responsive behavior
- Verifies animation states during transitions
- Tests keyboard shortcut functionality (Cmd+B/Ctrl+B)
- Handles rapid toggle clicks gracefully

#### 2. Task Editing Flow (`task-editing-flow.cy.ts`)
- Tests task creation through chat interface
- Validates inline task editing functionality
- Tests task status changes and completion
- Verifies priority level modifications
- Tests tag addition and removal
- Validates due date setting and updates
- Tests task deletion with confirmation
- Verifies form validation for required fields
- Tests data persistence across page refreshes

### ESLint & Prettier Configuration

#### ESLint
- **Configuration**: `eslint.config.js`
- **Rules**: TypeScript, React, and React Hooks rules enabled
- **Scripts**: 
  - `npm run lint` - Check for linting issues
  - `npm run lint:fix` - Automatically fix linting issues

#### Prettier
- **Configuration**: `.prettierrc.json`
- **Settings**: 
  - Semi-colons: enabled
  - Single quotes: enabled
  - Tab width: 2 spaces
  - Print width: 80 characters
- **Scripts**:
  - `npm run format` - Format all source files
  - `npm run format:check` - Check formatting without making changes

## Running Tests

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Open Cypress test runner
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

### Linting and Formatting
```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check
```

## Test Setup Files

### `src/setupTests.ts`
Contains test environment setup including:
- Jest DOM matchers
- Framer Motion mocks for animations
- Web API mocks (SpeechSynthesis, SpeechRecognition)
- Browser API mocks (localStorage, matchMedia)
- Observer API mocks (ResizeObserver, IntersectionObserver)

### `cypress/support/commands.ts`
Contains custom Cypress commands:
- `cy.dataCy()` - Select elements by data-cy attribute
- `cy.resetAppState()` - Clear application state
- `cy.createMockTask()` - Create test task data
- `cy.toggleSidebar()` - Toggle sidebar state
- `cy.waitForAppLoad()` - Wait for application to load

## Key Features Tested

### Sidebar Persistence
- State persistence using localStorage
- Mobile responsive behavior
- Animation handling during state changes
- Keyboard shortcuts (Cmd+B/Ctrl+B)

### Task Management
- Task creation, editing, and deletion
- Status and priority management
- Tag system functionality
- Due date handling
- Data persistence across sessions

### Voice Interface
- Voice control states and permissions
- Microphone interaction
- Speech recognition integration
- Audio feedback systems

## Coverage Goals
- **Components**: All new components have unit tests
- **Integration**: Critical user flows covered by Cypress tests
- **Code Quality**: ESLint and Prettier ensure consistent code style

## Future Test Additions
- Voice command integration tests
- AI service integration tests
- Performance testing for large task lists
- Accessibility testing with automated tools
- Visual regression testing for UI components
