import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export class LoginPage extends BasePage {
  async goto() { await this.page.goto('/auth/login'); }
  async login(email: string, pass: string) {
    await this.page.locator('[data-test="email"]').fill(email);
    await this.page.locator('[data-test="password"]').fill(pass);
    await this.page.locator('[data-test="login-submit"]').click();
  }
  async getErrorMessage(): Promise<Locator> { return this.page.locator('.alert-danger'); }
}
