import type { CSSProperties } from "react"

import { useTranslations } from "next-intl"

import BlogList from "@/components/sections/posts/BlogList"
import TechLogoIcon from "@/components/TechLogoIcon"
import { TECH_LOGOS, type TechLogo } from "@/lib/tech-logos"

type Logo = TechLogo

// ─── Logo list ────────────────────────────────────────────────────────────────
// Order matters: the column layout below picks logos by index.

const logos: Logo[] = [
    // Core frontend
    TECH_LOGOS["React"],                              // 0
    TECH_LOGOS["Next.js"], // 1
    TECH_LOGOS["Tailwind CSS"],                        // 3
    TECH_LOGOS["TypeScript"],
    TECH_LOGOS["Redis"],                      // 2

    // Backend
    TECH_LOGOS["Node.js"],                          // 5
    TECH_LOGOS["Chainlink"],
    TECH_LOGOS["NestJS"],                             // 6
    TECH_LOGOS["Solidity"],                        // 10
    TECH_LOGOS["Express"],   // 7

    // Databases

    TECH_LOGOS["Python"],                             // 9
    TECH_LOGOS["MongoDB"],                            // 11
    TECH_LOGOS["Vite"],                               // 4
    TECH_LOGOS["Stripe"],                             // 32
    TECH_LOGOS["TypeORM"],                            // 14
    // 6
    TECH_LOGOS["Go"],

    // DevOps / infra
    TECH_LOGOS["Nginx"],                               // 19
    TECH_LOGOS["RabbitMQ"],                           // 22
    TECH_LOGOS["AWS"],                               // 18
    TECH_LOGOS["Git"],
    TECH_LOGOS["Apache Kafka"], // 23
    TECH_LOGOS["Linux"],                               // 21

    // Messaging / queues
    TECH_LOGOS["npm"],                                 // 22
    TECH_LOGOS["Ethereum"],   // 27
    TECH_LOGOS["Claude Code"],                  // 24
    TECH_LOGOS["MQTT"],                               // 25

    // Blockchain / Web3
    TECH_LOGOS["PostgreSQL"],
    TECH_LOGOS["FastAPI"],                          // 27
    TECH_LOGOS["GitHub Actions"],             // 28
    TECH_LOGOS["Raspberry Pi"],
    TECH_LOGOS["Web3.js"],                         // 30

    // Tooling / other
    TECH_LOGOS["GraphQL"],
    TECH_LOGOS["Prisma"],    // 13
    // 31
    TECH_LOGOS["Arduino"],                            // 33
    TECH_LOGOS["Three.js"], // 34
    TECH_LOGOS["Postman"],                            // 35
    TECH_LOGOS["Flask"],  // 36
    TECH_LOGOS["Kubernetes"],
    TECH_LOGOS["Docker"],                             // 16                          // 38
    TECH_LOGOS["Jest"],                               // 39
    TECH_LOGOS["Figma"],                              // 40
]

// ─── Column layout ────────────────────────────────────────────────────────────

type Column = { items: Logo[]; topPx: number }

const LEFT: Column[] = [
    { items: [logos[9], logos[2]], topPx: 170 },
    { items: [logos[21], logos[29], logos[33]], topPx: 100 },
    { items: [logos[16], logos[20], logos[17], logos[18]], topPx: 25 },
    { items: [logos[19], logos[38], logos[37]], topPx: 100 },
    { items: [logos[32], logos[26]], topPx: 140 },
    { items: [logos[11], logos[13]], topPx: 100 },
]

const CENTER: Column[] = [
    { items: [logos[3]], topPx: 130 },
    { items: [logos[0]], topPx: 100 },
    { items: [logos[1]], topPx: 60 },
    { items: [logos[5]], topPx: 60 },
    { items: [logos[7]], topPx: 90 },
    { items: [logos[30]], topPx: 130 },
]

const RIGHT: Column[] = [
    { items: [logos[10], logos[15]], topPx: 100 },
    { items: [logos[8], logos[6]], topPx: 140 },
    { items: [logos[39], logos[31], logos[4]], topPx: 100 },
    { items: [logos[22], logos[23], logos[24], logos[25]], topPx: 25 },
    { items: [logos[28], logos[27], logos[34]], topPx: 100 },
    { items: [logos[36], logos[12]], topPx: 170 },
]

const allColumns = [...LEFT, ...CENTER, ...RIGHT]

// ─── Mobile carousel layout ───────────────────────────────────────────────────
// Mesmos icones do arco, so que divididos em 2 faixas que rolam em loop:
// a de cima vai, a de baixo volta. A ordem segue os grupos da lista
// (frontend -> backend -> infra -> etc).

const MOBILE_ROW_SPLIT = Math.ceil(logos.length / 2)

const MOBILE_ROWS: Logo[][] = [
    logos.slice(0, MOBILE_ROW_SPLIT),
    logos.slice(MOBILE_ROW_SPLIT),
]

// Duracoes proporcionais ao tamanho de cada faixa, para as duas andarem
// na mesma velocidade aparente mesmo com contagens diferentes de icones.
const MOBILE_ROW_DURATIONS = MOBILE_ROWS.map((row) => `${Math.round(row.length * 2.4)}s`)

