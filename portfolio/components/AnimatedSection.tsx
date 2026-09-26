"use client"

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react"
import { animated, easings, useSpring } from "@react-spring/web"

interface AnimatedSectionProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    /** Atraso em segundos, para escalonar secoes vizinhas. */
    delay?: number
    /** How far below its final position the section starts, in px. */
    offset?: number
    /**
     * IntersectionObserver rootMargin. A larger negative bottom margin makes
     * the section wait until it is further up the viewport before revealing.
     */
    rootMargin?: string
    /**
     * When false, the section hides again once it drops back below the reveal
     * line (the visitor scrolled up), and reveals again on the way down.
     * Leaving through the top of the viewport does not hide it.
     */
    once?: boolean
}

function useInView<T extends Element>(margin = "0px 0px -10% 0px", once = true) {
    const ref = useRef<T>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const node = ref.current
        if (!node) return

        // Sem IntersectionObserver o conteudo apareceria invisivel para sempre,
        // entao o fallback e mostrar direto.
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    if (once) observer.disconnect()
                } else if (!once && entry.boundingClientRect.top > 0) {
                    // Only below the viewport: scrolling past it downwards
                    // must not hide it.
                    setInView(false)
                }
            },
            { rootMargin: margin, threshold: 0.1 },
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [margin, once])

    return { ref, inView }
}

export function AnimatedSection({
    children,
    className,
    delay = 0,
    offset = 20,
    rootMargin,
    once = true,
    ...props
}: AnimatedSectionProps) {
    const { ref, inView } = useInView<HTMLDivElement>(rootMargin, once)

    const style = useSpring({
        from: { opacity: 0, y: offset, scale: 0.98 },
        to: inView
            ? { opacity: 1, y: 0, scale: 1 }
            : once
                ? undefined
                : { opacity: 0, y: offset, scale: 0.98 },
        delay: delay * 1000,
        config: { duration: 800, easing: easings.easeOutCubic },
    })

    return (
        <animated.div ref={ref} className={className} style={style} {...props}>
            {children}
        </animated.div>
    )
}
