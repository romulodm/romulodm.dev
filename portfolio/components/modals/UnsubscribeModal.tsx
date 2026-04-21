"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UnsubscribeModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UnsubscribeModal = ({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: UnsubscribeModalProps) => {
  const t = useTranslations("unsubscribeModal");
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/newsletter/request-unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        setError(data.error || t("errors.generic"));
      }
    } catch {
      setError(t("errors.connection"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);

    setTimeout(() => {
      setEmail("");
      setSuccess(false);
      setError("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {t("trigger")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("submit")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>{t("success.message")}</AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                {t("close")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UnsubscribeModal;

