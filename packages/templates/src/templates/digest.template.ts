import { wrapper, greetingRow, ctaButton, DEFAULT_ACCENT } from "../base";
import { getStrings } from "../i18n";
import type { DigestTemplateOptions, DigestPost } from "../types";

// ─── Single post block ────────────────────────────────────────────────────────

function renderDigestPost(
    post: DigestPost,
    accent: string,
    ctaLabel: string,
    isLast: boolean,
): string {
    const divider = isLast
        ? ""
        : `<tr><td style="padding:0 36px;">
         <hr style="border:none;border-top:1px solid #ede9e4;margin:0;" />
       </td></tr>`;

    return `
  ${post.imageUrl
            ? `<tr><td style="padding:28px 36px 0;">
         <img src="${post.imageUrl}" alt="Cover" width="528"
              style="width:100%;max-width:528px;height:200px;object-fit:cover;
                     display:block;border-radius:10px;border:1px solid #ede9e4;" />
       </td></tr>`
            : `<tr><td style="padding:28px 0 0;"></td></tr>`
        }
  <tr>
    <td style="padding:16px 36px 28px;font-family:'Inter',sans-serif;">
      ${post.tags?.length
            ? post.tags.map((tag) =>
                `<span style="display:inline-block;padding:3px 10px;
                          background-color:#fff8f5;border:1px solid #fde8dc;
                          border-radius:100px;font-size:11px;font-weight:600;
                          color:${accent};letter-spacing:0.3px;
                          margin:0 4px 10px 0;text-transform:lowercase;">
               #${tag}
             </span>`,
            ).join("")
            : ""
        }
      <h2 style="margin:0 0 8px;font-family:'Inter',sans-serif;
                 color:#1a1412;font-size:19px;font-weight:700;
                 line-height:1.3;letter-spacing:-0.3px;">
        ${post.title}
      </h2>
      ${post.summary
            ? `<p style="margin:0;font-family:'Inter',sans-serif;
                     color:#6b6460;font-size:15px;line-height:1.65;">
             ${post.summary}
           </p>`
            : ""
        }
      ${ctaButton(post.url, ctaLabel, accent)}
    </td>
  </tr>
  ${divider}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function digestTemplate(opts: DigestTemplateOptions): string {
    const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;
    const s = getStrings(opts.recipient.locale);

    const postsHtml = opts.posts
        .map((post, i) =>
            renderDigestPost(post, accent, s.readArticle, i === opts.posts.length - 1),
        )
        .join("\n");

    const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  ${postsHtml}
  ${opts.trackingPixelUrl
            ? `<tr><td style="padding:0;line-height:0;font-size:0;">
         <img src="${opts.trackingPixelUrl}" width="1" height="1" alt=""
              style="display:block;border:0;" />
       </td></tr>`
            : ""
        }`;

    return wrapper(body, opts.brand, opts.unsubscribeUrl, opts.recipient.locale, opts.previewText);
}