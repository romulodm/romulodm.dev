"use client";

// components/wall/PublishModal.tsx

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CARD_ART_STYLES,
  DEFAULT_CARD_ART_STYLE,
  DEFAULT_CARD_ART_TONE,
  PICKABLE_CARD_ART_TONES,
  generateCardArt,
  wallCardSeed,
  type CardArtStyle,
  type CardArtTone,
} from "./cardArt";
import { CardFace } from "./cards/CardFace";
import type { WallAuthor, WallMsg } from "./utils";

const MAX = 100;

interface Props {
  user: WallAuthor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted: (msg: WallMsg) => void;
}

/**
 * Two steps on purpose. The art is derived from the text, so a live preview
 * next to the textarea would repaint the whole card on every keystroke,
 * which reads as flicker rather than feedback. Step 1 is only the text;
 * step 2 freezes it and lets the visitor pick a style (and a tone, when
 * more than one is pickable). Going back keeps both the text and the
 * choice, so editing one word and returning to step 2 shows the same style
 * with its new palette.
 */
export function PublishModal({ user, open, onOpenChange, onPosted }: Props) {
  const t = useTranslations("wall.publish");
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState("");
  const [style, setStyle] = useState<CardArtStyle>(DEFAULT_CARD_ART_STYLE);
  const [tone, setTone] = useState<CardArtTone>(DEFAULT_CARD_ART_TONE);
  const [loading, setLoading] = useState(false);

  const canContinue = text.trim().length > 0;
  const seed = wallCardSeed(user.id, text);

  // Only computed on step 2, where the text can no longer change.
  const thumbs = useMemo(
    () =>
      step === 2
        ? CARD_ART_STYLES.map((s) => ({ style: s, art: generateCardArt(seed, s, tone) }))
        : [],
    [step, seed, tone],
  );
  const preview = thumbs.find((th) => th.style === style)?.art;

  const next = () => canContinue && setStep(2);

  const publish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), artStyle: style, artTone: tone }),
      });

      if (res.status === 409) { toast.error(t("alreadyPosted")); return; }
      if (!res.ok) { toast.error(t("error")); return; }

      const created: WallMsg = await res.json();
      onPosted(created);
      toast.success(t("success"));
      onOpenChange(false);
      setText("");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border border-border max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("step", { current: step, total: 2 })}
          </p>
          <DialogTitle>{step === 1 ? t("writeTitle") : t("styleTitle")}</DialogTitle>
          <DialogDescription>
            {step === 1 ? t("writeDescription") : t("styleDescription")}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-2">
            <textarea
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) next();
              }}
              placeholder={t("placeholder")}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2
                         text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-right text-xs tabular-nums text-muted-foreground">
              {text.length} / {MAX}
            </p>
          </div>
        ) : (
          preview && (
            <div className="grid gap-5">
              <CardFace art={preview} message={text.trim()} author={user} caption={t("now")} />

              {PICKABLE_CARD_ART_TONES.length > 1 && (
                <div className="grid gap-2">
                  <p className="text-sm font-medium">{t("toneLabel")}</p>
                  <div role="radiogroup" className="inline-flex w-fit rounded-lg border border-input p-0.5">
                    {PICKABLE_CARD_ART_TONES.map((tn) => (
                      <button
                        key={tn}
                        type="button"
                        role="radio"
                        aria-checked={tone === tn}
                        onClick={() => setTone(tn)}
                        className={`rounded-md px-3 py-1 text-sm transition-colors ${tone === tn
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {t(`tones.${tn}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <p className="text-sm font-medium">{t("styleLabel")}</p>
                <div role="radiogroup" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {thumbs.map(({ style: s, art }) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={style === s}
                      onClick={() => setStyle(s)}
                      className="group grid gap-1 text-left focus-visible:outline-none"
                    >
                      <span
                        className={`block aspect-[5/3] rounded-md bg-cover bg-top ring-offset-2 ring-offset-background
                                    transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-ring ${style === s ? "ring-2 ring-primary" : "ring-1 ring-border"
                          }`}
                        style={{ backgroundImage: `url("${art.dataUri}")` }}
                      />
                      <span
                        className={`text-xs ${style === s ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {t(`styles.${s}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 1 ? (
            <Button onClick={next} disabled={!canContinue}>
              {t("continue")}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                {t("back")}
              </Button>
              <Button onClick={publish} disabled={loading}>
                {loading ? t("publishing") : t("publish")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
