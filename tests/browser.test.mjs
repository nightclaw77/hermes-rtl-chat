import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sourcePath = process.argv[2] || fileURLToPath(new URL('../plugin.js', import.meta.url));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}) });
try {
  const page = await browser.newPage();
  await page.setContent(`<style>
    body { direction:ltr } .aui-md p {unicode-bidi:plaintext;text-align:start}
    [data-slot='aui_assistant-message-content'] .aui-md[dir] p {unicode-bidi:normal}
    [data-slot='group-chat-message-content'] { font-size:14px }
  </style>
  <div data-slot="group-chat-message-content"><div class="aui-md"><p id="fa"><span class="ref" data-ref="agent">@jarvis</span> لطفاً محیط اجرای برنامه را بررسی کن؛ مسیر <code>/home/demo/dev/paperclip</code> آماده است.</p></div></div>
  <div data-slot="group-chat-message-content"><div class="aui-md"><p id="en">Please check <code>/home/demo/dev/paperclip</code> before proceeding.</p></div></div>
  <div data-slot="aui_assistant-message-content"><div class="aui-md" dir="ltr"><p id="regular">این پاسخ فارسی برای بررسی خوانایی متن اصلی است.</p><pre id="fence"><code>const a = '/home/demo';</code></pre></div></div>
  <div id="outside"><p>این بخش تنظیمات است</p></div>`);
  if (sourcePath && existsSync(sourcePath)) {
    await page.evaluate(async source => {
      const plugin = (await import(URL.createObjectURL(new Blob([source], {type:'text/javascript'})))).default;
      window.disposers = [];
      plugin.register({onDispose:fn => window.disposers.push(fn)});
    }, readFileSync(sourcePath,'utf8'));
  }
  assert.equal(await page.locator('#fa').evaluate(el => getComputedStyle(el).direction), 'rtl', 'Persian bot message must resolve RTL even with an initial @mention');
  console.log('PASS Persian group message RTL');
  await page.evaluate(() => {
    const root = document.querySelector('[data-slot="group-chat-message-content"]');
    root.setAttribute('dir', 'rtl');
    root.insertAdjacentHTML('beforeend', '<pre id="group-fence"><code>const file = "/home/demo";</code></pre>');
  });
  await page.waitForTimeout(60);
  assert.equal(await page.locator('#group-fence').evaluate(el => getComputedStyle(el).direction), 'ltr', 'group fenced code must stay LTR even under an RTL parent');
  console.log('PASS group fenced code LTR');
  const css = selector => page.locator(selector).evaluate(el => ({dir:getComputedStyle(el).direction, bidi:getComputedStyle(el).unicodeBidi, align:getComputedStyle(el).textAlign}));
  assert.equal((await css('#en')).dir, 'ltr');
  console.log('PASS English paragraph LTR');
  assert.equal((await css('#regular')).dir, 'rtl');
  console.log('PASS normal assistant chat RTL');
  assert.equal((await css('#fa code')).dir, 'ltr');
  assert.equal((await css('#fa code')).bidi, 'isolate');
  assert.equal((await css('#fa [data-ref]')).dir, 'ltr');
  assert.equal((await css('#fa [data-ref]')).bidi, 'isolate');
  console.log('PASS code and mentions isolated');
  assert.equal(await page.locator('#outside [data-hermes-rtl-chat]').count(), 0);
  console.log('PASS non-chat UI untouched');
  const original = await page.locator('#fa').textContent();
  assert.equal(original, '@jarvis لطفاً محیط اجرای برنامه را بررسی کن؛ مسیر /home/demo/dev/paperclip آماده است.');
  console.log('PASS original mixed text preserved');
  await page.evaluate(() => {
    document.querySelector('[data-slot="group-chat-message-content"]').insertAdjacentHTML('beforeend', '<p id="late">این پاسخ جدید بات برای بررسی اعمال زنده جهت متن است.</p>');
  });
  await page.waitForFunction(() => document.querySelector('#late').getAttribute('data-hermes-rtl-chat') === 'rtl');
  console.log('PASS newly arriving message');
  await page.locator('#late').evaluate(el => el.firstChild.nodeValue = 'This streamed paragraph is now entirely English.');
  await page.waitForFunction(() => document.querySelector('#late').getAttribute('data-hermes-rtl-chat') === 'ltr');
  console.log('PASS streaming text direction updates');
  // Real Chromium selection, not text reconstructed by the test.
  const selected = await page.locator('#fa').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    return selection.toString();
  });
  assert.equal(selected, original);
  console.log('PASS selected/copyable text remains unchanged');
  await page.evaluate(() => {
    document.querySelector('[data-slot="group-chat-message-content"]').insertAdjacentHTML('beforeend', '<p id="pending">این پاسخ نباید پس از خاموش کردن دوباره علامت بخورد.</p>');
    window.disposers.forEach(fn => fn());
  });
  await page.waitForTimeout(80);
  assert.equal(await page.locator('[data-hermes-rtl-chat]').count(), 0);
  assert.equal(await page.locator('#hermes-rtl-chat-style').count(), 0);
  assert.equal(await page.locator('#fa').textContent(), original);
  console.log('PASS disable restores presentation and cancels pending work');
  console.log('TOTAL: 11 behavioral checks PASS (real Chromium, isolated fixture)');
} finally { await browser.close(); }
