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

const ICON_COLOR = "#F65F41";
const ICON_VIEWBOX = 33;
const ICON_PATH_D =
    "M33 16.5C33 14.5948 31.1271 13.0504 27.3709 13.0504C26.2651 13.0504 24.8688 13.2792 23.4491 13.621C24.6957 12.8583 25.8441 12.0326 26.6259 11.2508C29.282 8.5947 29.5137 6.1791 28.1673 4.83123C26.8209 3.48483 24.4039 3.71657 21.7477 6.3727C20.966 7.15443 20.1403 8.30283 19.3776 9.5495C19.7208 8.12977 19.9481 6.7335 19.9481 5.62763C19.9481 1.8715 18.4037 -0.00143433 16.4985 -0.00143433C14.5933 -0.00143433 13.0489 1.8715 13.0489 5.62763C13.0489 6.7335 13.2777 8.12977 13.6195 9.5495C12.8568 8.30283 12.0311 7.15443 11.2493 6.3727C8.5932 3.71657 6.1776 3.48483 4.82973 4.83123C3.48333 6.17763 3.71507 8.5947 6.3712 11.2508C7.15293 12.0326 8.30133 12.8583 9.548 13.621C8.12827 13.2778 6.732 13.0504 5.62613 13.0504C1.87293 13.0504 0 14.5948 0 16.5C0 18.4052 1.87293 19.9496 5.62907 19.9496C6.73493 19.9496 8.1312 19.7208 9.55093 19.3791C8.30427 20.1418 7.15587 20.9675 6.37413 21.7492C3.718 24.4054 3.48627 26.821 4.83267 28.1688C6.17907 29.5152 8.59613 29.2835 11.2523 26.6274C12.034 25.8456 12.8597 24.6972 13.6224 23.4506C13.2792 24.8703 13.0519 26.2666 13.0519 27.3724C13.0519 31.1286 14.5963 33.0015 16.5015 33.0015C18.4067 33.0015 19.9511 31.1286 19.9511 27.3724C19.9511 26.2666 19.7223 24.8703 19.3805 23.4506C20.1432 24.6972 20.9689 25.8456 21.7507 26.6274C24.4068 29.2835 26.8224 29.5152 28.1703 28.1688C29.5167 26.8224 29.2849 24.4054 26.6288 21.7492C25.8471 20.9675 24.6987 20.1418 23.452 19.3791C24.8717 19.7223 26.268 19.9496 27.3739 19.9496C31.13 19.9496 33.0029 18.4052 33.0029 16.5H33Z";

let cachedIconPath: Path2D | null = null;
function getIconPath(): Path2D {
    if (!cachedIconPath) cachedIconPath = new Path2D(ICON_PATH_D);
    return cachedIconPath;
}

/* ----------------------------------------------------------------- theme -- */

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
    ctx.globalAlpha = 0.95;
    ctx.translate(
        Math.round((CANVAS_SIZE - iconSize) / 3.9),
        Math.round((CANVAS_SIZE - iconSize) / 1.9)
    );
    ctx.scale(scale, scale);
    ctx.fillStyle = ICON_COLOR;
    ctx.fill(getIconPath());
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
