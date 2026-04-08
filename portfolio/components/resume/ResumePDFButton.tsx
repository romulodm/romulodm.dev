'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Download, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/**
 * Mapeia cada locale para o arquivo PDF correspondente em /public.
 * Adicione ou edite entradas conforme necessário.
 */
const PDF_BY_LOCALE: Record<string, string> = {
    pt: '/resume-pt.pdf',
    en: '/resume-en.pdf',
};

const FALLBACK_PDF = '/resume-en.pdf';

export function ResumePDFButton() {
    const locale = useLocale();
    const t = useTranslations('ResumePDFButton');

    const pdfPath = PDF_BY_LOCALE[locale] ?? FALLBACK_PDF;
    const fileName = `Resume-${locale.toUpperCase()}.pdf`;

    const [loading, setLoading] = useState<'view' | 'download' | null>(null);
    const [isSticky, setIsSticky] = useState(true);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsSticky(!entry.isIntersecting);
            },
            { threshold: 0, rootMargin: '80px 0px 0px 0px' }
        );

        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    const handleView = async () => {
        setLoading('view');
        try {
            window.open(pdfPath, '_blank');
        } finally {
            setLoading(null);
        }
    };

    const handleDownload = async () => {
        setLoading('download');
        try {
            const response = await fetch(pdfPath);
            if (!response.ok) throw new Error('Failed to fetch PDF');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setLoading(null);
        }
    };

    const ButtonUI = (
        <div className="no-pdf flex items-center rounded-xl border border-border bg-background overflow-hidden w-fit shadow-md">
            <div className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium whitespace-nowrap">{fileName}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <button
                onClick={handleView}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
                {loading === 'view' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
                {t('view')}
            </button>
            <div className="w-px h-8 bg-border" />
            <button
                onClick={handleDownload}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                {loading === 'download' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                {t('download')}
            </button>
        </div>
    );

    return (
        <>
            {isSticky && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    {ButtonUI}
                </div>
            )}
            <div ref={sentinelRef} className="flex justify-center mt-6">
                {!isSticky && ButtonUI}
            </div>
        </>
    );
}