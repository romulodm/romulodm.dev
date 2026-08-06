import { useTranslations } from "next-intl"
import { FiCpu } from "react-icons/fi"

import BlogList from "@/components/sections/posts/BlogList"
import SectionHeader from "@/components/sections/SectionHeader"

type Logo = {
    name: string
    src?: string           // simpleicons CDN URL
    srcDark?: string       // dark variant (simpleicons CDN URL)
    svgLight?: string      // inline SVG string for light mode (no simpleicons entry)
    svgDark?: string       // inline SVG string for dark mode
}

// ─── Inline SVGs for icons not in simpleicons v16 ────────────────────────────

// VS Code — official blue icon with wordmark-style mark
const SVG_VSCODE = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <mask id="m">
    <rect width="100" height="100" fill="white"/>
    <path d="M70 5L30 45 12 30 5 37l18 13L5 63l7 7 18-13 40 40 20-10V15L70 5z" fill="black"/>
  </mask>
  <path d="M90 15L70 5 30 45 12 30 5 37l18 13L5 63l7 7 18-13 40 40 20-10V15z" fill="#007ACC" mask="url(#m)"/>
  <path d="M70 5L90 15v70L70 95 30 55l-12 9-7-7 18-13L5 37l7-7 18 13z" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="5" y1="50" x2="95" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#29ABE2"/>
      <stop offset="1" stop-color="#007ACC"/>
    </linearGradient>
  </defs>
</svg>`

// AWS — orange "AWS" logotype on dark square (works both themes)
const SVG_AWS_LIGHT = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="50" y="46" font-family="Arial Black, sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="#FF9900">AWS</text>
  <path d="M18 58 Q50 72 82 58" stroke="#FF9900" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M76 53 L82 58 L76 63" stroke="#FF9900" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
const SVG_AWS_DARK = SVG_AWS_LIGHT

// MySQL — blue dolphin-style wordmark
const SVG_MYSQL = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="50" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#4479A1">MySQL</text>
  <path d="M62 28 Q72 18 80 25 Q88 32 75 40 Q85 42 82 55 Q70 45 62 50 Q58 38 62 28z" fill="#4479A1" opacity="0.85"/>
</svg>`
const SVG_MYSQL_DARK = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="50" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#5B9BD5">MySQL</text>
  <path d="M62 28 Q72 18 80 25 Q88 32 75 40 Q85 42 82 55 Q70 45 62 50 Q58 38 62 28z" fill="#5B9BD5" opacity="0.85"/>
</svg>`

// BullMQ — red bull silhouette
const SVG_BULLMQ = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 35 Q10 20 20 18 Q28 16 30 28" stroke="#CC2200" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M85 35 Q90 20 80 18 Q72 16 70 28" stroke="#CC2200" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="58" rx="30" ry="26" fill="#E53E2A"/>
  <circle cx="38" cy="50" r="5" fill="white"/>
  <circle cx="62" cy="50" r="5" fill="white"/>
  <circle cx="39" cy="51" r="2" fill="#333"/>
  <circle cx="63" cy="51" r="2" fill="#333"/>
  <ellipse cx="50" cy="62" rx="10" ry="5" fill="#C0301A"/>
  <path d="M42 69 Q50 76 58 69" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`

// PostGIS — elephant head (PostgreSQL) + location pin
const SVG_POSTGIS = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="42" cy="54" rx="26" ry="28" fill="#4169E1"/>
  <ellipse cx="42" cy="46" rx="20" ry="18" fill="#6080F0"/>
  <path d="M28 44 Q22 36 26 28 Q30 20 38 24" fill="#4169E1"/>
  <ellipse cx="34" cy="46" rx="4" ry="6" fill="#8090FF" opacity="0.6"/>
  <path d="M42 72 Q36 82 38 90" stroke="#4169E1" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M42 72 Q48 82 46 90" stroke="#4169E1" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="42" r="3" fill="#1a1a2e"/>
  <path d="M42 60 Q55 58 60 46" stroke="#8090FF" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="72" cy="36" r="14" fill="#27AE60"/>
  <path d="M72 24c-6.627 0-12 4.84-12 10.8 0 8.1 12 21.6 12 21.6s12-13.5 12-21.6C84 28.84 78.627 24 72 24z" fill="#2ECC71"/>
  <circle cx="72" cy="34" r="5" fill="white"/>
