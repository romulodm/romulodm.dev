import puppeteer from 'puppeteer';
import { resolve } from 'node:path';

// Exports a blog post as an A4 PDF in the light theme, with only the article:
// cover, tags, title, byline, summary and body (images and code blocks
// included). Navbar, sidebars, comments, footer and cookie banner are left out.
//
// Usage:
//   node scripts/export-post-pdf.mjs <slug | post URL> [pt|en] [output.pdf]
//
// With a slug it reads from http://localhost:3000 (run `npm run dev` first);
// set BASE_URL to use another host, e.g. BASE_URL=https://romulodm.dev.
// A full post URL (copied from the address bar) carries host, locale and slug,
// so the locale argument is not needed. Run with no arguments to list the
// slugs the blog page links to.

const LOCALES = ['pt', 'en'];
const args = process.argv.slice(2);

let baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
let slug;
let locale = 'pt';
let outArg;

if (/^https?:\/\//.test(args[0] ?? '')) {
    const parsed = new URL(args[0]);
    const match = parsed.pathname.match(/^\/(pt|en)\/blog\/([^/]+)\/?$/);
    if (!match) {
        console.error(`Not a post URL: ${args[0]} (expected /<pt|en>/blog/<slug>)`);
        process.exit(1);
    }
    baseUrl = parsed.origin;
    [, locale, slug] = match;
    slug = decodeURIComponent(slug);
    outArg = args[1];
} else {
    // A lone "pt"/"en" is a locale typed without the slug, not a slug.
    if (args.length === 1 && LOCALES.includes(args[0])) {
        locale = args[0];
    } else {
        [slug, locale = 'pt', outArg] = args;
    }
}

if (!LOCALES.includes(locale)) {
    console.error(`Unknown locale "${locale}". Use pt or en.`);
    process.exit(1);
}

const url = slug ? `${baseUrl}/${locale}/blog/${encodeURIComponent(slug)}` : null;
const out = slug ? resolve(process.cwd(), outArg ?? `post-${slug}-${locale}.pdf`) : null;

// Slugs linked from the blog index, to show when no slug (or a wrong one) is given.
async function listSlugs(page) {
    await page.goto(`${baseUrl}/${locale}/blog`, { waitUntil: 'networkidle0', timeout: 60_000 });
    const prefix = `/${locale}/blog/`;
    return page.evaluate((prefix) => {
        const slugs = new Set();
        document.querySelectorAll(`a[href^="${prefix}"]`).forEach((a) => {
            const rest = a.getAttribute('href').slice(prefix.length).split(/[?#]/)[0];
            if (rest && !rest.includes('/')) slugs.add(decodeURIComponent(rest));
        });
        return [...slugs].sort();
    }, prefix);
}

function printSlugs(slugs) {
    if (slugs.length === 0) {
        console.error(`No posts linked from ${baseUrl}/${locale}/blog.`);
        return;
    }
    console.error(`Posts on ${baseUrl}/${locale}/blog:`);
    slugs.forEach((s) => console.error(`  ${s}`));
    console.error('\nUsage: npm run export-post -- <slug> [pt|en] [output.pdf]');
}

const browser = await puppeteer.launch();

try {
    const page = await browser.newPage();

    // 2x so the srcset picks sharper images; the PDF keeps them at full resolution.
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    // next-themes (attribute="class") reads localStorage.theme before hydrating,
    // so setting it before any page script runs avoids a dark first paint.
    // prefers-color-scheme covers the "system" fallback as well.
    await page.evaluateOnNewDocument(() => {
        try { localStorage.setItem('theme', 'light'); } catch { /* cross-origin frame */ }
    });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

    if (!url) {
        printSlugs(await listSlugs(page));
        process.exitCode = 1;
    } else {
        await exportPost(page);
    }
} finally {
    await browser.close();
}

async function exportPost(page) {
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });
    if (!response) throw new Error(`GET ${url} returned no response`);

    // notFound() in a streamed page answers 200, so the status alone does not
    // catch a wrong slug. The post body only exists on a real post.
    if (!response.ok() || !(await page.$('#post-body'))) {
        console.error(`Post not found: ${url} (HTTP ${response.status()})\n`);
        printSlugs(await listSlugs(page));
        process.exitCode = 1;
        return;
    }

    // Post body images are loading="lazy" (lib/rehype-media-images.ts). Make
    // them eager, scroll through the page for good measure, then wait until
    // every image and web font has finished loading.
    await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
            img.loading = 'eager';
        });

        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 100));
        }
        window.scrollTo(0, 0);

        await Promise.all(
            Array.from(document.images).map((img) =>
                img.complete
                    ? Promise.resolve()
                    : new Promise((r) => {
                          img.addEventListener('load', r, { once: true });
                          img.addEventListener('error', r, { once: true });
                      }),
            ),
        );
        await document.fonts.ready;
    });

    // A YouTube iframe prints as a black box. Swap it for the video thumbnail
    // linked to the video.
    await page.evaluate(() => {
        document.querySelectorAll('article iframe[src*="youtube"]').forEach((iframe) => {
            const id = iframe.src.match(/\/embed\/([^?/]+)/)?.[1];
            if (!id) return;
            const link = document.createElement('a');
            link.href = `https://www.youtube.com/watch?v=${id}`;
            const thumb = document.createElement('img');
            thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            thumb.alt = iframe.title;
            thumb.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
            link.append(thumb);
            iframe.replaceWith(link);
        });
    });
    await page.waitForNetworkIdle({ idleTime: 300, timeout: 15_000 }).catch(() => {});

    await page.addStyleTag({
        content: `
            /* Everything that is not the article. */
            nav:not(article *), footer:not(article *),
            :has(> main) > aside,           /* reactions sidebar and RightSidebar */
            nextjs-portal,                  /* dev-mode indicator */
            #comments-section,
            article .md\\:hidden,           /* PostStatsMobile: the print width is below md */
            [data-code-copy] { display: none !important; }

            /* The article fills the page: no centered column, no top offset
               for the fixed navbar, no card shadow. */
            :has(> main) { padding: 0 !important; margin: 0 !important; max-width: none !important; }
            main { max-width: none !important; padding: 0 !important; }
            article { box-shadow: none !important; }

            /* Keep images, code blocks and figures whole when they fit on a page. */
            img, figure, pre, .code-block, blockquote, table { break-inside: avoid; }
            h1, h2, h3, h4 { break-after: avoid; }
        `,
    });

    // Fixed-position leftovers (cookie banner, toasts, back-to-top) would be
    // stamped on every page.
    await page.evaluate(() => {
        document.querySelectorAll('body *').forEach((el) => {
            if (getComputedStyle(el).position === 'fixed') el.style.setProperty('display', 'none', 'important');
        });
    });

    await page.pdf({
        path: out,
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
            <div style="width:100%;font-size:8px;color:#888;padding:0 12mm;display:flex;justify-content:space-between;">
                <span>${url.replace(/^https?:\/\//, '')}</span>
                <span><span class="pageNumber"></span>/<span class="totalPages"></span></span>
            </div>`,
    });

    console.log(`PDF written to ${out}`);
}
