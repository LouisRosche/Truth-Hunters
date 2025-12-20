/**
 * Visual Regression Tests
 * Captures screenshots and compares them to baselines
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('Setup Screen - Initial state', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot of entire setup screen
    await expect(page).toHaveScreenshot('setup-screen.png', {
      fullPage: true,
    });
  });

  test('Setup Screen - With team name entered', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Fill in team name
    const teamNameInput = page.getByRole('textbox', { name: /team name/i });
    await teamNameInput.fill('Test Team');

    // Screenshot after input
    await expect(page).toHaveScreenshot('setup-screen-with-name.png');
  });

  test('Setup Screen - Player selection', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Add a player
    const addPlayerButton = page.getByRole('button', { name: /add player/i });
    if (await addPlayerButton.isVisible()) {
      await addPlayerButton.click();

      // Fill in player name
      const playerNameInput = page.getByRole('textbox', { name: /player.*name/i }).first();
      await playerNameInput.fill('Maya');

      await expect(page).toHaveScreenshot('setup-screen-with-player.png');
    }
  });

  test('Setup Screen - Difficulty selector', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on difficulty selector (UI uses Beginner, Standard, Expert, Progressive)
    const standardButton = page.getByRole('button', { name: /standard/i });

    if (await standardButton.isVisible()) {
      await standardButton.click();
      await expect(page).toHaveScreenshot('setup-screen-difficulty-selected.png');
    }
  });

  test('Header - Normal mode', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Screenshot just the header
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-normal.png');
  });

  test('Header - With toggled presentation mode', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find and click presentation mode toggle
    const presentationButton = page.getByRole('button', { name: /presentation|group|large/i });
    if (await presentationButton.isVisible()) {
      await presentationButton.click();

      // Wait for presentation mode to apply
      await page.waitForTimeout(300);

      const header = page.locator('header');
      await expect(header).toHaveScreenshot('header-presentation-mode.png');
    }
  });

  test('Mobile viewport - Setup screen', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.waitForLoadState('networkidle');

      // Mobile-specific screenshot
      await expect(page).toHaveScreenshot('setup-screen-mobile.png', {
        fullPage: true,
      });
    } else {
      test.skip();
    }
  });

  test('Dark mode compatibility', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Force dark mode (assuming CSS uses prefers-color-scheme)
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page).toHaveScreenshot('setup-screen-dark-mode.png', {
      fullPage: true,
    });
  });

  test('Error boundary - if triggered', async ({ page }) => {
    // This test would need to trigger an error
    // For now, it's a placeholder for error state visual testing
    test.skip('Error boundary visual testing requires error trigger mechanism');
  });
});

test.describe('Presentation Mode Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Enable presentation mode
    const presentationButton = page.getByRole('button', { name: /presentation|group|large/i });
    if (await presentationButton.isVisible()) {
      await presentationButton.click();
      await page.waitForTimeout(300); // Wait for animation
    }
  });

  test('Presentation mode - Text sizing', async ({ page }) => {
    await expect(page).toHaveScreenshot('presentation-mode-full.png', {
      fullPage: true,
    });
  });
});

test.describe('Accessibility Visual Tests', () => {
  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to first focusable element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('focus-indicator-first-element.png');

    // Tab to second element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('focus-indicator-second-element.png');
  });

  test('High contrast mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Emulate high contrast
    await page.emulateMedia({ forcedColors: 'active' });

    await expect(page).toHaveScreenshot('setup-screen-high-contrast.png', {
      fullPage: true,
    });
  });
});
