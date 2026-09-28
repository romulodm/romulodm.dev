'use client';

import { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

import CardTemplate, { type CardTemplateRef } from '@/components/lanyard/LayardCardTemplate';

// Pre-load the GLB model to reduce initial loading time
useGLTF.preload('/card.glb');

function getTodayFormatted(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
}

interface StaticCardMeshProps {
    cardTexture?: HTMLCanvasElement | null;
    rotateY: number;
    onReady?: () => void;
}

function StaticCardMesh({ cardTexture, rotateY, onReady }: StaticCardMeshProps) {
    const { nodes, materials } = useGLTF('/card.glb') as any;
    const groupRef = useRef<THREE.Group>(null);
    const targetY = useRef(0);
    const currentY = useRef(0);

    const customTexture = useMemo(() => {
        if (!cardTexture) return null;
        const tex = new THREE.CanvasTexture(cardTexture);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [cardTexture]);

    useEffect(() => () => customTexture?.dispose(), [customTexture]);

    // This only mounts once the GLB has resolved.
    useEffect(() => {
        if (!onReady) return;
        const frame = requestAnimationFrame(() => onReady());
        return () => cancelAnimationFrame(frame);
    }, [onReady]);

    useEffect(() => {
        targetY.current = (rotateY * Math.PI) / 180;
    }, [rotateY]);

    useFrame(() => {
        if (!groupRef.current) return;
        // Lerp suave para o ângulo target
        currentY.current += (targetY.current - currentY.current) * 0.12;
        groupRef.current.rotation.y = currentY.current;
    });

    return (
        // Mesma escala e posição que o Band usa: scale=2.25, position=[0,-1.2,-0.05]
        <group ref={groupRef} scale={2} position={[0, -1.2, -0.05]}>
            <mesh geometry={nodes.card.geometry}>
                <meshPhysicalMaterial
                    map={customTexture ?? materials.base.map}
                    map-anisotropy={16}
                    clearcoat={1}
                    clearcoatRoughness={0.15}
                    roughness={0.9}
                    metalness={0.8}
                />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
        </group>
    );
}

interface StaticCardSceneProps {
    cardTexture?: HTMLCanvasElement | null;
    onReady?: () => void;
}

function StaticCardScene({ cardTexture, onReady }: StaticCardSceneProps) {
    const [rotateY, setRotateY] = useState(0);
    const dragging = useRef(false);
    const lastX = useRef(0);

    const onMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        lastX.current = e.clientX;
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragging.current) return;
        setRotateY((prev) => prev + (e.clientX - lastX.current) * 0.5);
        lastX.current = e.clientX;
    };
    const onMouseUp = () => { dragging.current = false; };
    const onTouchStart = (e: React.TouchEvent) => {
        lastX.current = e.touches[0].clientX;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        setRotateY((prev) => prev + (e.touches[0].clientX - lastX.current) * 0.5);
        lastX.current = e.touches[0].clientX;
    };

    return (
        <div
            style={{ width: 420, height: 520 }}
            className="cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
        >
            <Canvas
                camera={{ position: [0, 0, 10], fov: 18 }}
                dpr={[1, 2]}
                gl={{ alpha: true }}
                onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
            >
                <ambientLight intensity={Math.PI} />
                <StaticCardMesh cardTexture={cardTexture} rotateY={rotateY} onReady={onReady} />
                <Environment blur={0.75}>
                    <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
                    <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
                    <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
                    <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
                </Environment>
            </Canvas>
        </div>
    );
}

/** Safety net: never sit on the skeleton if the GLB fails to resolve. */
const REVEAL_TIMEOUT_MS = 4000;

export default function StaticCardDisplay() {
    const [cardTexture, setCardTexture] = useState<HTMLCanvasElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const cardTemplateRef = useRef<CardTemplateRef>(null);
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
            <div className="flex justify-center py-4 relative">
                {/* Skeleton placeholder while loading */}
                <div
                    style={{ width: 260, height: 340 }}
                    className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity duration-500 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="w-[180px] h-[240px] rounded-xl bg-black/20 dark:bg-white/10 animate-pulse" />
                </div>

                {/* Actual 3D content with fade-in */}
                <div className={`transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
                    {cardTexture && (
                        // Local boundary: <Canvas> suspends on the GLB.
                        <Suspense fallback={null}>
                            <StaticCardScene cardTexture={cardTexture} onReady={handleSceneReady} />
                        </Suspense>
                    )}
                </div>
            </div>
        </>
    );
}
