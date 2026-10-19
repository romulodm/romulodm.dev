import type { TechLogo } from "@/lib/tech-logos"

interface TechLogoIconProps {
    logo: TechLogo
    /** Size classes, applied to every variant. */
    className: string
    /**
     * Next to a visible label the logo adds nothing for a screen reader, so it
     * gets an empty alt instead of repeating the name.
     */
    decorative?: boolean
}

/**
 * Draws one entry of lib/tech-logos.ts: a simpleicons <img>, or the inline SVG
 * for the few logos the CDN does not have in a recognisable form.
 *
 * Logos with a per-theme variant render both copies and let the `dark:`
 * classes pick one. Switching in CSS rather than reading the theme in React
 * keeps this usable from server components and avoids the wrong logo flashing
 * before the theme is known on the client. The hidden copy of an <img> is not
 * fetched until it is shown, because both are `loading="lazy"` and a
 * display:none image never enters the viewport.
 *
 * No "use client": it has no state or effects, so it renders on the server for
 * the Stack section and inside client components (the featured project chips)
 * alike.
 */
export default function TechLogoIcon({ logo, className, decorative = false }: TechLogoIconProps) {
    const hasDarkVariant = !!(logo.srcDark || logo.svgDark)
    const alt = decorative ? "" : logo.name

    if (logo.svgLight) {
        return (
            <>
                <span
                    role={decorative ? undefined : "img"}
                    aria-label={decorative ? undefined : logo.name}
                    aria-hidden={decorative || undefined}
                    className={`block ${className} [&>svg]:h-full [&>svg]:w-full ${hasDarkVariant ? "dark:hidden" : ""}`}
                    dangerouslySetInnerHTML={{ __html: logo.svgLight }}
                />
                {logo.svgDark && (
                    <span
                        role={decorative ? undefined : "img"}
                        aria-label={decorative ? undefined : logo.name}
                        aria-hidden={decorative || undefined}
                        className={`hidden ${className} [&>svg]:h-full [&>svg]:w-full dark:block`}
                        dangerouslySetInnerHTML={{ __html: logo.svgDark }}
                    />
                )}
            </>
        )
    }

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element -- CDN glyph shared with other sections by URL; the optimizer would give each size its own URL and defeat the shared cache */}
            <img
                className={`${className} object-contain ${hasDarkVariant ? "dark:hidden" : ""}`}
                src={logo.src}
                alt={alt}
                loading="lazy"
            />
            {logo.srcDark && (
                // eslint-disable-next-line @next/next/no-img-element -- see above
                <img
                    className={`hidden ${className} object-contain dark:block`}
                    src={logo.srcDark}
                    alt={alt}
                    loading="lazy"
                />
            )}
        </>
    )
}
