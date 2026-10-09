'use client'

// Hero of the /newsletter page: a pixel-art dusk landscape (same palette as the
// home hero sky and hills) clipped by a wave, with the sign-up form on top.
//
// Wide screens (xl+) draw everything inside one SVG so the wave and the two
// curved tickers share a single coordinate system and stay
// aligned at any width. Below xl the overlay would not fit inside the fixed
// aspect ratio (the title wraps and the form hits the curve), so the image
// becomes a background whose height follows the content instead.

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Mail } from 'lucide-react'

import { NewsletterSubscribeForm } from '@/components/newsletter/NewsletterSubscribeForm'
import duskValley from '@/public/newsletter/dusk-valley.webp'

interface NewsletterHeroProps {
    title: ReactNode
    description: string
    note: string
    benefits: string[]
}

// Geometry of the desktop SVG, in viewBox units (1440 x 680).
// The wave is lowest near the center (y ~598), which is where the mail pill sits.
const WAVE_PATH = 'M0,0 H1440 V500 C1160,580 900,612 690,598 C470,584 230,520 0,480 Z'
// The curve under the image reads as a pipeline: technology logos travel
// along the left half into the mail pill, and what the newsletter delivers
// (the benefits) comes out of it along the right half.
const TECH_PATH = 'M28,532 C240,572 470,620 714,636'
const BENEFITS_PATH = 'M726,636 C900,648 1160,622 1412,554'
const PILL_CENTER = { x: 720, y: 632 }
// One duration for both halves keeps the logos and the benefits text moving at
// the same speed. That only holds because the two paths have the same length
// (~694 units each): animateMotion covers the whole path per cycle, and the
// startOffset animation of the text also moves by 100% of its path per cycle.
// Changing either path means re-checking the other.
const FLOW_DURATION_S = 28

// Redis — classic stacked-layers logo (devicon). simpleicons only ships the
// 2024 rebrand mark, which is not the one people recognize.
const SVG_REDIS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#A41E11" d="M121.8 93.1c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.9-11.5 3.8-17.3 1S13 98.1 6.3 94.9c-3.3-1.6-5-2.9-5-4.2V78s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9v12.5c0 1.3-1.5 2.7-4.9 4.4z"/><path fill="#D82C20" d="M121.8 80.5C115.1 84 80.4 98.2 73 102.1c-7.4 3.9-11.5 3.8-17.3 1-5.8-2.8-42.7-17.7-49.4-20.9C-.3 79-.5 76.8 6 74.3c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.9z"/><path fill="#A41E11" d="M121.8 72.5C115.1 76 80.4 90.2 73 94.1c-7.4 3.8-11.5 3.8-17.3 1C49.9 92.3 13 77.4 6.3 74.2c-3.3-1.6-5-2.9-5-4.2V57.3s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9V68c0 1.3-1.5 2.7-4.9 4.5z"/><path fill="#D82C20" d="M121.8 59.8c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.8-11.5 3.8-17.3 1C49.9 79.6 13 64.7 6.3 61.5s-6.8-5.4-.3-7.9c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.9z"/><path fill="#A41E11" d="M121.8 51c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.8-11.5 3.8-17.3 1C49.9 70.9 13 56 6.3 52.8c-3.3-1.6-5.1-2.9-5.1-4.2V35.9s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9v12.5c.1 1.3-1.4 2.6-4.8 4.4z"/><path fill="#D82C20" d="M121.8 38.3C115.1 41.8 80.4 56 73 59.9c-7.4 3.8-11.5 3.8-17.3 1S13 43.3 6.3 40.1s-6.8-5.4-.3-7.9c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.8z"/><path fill="#fff" d="M80.4 26.1l-10.8 1.2-2.5 5.8-3.9-6.5-12.5-1.1 9.3-3.4-2.8-5.2 8.8 3.4 8.2-2.7L72 23zM66.5 54.5l-20.3-8.4 29.1-4.4z"/><ellipse fill="#fff" cx="38.4" cy="35.4" rx="15.5" ry="6"/><path fill="#7A0C00" d="M93.3 27.7l17.2 6.8-17.2 6.8z"/><path fill="#AD2115" d="M74.3 35.3l19-7.6v13.6l-1.9.8z"/></svg>`

