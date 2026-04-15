
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.goto('http://localhost:3003/lesson/1775537465385');
  console.log('Page loaded...');
  try {
      await page.waitForSelector('#exam-guard-start-btn', { timeout: 3000 });
      console.log('Button found. Clicking...');
      await page.click('#exam-guard-start-btn');
      console.log('Clicked.');
      await new Promise(r => setTimeout(r, 1000));
      const isHidden = await page.evaluate(() => document.getElementById('exam-guard-overlay').classList.contains('hidden'));
      console.log('Overlay has hidden class:', isHidden);
  } catch (err) {
      console.error('Test error:', err);
  }
  await browser.close();
})();

