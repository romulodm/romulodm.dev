"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

export type CardVariant = "dark" | "light";

/**
 * The texture is square, but the `card` mesh in card.glb only samples the top
 * 1042px of it — the left half is the front of the card, the right half is the
 * back. Everything below CARD_UV_HEIGHT is off-mesh and only exists so the
 * exported PNG lines up.
 */
const CANVAS_SIZE = 1376;
const CARD_UV_HEIGHT = 1042;
const FACE_W = CANVAS_SIZE / 2;
const TEXT_X = FACE_W - 55;

/* ------------------------------------------------------------------ icon -- */

const ICON_VIEWBOX = 512;
const ICON_PATH_D =
    "M330.25 32.25L479.75 181.75A105 105 0 0 1 479.75 330.25L330.25 479.75A105 105 0 0 1 181.75 479.75L32.25 330.25A105 105 0 0 1 32.25 181.75L181.75 32.25A105 105 0 0 1 330.25 32.25ZM237.62 147.38L151.88 233.12A26 26 0 0 0 170.27 277.50L341.73 277.50A26 26 0 0 0 360.12 233.12L274.38 147.38A26 26 0 0 0 237.62 147.38Z";

let cachedIconPath: Path2D | null = null;
function getIconPath(): Path2D {
    if (!cachedIconPath) cachedIconPath = new Path2D(ICON_PATH_D);
    return cachedIconPath;
}

/* ----------------------------------------------------------------- theme -- */

/** Site primary, hsl(18 90% 61%) — the mark keeps the brand color on both variants. */
const ICON_COLOR = "#F57842";

interface Theme {
    bg: string;
    text: string;
    muted: string;
}

const THEMES: Record<CardVariant, Theme> = {
    dark: {
        bg: "#000000",
        text: "#ffffff",
        muted: "#878787",
    },
    light: {
        bg: "#f4f4f2",
        text: "#000000",
        muted: "#878787",
    },
};

/* ----------------------------------------------------------------- fonts -- */

/** next/font hashes the family name, so read it back off the CSS variable. */
const FONT_VAR = "--font-jetbrains";
const FONT_FALLBACK = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_TIMEOUT_MS = 500;

function resolveMonoFamily(): string {
    if (typeof window === "undefined") return FONT_FALLBACK;
    const root = document.body ?? document.documentElement;
    const name = getComputedStyle(root).getPropertyValue(FONT_VAR).trim();
    return name ? `${name}, ${FONT_FALLBACK}` : FONT_FALLBACK;
}

/**
 * Canvas silently falls back to the generic monospace if the webfont has not
 * been parsed yet, so wait for it — but never let a slow font hold the card
 * back for more than a frame or two.
 */
async function waitForFont(family: string): Promise<void> {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    const specs = [`normal 48px ${family}`, `normal 44px ${family}`];
    await Promise.race([
        Promise.all(specs.map((spec) => document.fonts.load(spec).catch(() => undefined))),
        new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
    ]);
}

/* --------------------------------------------------------------- drawing -- */

interface DrawOptions {
    userName: string;
    role?: string;
    city?: string;
    date?: string;
    variant: CardVariant;
    fontFamily: string;
    size: number;
}

