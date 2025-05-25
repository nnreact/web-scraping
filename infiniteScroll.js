  // Scroll to the bottom of the page to load all hotels
  let previousHeight;
  try {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      while (true) {
          await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
          await page.waitForTimeout(2000); // Wait for 2 seconds
          let newHeight = await page.evaluate('document.body.scrollHeight');
          if (newHeight === previousHeight) break;
          previousHeight = newHeight;
      }
  } catch (e) {
      console.log('Error during scrolling:', e);
  }