"use client";

import { Suspense, useRef, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Lanyard from "@/components/ui/lanyard";
import CardTemplate, { type CardTemplateRef } from "@/components/lanyard/LayardCardTemplate";

function getTodayFormatted(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
}

/** Safety net: never leave the hero empty if the GLB fails to resolve. */
const REVEAL_TIMEOUT_MS = 4000;

interface LanyardDisplayProps {
    position?: [number, number, number];
    fov?: number;
    containerClassName?: string;
    /** Repassado ao <Canvas>: eventos de ponteiro vem deste elemento. */
    eventSource?: React.RefObject<HTMLElement | null>;
    /** Repassado ao <Lanyard>: altura do quadro de referencia da camera. */
    frameHeight?: () => number;
}

export default function LanyardDisplay({
    position = [0, 0, 20],
    fov = 20,
    containerClassName,
    eventSource,
    frameHeight,
}: LanyardDisplayProps) {
    const [cardTexture, setCardTexture] = useState<HTMLCanvasElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const cardTemplateRef = useRef<CardTemplateRef>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const today = getTodayFormatted();
    const t = useTranslations("lanyard");

    const handleTextureReady = useCallback((canvas: HTMLCanvasElement) => {
        setCardTexture(canvas);
    }, []);

    const handleSceneReady = useCallback(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (isReady) return;
        const timer = setTimeout(() => setIsReady(true), REVEAL_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [isReady]);

    return (
        <>
            <CardTemplate
                ref={cardTemplateRef}
                userName={t("name")}
                role={t("role")}
                variant="dark"
                onTextureReady={handleTextureReady}
                city={t("city")}
                date={today}
            />
            <div className={containerClassName}>
                {/* Mounted as soon as the texture exists; revealed once the scene
                    is live, so the fade-in rides along with the card dropping in. */}
                <div className={`transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
                    {cardTexture && (
                        // Local boundary: <Canvas> suspends on the GLB, and without
                        // this it would throw all the way up and blank the hero.
                        <Suspense fallback={null}>
                            <Lanyard
                                position={position}
                                fov={fov}
                                containerClassName="absolute inset-0 w-full h-full"
                                cardTexture={cardTexture}
                                canvasRef={canvasRef}
                                onReady={handleSceneReady}
                                eventSource={eventSource}
                                frameHeight={frameHeight}
                            />
                        </Suspense>
                    )}
                </div>
            </div>
        </>
    );
}
