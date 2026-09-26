// components/wall/ui/AvatarCircle.tsx
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AvatarUser } from "@/lib/avatar";

interface Props {
  user: AvatarUser;
  size?: number;
}

/**
 * Avatar dos cards do mural.
 *
 * Era aqui que vivia o fallback de letra inicial sobre uma cor derivada do nome
 * (`avatarColor`, em ../utils). Com o seedicon quem nao tem foto do provider
 * recebe um avatar proprio em vez de uma inicial, entao o fallback saiu e a
 * funcao foi removida. O wrapper continua existindo porque os quatro cards
 * passam tamanhos fixos e compartilham o mesmo ring.
 */
export function AvatarCircle({ user, size = 26 }: Props) {
  return <UserAvatar user={user} size={size} className="ring-1 ring-black/10 dark:ring-white/15" />;
}
