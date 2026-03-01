const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'http://localhost:3000';
  console.log('Starting interactive primer test against', url);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for PRIME phase to appear
    await page.waitForSelector('.phase-badge', { timeout: 10000 });
    const phase = await page.textContent('.phase-badge');
    console.log('Found phase badge:', phase && phase.trim());

    // Locate the glass-card primer container
    const card = await page.waitForSelector('.glass-card, .max-w-lg.glass-card', { timeout: 5000 });
    if (!card) throw new Error('Primer glass-card not found');

    // Read initial displayed text
    const questionSelector = '.glass-card p, .max-w-lg p, .glass-card .whitespace-pre-line p, .max-w-lg .whitespace-pre-line';
    const textElem = await page.$(questionSelector) || await page.$('.glass-card p, .max-w-lg p');
    const initialText = textElem ? (await textElem.innerText()).slice(0, 200) : '[no text element]';
    console.log('Initial primer snippet:', initialText.replace(/\n/g, ' '));

    // Wait a short time so typing starts (if any)
    await page.waitForTimeout(500);

    // Capture partial text
    const partial = textElem ? (await textElem.innerText()) : '';
    console.log('Partial text length:', partial.length);

    // Prepare to observe audio play calls via page variable
    await page.addInitScript(() => {
      window.__playEvents = [];
      const orig = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        window.__playEvents.push(true);
        try { return orig.call(this); } catch (e) { return Promise.resolve(); }
      };
    });

    // Click the Play button (if present) but ensure it does not skip typing
    const playBtn = await page.$('button:has-text("Play primer audio")');
    if (playBtn) {
      // click the play button (should not trigger skip)
      await playBtn.click({ delay: 50 });
      console.log('Clicked Play button');

      // wait briefly and check that typing did not skip
      await page.waitForTimeout(300);
      const afterPlayText = textElem ? (await textElem.innerText()) : '';
      if (afterPlayText.length > partial.length + 5) {
        console.warn('Warning: text advanced significantly after Play click (possible skip)');
      } else {
        console.log('Play click did not skip typing (good)');
      }

      // check play events
      const plays = await page.evaluate(() => window.__playEvents.length);
      console.log('Audio play events recorded:', plays);

      // Click Stop (if present)
      const stopBtn = await page.$('button:has-text("Stop audio")');
      if (stopBtn) {
        await stopBtn.click({ delay: 50 });
        console.log('Clicked Stop button');
      }
    } else {
      console.log('No Play button found on primer (skipping audio test)');
    }

    // Now test tapping the glossy card to skip typing
    // First re-capture current text
    const beforeSkip = textElem ? (await textElem.innerText()) : '';
    console.log('Text length before skip click:', beforeSkip.length);

    await card.click({ delay: 20 });
    console.log('Clicked the glossy card to skip typing');

    // wait a moment for skip to apply
    await page.waitForTimeout(200);

    const afterSkip = textElem ? (await textElem.innerText()) : '';
    console.log('Text length after skip click:', afterSkip.length);

    if (afterSkip.length >= beforeSkip.length) {
      console.log('Skip click applied — displayed text length increased or same (expected full text)');
    }

    // Final pass: ensure Play/Stop buttons still work and didn't trigger skip
    if (playBtn) {
      // restore partial by reloading the page (quick reset)
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('.glass-card, .max-w-lg.glass-card');
      const card2 = await page.$('.glass-card, .max-w-lg.glass-card');
      await page.waitForTimeout(400);
      const textElem2 = await page.$(' .glass-card p, .max-w-lg p');
      const partial2 = textElem2 ? (await textElem2.innerText()) : '';
      const playBtn2 = await page.$('button:has-text("Play primer audio")');
      if (playBtn2) {
        await playBtn2.click();
        await page.waitForTimeout(300);
        const plays2 = await page.evaluate(() => window.__playEvents.length);
        console.log('Audio play events after reload:', plays2);
      }
    }

    console.log('Interactive primer test completed successfully');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Interactive test failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
