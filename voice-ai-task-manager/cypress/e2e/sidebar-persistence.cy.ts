describe('Sidebar Toggle Persistence', () => {
  beforeEach(() => {
    cy.resetAppState();
    cy.visit('/');
    cy.waitForAppLoad();
  });

  it('should persist sidebar state when toggled', () => {
    // Check initial sidebar state (should be visible)
    cy.get('[data-testid="conversation-sidebar"]').should('be.visible');
    
    // Toggle sidebar to collapse it
    cy.get('[data-testid="sidebar-toggle"]').click();
    
    // Verify sidebar is collapsed/minimized
    cy.get('[data-testid="conversation-sidebar"]').should('have.class', 'minimized');
    
    // Refresh the page
    cy.reload();
    cy.waitForAppLoad();
    
    // Verify sidebar state is persisted (still collapsed)
    cy.get('[data-testid="conversation-sidebar"]').should('have.class', 'minimized');
  });

  it('should persist expanded sidebar state', () => {
    // Start with collapsed sidebar
    cy.get('[data-testid="sidebar-toggle"]').click();
    cy.get('[data-testid="conversation-sidebar"]').should('have.class', 'minimized');
    
    // Expand sidebar
    cy.get('[data-testid="sidebar-expand"]').click();
    cy.get('[data-testid="conversation-sidebar"]').should('not.have.class', 'minimized');
    
    // Refresh the page
    cy.reload();
    cy.waitForAppLoad();
    
    // Verify sidebar state is persisted (expanded)
    cy.get('[data-testid="conversation-sidebar"]').should('not.have.class', 'minimized');
    cy.get('[data-testid="conversation-sidebar"]').should('be.visible');
  });

  it('should save sidebar state to localStorage', () => {
    // Toggle sidebar
    cy.get('[data-testid="sidebar-toggle"]').click();
    
    // Check localStorage for sidebar state
    cy.window().then((win) => {
      const sidebarState = win.localStorage.getItem('sidebar-minimized');
      expect(sidebarState).to.equal('true');
    });
    
    // Toggle back
    cy.get('[data-testid="sidebar-expand"]').click();
    
    // Check localStorage again
    cy.window().then((win) => {
      const sidebarState = win.localStorage.getItem('sidebar-minimized');
      expect(sidebarState).to.equal('false');
    });
  });

  it('should work on mobile devices', () => {
    // Set mobile viewport
    cy.viewport(375, 667);
    
    // On mobile, sidebar should start hidden
    cy.get('[data-testid="conversation-sidebar"]').should('not.be.visible');
    
    // Click mobile menu button to show sidebar
    cy.get('[data-testid="mobile-menu-toggle"]').click();
    cy.get('[data-testid="conversation-sidebar"]').should('be.visible');
    
    // Click overlay to hide sidebar
    cy.get('[data-testid="sidebar-overlay"]').click();
    cy.get('[data-testid="conversation-sidebar"]').should('not.be.visible');
    
    // Verify state persists on refresh
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="conversation-sidebar"]').should('not.be.visible');
  });

  it('should maintain sidebar content when toggling', () => {
    // Create some conversations first
    cy.createMockTask({ title: 'Test conversation 1' });
    cy.createMockTask({ title: 'Test conversation 2' });
    
    // Verify conversations are visible
    cy.get('[data-testid="conversation-list"]').should('contain', 'Test conversation 1');
    
    // Toggle sidebar
    cy.get('[data-testid="sidebar-toggle"]').click();
    
    // Expand sidebar
    cy.get('[data-testid="sidebar-expand"]').click();
    
    // Verify conversations are still there
    cy.get('[data-testid="conversation-list"]').should('contain', 'Test conversation 1');
    cy.get('[data-testid="conversation-list"]').should('contain', 'Test conversation 2');
  });

  it('should handle keyboard shortcut for sidebar toggle', () => {
    // Use keyboard shortcut (Cmd+B or Ctrl+B)
    cy.get('body').type('{cmd+b}');
    
    // Verify sidebar toggled
    cy.get('[data-testid="conversation-sidebar"]').should('have.class', 'minimized');
    
    // Use shortcut again
    cy.get('body').type('{cmd+b}');
    
    // Verify sidebar expanded
    cy.get('[data-testid="conversation-sidebar"]').should('not.have.class', 'minimized');
  });

  it('should maintain proper animations during toggle', () => {
    // Toggle sidebar and check for animation classes
    cy.get('[data-testid="sidebar-toggle"]').click();
    
    // Should have transition classes during animation
    cy.get('[data-testid="conversation-sidebar"]')
      .should('have.class', 'transition-all')
      .should('have.class', 'duration-300');
    
    // Wait for animation to complete
    cy.wait(350);
    
    // Should be in final minimized state
    cy.get('[data-testid="conversation-sidebar"]').should('have.class', 'minimized');
  });

  it('should handle rapid toggle clicks', () => {
    // Rapidly click toggle button multiple times
    cy.get('[data-testid="sidebar-toggle"]').click().click().click().click();
    
    // Wait for animations to settle
    cy.wait(500);
    
    // Should be in a consistent state
    cy.get('[data-testid="conversation-sidebar"]').should('be.visible');
    
    // State should be properly saved
    cy.reload();
    cy.waitForAppLoad();
    cy.get('[data-testid="conversation-sidebar"]').should('be.visible');
  });
});
