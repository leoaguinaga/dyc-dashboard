import { expect, test } from '@playwright/test'

const landingBase = process.env.DYC_LANDING_BASE_URL

const routes = [
  '/',
  '/nosotros',
  '/portafolio',
  '/servicios/diseno-de-obras',
  '/servicios/ejecucion-de-obras',
  '/servicios/industrial',
  '/servicios/mantenimiento-y-remodelacion',
  '/servicios/publicidad-exterior',
  '/servicios/retail',
]

test.describe('responsive DYC landing pages', () => {
  test.skip(!landingBase, 'Set DYC_LANDING_BASE_URL to test the public site')

  for (const route of routes) {
    test(`${route} fits the viewport`, async ({ page }, testInfo) => {
      await page.goto(`${landingBase}${route}`)
      await page.evaluate(() => document.fonts.ready)

      await expect(page.locator('main h1').first()).toBeVisible()

      const overflow = await page.evaluate(() => ({
        body: document.body.scrollWidth - document.body.clientWidth,
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 5)
          .map((element) => ({
            tag: element.tagName,
            className: element.className?.toString().slice(0, 120),
            right: Math.round(element.getBoundingClientRect().right),
          })),
      }))

      expect(overflow.body, `horizontal overflow in ${route} on ${testInfo.project.name}: ${JSON.stringify(overflow.offenders)}`).toBe(0)
      expect(overflow.document).toBe(0)
    })
  }
})
