import { AvatarCircle } from "../ui/AvatarCircle";
import { Decoration } from "../ui/Decoration";
import type { WallAuthor } from "../utils";

export function AlreadyPostedCard({ user }: { user: WallAuthor }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col h-[220px]"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #3b1f6e 0%, #1a0a3d 100%)",
      }}
    >
      <Decoration type="diamond-center" />

      <div className="flex-1 flex flex-col mt-5 items-center justify-center relative z-10 px-6">
        <p className="text-white text-bold text-lg">Your mark is on the wall ✓</p>
        <p className="text-white text-center text-sm">
          Scroll down to find your message
        </p>
      </div>

      {/* Wave + footer in normal flow */}
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
          <div className="w-full flex justify-center items-center gap-3 min-w-0">
            <AvatarCircle user={user} size={35} />
          </div>
        </div>
      </div>
    </div>
  );
}
