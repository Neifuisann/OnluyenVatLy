# Playwright Tests

This directory contains automated Playwright tests for the OnluyenVatLy application.

## Installation

First, install Playwright and its dependencies:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run tests with browser visible
npm run test:headed

# Show test report
npm run test:report
```

## Test Structure

- `landing-page.spec.js` - Tests for the landing page including:
  - Page loading and basic elements
  - Navigation links
  - Responsive design
  - SEO meta tags
  - Accessibility
  - Console errors
  - Resource loading
  - Internal links

## Configuration

Tests are configured in `playwright.config.js` with:
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile viewport testing
- Automatic server startup
- Screenshot and video capture on failure
- HTML reporting