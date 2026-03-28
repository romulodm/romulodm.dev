import puppeteer from 'puppeteer';

const locales = [
    { url: 'http://localhost:3000/pt/resume', out: 'public/resume-pt.pdf' },
    { url: 'http://localhost:3000/en/resume', out: 'public/resume-en.pdf' },
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

    // Oculta elementos marcados com no-pdf
    await page.addStyleTag({
        content: ` .no-pdf { display: none !important; }`
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