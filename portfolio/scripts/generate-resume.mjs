import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve against portfolio/public regardless of the cwd the script runs from.
const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
await mkdir(publicDir, { recursive: true });

const locales = [
    { url: 'http://localhost:3000/pt/resume', out: resolve(publicDir, 'resume-pt.pdf') },
    { url: 'http://localhost:3000/en/resume', out: resolve(publicDir, 'resume-en.pdf') },
];

const browser = await puppeteer.launch();

for (const { url, out } of locales) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Remove banner de cookies
    await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const reject = buttons.find(b => b.textContent?.match(/recusar|reject|deny|decline/i));
        if (reject) reject.click();
        document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"]')
            .forEach(el => el.remove());
    });

    await new Promise(r => setTimeout(r, 500));

    // PDF-only overrides: hide .no-pdf elements, underline every link,
    // use the same inner padding on all sides, and lay the sections out as
    // plain blocks so Chrome can split long sections across pages instead of
    // pushing a whole experience to the next page.
    await page.addStyleTag({
        content: `
            .no-pdf { display: none !important; }
            main > div { padding: 1.5rem !important; }
            #resume-content a {
                text-decoration: underline !important;
                text-underline-offset: 2px;
            }
            #resume-content { display: block !important; }
            #resume-content > * + * { margin-top: 2rem; }
            #resume-content section > .grid { display: block !important; }
        `
    });

    await page.pdf({
        path: out,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    console.log(`✅ Gerado: ${out}`);
    await page.close();
}

await browser.close();