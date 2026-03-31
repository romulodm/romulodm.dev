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

interface ContactModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
    const t = useTranslations('contact');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                    <DialogTitle>{t('modal-title')}</DialogTitle>
                    <DialogDescription>{t('modal-subtitle')}</DialogDescription>
                </DialogHeader>

                <ContactForm />
            </DialogContent>
        </Dialog>
    );
}