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

            {/* 
              Sempre renderiza o container com as mesmas dimensões.
              Isso evita layout shift e não bloqueia o resto da hero.
            */}
            <div className={containerClassName}>
                {!isReady ? (
                    // Spinner centralizado apenas nesta área
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : (
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
        </>
    );
}