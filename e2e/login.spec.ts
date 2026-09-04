import { expect, test } from '@playwright/test'

test('redirects visitors to the login page', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Bienvenido de nuevo!' }),
  ).toBeVisible()
  await expect(page.getByPlaceholder('usuario@empresa.cl')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
})
