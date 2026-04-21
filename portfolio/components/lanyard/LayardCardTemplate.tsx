"use client";

import { forwardRef, useImperativeHandle, useEffect, useState } from "react";

const ICON_SVG_WHITE = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33">
  <path fill="#F65F41" d="M33 16.5C33 14.5948 31.1271 13.0504 27.3709 13.0504C26.2651 13.0504 24.8688 13.2792 23.4491 13.621C24.6957 12.8583 25.8441 12.0326 26.6259 11.2508C29.282 8.5947 29.5137 6.1791 28.1673 4.83123C26.8209 3.48483 24.4039 3.71657 21.7477 6.3727C20.966 7.15443 20.1403 8.30283 19.3776 9.5495C19.7208 8.12977 19.9481 6.7335 19.9481 5.62763C19.9481 1.8715 18.4037 -0.00143433 16.4985 -0.00143433C14.5933 -0.00143433 13.0489 1.8715 13.0489 5.62763C13.0489 6.7335 13.2777 8.12977 13.6195 9.5495C12.8568 8.30283 12.0311 7.15443 11.2493 6.3727C8.5932 3.71657 6.1776 3.48483 4.82973 4.83123C3.48333 6.17763 3.71507 8.5947 6.3712 11.2508C7.15293 12.0326 8.30133 12.8583 9.548 13.621C8.12827 13.2778 6.732 13.0504 5.62613 13.0504C1.87293 13.0504 0 14.5948 0 16.5C0 18.4052 1.87293 19.9496 5.62907 19.9496C6.73493 19.9496 8.1312 19.7208 9.55093 19.3791C8.30427 20.1418 7.15587 20.9675 6.37413 21.7492C3.718 24.4054 3.48627 26.821 4.83267 28.1688C6.17907 29.5152 8.59613 29.2835 11.2523 26.6274C12.034 25.8456 12.8597 24.6972 13.6224 23.4506C13.2792 24.8703 13.0519 26.2666 13.0519 27.3724C13.0519 31.1286 14.5963 33.0015 16.5015 33.0015C18.4067 33.0015 19.9511 31.1286 19.9511 27.3724C19.9511 26.2666 19.7223 24.8703 19.3805 23.4506C20.1432 24.6972 20.9689 25.8456 21.7507 26.6274C24.4068 29.2835 26.8224 29.5152 28.1703 28.1688C29.5167 26.8224 29.2849 24.4054 26.6288 21.7492C25.8471 20.9675 24.6987 20.1418 23.452 19.3791C24.8717 19.7223 26.268 19.9496 27.3739 19.9496C31.13 19.9496 33.0029 18.4052 33.0029 16.5H33Z"/>
</svg>
`);
//#F65F41
const ICON_DATA_URL = `data:image/svg+xml;charset=utf-8,${ICON_SVG_WHITE}`;

export type CardVariant = "dark" | "light";

interface CardTemplateProps {
    userName: string;
    /** Optional job title rendered above the name */
    role?: string;
    variant: CardVariant;
    onTextureReady: (dataUrl: string) => void;
    city?: string;
    date?: string;
}

export interface CardTemplateRef {
    captureTexture: () => Promise<void>;
    exportCard: () => void;
}

const CANVAS_SIZE = 1376;

/** Shared draw routine used by both captureTexture and exportCard */
function drawCard(
    ctx: CanvasRenderingContext2D,
    {
        baseImage,
        iconImg,
        userName,
        role,
        city,
        date,
        textColor,
        size,
    }: {
        baseImage: HTMLImageElement | null;
        iconImg: HTMLImageElement | null
        userName: string;
        role?: string;
        city?: string;
        date?: string;
        textColor: string;
        size: number;
    }
) {
    if (baseImage) {
        ctx.drawImage(baseImage, 0, 0, size, size);
    } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, size, size);
    }

    const textX = size / 2 - 55;
    const monoFont = (px: number) => `normal ${px}px "Geist Mono", monospace`;

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    // City
    if (city) {
        ctx.fillStyle = textColor;
        ctx.font = monoFont(48);
        ctx.fillText(city.toUpperCase(), textX, size - 1206);
    }

    // Date
    if (date) {
        ctx.fillStyle = "#878787";
        ctx.font = monoFont(48);
        ctx.fillText(date.toUpperCase(), textX, size - 1150);
    }

    if (iconImg) {
        const iconSize = Math.round(size * 0.2);
        const x = Math.round((size - iconSize) / 3.8);
        const y = Math.round((size - iconSize) / 1.9);

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(iconImg, x, y, iconSize, iconSize);
        ctx.restore();
    }

    // Role (above name, muted)
    if (role) {
        ctx.fillStyle = "#878787";
        ctx.font = monoFont(44);
        ctx.fillText(role.toUpperCase(), textX, size - 455);
    }

    // Name
    ctx.fillStyle = textColor;
    ctx.font = monoFont(48);
    ctx.fillText((userName || "YOUR NAME").toUpperCase(), textX, size - 400);
}

const CardTemplate = forwardRef<CardTemplateRef, CardTemplateProps>(
    ({ userName, role, variant, onTextureReady, city, date }, ref) => {
        const [iconImg, setIconImg] = useState<HTMLImageElement | null>(null);

        useEffect(() => {
            const icon = new Image();
            icon.crossOrigin = "anonymous";
            icon.onload = () => setIconImg(icon);
            icon.src = ICON_DATA_URL;
        }, []);

        const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

        const imageSrc = variant === "dark" ? "/card-base-dark.png" : "/card-base-light.png";
        const textColor = variant === "dark" ? "#ffffff" : "#000000";

        useEffect(() => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => setBaseImage(img);
            img.src = imageSrc;
        }, [imageSrc]);

        const captureTexture = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            drawCard(ctx, { baseImage, iconImg, userName, role, city, date, textColor, size: CANVAS_SIZE });
            onTextureReady(canvas.toDataURL("image/png"));
        };

        const exportCard = () => {
            const CROP_BOTTOM = 334;
            const EXPORT_HEIGHT = CANVAS_SIZE - CROP_BOTTOM;

            const full = document.createElement("canvas");
            full.width = CANVAS_SIZE;
            full.height = CANVAS_SIZE;
            const fullCtx = full.getContext("2d");
            if (!fullCtx) return;

            drawCard(fullCtx, { baseImage, iconImg, userName, role, city, date, textColor, size: CANVAS_SIZE });

            const out = document.createElement("canvas");
            out.width = CANVAS_SIZE;
            out.height = EXPORT_HEIGHT;
            const outCtx = out.getContext("2d");
            if (!outCtx) return;

            outCtx.drawImage(full, 0, 0, CANVAS_SIZE, EXPORT_HEIGHT, 0, 0, CANVAS_SIZE, EXPORT_HEIGHT);

            const link = document.createElement("a");
            link.download = `card-${userName || "card"}.png`;
            link.href = out.toDataURL("image/png", 1.0);
            link.click();
        };

        useImperativeHandle(ref, () => ({ captureTexture, exportCard }));

        return null;
    }
);

CardTemplate.displayName = "CardTemplate";

export default CardTemplate;