// Same CDN and colors as the Stack section on the home page. Only logos with a
// fixed brand color are used: the monochrome ones (Next.js, Express, Vercel)
// would need a per-theme variant to stay visible on the tile.
const TECH_LOGOS = [
    { name: 'React', src: 'https://cdn.simpleicons.org/react/61DAFB' },
    { name: 'TypeScript', src: 'https://cdn.simpleicons.org/typescript/3178C6' },
    { name: 'Node.js', src: 'https://cdn.simpleicons.org/nodedotjs/339933' },
    { name: 'PostgreSQL', src: 'https://cdn.simpleicons.org/postgresql/4169E1' },
    { name: 'Docker', src: 'https://cdn.simpleicons.org/docker/2496ED' },
    // <image href> takes a URL, not markup, so the inline SVG goes in as a data URI.
    { name: 'Redis', src: `data:image/svg+xml,${encodeURIComponent(SVG_REDIS)}` },
    { name: 'Go', src: 'https://cdn.simpleicons.org/go/00ADD8' },
    { name: 'Python', src: 'https://cdn.simpleicons.org/python/3776AB' },
    { name: 'Tailwind CSS', src: 'https://cdn.simpleicons.org/tailwindcss/06B6D4' },
    { name: 'Kubernetes', src: 'https://cdn.simpleicons.org/kubernetes/326CE5' },
]

// Mobile wave, in objectBoundingBox units so it scales with the content height.
const WAVE_PATH_MOBILE = 'M0,0 H1 V0.88 C0.66,0.99 0.34,0.95 0,0.84 Z'

// SMIL animations ignore prefers-reduced-motion, so they are left out of the
// tree entirely when the visitor asked for less motion.
function usePrefersReducedMotion() {
    const [reduce, setReduce] = useState(false)
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReduce(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])
    return reduce
}

export function NewsletterHero(props: NewsletterHeroProps) {
    return (
        <>
            <HeroWide {...props} />
            <HeroCompact {...props} />
        </>
    )
}

function HeroWide({ benefits, ...content }: NewsletterHeroProps) {
    const reduceMotion = usePrefersReducedMotion()
    // Repeated so the text still covers the whole path while startOffset slides
    // from -100% to 0%.
    const benefitRun = Array.from({ length: 4 }, () => benefits).flat()

    return (
        <div className="relative hidden overflow-hidden rounded-[28px] xl:block">
            <svg viewBox="0 0 1440 680" className="block w-full" aria-hidden>
                <defs>
                    <clipPath id="nl-hero-wave">
                        <path d={WAVE_PATH} />
                    </clipPath>
                    <path id="nl-hero-benefits" d={BENEFITS_PATH} fill="none" />
                    {/* Overall darkening, stronger towards the valley. */}
                    <linearGradient id="nl-hero-shade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#000" stopOpacity="0.25" />
                        <stop offset="0.5" stopColor="#000" stopOpacity="0.4" />
                        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
                    </linearGradient>
                    {/* Extra shade right behind the copy: the pink horizon and the lit
                        hill flank sit exactly where the description and form are, and a
                        uniform overlay dark enough for them would kill the whole image. */}
                    <radialGradient id="nl-hero-focus" cx="720" cy="250" r="520" gradientUnits="userSpaceOnUse" gradientTransform="translate(720 250) scale(1 0.55) translate(-720 -250)">
                        <stop offset="0" stopColor="#000" stopOpacity="0.55" />
                        <stop offset="0.6" stopColor="#000" stopOpacity="0.3" />
                        <stop offset="1" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="nl-hero-edge" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#000" />
                        <stop offset="0.08" stopColor="#fff" />
                        <stop offset="0.92" stopColor="#fff" />
                        <stop offset="1" stopColor="#000" />
                    </linearGradient>
                    <mask id="nl-hero-edge-fade">
                        <rect width="1440" height="680" fill="url(#nl-hero-edge)" />
                    </mask>
                </defs>

                {/* xMidYMax keeps the river and the hills; the crop falls on the empty sky. */}
                <image
                    href={duskValley.src}
                    width="1440"
                    height="680"
                    preserveAspectRatio="xMidYMax slice"
                    clipPath="url(#nl-hero-wave)"
                    style={{ imageRendering: 'pixelated' }}
                />
                <g clipPath="url(#nl-hero-wave)">
                    <rect width="1440" height="680" fill="url(#nl-hero-shade)" />
                    <rect width="1440" height="680" fill="url(#nl-hero-focus)" />
                </g>

                <g mask="url(#nl-hero-edge-fade)" style={{ fontSize: 18, fontWeight: 500 }}>
                    {/* Static tiles would pile up at the start of the path, so with
                        reduced motion the logos are simply left out. */}
                    {!reduceMotion &&
                        TECH_LOGOS.map((logo, i) => (
                            <g key={logo.name}>
                                <rect x="-16" y="-16" width="32" height="32" rx="9" className="fill-card stroke-border" />
                                <image href={logo.src} x="-9" y="-9" width="18" height="18" preserveAspectRatio="xMidYMid meet" />
                                <animateMotion
                                    dur={`${FLOW_DURATION_S}s`}
                                    begin={`-${((i * FLOW_DURATION_S) / TECH_LOGOS.length).toFixed(2)}s`}
                                    repeatCount="indefinite"
                                    path={TECH_PATH}
                                    rotate="0"
                                />
                            </g>
                        ))}

                    {benefitRun.length > 0 && (
                        <text className="text-foreground" fill="currentColor" fillOpacity={0.8}>
                            <textPath href="#nl-hero-benefits" startOffset="0%">
                                {benefitRun.map((benefit, i) => (
                                    <tspan key={i}>
                                        <tspan className="text-primary" fill="currentColor">
                                            {'●'}
                                        </tspan>
                                        {`  ${benefit}      `}
                                    </tspan>
                                ))}
                                {!reduceMotion && (
                                    <animate attributeName="startOffset" from="-100%" to="0%" dur={`${FLOW_DURATION_S}s`} repeatCount="indefinite" />
                                )}
                            </textPath>
                        </text>
                    )}
                </g>

                {/* Drawn last so both tickers slide under it. */}
                <g transform={`translate(${PILL_CENTER.x},${PILL_CENTER.y})`}>
                    <rect x="-58" y="-26" width="116" height="52" rx="26" fill="#111" />
                    <Mail x={-11} y={-11} width={22} height={22} strokeWidth={1.75} color="rgba(255,255,255,0.92)" />
                </g>
            </svg>

            <div className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-[6%] text-center">
                <HeroContent {...content} />
            </div>
        </div>
    )
}

