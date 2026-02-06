import { chromium } from 'playwright';

async function captureFigma() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Base URL without node-id
  const baseUrl = 'https://www.figma.com/design/fdtYoTsbipjSRFTfC5ymWI/Graduation-Project--AI-Powered-Smart-Gym-';

  // We'll navigate to the dashboard section and use the left panel to navigate
  console.log('Navigating to Figma...');

  try {
    await page.goto(`${baseUrl}?node-id=767-5504`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(10000);

    // Capture the first screen (Login) which is already selected
    await page.keyboard.press('Shift+1'); // Zoom to fit
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screens/01-login.png' });
    console.log('1. Login captured');

    // Try using the layers panel - click on the left sidebar to expand layers
    // First, let's look for the "Dashboard" section in layers

    // Click on the layers panel icon or area
    await page.mouse.click(30, 400); // Left sidebar area
    await page.waitForTimeout(1000);

    // Now let's try navigating with keyboard - press Tab to go to next sibling frame
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('Shift+1');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screens/02-screen.png' });
    console.log('2. Second screen captured');

    // Continue with Tab
    for (let i = 3; i <= 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await page.keyboard.press('Shift+1');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `screens/${String(i).padStart(2, '0')}-screen.png` });
      console.log(`${i}. Screen captured`);
    }

    console.log('\nAll screens captured!');

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

captureFigma();
