const { request } = require('@playwright/test');

class PlaywrightTestAuth {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:3003';
    this.tokens = null;
  }

  // Fetch test tokens from the server
  async fetchTokens() {
    const context = await request.newContext({
      baseURL: this.baseURL
    });

    try {
      const response = await context.get('/api/test-tokens');
      
      if (!response.ok()) {
        throw new Error(`Failed to fetch test tokens: ${response.status()}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to get test tokens');
      }

      this.tokens = data.tokens;
      this.usage = data.usage;
      
      return this.tokens;
    } finally {
      await context.dispose();
    }
  }

  // Get authentication headers for admin
  async getAdminHeaders() {
    if (!this.tokens) {
      await this.fetchTokens();
    }

    return {
      [this.usage.header]: this.tokens.admin,
      [this.usage.userAgentHeader]: this.usage.userAgentValue
    };
  }

  // Get authentication headers for student
  async getStudentHeaders() {
    if (!this.tokens) {
      await this.fetchTokens();
    }

    return {
      [this.usage.header]: this.tokens.student,
      [this.usage.userAgentHeader]: this.usage.userAgentValue
    };
  }

  // Apply auth headers to browser context
  async applyAuthToContext(context, userType = 'student') {
    const headers = userType === 'admin' 
      ? await this.getAdminHeaders()
      : await this.getStudentHeaders();

    // Set extra HTTP headers for all requests
    await context.setExtraHTTPHeaders(headers);
    
    return headers;
  }

  // Apply auth headers to page
  async applyAuthToPage(page, userType = 'student') {
    const headers = userType === 'admin' 
      ? await this.getAdminHeaders()
      : await this.getStudentHeaders();

    // Set extra HTTP headers for this page
    await page.setExtraHTTPHeaders(headers);
    
    return headers;
  }

  // Helper to create pre-authenticated browser context
  async createAuthenticatedContext(browser, userType = 'student') {
    const context = await browser.newContext({
      // Add Playwright user agent to help with detection
      userAgent: 'Mozilla/5.0 (Playwright Test) AppleWebKit/537.36'
    });

    // Apply authentication
    await this.applyAuthToContext(context, userType);

    return context;
  }

  // Helper to navigate with authentication
  async authenticatedGoto(page, url, userType = 'student') {
    // Apply auth headers
    await this.applyAuthToPage(page, userType);
    
    // Navigate to the page
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check if authentication was successful
    const testModeHeader = await response.headerValue('x-test-mode');
    if (testModeHeader !== 'true') {
      console.warn('Test mode not detected in response. Authentication may have failed.');
    }
    
    return response;
  }
}

// Export singleton instance
module.exports = new PlaywrightTestAuth();