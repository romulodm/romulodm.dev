"use client";

interface Props {
  onSignIn: () => void;
}
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"

export function SignInCard({ onSignIn }: Props) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col h-[220px]"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #3b1f6e 0%, #1a0a3d 100%)",
      }}
    >

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 relative z-10">
        <div className="text-center">
          <p
            className="type-h3 text-white"
          >
            &ldquo;Join the wall…&rdquo;
          </p>
          <p className="text-white/50 text-xs mt-0.5">Sign in to leave your mark</p>
        </div>

        <button
          onClick={onSignIn}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/22 active:bg-white/30
                     border border-white/20 rounded-lg px-4 py-2 text-white text-xs
                     font-medium transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 16 16" fill="none">
            <path
              d="M11 2h1a2 2 0 012 2v8a2 2 0 01-2 2h-1M7 11l4-4-4-4M11 8H3"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          Write a message…
        </button>
      </div>

      <div>
        <svg
          viewBox="0 0 600 40"
          preserveAspectRatio="none"
          className="block h-6 w-full"
          aria-hidden
        >
          <path
            d="M0 25 Q 50 5 100 22 T 200 22 T 300 22 T 400 22 T 500 22 T 600 22 T 600 22 L600 40 L0 40 Z"
            className="fill-white dark:fill-[#141414]"
          />
        </svg>

        <div className="flex items-center justify-between gap-3
                                bg-white dark:bg-[#141414] px-4 border-0 pb-4 pt-2 -mt-0.5">

          <div className="w-full flex justify-center items-center p-1 gap-3 min-w-0">
            <FaGithub className="text-2xl text-neutral-900 dark:text-white" />
            <span className="text-neutral-300 dark:text-white/20 text-sm">·</span>
            <FcGoogle className="text-2xl" />
          </div>


        </div>
      </div>
    </div>
  );
}
