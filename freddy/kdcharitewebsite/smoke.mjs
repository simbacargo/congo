import { chromium } from '@playwright/test';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:4173/programs', { waitUntil: 'networkidle' });
// Faith tab → church list with new DRC names + translated denomination
await page.getByRole('button', { name: 'The Faith Network' }).click();
await page.waitForTimeout(400);
const church = await page.getByText('Cathédrale Saints Pierre et Paul').first().isVisible();
const denomOk = await page.getByText('Catholic', { exact: false }).first().isVisible();
const bodyTxt = await page.evaluate(() => document.body.innerText);
console.log('DRC church visible:', church);
console.log('denomination label rendered:', denomOk);
console.log('no raw i18n keys leaked:', !/denominations\.|testimonials\.|ecosystem\./.test(bodyTxt));
console.log('no old US brands present:', !/Shell|Chevron|ExxonMobil/.test(bodyTxt));
console.log('errors:', errors.length ? JSON.stringify(errors) : 'none');
await browser.close();