function HeroCompact(content: NewsletterHeroProps) {
    return (
        <div className="relative xl:hidden">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <div className="absolute inset-0" style={{ clipPath: 'url(#nl-hero-wave-m)' }}>
                    <Image
                        src={duskValley}
                        alt=""
                        fill
                        sizes="100vw"
                        placeholder="blur"
                        className="object-cover object-bottom"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/55" />
                </div>
            </div>

            <div className="relative flex flex-col items-center px-5 pb-36 pt-14 text-center sm:px-10">
                <HeroContent {...content} />
                <BenefitList benefits={content.benefits} />
            </div>

            <svg className="absolute h-0 w-0" aria-hidden>
                <defs>
                    <clipPath id="nl-hero-wave-m" clipPathUnits="objectBoundingBox">
                        <path d={WAVE_PATH_MOBILE} />
                    </clipPath>
                </defs>
            </svg>
        </div>
    )
}

type HeroCopy = Omit<NewsletterHeroProps, 'benefits'>

function HeroContent({ title, description, note }: HeroCopy) {
    // Heavier than drop-shadow-md: the copy crosses the pink horizon and the
    // lit hills, where a soft shadow alone left the smaller lines unreadable.
    const textShadow = { textShadow: '0 1px 2px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.45)' }

    return (
        <>
            {/* The heading is rendered twice (wide and compact trees), but only one
                of them is ever displayed, so assistive tech sees a single h1. */}
            <h1 className="type-display max-w-4xl text-balance text-white" style={textShadow}>
                {title}
            </h1>

            <p className="type-body mt-5 max-w-xl text-white" style={textShadow}>
                {description}
            </p>

            {/* The field is translucent, so it gets its own dark backing to stay
                legible over the brightest part of the river. */}
            <div className="mt-8 w-full max-w-md rounded-sm bg-black/55 backdrop-blur-md">
                <NewsletterSubscribeForm tone="dark" />
            </div>

            <p className="mt-3 text-xs text-white/85" style={textShadow}>
                {note}
            </p>
        </>
    )
}

// Compact layout only: on wide screens the benefits scroll along the curve.
function BenefitList({ benefits }: { benefits: string[] }) {
    return (
        <ul className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6">
            {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-white">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/60 bg-primary/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    {benefit}
                </li>
            ))}
        </ul>
    )
}
