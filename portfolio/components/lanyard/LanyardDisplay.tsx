"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Lanyard from "@/components/ui/lanyard";
import CardTemplate, { type CardTemplateRef } from "@/components/lanyard/LayardCardTemplate";

function getTodayFormatted(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
}

interface LanyardDisplayProps {
    position?: [number, number, number];
    fov?: number;
    containerClassName?: string;
}

export default function LanyardDisplay({
    position = [0, 0, 20],
    fov = 20,
    containerClassName,
}: LanyardDisplayProps) {
    const [cardTextureUrl, setCardTextureUrl] = useState<string | undefined>(undefined);
    const [textureKey, setTextureKey] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const cardTemplateRef = useRef<CardTemplateRef>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const today = getTodayFormatted();

    const handleTextureReady = useCallback((dataUrl: string) => {
        setCardTextureUrl(dataUrl);
        setTextureKey((prev) => prev + 1);
        setIsReady(true);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (cardTemplateRef.current) {
                await cardTemplateRef.current.captureTexture();
            }
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <CardTemplate
                ref={cardTemplateRef}
                userName="Romulo de Moraes"
                role="Software Engineer"
                variant="dark"
                onTextureReady={handleTextureReady}
                city="Rio Grande, Brazil"
                date={today}
            />
            <div className={containerClassName}>
                {/* Skeleton placeholder while loading */}

                {/* 
                <div
                    className={`absolute inset-0 z-20 w-full h-full flex items-center justify-center transition-opacity duration-500 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="relative w-[200px] h-[280px] animate-pulse">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160px] h-[210px] rounded-xl bg-black/20 dark:bg-white/10" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-[100px] bg-black/10 dark:bg-white/5" />
                    </div>
                </div> 
                */}

                {/* Actual 3D content with fade-in */}
                <div className={`transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
                    {isReady && (
                        <Lanyard
                            key={textureKey}
                            position={position}
                            fov={fov}
                            containerClassName="absolute inset-0 w-full h-full"
                            cardTextureUrl={cardTextureUrl}
                            canvasRef={canvasRef}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
