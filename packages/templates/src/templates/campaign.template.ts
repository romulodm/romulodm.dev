import { wrapper, greetingRow, ctaButton, DEFAULT_ACCENT } from "../base";
import { getStrings } from "../i18n";
import { CampaignTemplateOptions, PostMeta } from "../types";

// ─── Animated "new post" banner ───────────────────────────────────────────────
//
// CSS animations work in Apple Mail, iOS Mail, Samsung Mail, and most
// webmail clients. Outlook (desktop) ignores @keyframes gracefully —
// the badge still shows, just without the pulse.

function renderNewPostBanner(label: string, accent: string): string {
  return `
  <tr>
    <td style="padding:0 36px 20px;">
      <!--[if !mso]><!-->
      <style>
        @keyframes rdm-pulse {
          0%   { opacity: 1;     transform: scale(1); }
          50%  { opacity: 0.75;  transform: scale(1.04); }
          100% { opacity: 1;     transform: scale(1); }
        }
        .rdm-new-post {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px 5px 8px;
          background: ${accent}18;
          border: 1px solid ${accent}44;
          border-radius: 100px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: ${accent};
          letter-spacing: 0.2px;
          animation: rdm-pulse 2.4s ease-in-out infinite;
        }
        .rdm-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${accent};
          flex-shrink: 0;
          animation: rdm-pulse 2.4s ease-in-out infinite;
        }
      </style>
      <span class="rdm-new-post">
        <span class="rdm-dot"></span>
        ${label}
      </span>
      <!--<![endif]-->
      <!--[if mso]>
      <span style="display:inline-block;padding:4px 12px;background:${accent}22;
                   border:1px solid ${accent}55;border-radius:12px;
                   font-family:Arial,sans-serif;font-size:12px;font-weight:700;
                   color:${accent};">
        ${label}
      </span>
      <![endif]-->
    </td>
  </tr>`;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function renderTags(tags: string[], accent: string): string {
  const pills = tags
    .map(
      (tag) =>
        `<span style="display:inline-block;padding:3px 10px;
                      background-color:#fff8f5;border:1px solid #fde8dc;
                      border-radius:100px;font-family:'Inter',sans-serif;
                      font-size:11px;font-weight:600;color:${accent};
                      letter-spacing:0.3px;margin:0 4px 6px 0;
                      text-transform:lowercase;">#${tag}</span>`,
    )
    .join("");
  return `<div style="margin-bottom:14px;line-height:1;">${pills}</div>`;
}

// ─── Post card ────────────────────────────────────────────────────────────────

function renderPostCard(post: PostMeta, accent: string, ctaLabel: string): string {
  return `
  ${post.imageUrl
      ? `<tr><td style="padding:0 36px 0;">
           <img src="${post.imageUrl}" alt="Cover" width="528"
                style="width:100%;max-width:528px;height:220px;object-fit:cover;
                       display:block;border-radius:10px;border:1px solid #ede9e4;" />
         </td></tr>`
      : ""
    }
  <tr>
    <td style="padding:${post.imageUrl ? "20px" : "4px"} 36px 32px;">
      ${post.tags?.length ? renderTags(post.tags, accent) : ""}
      <h2 style="margin:0 0 10px;font-family:'Inter',sans-serif;
                 color:#1a1412;font-size:20px;font-weight:700;
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
  </tr>`;
}

// ─── Tracking pixel ───────────────────────────────────────────────────────────

function renderTrackingPixel(url: string): string {
  return `<tr><td style="padding:0;line-height:0;font-size:0;">
    <img src="${url}" width="1" height="1" alt="" style="display:block;border:0;" />
  </td></tr>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function campaignTemplate(opts: CampaignTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;
  const s = getStrings(opts.recipient.locale);

  const contentBlock = opts.post
    ? `${renderNewPostBanner(s.newPostLabel, accent)}${renderPostCard(opts.post, accent, opts.post.ctaLabel ?? s.readArticle)}`
    : `<tr><td style="padding:4px 36px 32px;font-family:'Inter',sans-serif;
                      color:#4a4440;font-size:15px;line-height:1.7;">
         ${opts.content ?? ""}
       </td></tr>`;

  const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  ${contentBlock}
  ${opts.trackingPixelUrl ? renderTrackingPixel(opts.trackingPixelUrl) : ""}`;

  return wrapper(body, opts.brand, opts.unsubscribeUrl, opts.recipient.locale, opts.previewText);
}