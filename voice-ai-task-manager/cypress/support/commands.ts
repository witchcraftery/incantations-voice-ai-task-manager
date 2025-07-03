/// <reference types="cypress" />

// Custom commands for the Voice AI Task Manager

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to clear local storage and set up fresh state
       */
      resetAppState(): Chainable<void>;
      
      /**
       * Custom command to create a mock task
       */
      createMockTask(task: {
        title: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
      }): Chainable<void>;
      
      /**
       * Custom command to toggle sidebar
       */
      toggleSidebar(): Chainable<void>;
      
      /**
       * Custom command to wait for app to load
       */
      waitForAppLoad(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`);
});

Cypress.Commands.add('resetAppState', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.reload();
});

Cypress.Commands.add('createMockTask', (task) => {
  cy.window().then((win) => {
    const tasks = JSON.parse(win.localStorage.getItem('voice-ai-tasks') || '[]');
    const newTask = {
      id: `task-${Date.now()}`,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      ...task
    };
    tasks.push(newTask);
    win.localStorage.setItem('voice-ai-tasks', JSON.stringify(tasks));
  });
});

Cypress.Commands.add('toggleSidebar', () => {
  cy.get('[data-testid="sidebar-toggle"]').click();
});

Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('[data-testid="app-container"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="header"]').should('be.visible');
});
