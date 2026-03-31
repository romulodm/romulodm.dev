'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FooterNewsletter } from './FooterNewsletter'
import { Logo } from './Logo'
import { FaLinkedinIn } from 'react-icons/fa'
import { BsGithub, BsInstagram } from 'react-icons/bs'
import { FaArrowRightLong } from 'react-icons/fa6'
import { Mail, MapPin, Phone } from 'lucide-react'
import { TermsModal } from './modals/TermsModal'

export function Footer() {
    const t = useTranslations('footer')
    const currentYear = new Date().getFullYear()

    const [termsOpen, setTermsOpen] = useState(false);

    return (
        <footer
            className="relative z-[5] overflow-hidden pt-10 px-4 sm:px-5 mt-10"
            style={{
                backgroundColor: '#00C74D',
                borderRadius: '56px 56px 0 0',
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1440 800"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <polygon points="980,0 1440,0 1440,480 980,0" fill="#A5FF82" opacity="0.55" />
                <polygon points="0,520 220,800 0,800" fill="#A5FF82" opacity="0.45" />
                <polygon points="1260,600 1440,480 1440,800 1260,800" fill="#A5FF82" opacity="0.3" />
                <polygon points="0,200 320,0 0,0" fill="#A5FF82" opacity="0.25" />
            </svg> */}

            {/* ── CTA ── */}
            <div className="relative z-[2] text-center max-w-[740px] mx-auto mb-10 px-4">
                <h2
                    className="font-extrabold text-white text-[#0e0e0e] leading-[1.06] tracking-tight mb-5"
                    style={{
                        fontSize: 'clamp(2rem, 5.5vw, 4.2rem)',
                        letterSpacing: '-0.025em',
                    }}
                >
                    {t('cta.title')}
                </h2>
                <a

                    href="mailto:demoraes.romulo@hotmail.com"
                    className="inline-flex items-center gap-2.5 bg-[#0e0e0e] text-white text-[0.95rem] font-medium px-[22px] py-[13px] rounded-full no-underline hover:opacity-90 transition-opacity"
                >
                    {t('cta.button')}
                    <span className="bg-[#00C74D] text-white text-[#0e0e0e] w-[26px] h-[26px] rounded-full flex items-center justify-center text-[0.85rem]">
                        <FaArrowRightLong />
                    </span>
                </a>

                <p className="mt-[18px] text-sm sm:text-base text-white font-semilbold">
                    {t('cta.disclaimer')}
                </p>
            </div>

            {/* ── Black card ── */}
            <div
                className="relative z-[2] bg-[#0e0e0e] mx-auto max-w-[1220px] px-5 pt-10 sm:px-8 sm:pt-12 md:px-12 md:pt-14"
                style={{ borderRadius: '40px 40px 0 0' }}
            >
                <FooterNewsletter />

                {/* Grid */}
                <div className="grid gap-8 pb-12 grid-cols-2 md:grid-cols-3 lg:grid-cols-[190px_1fr_1fr_1fr_260px]">

                    {/* Logo */}
                    <div className="flex items-start col-span-2 md:col-span-3 lg:col-span-1">
                        <a href="/" className="flex items-center gap-2.5 no-underline">
                            <Logo size={55} />
                        </a>
                    </div>

                    <FooterCol title={t('nav.resources.title')}>
                        <FooterLink href="/">{t('nav.resources.links.home')}</FooterLink>
                        <FooterLink href="/resume">{t('nav.resources.links.resume')}</FooterLink>
                        <FooterLink href="/blog">{t('nav.resources.links.blog')}</FooterLink>
                        <FooterLink href="/profile">{t('nav.resources.links.profile')}</FooterLink>
                    </FooterCol>

                    <FooterCol title={t('nav.newsletter.title')}>
                        <FooterLink href="/newsletter/about">{t('nav.newsletter.links.about')}</FooterLink>
                        <FooterLink href="/newsletter/login">{t('nav.newsletter.links.login')}</FooterLink>
                        <FooterLink href="/newsletter/logout">{t('nav.newsletter.links.logout')}</FooterLink>
                        <FooterLink href="/newsletter/privacy">{t('nav.newsletter.links.privacy')}</FooterLink>
                    </FooterCol>

                    <FooterCol title={t('nav.legal.title')}>
                        <FooterLink href="/privacy">{t('nav.legal.links.privacy')}</FooterLink>
                        <li>
                            <button
                                onClick={() => setTermsOpen(true)}
                                className="text-[0.78rem] text-white/50 no-underline leading-snug hover:text-white/80 transition-colors"
                                title="Terms of Service"
                            >
                                {t('nav.legal.links.terms')}
                            </button>
                        </li>
                        <FooterLink href="/legal">{t('nav.legal.links.notices')}</FooterLink>
                    </FooterCol>

                    {/* About — ocupa linha inteira no mobile */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-sm font-semibold text-white mb-4 tracking-[0.01em]">
                            {t('nav.about.title')}
                        </h4>
                        <p className="text-[0.72rem] text-white/50 leading-relaxed">
                            {t('nav.about.description')}
                        </p>
                        <p className="text-[0.72rem] mt-4 text-white/50 leading-relaxed">
                            {t('nav.about.community')}
                        </p>
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center space-x-2 text-gray-300">
                                <div className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <a
                                    href="mailto:hello@aiagency.com"
                                    className="text-sm text-white/50 hover:text-white transition-colors duration-300"
                                >
                                    romulo@romulodm.dev
                                </a>
                            </div>

                            <div className="flex items-center space-x-2 text-gray-300">
                                <div className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <a
                                    href='https://maps.app.goo.gl/RVpzZiEVoMxdtNuN7'
                                    target='_blank'
                                    className="text-sm text-white/50 hover:text-white transition-colors duration-300"
                                >
                                    Av. Itália Carreiros, Rio Grande
                                </a>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Socials ── */}
                <div className="flex justify-between items-center py-5 border-t border-white/10">
                    <div className="flex gap-2">
                        <SocialBtn href="https://github.com/romulodm" aria-label="GitHub">
                            <BsGithub />
                        </SocialBtn>
                        <SocialBtn href="https://linkedin.com/in/romulodm" aria-label="LinkedIn">
                            <FaLinkedinIn />
                        </SocialBtn>
                        <SocialBtn href="https://instagram.com/romulo_dmr" aria-label="Instagram">
                            <BsInstagram />
                        </SocialBtn>
                    </div>

                    <iframe
                        className="hidden sm:block"
                        src={`https://ghbtns.com/github-btn.html?user=romulodm&repo=go-chess&type=star&count=true&v=2&dark=1`}
                        width="80"
                        height="20"
                        title="Star on GitHub"
                        loading="lazy"
                    />
                </div>

                {/* ── Bottom bar ── */}
                <div className="border-t border-white/10 py-[18px] pb-7 flex justify-between items-center flex-wrap gap-2.5">
                    <p className="text-xs text-white/25">
                        Romulo {t('legal.copyright', { year: currentYear })}
                    </p>
                    <p className="text-xs text-white/30 flex items-center">
                        {t('legal.madeWith')}
                        <span className='px-1'>
                            <picture>
                                <source src="https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp" type="image/webp" />
                                <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif" alt="❤" width="18" height="18" />
                            </picture>
                        </span>
                        Next.js & TypeScript
                    </p>
                </div>
            </div>

            {termsOpen && (
                <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
            )}
        </footer>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-sm font-semibold text-white mb-4 tracking-[0.01em]">
                {title}
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                {children}
            </ul>
        </div>
    )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <a
                href={href}
                className="text-[0.78rem] text-white/50 no-underline leading-snug hover:text-white/80 transition-colors"
            >
                {children}
            </a>
        </li>
    )
}

function SocialBtn({
    children,
    href,
    'aria-label': label,
}: {
    children: React.ReactNode
    href: string
    'aria-label': string
}) {
    return (
        <a
            href={href}
            aria-label={label}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 bg-white/5 text-white rounded-full flex items-center justify-center no-underline hover:bg-white/10 transition-colors"
        >
            {children}
        </a>
    )
}