import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";


interface UnsubscribeModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const UnsubscribeModal = ({ trigger, open: controlledOpen, onOpenChange }: UnsubscribeModalProps) => {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            const response = await fetch(
                `api/newsletter/request-unsubscribe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setEmail("");
            } else {
                setError(data.error || "Erro ao processar solicitação");
            }
        } catch (err) {
            setError("Erro de conexão. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        // Reset após fechar
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
                        Cancelar inscrição
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancelar inscrição na newsletter</DialogTitle>
                    <DialogDescription>
                        Digite seu email para receber um link de confirmação de cancelamento.
                    </DialogDescription>
                </DialogHeader>

                {!success ? (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar confirmação
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <Alert>
                            <AlertDescription>
                                ✅ Email de confirmação enviado com sucesso! Verifique sua caixa
                                de entrada e clique no link para confirmar o cancelamento.
                            </AlertDescription>
                        </Alert>

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                Fechar
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default UnsubscribeModal;