import { expect, test } from '@playwright/test'

test.describe('responsive public shell', () => {
  test('keeps login usable without horizontal overflow', async ({ page }, testInfo) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo!' })).toBeVisible()
    const submitButton = page.getByRole('button', { name: 'Ingresar' })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeInViewport()

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))

    expect(overflow, `horizontal overflow in ${testInfo.project.name}`).toEqual({
      body: 0,
      document: 0,
    })

    const form = page.locator('form')
    await expect(form).toBeInViewport()

    if (testInfo.project.use.hasTouch) {
      const controls = [
        page.getByPlaceholder('usuario@empresa.cl'),
        page.locator('input[type="password"]'),
        page.getByRole('button', { name: 'Mostrar contraseña' }),
        page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }),
        submitButton,
      ]

      for (const control of controls) {
        const box = await control.boundingBox()
        expect(box?.height, `touch target height in ${testInfo.project.name}`).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('protected routes preserve the responsive login redirect', async ({ page }) => {
    for (const route of ['/dashboard', '/proyectos', '/solicitudes', '/pagos', '/ayuda']) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
    }
  })
})