function drawCard(ctx: CanvasRenderingContext2D, opts: DrawOptions) {
    const { userName, role, city, date, variant, fontFamily, size } = opts;
    const theme = THEMES[variant];

    ctx.save();
    // Author everything in 1376-space, then scale once.
    ctx.scale(size / CANVAS_SIZE, size / CANVAS_SIZE);

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const monoFont = (px: number) => `normal ${px}px ${fontFamily}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    if (city) {
        ctx.fillStyle = theme.text;
        ctx.font = monoFont(50);
        ctx.fillText(city.toUpperCase(), TEXT_X, CANVAS_SIZE - 1200);
    }

    if (date) {
        ctx.fillStyle = theme.muted;
        ctx.font = monoFont(42);
        ctx.fillText(date.toUpperCase(), TEXT_X, CANVAS_SIZE - 1140);
    }

    // brand mark
    const iconSize = Math.round(CANVAS_SIZE * 0.2);
    const scale = iconSize / ICON_VIEWBOX;
    ctx.save();
    ctx.translate(
        Math.round((CANVAS_SIZE - iconSize) / 3.9),
        Math.round((CANVAS_SIZE - iconSize) / 1.9)
    );
    ctx.scale(scale, scale);
    ctx.fillStyle = ICON_COLOR;
    ctx.fill(getIconPath(), "evenodd");
    ctx.restore();

    if (role) {
        ctx.fillStyle = theme.muted;
        ctx.font = monoFont(42);
        ctx.fillText(role.toUpperCase(), TEXT_X, CANVAS_SIZE - 455);
    }

    ctx.fillStyle = theme.text;
    ctx.font = monoFont(50);
    ctx.fillText((userName || "YOUR NAME").toUpperCase(), TEXT_X, CANVAS_SIZE - 400);

    ctx.restore();
}

/* ------------------------------------------------------------- component -- */

interface CardTemplateProps {
    userName: string;
    /** Optional job title rendered above the name */
    role?: string;
    variant: CardVariant;
    /** Receives the live canvas — feed it straight to a THREE.CanvasTexture. */
    onTextureReady: (canvas: HTMLCanvasElement) => void;
    city?: string;
    date?: string;
}

export interface CardTemplateRef {
    captureTexture: () => Promise<HTMLCanvasElement | null>;
    exportCard: () => Promise<void>;
}

/**
 * Renders the card texture entirely in canvas — no image requests, so the
 * texture is ready on the first frame after the mono webfont resolves.
 */
const CardTemplate = forwardRef<CardTemplateRef, CardTemplateProps>(
    ({ userName, role, variant, onTextureReady, city, date }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const fontFamilyRef = useRef<string | null>(null);

        const render = useCallback(async (): Promise<HTMLCanvasElement | null> => {
            if (typeof document === "undefined") return null;

            if (!fontFamilyRef.current) {
                const family = resolveMonoFamily();
                await waitForFont(family);
                fontFamilyRef.current = family;
            }

            let canvas = canvasRef.current;
            if (!canvas) {
                canvas = document.createElement("canvas");
                canvas.width = CANVAS_SIZE;
                canvas.height = CANVAS_SIZE;
                canvasRef.current = canvas;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            drawCard(ctx, {
                userName,
                role,
                city,
                date,
                variant,
                fontFamily: fontFamilyRef.current,
                size: CANVAS_SIZE,
            });

            return canvas;
        }, [userName, role, city, date, variant]);

        const captureTexture = useCallback(async () => {
            const canvas = await render();
            if (canvas) onTextureReady(canvas);
            return canvas;
        }, [render, onTextureReady]);

        const exportCard = useCallback(async () => {
            const full = await render();
            if (!full) return;

            const out = document.createElement("canvas");
            out.width = CANVAS_SIZE;
            out.height = CARD_UV_HEIGHT;
            const ctx = out.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(
                full,
                0, 0, CANVAS_SIZE, CARD_UV_HEIGHT,
                0, 0, CANVAS_SIZE, CARD_UV_HEIGHT
            );

            const link = document.createElement("a");
            link.download = `card-${userName || "card"}.png`;
            link.href = out.toDataURL("image/png", 1.0);
            link.click();
        }, [render, userName]);

        // Draw as soon as we mount — the consumer does not have to poll or wait.
        useEffect(() => {
            let alive = true;
            render().then((canvas) => {
                if (alive && canvas) onTextureReady(canvas);
            });
            return () => {
                alive = false;
            };
        }, [render, onTextureReady]);

        useImperativeHandle(ref, () => ({ captureTexture, exportCard }), [captureTexture, exportCard]);

        return null;
    }
);

CardTemplate.displayName = "CardTemplate";

export default CardTemplate;
