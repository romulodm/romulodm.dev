// components/wall/ui/AvatarCircle.tsx
import Image from "next/image";
import { avatarColor } from "../utils";

interface Props {
  username: string;
  image: string | null;
  size?: number;
  /** Optional hex/css color to override the default hashed avatar background. */
  bg?: string;
}

export function AvatarCircle({ username, image, size = 26, bg }: Props) {
  if (image) {
    return (
      <Image
        src={image}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  // When an explicit bg color is provided (from the card theme), use inline style.
  // Otherwise fall back to the Tailwind class from avatarColor().
  if (bg) {
    return (
      <div
        className="rounded-full shrink-0 flex items-center justify-center
                   text-white font-semibold ring-1 ring-white/15"
        style={{ width: size, height: size, fontSize: size * 0.38, background: bg }}
      >
        {username[0].toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center
                  text-white font-bold ${avatarColor(username)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {username[0].toUpperCase()}
    </div>
  );
}