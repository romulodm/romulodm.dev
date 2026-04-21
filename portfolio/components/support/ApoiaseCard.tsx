"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from 'next-intl'
import "@/styles/apoiase.css";
import Link from "next/link";
import { FaArrowRightLong } from "react-icons/fa6";

type FaceState = "neutral" | "surprised" | "happy";

const ApoiaseCard = () => {
    const t = useTranslations('support')
    const containerRef = useRef<HTMLDivElement>(null);
    const [faceState, setFaceState] = useState<FaceState>("neutral");
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [faceNudge, setFaceNudge] = useState({ x: 0, y: 0 });
    const [isOnButton, setIsOnButton] = useState(false);

    const handleCardMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current || isOnButton) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const ratioX = (mouseX - rect.width / 2) / rect.width;
        const ratioY = (mouseY - rect.height / 2) / rect.height;

        setEyeOffset({ x: ratioX * 14, y: ratioY * 12 });
        setFaceNudge({ x: ratioX * 8, y: ratioY * 6 });
    }, [isOnButton]);

    const handleCardEnter = () => setFaceState("surprised");

    const handleCardLeave = () => {
        setFaceState("neutral");
        setEyeOffset({ x: 0, y: 0 });
        setFaceNudge({ x: 0, y: 0 });
        setIsOnButton(false);
    };

    const handleButtonEnter = () => {
        setFaceState("happy");
        setIsOnButton(true);
        setEyeOffset({ x: 0, y: 0 });
        setFaceNudge({ x: 0, y: 0 });
    };

    const handleButtonLeave = () => {
        setFaceState("surprised");
        setIsOnButton(false);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleCardMouseMove}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
            className="relative flex flex-col items-center justify-start p-10 w-full max-w-7xl overflow-hidden"
        >
            <div
                className="apoiase-face-wrapper"
                style={{
                    transform: `translate(${faceNudge.x}px, ${faceNudge.y}px)`,
                    transition: "transform 0.25s ease-out",
                }}
            >
                <div className="ml-4 apoiase-face">
                    <div
                        className="apoiase-face-inner"
                        style={{
                            transform: `translate(${eyeOffset.x * 0.3}px, ${eyeOffset.y * 0.3}px)`,
                            transition: "transform 0.15s ease-out",
                        }}
                    >
                        <div className="apoiase-eyes">
                            <div
                                className={`apoiase-eye ${faceState === "surprised" || faceState === "happy" ? "surprised" : ""}`}
                                style={{
                                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                                    transition: "transform 0.15s ease-out",
                                }}
                            >
                                {(faceState === "surprised" || faceState === "happy") && <div className="apoiase-eye-white" />}
                            </div>
                            <div
                                className={`apoiase-eye ${faceState === "surprised" || faceState === "happy" ? "surprised" : ""}`}
                                style={{
                                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                                    transition: "transform 0.15s ease-out",
                                }}
                            >
                                {(faceState === "surprised" || faceState === "happy") && <div className="apoiase-eye-white" />}
                            </div>
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

            <div className="apoiase-content">
                <div className="w-full -mt-5 flex flex-col sm:flex-row items-center justify-center mb-1 gap-1">
                    <h1 className="text-3xl mb-1.5 text-center font-extrabold text-primary leading-tight">
                        {t('apoiase.title')}
                    </h1>
                    <img
                        src="https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif"
                        alt="heart"
                        width="27"
                        height="27"
                    />
                </div>

                <p className="text-lg text-center text-foreground mb-4">
                    {t('apoiase.description')}
                </p>
                <Link
                    href={"/support"}
                    target="_blank"
                    onMouseEnter={handleButtonEnter}
                    onMouseLeave={handleButtonLeave}
                    className="inline-flex items-center gap-2.5 bg-[#5A7CE2] text-white text-[0.95rem] font-medium px-[22px] py-[13px] rounded-full hover:opacity-90 transition-opacity"
                >
                    {t('apoiase.button')}
                    <span className="bg-[#F9733D] text-white w-[26px] h-[26px] rounded-full flex items-center justify-center text-[0.85rem]">
                        <FaArrowRightLong />
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default ApoiaseCard;
