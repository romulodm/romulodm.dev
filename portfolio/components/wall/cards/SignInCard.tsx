"use client";

import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useTranslations } from "next-intl";
import { CardShell } from "./CardShell";
import { INVITE_BUTTON, INVITE_TEXT_SHADOW, InviteBackdrop } from "./invitePanel";

interface Props {
  onSignIn: () => void;
}

export function SignInCard({ onSignIn }: Props) {
  const t = useTranslations("wall.signIn");

  return (
    <CardShell
      panel={
        <>
          <InviteBackdrop />
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-6">
            <div className="text-center" style={INVITE_TEXT_SHADOW}>
              <p className="type-h3 text-white">{t("title")}</p>
              <p className="text-white/85 text-xs mt-0.5">{t("subtitle")}</p>
            </div>

            <button onClick={onSignIn} className={INVITE_BUTTON}>
              <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11 2h1a2 2 0 012 2v8a2 2 0 01-2 2h-1M7 11l4-4-4-4M11 8H3"
                  stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              {t("cta")}
            </button>
          </div>
        </>
      }
      footer={
        <div className="flex w-full min-w-0 items-center justify-center gap-3">
          <FaGithub className="text-2xl text-neutral-900 dark:text-white" />
          <span className="text-neutral-300 dark:text-white/20 text-sm">·</span>
          <FcGoogle className="text-2xl" />
        </div>
      }
    />
  );
}
