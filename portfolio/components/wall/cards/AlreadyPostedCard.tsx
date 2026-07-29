import { Wave } from "../ui/Wave";
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

      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 relative z-10 px-6">
        <p className="text-white/50 text-[11px]">Your mark is on the wall ✓</p>
        <p className="text-white/30 text-[10px] text-center">
          Scroll down to find your message
        </p>
      </div>

      <Wave />

      <div className="absolute bottom-0 left-0 right-0 h-[52px] bg-[#111]/60
                      flex items-center gap-2.5 px-4 z-10">
        <AvatarCircle username={user.username} image={user.image} size={26} />
        <p className="text-white/60 text-[11px] font-medium">{user.username}</p>
      </div>
    </div>
  );
}
