import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
export class RegisterPage extends BasePage {
  async goto() { await this.page.goto('/auth/register'); }
  async registerNewUser(d: any) {
    await this.page.locator('[data-test="first-name"]').fill(d.firstName);
    await this.page.locator('[data-test="last-name"]').fill(d.lastName);
    await this.page.locator('[data-test="dob"]').fill(d.dob);
    await this.page.locator('[data-test="address"]').fill(d.street);
    await this.page.locator('[data-test="postcode"]').fill(d.postcode);
    await this.page.locator('[data-test="city"]').fill(d.city);
    await this.page.locator('[data-test="state"]').fill(d.state);
    await this.page.locator('[data-test="country"]').selectOption(d.country);
    await this.page.locator('[data-test="phone"]').fill(d.phone);
    await this.page.locator('[data-test="email"]').fill(d.email);
    await this.page.locator('[data-test="password"]').fill(d.pass);
    await this.page.locator('[data-test="register-submit"]').click();
  }
}