</svg>`

// ─── Logo list ────────────────────────────────────────────────────────────────

const logos: Logo[] = [
    // Core frontend
    { name: "React", src: "https://cdn.simpleicons.org/react/61DAFB" },                              // 0
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/000000", srcDark: "https://cdn.simpleicons.org/nextdotjs/ffffff" }, // 1
    { name: "TypeScript", src: "https://cdn.simpleicons.org/typescript/3178C6" },                         // 2
    { name: "Tailwind CSS", src: "https://cdn.simpleicons.org/tailwindcss/06B6D4" },                        // 3
    { name: "Vite", src: "https://cdn.simpleicons.org/vite/646CFF" },                               // 4

    // Backend
    { name: "Node.js", src: "https://cdn.simpleicons.org/nodedotjs/339933" },                          // 5
    { name: "NestJS", src: "https://cdn.simpleicons.org/nestjs/E0234E" },                             // 6
    { name: "Express", src: "https://cdn.simpleicons.org/express/000000", srcDark: "https://cdn.simpleicons.org/express/ffffff" },   // 7
    { name: "Go", src: "https://cdn.simpleicons.org/go/00ADD8" },                                 // 8
    { name: "Python", src: "https://cdn.simpleicons.org/python/3776AB" },                             // 9

    // Databases
    { name: "PostgreSQL", src: "https://cdn.simpleicons.org/postgresql/4169E1" },                         // 10
    { name: "MongoDB", src: "https://cdn.simpleicons.org/mongodb/47A248" },                            // 11
    { name: "Redis", src: "https://cdn.simpleicons.org/redis/FF4438" },                              // 12
    { name: "Prisma", src: "https://cdn.simpleicons.org/prisma/2D3748", srcDark: "https://cdn.simpleicons.org/prisma/a0aec0" },    // 13
    { name: "TypeORM", src: "https://cdn.simpleicons.org/typeorm/FE0803" },                            // 14
    { name: "PostGIS", svgLight: SVG_POSTGIS, svgDark: SVG_POSTGIS },                                // 15

    // DevOps / infra
    { name: "Docker", src: "https://cdn.simpleicons.org/docker/2496ED" },                             // 16
    { name: "Kubernetes", src: "https://cdn.simpleicons.org/kubernetes/326CE5" },                         // 17
    { name: "AWS", svgLight: SVG_AWS_LIGHT, svgDark: SVG_AWS_DARK },                               // 18
    { name: "Nginx", src: "https://cdn.simpleicons.org/nginx/009639" },                               // 19
    { name: "Git", src: "https://cdn.simpleicons.org/git/F05032" },                                 // 20
    { name: "Linux", src: "https://cdn.simpleicons.org/linux/FCC624" },                               // 21

    // Messaging / queues
    { name: "RabbitMQ", src: "https://cdn.simpleicons.org/rabbitmq/FF6600" },                           // 22
    { name: "Apache Kafka", src: "https://cdn.simpleicons.org/apachekafka/231F20", srcDark: "https://cdn.simpleicons.org/apachekafka/ffffff" }, // 23
    { name: "BullMQ", svgLight: SVG_BULLMQ, svgDark: SVG_BULLMQ },                                   // 24
    { name: "MQTT", src: "https://cdn.simpleicons.org/mqtt/660066" },                               // 25

    // Blockchain / Web3
    { name: "Solidity", src: "https://cdn.simpleicons.org/solidity/363636", srcDark: "https://cdn.simpleicons.org/solidity/aaaaaa" },   // 26
    { name: "Ethereum", src: "https://cdn.simpleicons.org/ethereum/3C3C3D", srcDark: "https://cdn.simpleicons.org/ethereum/9ca3af" },   // 27
    { name: "Chainlink", src: "https://cdn.simpleicons.org/chainlink/375BD2" },                          // 28
    { name: "MySQL", svgLight: SVG_MYSQL, svgDark: SVG_MYSQL_DARK },                                 // 29
    { name: "Web3.js", src: "https://cdn.simpleicons.org/web3dotjs/F16822" },                         // 30

    // Tooling / other
    { name: "GraphQL", src: "https://cdn.simpleicons.org/graphql/E10098" },                            // 31
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe/635BFF" },                             // 32
    { name: "Arduino", src: "https://cdn.simpleicons.org/arduino/00979D" },                            // 33
    { name: "Raspberry Pi", src: "https://cdn.simpleicons.org/raspberrypi/A22846" },                        // 34
    { name: "Postman", src: "https://cdn.simpleicons.org/postman/FF6C37" },                            // 35
    { name: "VS Code", svgLight: SVG_VSCODE, svgDark: SVG_VSCODE },                                   // 36
    { name: "Vercel", src: "https://cdn.simpleicons.org/vercel/000000", srcDark: "https://cdn.simpleicons.org/vercel/ffffff" },    // 37
    { name: "Supabase", src: "https://cdn.simpleicons.org/supabase/3ECF8E" },                           // 38
    { name: "Jest", src: "https://cdn.simpleicons.org/jest/C21325" },                               // 39
    { name: "Figma", src: "https://cdn.simpleicons.org/figma/F24E1E" },                              // 40
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

// ─── LogoTile ─────────────────────────────────────────────────────────────────

function LogoTile({ logo }: { logo: Logo }) {
    const hasDarkVariant = !!(logo.srcDark || logo.svgDark)

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
            <div className="
                flex items-center justify-center rounded-2xl
                border transition-transform duration-200 ease-out
                group-hover:-translate-y-1
                w-16 h-16
                md:w-20 md:h-20
                xl:w-[100px] xl:h-[100px]
                bg-white/90 border-border shadow-md backdrop-blur-xl
                dark:bg-[#1a1a1f] dark:border-[#2e2e38] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]
            ">
                {logo.svgLight ? (
                    <>
                        {/* Inline SVG — light */}
                        <div
                            className={`h-[65%] w-[65%] [&>svg]:h-full [&>svg]:w-full ${hasDarkVariant ? 'dark:hidden' : ''}`}
                            dangerouslySetInnerHTML={{ __html: logo.svgLight }}
                        />
                        {/* Inline SVG — dark */}
                        {logo.svgDark && (
                            <div
                                className="h-[65%] w-[65%] [&>svg]:h-full [&>svg]:w-full hidden dark:block"
                                dangerouslySetInnerHTML={{ __html: logo.svgDark }}
                            />
                        )}
                    </>
                ) : (
                    <>
                        {/* Simpleicons img — light */}
                        <img
                            className={`h-[65%] w-[65%] object-contain ${hasDarkVariant ? 'dark:hidden' : ''}`}
                            src={logo.src}
                            alt={logo.name}
                        />
                        {/* Simpleicons img — dark */}
                        {logo.srcDark && (
                            <img
                                className="h-[65%] w-[65%] object-contain hidden dark:block"
                                src={logo.srcDark}
                                alt={logo.name}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Stack() {
    const t = useTranslations("home.showcase")

    return (
        <section className="relative -mt-16 flex flex-col items-center overflow-hidden pt-4 px-4 sm:px-6">

            {/* Arc container */}
            <div
                className="relative w-full pointer-events-none"
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