"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import "@/styles/apoiase.css";
import Link from "next/link";
import { FaArrowRightLong } from "react-icons/fa6";

type FaceState = "neutral" | "surprised" | "happy";

/** Mao agarrando a borda de cima da placa: nos dos dedos por cima, dedos dobrados por baixo. */
const Hand = ({ side }: { side: "left" | "right" }) => (
    <span className={`apoiase-hand ${side}`} aria-hidden>
        <svg viewBox="0 0 42 30" fill="none">
            <g className="finger">
                <rect x="3.5" y="9" width="8" height="19" rx="4" />
                <rect x="12.5" y="7" width="8" height="21" rx="4" />
                <rect x="21.5" y="7" width="8" height="21" rx="4" />
                <rect x="30.5" y="9.5" width="8" height="17" rx="4" />
            </g>
            <rect className="palm" x="2" y="0" width="38" height="15" rx="7.5" />
        </svg>
    </span>
);

const ApoiaseCard = () => {
    const t = useTranslations("support");
    const containerRef = useRef<HTMLDivElement>(null);
    const [faceState, setFaceState] = useState<FaceState>("neutral");
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [faceNudge, setFaceNudge] = useState({ x: 0, y: 0, rot: 0 });
    const [isOnButton, setIsOnButton] = useState(false);

    const handleCardMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!containerRef.current || isOnButton) return;
            const rect = containerRef.current.getBoundingClientRect();
            const ratioX = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const ratioY = (e.clientY - rect.top - rect.height / 2) / rect.height;

            setEyeOffset({ x: ratioX * 12, y: ratioY * 10 });
            // pouco deslocamento vertical: a base da cabeca fica atras da placa
            setFaceNudge({ x: ratioX * 9, y: ratioY * 4, rot: ratioX * 5 });
        },
        [isOnButton]
    );

    const resetPose = () => setFaceNudge({ x: 0, y: 0, rot: 0 });

    const handleCardEnter = () => setFaceState("surprised");

    const handleCardLeave = () => {
        setFaceState("neutral");
        setEyeOffset({ x: 0, y: 0 });
        resetPose();
        setIsOnButton(false);
    };

    const handleButtonEnter = () => {
        setFaceState("happy");
        setIsOnButton(true);
        setEyeOffset({ x: 0, y: 0 });
        resetPose();
    };

    const handleButtonLeave = () => {
        setFaceState("surprised");
        setIsOnButton(false);
    };

    const isWideEyed = faceState !== "neutral";

    // a placa sobe nos estados hover; a cabeca sobe junto pra boca nao ficar escondida
    const headLift = faceState === "happy" ? -10 : faceState === "surprised" ? -3 : 0;

    return (
        <div
            ref={containerRef}
            data-face={faceState}
            onMouseMove={handleCardMouseMove}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
            className="apoiase-scene"
        >
            {/* ---------------------------------------------------- cabeca -- */}
            <div
                className="apoiase-face-wrapper"
                style={{
                    transform: `translate(${faceNudge.x}px, ${faceNudge.y + headLift}px) rotate(${faceNudge.rot}deg)`,
                    transition: "transform 0.25s ease-out",
                }}
            >
                <div className="apoiase-face">
                    <div
                        className="apoiase-face-inner"
                        style={{
                            transform: `translate(${eyeOffset.x * 0.3}px, ${eyeOffset.y * 0.3}px)`,
                            transition: "transform 0.15s ease-out",
                        }}
                    >
                        <div className="apoiase-eyes">
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className={`apoiase-eye ${isWideEyed ? "surprised" : ""}`}
                                    style={{
                                        transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                                        transition: "transform 0.15s ease-out",
                                    }}
                                >
                                    {isWideEyed && <div className="apoiase-eye-white" />}
                                </div>
                            ))}
                        </div>
                        <div
                            className={`apoiase-mouth ${faceState}`}
                            style={{
                                transform: `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.5}px)`,
                                transition: "transform 0.15s ease-out",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* -------------------------------------------- placa + membros -- */}
            <div className="apoiase-stage">
                {/* pes: ficam atras da placa */}
                <div className="apoiase-feet" aria-hidden>
                    <span className="apoiase-foot" />
                    <span className="apoiase-foot" />
                </div>

                <div className="apoiase-sign">
                    <Hand side="left" />
                    <Hand side="right" />

                    <div className="apoiase-content">
                        <div className="flex w-full flex-col items-center justify-center gap-1 sm:flex-row">
                            <h2 className="type-h2 mb-1 text-center text-secondary">
                                {t("apoiase.title")}
                            </h2>
                            <img
                                src="https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif"
                                alt="heart"
                                width="24"
                                height="24"
                            />
                        </div>

                        <p className="mb-2 text-center text-base text-foreground">
                            {t("apoiase.description")}
                        </p>

                        <Link
                            href="/support"
                            target="_blank"
                            onMouseEnter={handleButtonEnter}
                            onMouseLeave={handleButtonLeave}
                            className="inline-flex items-center gap-2.5 rounded-sm bg-secondary px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        >
                            {t("apoiase.button")}
                            <span className="flex h-[24px] w-[24px] items-center justify-center rounded-sm bg-primary text-xs">
                                <FaArrowRightLong />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApoiaseCard;
