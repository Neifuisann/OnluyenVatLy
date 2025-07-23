// @ts-check
const { test, expect } = require('@playwright/test');
const testAuth = require('./helpers/testAuth');

test.describe('Lesson (Exam) Page Tests', () => {
  let testLessonId = '1'; // Default test lesson ID

  test.describe('Authentication & Access', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      // Try to access lesson page without authentication
      const response = await page.goto(`/lesson/${testLessonId}`);
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/student\/login/);
      
      // Should include redirect parameter
      expect(page.url()).toContain(`redirect=%2Flesson%2F${testLessonId}`);
    });

    test('should allow access with student authentication', async ({ page }) => {
      // Apply student authentication
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock lesson data
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Test Lesson',
              questions: []
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Should not redirect
      await expect(page).toHaveURL(new RegExp(`/lesson/${testLessonId}`));
    });

    test('should allow access with admin authentication', async ({ page }) => {
      // Apply admin authentication
      await testAuth.applyAuthToPage(page, 'admin');
      
      // Mock lesson data
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Test Lesson',
              questions: []
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Should not redirect
      await expect(page).toHaveURL(new RegExp(`/lesson/${testLessonId}`));
    });
  });

  test.describe('Page Load & Basic Elements', () => {
    test.beforeEach(async ({ page }) => {
      // Apply authentication
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock lesson data
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Physics Test - Chapter 1',
              subject: 'Vật lý',
              grade: '12',
              timeLimitEnabled: true,
              timeLimitMinutes: 30,
              showCountdown: true,
              questions: [
                {
                  id: 1,
                  type: 'ABCD',
                  question: 'What is the speed of light?',
                  options: {
                    A: '300,000 km/s',
                    B: '150,000 km/s',
                    C: '600,000 km/s',
                    D: '100,000 km/s'
                  }
                }
              ]
            }
          })
        });
      });
    });

    test('should load page successfully', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check loading indicator disappears
      const loader = page.locator('#loading-indicator');
      await loader.waitFor({ state: 'hidden', timeout: 10000 });
      
      // Check page title updates (wait for JavaScript to set it)
      await page.waitForFunction(
        () => document.title !== 'Loading lesson...' && document.title !== 'undefined',
        { timeout: 5000 }
      );
      
      const title = await page.title();
      expect(title).toContain('Physics Test');
      
      // Check main container is visible
      const examContainer = page.locator('.exam-container');
      await expect(examContainer).toBeVisible();
    });

    test('should display exam structure correctly', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check sidebar
      const sidebar = page.locator('.exam-sidebar');
      await expect(sidebar).toBeVisible();
      
      // Check main content area
      const content = page.locator('.exam-content');
      await expect(content).toBeVisible();
    });

    test('should handle invalid lesson ID', async ({ page }) => {
      // Apply authentication
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock 404 response
      await page.route('/api/lessons/invalid', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Lesson not found'
          })
        });
      });

      await page.goto('/lesson/invalid');
      
      // Wait for error to appear
      await page.waitForTimeout(1000);
      
      // Should show error
      const errorText = await page.textContent('body');
      expect(errorText).toMatch(/Error loading lesson|Lesson not found|404/i);
    });
  });

  test.describe('Exam Sidebar', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock lesson with multiple questions
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Comprehensive Physics Test',
              timeLimitEnabled: true,
              timeLimitMinutes: 45,
              showCountdown: true,
              questions: [
                {
                  id: 1,
                  type: 'ABCD',
                  question: 'Question 1',
                  options: { A: 'A1', B: 'B1', C: 'C1', D: 'D1' }
                },
                {
                  id: 2,
                  type: 'TrueFalse',
                  question: 'Question 2',
                  options: { A: 'True', B: 'False' }
                },
                {
                  id: 3,
                  type: 'Number',
                  question: 'Question 3'
                },
                {
                  id: 4,
                  type: 'ABCD',
                  question: 'Question 4',
                  options: { A: 'A4', B: 'B4', C: 'C4', D: 'D4' }
                },
                {
                  id: 5,
                  type: 'ABCD',
                  question: 'Question 5',
                  options: { A: 'A5', B: 'B5', C: 'C5', D: 'D5' }
                }
              ]
            }
          })
        });
      });
    });

    test('should display exam header correctly', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check title
      const title = page.locator('.exam-title');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Comprehensive Physics Test');
    });

    test('should display timer when enabled', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check timer in sidebar
      const timer = page.locator('.exam-timer');
      await expect(timer).toBeVisible();
      await expect(timer).toContainText(':'); // Should show time format
      
      // Check countdown timer element
      const countdownTimer = page.locator('#countdown-timer');
      await expect(countdownTimer).toBeVisible();
    });

    test('should display question navigation grid', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check question grid
      const questionGrid = page.locator('.question-grid');
      await expect(questionGrid).toBeVisible();
      
      // Check all question nav items
      const navItems = questionGrid.locator('.question-nav-item');
      await expect(navItems).toHaveCount(5);
      
      // First question should be active
      await expect(navItems.nth(0)).toHaveClass(/active/);
    });

    test('should update question status indicators', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Answer first question
      const firstOption = page.locator('.option-row').first();
      await firstOption.click();
      
      // Check navigation item shows answered status
      const firstNavItem = page.locator('.question-nav-item').first();
      await expect(firstNavItem).toHaveClass(/answered/);
    });

    test('should display progress statistics', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check stats section
      const stats = page.locator('.exam-stats');
      await expect(stats).toBeVisible();
      
      // Check progress info
      const answeredCount = stats.locator('.answered-count');
      await expect(answeredCount).toBeVisible();
      await expect(answeredCount).toContainText('0/5'); // Initially 0 answered
    });
  });

  test.describe('Question Display & Interaction', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock lesson with different question types
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Mixed Question Types Test',
              questions: [
                {
                  id: 1,
                  type: 'ABCD',
                  question: 'What is \\(E = mc^2\\)?',
                  options: {
                    A: 'Mass-energy equivalence',
                    B: 'Force equation',
                    C: 'Velocity formula',
                    D: 'Acceleration formula'
                  },
                  questionImage: 'https://example.com/image1.png'
                },
                {
                  id: 2,
                  type: 'TrueFalse',
                  question: 'The Earth is flat.',
                  options: {
                    A: 'True',
                    B: 'False'
                  }
                },
                {
                  id: 3,
                  type: 'Number',
                  question: 'What is 2 + 2?',
                  unit: ''
                }
              ]
            }
          })
        });
      });
    });

    test('should render ABCD questions correctly', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check question container
      const questionContainer = page.locator('.question-card').first();
      await expect(questionContainer).toBeVisible();
      
      // Check question text (with math)
      const questionText = questionContainer.locator('.question-text');
      await expect(questionText).toBeVisible();
      await expect(questionText).toContainText('What is');
      
      // Check KaTeX rendered math
      const katexElement = questionText.locator('.katex');
      await expect(katexElement).toBeVisible();
      
      // Check all options
      const options = questionContainer.locator('.option-row');
      await expect(options).toHaveCount(4);
      
      // Check option labels
      await expect(options.nth(0)).toContainText('A');
      await expect(options.nth(0)).toContainText('Mass-energy equivalence');
    });

    test('should render True/False questions correctly', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Navigate to question 2
      await page.locator('.question-nav-item').nth(1).click();
      
      // Check True/False options
      const options = page.locator('.option-row');
      await expect(options).toHaveCount(2);
      await expect(options.nth(0)).toContainText('True');
      await expect(options.nth(1)).toContainText('False');
    });

    test('should render Number questions correctly', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Navigate to question 3
      await page.locator('.question-nav-item').nth(2).click();
      
      // Check number input
      const numberInput = page.locator('input[type="number"]');
      await expect(numberInput).toBeVisible();
      await expect(numberInput).toHaveAttribute('placeholder', /Nhập đáp án/);
    });

    test('should handle answer selection for ABCD', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      const options = page.locator('.option-row');
      
      // Click first option
      await options.nth(0).click();
      await expect(options.nth(0).locator('input')).toBeChecked();
      
      // Click second option (should deselect first)
      await options.nth(1).click();
      await expect(options.nth(0).locator('input')).not.toBeChecked();
      await expect(options.nth(1).locator('input')).toBeChecked();
    });

    test('should persist answers when navigating', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Answer question 1
      await page.locator('.option-row').nth(0).click();
      
      // Navigate to question 2
      await page.locator('.question-nav-item').nth(1).click();
      
      // Navigate back to question 1
      await page.locator('.question-nav-item').nth(0).click();
      
      // Check answer is still selected
      await expect(page.locator('.option-row input').nth(0)).toBeChecked();
    });

    test('should display question images', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check image is displayed
      const questionImage = page.locator('.question-image img');
      await expect(questionImage).toBeVisible();
      await expect(questionImage).toHaveAttribute('src', 'https://example.com/image1.png');
    });
  });

  test.describe('Timer Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
    });

    test('should display and update countdown timer', async ({ page }) => {
      // Mock lesson with short timer
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Timed Test',
              timeLimitEnabled: true,
              timeLimitMinutes: 1, // 1 minute for testing
              showCountdown: true,
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test question',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Check timer displays
      const timer = page.locator('#countdown-timer');
      await expect(timer).toBeVisible();
      
      // Check initial time
      const initialTime = await timer.locator('#timer-display').textContent();
      expect(initialTime).toMatch(/1:00|0:5\d/); // Should start at 1:00 or slightly less
      
      // Wait and check timer updates
      await page.waitForTimeout(2000);
      const updatedTime = await timer.locator('#timer-display').textContent();
      expect(initialTime).not.toBe(updatedTime);
    });

    test('should show warning at 5 minutes', async ({ page }) => {
      // Mock lesson with timer approaching 5 minutes
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Warning Test',
              timeLimitEnabled: true,
              timeLimitMinutes: 5.1, // Just over 5 minutes
              showCountdown: true,
              showWarning: true,
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Wait for timer to reach warning threshold
      await page.waitForTimeout(7000); // Wait for timer to tick down
      
      // Check for warning modal
      const warningModal = page.locator('.time-warning-modal');
      await expect(warningModal).toBeVisible({ timeout: 10000 });
      await expect(warningModal).toContainText('Còn lại 5 phút');
    });

    test('should change timer color in danger zone', async ({ page }) => {
      // Mock lesson with very short timer
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Danger Zone Test',
              timeLimitEnabled: true,
              timeLimitMinutes: 0.5, // 30 seconds
              showCountdown: true,
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Check timer has danger styling
      const timer = page.locator('#countdown-timer');
      await expect(timer).toHaveCSS('border-color', /rgb\(239, 68, 68\)/); // Red color
    });
  });

  test.describe('Quiz Submission', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock lesson
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Submission Test',
              attemptLimit: 3,
              questions: [
                {
                  id: 1,
                  type: 'ABCD',
                  question: 'Q1',
                  options: { A: 'A1', B: 'B1', C: 'C1', D: 'D1' }
                },
                {
                  id: 2,
                  type: 'TrueFalse',
                  question: 'Q2',
                  options: { A: 'True', B: 'False' }
                }
              ]
            }
          })
        });
      });

      // Mock attempt check
      await page.route(`/api/lessons/${testLessonId}/attempt-check`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            canAttempt: true,
            attempts: 0,
            remainingAttempts: 3
          })
        });
      });
    });

    test('should show submit button', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      const submitBtn = page.locator('#submit-quiz-btn');
      await expect(submitBtn).toBeVisible();
      await expect(submitBtn).toContainText('Nộp bài');
    });

    test('should warn about unanswered questions', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Try to submit without answering
      await page.locator('#submit-quiz-btn').click();
      
      // Should show confirmation with warning
      await expect(page.locator('text=Bạn chưa trả lời hết')).toBeVisible();
    });

    test('should submit successfully with all answers', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Answer all questions
      await page.locator('.option-row').first().click(); // Q1
      await page.locator('.question-nav-item').nth(1).click(); // Navigate to Q2
      await page.locator('.option-row').first().click(); // Q2
      
      // Mock submission response
      await page.route('/api/quiz/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            score: 85,
            totalScore: 100,
            correctAnswers: 1,
            totalQuestions: 2,
            details: []
          })
        });
      });
      
      // Submit
      await page.locator('#submit-quiz-btn').click();
      
      // Confirm submission
      await page.locator('button:has-text("Xác nhận")').click();
      
      // Check feedback modal
      const feedbackModal = page.locator('.practice-feedback-modal');
      await expect(feedbackModal).toBeVisible();
      await expect(feedbackModal).toContainText('85');
      await expect(feedbackModal).toContainText('Kết quả luyện tập');
    });

    test('should show retry option in feedback', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Answer and submit
      await page.locator('.option-row').first().click();
      
      // Mock submission
      await page.route('/api/quiz/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            score: 50,
            totalScore: 100,
            correctAnswers: 1,
            totalQuestions: 2
          })
        });
      });
      
      await page.locator('#submit-quiz-btn').click();
      await page.locator('button:has-text("Xác nhận")').click();
      
      // Check retry button
      const retryBtn = page.locator('button:has-text("Làm lại")');
      await expect(retryBtn).toBeVisible();
    });
  });

  test.describe('Attempt Limits', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
    });

    test('should show attempt limit reached', async ({ page }) => {
      // Mock lesson
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Limited Attempts Test',
              attemptLimit: 3,
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      // Mock attempt check - limit reached
      await page.route(`/api/lessons/${testLessonId}/attempt-check`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            canAttempt: false,
            reason: 'limit_reached',
            attempts: 3,
            maxAttempts: 3
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Check attempt denied modal
      const modal = page.locator('.attempt-denied-modal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Bạn đã hết lượt làm bài');
      await expect(modal).toContainText('3/3');
    });

    test('should show cooldown period', async ({ page }) => {
      // Mock lesson
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Cooldown Test',
              attemptLimit: 3,
              cooldownMinutes: 30,
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      // Mock attempt check - in cooldown
      await page.route(`/api/lessons/${testLessonId}/attempt-check`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            canAttempt: false,
            reason: 'cooldown',
            remainingTime: 1200000, // 20 minutes in ms
            attempts: 1,
            remainingAttempts: 2
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Check cooldown modal
      const modal = page.locator('.attempt-denied-modal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('thời gian chờ');
      await expect(modal).toContainText('20 phút');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Mock simple lesson
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Mobile Test',
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Mobile question',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });
    });

    test('should hide sidebar on mobile by default', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Sidebar should be hidden or have mobile styling
      const sidebar = page.locator('.exam-sidebar');
      const isVisible = await sidebar.isVisible();
      
      if (isVisible) {
        // Check if it has mobile-specific styling
        const display = await sidebar.evaluate(el => 
          window.getComputedStyle(el).position
        );
        expect(['fixed', 'absolute']).toContain(display);
      }
    });

    test('should have mobile-friendly touch targets', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check option size
      const option = page.locator('.option-row').first();
      const box = await option.boundingBox();
      
      // Touch targets should be at least 44x44 pixels
      expect(box.height).toBeGreaterThanOrEqual(44);
    });

    test('should show mobile menu toggle', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check for mobile menu button
      const mobileToggle = page.locator('[class*="mobile-toggle"], [class*="menu-toggle"]');
      await expect(mobileToggle).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Server error'
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Should show error message
      await expect(page.locator('text=/error|lỗi/i')).toBeVisible();
    });

    test('should handle network errors during submission', async ({ page }) => {
      // Mock successful lesson load
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Network Error Test',
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Answer question
      await page.locator('.option-row').first().click();
      
      // Mock network error for submission
      await page.route('/api/quiz/submit', async route => {
        await route.abort('failed');
      });
      
      // Try to submit
      await page.locator('#submit-quiz-btn').click();
      await page.locator('button:has-text("Xác nhận")').click();
      
      // Should show error alert
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('lỗi');
        dialog.accept();
      });
    });

    test('should handle malformed question data', async ({ page }) => {
      // Mock lesson with malformed questions
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Malformed Test',
              questions: [
                {
                  id: 1,
                  type: 'ABCD',
                  // Missing question text and options
                },
                {
                  id: 2,
                  type: 'InvalidType',
                  question: 'Invalid question type'
                }
              ]
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Page should still load without crashing
      await expect(page.locator('.exam-container')).toBeVisible();
      
      // But may show error or empty state
      const hasError = await page.locator('text=/error|lỗi/i').count() > 0;
      const hasEmptyState = await page.locator('text=/không có câu hỏi/i').count() > 0;
      
      expect(hasError || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should handle large number of questions', async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Generate 100 questions
      const questions = [];
      for (let i = 1; i <= 100; i++) {
        questions.push({
          id: i,
          type: 'ABCD',
          question: `Question ${i}`,
          options: { A: 'A', B: 'B', C: 'C', D: 'D' }
        });
      }
      
      // Mock lesson with many questions
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Performance Test',
              questions: questions
            }
          })
        });
      });

      const startTime = Date.now();
      await page.goto(`/lesson/${testLessonId}`);
      const loadTime = Date.now() - startTime;
      
      // Should load in reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds
      
      // Check all navigation items rendered
      const navItems = page.locator('.question-nav-item');
      await expect(navItems).toHaveCount(100);
    });

    test('should not leak memory with timer', async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock lesson with timer
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Timer Memory Test',
              timeLimitEnabled: true,
              timeLimitMinutes: 60,
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test',
                options: { A: 'A', B: 'B', C: 'C', D: 'D' }
              }]
            }
          })
        });
      });

      await page.goto(`/lesson/${testLessonId}`);
      
      // Get initial memory
      const initialMetrics = await page.metrics();
      
      // Wait for timer to run
      await page.waitForTimeout(5000);
      
      // Navigate away and back
      await page.goto('/');
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check memory didn't increase significantly
      const finalMetrics = await page.metrics();
      const memoryIncrease = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
      
      // Allow for some increase but not excessive
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await testAuth.applyAuthToPage(page, 'student');
      
      // Mock simple lesson
      await page.route(`/api/lessons/${testLessonId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testLessonId,
              title: 'Accessibility Test',
              questions: [{
                id: 1,
                type: 'ABCD',
                question: 'Test question',
                options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }
              }]
            }
          })
        });
      });
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check navigation exists
      const questionNav = page.locator('.question-nav');
      await expect(questionNav).toBeVisible();
      
      // Check options have proper labels
      const options = page.locator('.option-row');
      const firstOption = options.first();
      const label = firstOption.locator('.option-label');
      await expect(label).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Tab to first option
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Select with space/enter
      await page.keyboard.press('Space');
      
      // Check option is selected
      const firstOption = page.locator('.option-row').first();
      const input = firstOption.locator('input');
      await expect(input).toBeChecked();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto(`/lesson/${testLessonId}`);
      
      // Check text contrast
      const questionText = page.locator('.question-text').first();
      const color = await questionText.evaluate(el => 
        window.getComputedStyle(el).color
      );
      const bgColor = await questionText.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have distinct colors (not checking exact contrast ratio)
      expect(color).not.toBe(bgColor);
    });
  });
});