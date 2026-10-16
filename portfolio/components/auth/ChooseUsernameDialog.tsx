"use client";

// components/auth/ChooseUsernameDialog.tsx

import { useEffect, useState, type FormEvent } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

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
  USERNAME_MAX_LENGTH,
  USERNAME_PATTERN,
  normalizeUsernameInput,
} from "@/lib/username-rules";

/**
 * Opens on any page while the signed-in account still has the username the
 * system assigned (session.user.usernameChosen === false): every new Google or
 * GitHub account, and older accounts whose username came from the e-mail
 * address. It cannot be dismissed, only answered or abandoned by signing out.
 * The server enforces the same rule on comments and wall posts, so closing it
 * through dev tools gains nothing.
 *
 * The field is prefilled with the current username: a neutral placeholder,
 * or the GitHub login for GitHub accounts. Accepting it as is counts as a
 * choice.
 */
export function ChooseUsernameDialog() {
  const t = useTranslations("auth.chooseUsername");
  const { data: session, status, update } = useSession();
  const pending = status === "authenticated" && session?.user?.usernameChosen === false;
  const current = session?.user?.username ?? "";

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pending) setValue(current);
  }, [pending, current]);

  if (!pending) return null;

  const username = normalizeUsernameInput(value);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    // Only the format is checked here. Reserved names and uniqueness are the
    // server's call (an admin may take a reserved name).
    if (!USERNAME_PATTERN.test(username)) {
      setError(t("errors.format"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("errors.generic"));
        // 409 is either "taken" or "already chosen in another tab". Refreshing
        // the session closes the dialog in the second case and changes nothing
        // in the first.
        if (res.status === 409) await update();
        return;
      }

      // Re-reads the account from the database (see the jwt callback in
      // lib/auth.ts); usernameChosen flips to true and the dialog unmounts.
      await update();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent hideClose className="max-w-md border border-border">
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <label htmlFor="choose-username" className="text-sm font-medium">
              {t("label")}
            </label>
            <div
              className={`flex h-11 items-center rounded-lg border bg-background px-3 text-sm
                          focus-within:ring-2 focus-within:ring-ring
                          ${error ? "border-red-400" : "border-input"}`}
            >
              <span aria-hidden className="text-muted-foreground">@</span>
              <input
                id="choose-username"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.replace(/\s+/g, "").toLowerCase());
                  setError(null);
                }}
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={USERNAME_MAX_LENGTH + 1}
                aria-invalid={Boolean(error)}
                aria-describedby="choose-username-hint"
                className="flex-1 bg-transparent pl-0.5 outline-none"
              />
            </div>
            <p
              id="choose-username-hint"
              className={`text-xs ${error ? "text-red-500" : "text-muted-foreground"}`}
            >
              {error ?? t("hint")}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => signOut()} disabled={saving}>
              {t("signOut")}
            </Button>
            <Button type="submit" disabled={saving || username.length === 0}>
              {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
