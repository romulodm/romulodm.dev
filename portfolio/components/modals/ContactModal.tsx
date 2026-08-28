'use client';

import { useTranslations } from 'next-intl';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ContactForm from '@/components/sections/contact/ContactForm';
import type { ContactTopicValue } from '@/lib/contact-topics';

interface ContactModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Assunto já selecionado ao abrir. Quem entra pelo botão genérico ("Get in
     * touch") não passa nada e escolhe; quem entra por um atalho de contexto
     * ("reportar um bug") chega com o campo preenchido — e ainda pode trocar.
     */
    defaultTopic?: ContactTopicValue;
    /** Sobrescreve o título. Padrão: a chamada genérica "Let's talk". */
    title?: string;
    /** Sobrescreve o subtítulo. */
    description?: string;
}

export function ContactModal({
    open,
    onOpenChange,
    defaultTopic,
    title,
    description,
}: ContactModalProps) {
    const t = useTranslations('contact');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader className="-mb-2">
                    <DialogTitle>{title ?? t('modal-title')}</DialogTitle>
                    <DialogDescription>
                        {description ?? t('modal-subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {/*
                  `key` no assunto força uma montagem nova quando o contexto
                  muda. Sem isso, o estado do formulário (inclusive o widget do
                  Turnstile) sobreviveria à troca e o `defaultTopic` novo seria
                  ignorado, porque `useState` só lê o valor inicial uma vez.
                */}
                <ContactForm key={defaultTopic ?? 'none'} defaultTopic={defaultTopic} />
            </DialogContent>
        </Dialog>
    );
}
