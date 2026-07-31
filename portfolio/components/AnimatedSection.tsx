"use client"

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react"
import { animated, easings, useSpring } from "@react-spring/web"

interface AnimatedSectionProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    /** Atraso em segundos, para escalonar secoes vizinhas. */
    delay?: number
}

function useInViewOnce<T extends Element>(margin = "0px 0px -10% 0px") {
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
                    observer.disconnect()
                }
            },
            { rootMargin: margin, threshold: 0.1 },
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [margin])

    return { ref, inView }
}

export function AnimatedSection({
    children,
    className,
    delay = 0,
    ...props
}: AnimatedSectionProps) {
    const { ref, inView } = useInViewOnce<HTMLDivElement>()

    const style = useSpring({
        from: { opacity: 0, y: 20, scale: 0.98 },
        to: inView ? { opacity: 1, y: 0, scale: 1 } : undefined,
        delay: delay * 1000,
        config: { duration: 800, easing: easings.easeOutCubic },
    })

    return (
        <animated.div ref={ref} className={className} style={style} {...props}>
            {children}
        </animated.div>
    )
}