const CARD_CLASS = `
    flex items-center justify-center rounded-2xl
    border transition-transform duration-200 ease-out
    border-black/10 bg-white/75 backdrop-blur-2xl 
    dark:border-white/10 dark:bg-[rgba(23,23,23,0.85)]
`

// ─── LogoTile (arco — telas medias/grandes) ───────────────────────────────────
// Aqui o nome aparece em tooltip no hover.

function LogoTile({ logo }: { logo: Logo }) {
    return (
        <div className="group relative flex-shrink-0 pointer-events-auto">

            {/* Tooltip */}
            <div className="
                pointer-events-none
                absolute left-1/2 -translate-x-1/2
                bottom-[calc(100%+10px)]
                whitespace-nowrap rounded-lg
                bg-neutral-900 px-3 py-1.5
                text-xs font-semibold text-white
                shadow-lg
                opacity-0 scale-95 -translate-y-1
                group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
                transition-all duration-150 ease-out
                z-50
            ">
                {logo.name}
                <span className="
                    absolute left-1/2 -translate-x-1/2 top-full
                    border-4 border-transparent border-t-neutral-900
                " />
            </div>

            {/* Card */}
            <div className={`${CARD_CLASS} group-hover:-translate-y-1 w-16 h-16 md:w-20 md:h-20 xl:w-[100px] xl:h-[100px]`}>
                <TechLogoIcon logo={logo} className="h-[65%] w-[65%]" />
            </div>
        </div>
    )
}

// ─── CarouselTile (celular) ───────────────────────────────────────────────────
// Sem tooltip: o nome fica fixo embaixo do card, porque em touch nao ha hover.

function CarouselTile({ logo }: { logo: Logo }) {
    return (
        <div className="flex w-[84px] flex-shrink-0 flex-col items-center gap-2">
            <div className={`${CARD_CLASS} h-16 w-16`}>
                <TechLogoIcon logo={logo} className="h-[65%] w-[65%]" />
            </div>
            <span className="w-full truncate text-center text-xs font-medium leading-none text-neutral-500 dark:text-neutral-400">
                {logo.name}
            </span>
        </div>
    )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Stack() {
    const t = useTranslations("home.showcase")

    return (
        /*
         * Esta secao nao e marcada com `data-st-03`. A transicao que a entrega
         * e feita pelo <Built />, o irmao anterior, em modo `cover` — cada
         * secao cobre a si mesma com a cor da seguinte, encadeado. O modo
         * `reveal` ancoraria a grade no rodape desta secao, que fica a milhares
         * de pixels da emenda.
         */
        <section className="relative -mt-16 flex flex-col items-center overflow-hidden pt-10 md:pt-4 px-4 sm:px-6">

            {/* Arc container */}
            <div
                className="relative hidden w-full pointer-events-none md:block"
                style={{ height: 380, marginBottom: -160 }}
            >
                <div
                    className="
                        absolute left-1/2 top-0 origin-top flex items-start
                        gap-2 sm:gap-3 md:gap-5 lg:gap-7 xl:gap-11
                    "
                    style={{ transform: "translateX(-50%)" }}
                >
                    {allColumns.map((col, colIdx) => (
                        <div
                            key={colIdx}
                            className="flex flex-col flex-shrink-0 gap-2 sm:gap-3 md:gap-5 lg:gap-7 xl:gap-11"
                            style={{ marginTop: col.topPx }}
                        >
                            {col.items.map((logo, logoIdx) => (
                                <LogoTile key={`${logo.name}-${colIdx}-${logoIdx}`} logo={logo} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Carrossel — mesmos icones do arco, em 2 faixas: uma indo e outra
                vindo. Sai de cena a partir de md, onde o arco assume. */}
            <div className="relative w-full md:hidden">
                {/* Fade nas bordas */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />

                <div className="flex flex-col gap-4 py-2">
                    {MOBILE_ROWS.map((row, rowIdx) => (
                        <div key={rowIdx} className="overflow-hidden py-1">
                            <div
                                className={`
                                    flex w-max animate-stack-marquee
                                    motion-reduce:animate-none
                                    ${rowIdx % 2 === 1 ? '[animation-direction:reverse]' : ''}
                                `}
                                style={{ "--marquee-duration": MOBILE_ROW_DURATIONS[rowIdx] } as CSSProperties}
                            >
                                {/* Duas copias identicas: o keyframe anda -50%, entao o loop
                                    volta exatamente para o inicio da segunda copia. */}
                                {[0, 1].map((copy) => (
                                    <div
                                        key={copy}
                                        className="flex flex-shrink-0 gap-3 pr-3"
                                        aria-hidden={copy === 1}
                                    >
                                        {row.map((logo, logoIdx) => (
                                            <CarouselTile key={`${logo.name}-${copy}-${logoIdx}`} logo={logo} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* O cabecalho e igual ao das outras secoes, linha inclusive — ela
                cai por cima do arco, que ja esta esmaecido no fundo. */}
            <div className="relative z-10 mx-auto mt-6 max-w-xl text-center">
                <p className="mx-auto mt-3 max-w-lg text-pretty text-base leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-lg">
                    {t("description")}

                    <>
                        {' '}
                        <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {t("highlight")}
                        </strong>
                    </>

                </p>

            </div>

            <BlogList />
        </section>
    )
}