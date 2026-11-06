import { expect, type Locator } from '@playwright/test';
import { BasePage, escapeRegExp } from '../pages/BasePage';

export class MainNavigation extends BasePage {
  rootLink(name: string): Locator {
    return this.$(this.s.navigation.rootLink)
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`, 'i') })
      .first();
  }

  async rootLinkTexts(): Promise<string[]> {
    return (await this.$(this.s.navigation.rootLink).allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  async openCategory(name: string): Promise<void> {
    const link = this.rootLink(name);
    const href = (await link.getAttribute('href')) ?? '';
    const norm = (p: string) => p.replace(/\/+$/, '').toLowerCase();
    const target = norm(new URL(href, this.cfg.baseURL).pathname);
    const flyout = this.$(this.s.navigation.flyout).locator('visible=true').first();
    await expect(async () => {
      await link.click();
      await Promise.race([
        this.page.waitForURL((u) => norm(u.pathname) === target, { timeout: 5_000 }),
        flyout.waitFor({ state: 'visible', timeout: 5_000 }),
      ]);
    }).toPass({ timeout: 30_000 });
    if (norm(new URL(this.page.url()).pathname) !== target) {
      const inFlyout = flyout.locator(`a[href="${href}"]`).first();
      await Promise.all([this.page.waitForURL((u) => norm(u.pathname) === target), inFlyout.click()]);
    }
  }

  async openFlyout(name: string): Promise<Locator> {
    const link = this.rootLink(name);
    await link.hover();
    const visible = this.$(this.s.navigation.flyout).locator('visible=true').first();
    if (!(await visible.isVisible().catch(() => false))) {
      await this.page.waitForTimeout(500);
      if (!(await visible.isVisible())) await link.click();
    }
    await expect(visible).toBeVisible();
    return visible;
  }

  // --- mobile ---
  async openMobileMenu(): Promise<Locator> {
    const toggle = this.$(this.s.header.mobileMenuToggle).locator('visible=true').first();
    await toggle.click();
    const oc = this.$(this.s.navigation.offcanvas).first();
    await expect(oc).toBeVisible();
    // Shopware lazy-loads the menu content (/widgets/menu/offcanvas)
    await expect(oc.locator('a').first()).toBeVisible();
    return oc;
  }
}
