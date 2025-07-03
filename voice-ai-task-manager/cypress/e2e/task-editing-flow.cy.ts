describe('Task Editing Flow', () => {
  beforeEach(() => {
    cy.resetAppState();
    cy.visit('/');
    cy.waitForAppLoad();
    
    // Navigate to tasks tab
    cy.get('[data-testid="tasks-tab"]').click();
  });

  it('should create a new task through the chat interface', () => {
    // Navigate to chat tab
    cy.get('[data-testid="chat-tab"]').click();
    
    // Type a task creation message
    cy.get('[data-testid="chat-input"]').type('Create a task to finish the project report{enter}');
    
    // Wait for AI response
    cy.get('[data-testid="chat-messages"]').should('contain', 'task created');
    
    // Navigate to tasks tab to verify task was created
    cy.get('[data-testid="tasks-tab"]').click();
    cy.get('[data-testid="task-list"]').should('contain', 'finish the project report');
  });

  it('should edit task title inline', () => {
    // Create a test task first
    cy.createMockTask({ 
      title: 'Original Task Title',
      description: 'Task description'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Find and edit the task
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-title"]').should('contain', 'Original Task Title');
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Edit in the task edit modal/form
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-title-input"]').clear().type('Updated Task Title');
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify the task was updated
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-title"]').should('contain', 'Updated Task Title');
    });
  });

  it('should edit task description', () => {
    cy.createMockTask({ 
      title: 'Test Task',
      description: 'Original description'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Open edit modal
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Edit description
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-description-input"]').clear().type('Updated task description with more details');
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify description was updated
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-description"]').should('contain', 'Updated task description');
    });
  });

  it('should change task priority', () => {
    cy.createMockTask({ 
      title: 'Test Task',
      priority: 'medium'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Open edit modal
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Change priority
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-priority-select"]').click();
    cy.get('[data-testid="priority-high"]').click();
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify priority was updated
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-priority-badge"]').should('contain', 'high');
    });
  });

  it('should change task status', () => {
    cy.createMockTask({ 
      title: 'Test Task',
      status: 'pending'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Click the completion toggle
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-completion-toggle"]').click();
    });
    
    // Verify status was updated to completed
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-status-badge"]').should('contain', 'completed');
      cy.get('[data-testid="task-title"]').should('have.class', 'line-through');
    });
  });

  it('should add and remove tags', () => {
    cy.createMockTask({ 
      title: 'Test Task',
      description: 'Task for testing tags'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Open edit modal
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Add tags
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-tags-input"]').type('urgent{enter}');
    cy.get('[data-testid="task-tags-input"]').type('work{enter}');
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify tags were added
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-tag"]').should('contain', 'urgent');
      cy.get('[data-testid="task-tag"]').should('contain', 'work');
    });
    
    // Remove a tag
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="remove-tag-urgent"]').click();
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify tag was removed
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-tag"]').should('not.contain', 'urgent');
      cy.get('[data-testid="task-tag"]').should('contain', 'work');
    });
  });

  it('should set and update due date', () => {
    cy.createMockTask({ 
      title: 'Test Task',
      description: 'Task for testing due dates'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Open edit modal
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Set due date
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-due-date-input"]').click();
    
    // Select tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate().toString();
    
    cy.get('[data-testid="date-picker"]').should('be.visible');
    cy.get(`[data-testid="date-${tomorrowDay}"]`).click();
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify due date was set
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-due-date"]').should('be.visible');
    });
  });

  it('should delete a task', () => {
    cy.createMockTask({ 
      title: 'Task to Delete',
      description: 'This task will be deleted'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Verify task exists
    cy.get('[data-testid="task-list"]').should('contain', 'Task to Delete');
    
    // Open edit modal and delete
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="delete-task-button"]').click();
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Verify task was deleted
    cy.get('[data-testid="task-list"]').should('not.contain', 'Task to Delete');
  });

  it('should cancel task editing without saving changes', () => {
    cy.createMockTask({ 
      title: 'Original Task',
      description: 'Original description'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Open edit modal
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Make changes but cancel
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-title-input"]').clear().type('Changed Title');
    cy.get('[data-testid="task-description-input"]').clear().type('Changed description');
    cy.get('[data-testid="cancel-edit-button"]').click();
    
    // Verify changes were not saved
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-title"]').should('contain', 'Original Task');
      cy.get('[data-testid="task-description"]').should('contain', 'Original description');
    });
  });

  it('should validate required fields when editing', () => {
    cy.createMockTask({ 
      title: 'Test Task',
      description: 'Test description'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Open edit modal
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    // Clear required title field
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-title-input"]').clear();
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify validation error is shown
    cy.get('[data-testid="title-error-message"]').should('be.visible');
    cy.get('[data-testid="title-error-message"]').should('contain', 'Title is required');
    
    // Modal should still be open
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
  });

  it('should persist task changes across page refreshes', () => {
    cy.createMockTask({ 
      title: 'Persistence Test Task',
      description: 'Original description'
    });
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Edit the task
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="edit-task-button"]').click();
    });
    
    cy.get('[data-testid="task-edit-modal"]').should('be.visible');
    cy.get('[data-testid="task-title-input"]').clear().type('Updated Persistent Task');
    cy.get('[data-testid="task-description-input"]').clear().type('Updated description after refresh');
    cy.get('[data-testid="save-task-button"]').click();
    
    // Refresh the page
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="tasks-tab"]').click();
    
    // Verify changes persisted
    cy.get('[data-testid="task-card"]').first().within(() => {
      cy.get('[data-testid="task-title"]').should('contain', 'Updated Persistent Task');
      cy.get('[data-testid="task-description"]').should('contain', 'Updated description after refresh');
    });
  });
});
