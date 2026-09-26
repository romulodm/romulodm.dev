import { useTranslations } from "next-intl";
import { AvatarCircle } from "../ui/AvatarCircle";
import { Decoration } from "../ui/Decoration";
import type { WallAuthor } from "../utils";
import { CardShell } from "./CardShell";
import { INVITE_TEXT_SHADOW, InviteBackdrop } from "./invitePanel";

export function AlreadyPostedCard({ user }: { user: WallAuthor }) {
  const t = useTranslations("wall.posted");

  return (
    <CardShell
      panel={
        <>
          <InviteBackdrop />
          <Decoration type="diamond-center" />
          <div className="relative z-10 mt-5 flex flex-1 flex-col items-center justify-center px-6">
            <p className="text-white font-semibold text-lg" style={INVITE_TEXT_SHADOW}>
              {t("title")}
            </p>
            <p className="text-white text-center text-sm" style={INVITE_TEXT_SHADOW}>
              {t("subtitle")}
            </p>
          </div>
        </>
      }
      footer={
        <div className="flex w-full min-w-0 justify-center">
          <AvatarCircle user={user} size={35} />
        </div>
      }
    />
  );
}
