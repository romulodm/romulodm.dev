import { wrapper, ctaButton, unsubscribeRow, DEFAULT_ACCENT } from "../base";
import { CampaignTemplateOptions, PostMeta } from "../types";

// ─── Post card block ──────────────────────────────────────────────────────────

function renderTags(tags: string[], accent: string): string {
  if (!tags.length) return "";

  const pills = tags
    .map(
      (tag) =>
        `<span style="display:inline-block;padding:3px 10px;
                      background-color:#fff8f5;border:1px solid #fde8dc;
                      border-radius:100px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      font-size:11px;font-weight:600;color:${accent};
                      letter-spacing:0.3px;margin:0 4px 6px 0;
                      text-transform:lowercase;">
          #${tag}
        </span>`
    )
    .join("");

  return `<div style="margin-bottom:16px;line-height:1;">${pills}</div>`;
}

function renderHeroImage(imageUrl: string): string {
  return `
  <tr>
    <td style="padding:0 40px 0;">
      <img src="${imageUrl}" alt="Cover image"
           width="520"
           style="width:100%;max-width:520px;height:auto;display:block;
                  border-radius:10px;border:1px solid #ede9e4;object-fit:cover;" />
    </td>
  </tr>`;
}

function renderPostCard(post: PostMeta, accent: string): string {
  const cta = ctaButton(post.url, post.ctaLabel ?? "Ler artigo completo", accent);
  const tags = post.tags?.length ? renderTags(post.tags, accent) : "";

  return `
  ${post.imageUrl ? renderHeroImage(post.imageUrl) : ""}
  <tr>
    <td style="padding:${post.imageUrl ? "28px" : "40px"} 40px 32px;">
      ${tags}
      <h2 style="margin:0 0 12px;font-family:'Georgia',serif;
                 color:#1a1412;font-size:22px;font-weight:700;
                 line-height:1.3;letter-spacing:-0.3px;">
        ${post.title}
      </h2>
      ${
        post.summary
          ? `<p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      color:#6b6460;font-size:15px;line-height:1.65;">
               ${post.summary}
             </p>`
          : ""
      }
      ${cta}
    </td>
  </tr>`;
}

// ─── Tracking pixel ───────────────────────────────────────────────────────────

function renderTrackingPixel(url: string): string {
  return `
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="${url}" width="1" height="1" alt=""
           style="display:block;border:0;" />
    </td>
  </tr>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function campaignTemplate(opts: CampaignTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;

  const contentBlock = opts.post
    ? renderPostCard(opts.post, accent)
    : `
  <tr>
    <td style="padding:40px 40px 32px;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
               color:#4a4440;font-size:16px;line-height:1.7;">
      ${opts.content ?? ""}
    </td>
  </tr>`;

  const disclaimer = `
  <tr>
    <td style="padding:0 40px 24px;text-align:center;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#c8c0b8;font-size:11px;line-height:1.5;">
        Você está recebendo este e-mail porque se inscreveu em ${opts.brand.name}.
      </p>
    </td>
  </tr>`;

  const body = `
  ${contentBlock}
  ${disclaimer}
  ${unsubscribeRow(opts.unsubscribeUrl)}
  ${opts.trackingPixelUrl ? renderTrackingPixel(opts.trackingPixelUrl) : ""}`;

  return wrapper(body, opts.brand);
}
