import BlogList from "@/components/sections/posts/BlogList"

type Logo = {
    name: string
    src: string
}

const logos: Logo[] = [
    { name: "React", src: "https://cdn.simpleicons.org/react/61DAFB" },                // 0
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/000000" },          // 1
    { name: "Node.js", src: "https://cdn.simpleicons.org/nodedotjs/339933" },          // 2
    { name: "Express", src: "https://cdn.simpleicons.org/express/000000" },            // 3
    { name: "MongoDB", src: "https://cdn.simpleicons.org/mongodb/47A248" },            // 4
    { name: "PostgreSQL", src: "https://cdn.simpleicons.org/postgresql/4169E1" },      // 5
    { name: "Docker", src: "https://cdn.simpleicons.org/docker/2496ED" },              // 6
    { name: "Git", src: "https://cdn.simpleicons.org/git/F05032" },                    // 7
    { name: "Go", src: "https://cdn.simpleicons.org/go/00ADD8" },                      // 8
    { name: "Postman", src: "https://cdn.simpleicons.org/postman/FF6C37" },            // 9
    { name: "VS Code", src: "https://cdn.simpleicons.org/visualstudiocode/007ACC" },   // 10
    { name: "Python", src: "https://cdn.simpleicons.org/python/3776AB" },              // 11
    { name: "C++", src: "https://cdn.simpleicons.org/cplusplus/00599C" },              // 12
    { name: "Arduino", src: "https://cdn.simpleicons.org/arduino/00979D" },            // 13
    { name: "Tailwind CSS", src: "https://cdn.simpleicons.org/tailwindcss/06B6D4" },   // 14
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe/635BFF" },              // 15
    { name: "Ethereum", src: "https://cdn.simpleicons.org/ethereum/3C3C3D" },          // 16
    { name: "Web3.js", src: "https://cdn.simpleicons.org/web3dotjs/F16822" },          // 17
    { name: "TypeScript", src: "https://cdn.simpleicons.org/typescript/3178C6" },      // 18
    { name: "Redis", src: "https://cdn.simpleicons.org/redis/FF4438" },                // 19
    { name: "Prisma", src: "https://cdn.simpleicons.org/prisma/2D3748" },              // 20
    { name: "GraphQL", src: "https://cdn.simpleicons.org/graphql/E10098" },            // 21
    { name: "Figma", src: "https://cdn.simpleicons.org/figma/F24E1E" },                // 22
    { name: "Linux", src: "https://cdn.simpleicons.org/linux/FCC624" },                // 23
    { name: "Rust", src: "https://cdn.simpleicons.org/rust/000000" },                  // 24
    { name: "Kubernetes", src: "https://cdn.simpleicons.org/kubernetes/326CE5" },      // 25
    { name: "AWS", src: "https://cdn.simpleicons.org/amazonwebservices/FF9900" },      // 26
    { name: "Nginx", src: "https://cdn.simpleicons.org/nginx/009639" },                // 27
    { name: "Supabase", src: "https://cdn.simpleicons.org/supabase/3ECF8E" },          // 28
    { name: "Vercel", src: "https://cdn.simpleicons.org/vercel/000000" },              // 29
    { name: "Jest", src: "https://cdn.simpleicons.org/jest/C21325" },                  // 30
    { name: "Solidity", src: "https://cdn.simpleicons.org/solidity/363636" },          // 31
    { name: "Vite", src: "https://cdn.simpleicons.org/vite/646CFF" },                  // 32
]

type Column = { items: Logo[]; topPx: number }

const LEFT: Column[] = [
    { items: [logos[12], logos[18]], topPx: 170 },
    { items: [logos[11], logos[24], logos[12]], topPx: 100 },
    { items: [logos[23], logos[13], logos[18], logos[9]], topPx: 25 },
    { items: [logos[6], logos[7], logos[25]], topPx: 100 },
    { items: [logos[15], logos[31]], topPx: 140 },
    { items: [logos[4], logos[20]], topPx: 100 },
]

const CENTER: Column[] = [
    { items: [logos[14]], topPx: 130 },
    { items: [logos[0]], topPx: 100 },
    { items: [logos[1]], topPx: 60 },
    { items: [logos[2]], topPx: 60 },
    { items: [logos[3]], topPx: 90 },
    { items: [logos[17]], topPx: 130 },
]

const RIGHT: Column[] = [
    { items: [logos[5], logos[9]], topPx: 100 },
    { items: [logos[8], logos[29]], topPx: 140 },
    { items: [logos[30], logos[21], logos[32]], topPx: 100 },
    { items: [logos[15], logos[13], logos[15], logos[15]], topPx: 25 },
    { items: [logos[29], logos[9], logos[13]], topPx: 100 },
    { items: [logos[10], logos[10]], topPx: 170 },
]

const allColumns = [...LEFT, ...CENTER, ...RIGHT]

function LogoTile({ logo }: { logo: Logo }) {
    return (
        <div className="group relative flex-shrink-0">

            {/* Tooltip */}
            <div
                className="
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
                "
            >
                {logo.name}
                {/* Arrow pointing down */}
                <span className="
                    absolute left-1/2 -translate-x-1/2 top-full
                    border-4 border-transparent border-t-neutral-900
                " />
            </div>

            {/* Card */}
            <div
                className="
                    flex items-center justify-center rounded-2xl
                    border border-border bg-white dark:bg-secondary
                    shadow-md
                    transition-transform duration-200 ease-out
                    group-hover:-translate-y-1
                    w-16 h-16
                    md:w-20 md:h-20
                    xl:w-[100px] xl:h-[100px]
                "
            >
                <img
                    className="h-[65%] w-[65%] object-contain"
                    src={logo.src}
                    alt={logo.name}
                />
            </div>
        </div>
    )
}

export default function Stack() {
    return (
        <section className="relative -mt-16 flex flex-col items-center overflow-hidden pt-4 px-4 sm:px-6">

            {/* Arc container */}
            <div
                className="relative w-full"
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

            {/* Text content */}
            <div className="relative mt-5 z-10 mx-auto max-w-xl text-center">
                <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-neutral-500 sm:text-lg">
                    {"Frontend, backend, databases, DevOps, blockchain, embedded systems, payment gateways, APIs, and more. "}
                    <strong className="font-semibold text-neutral-900">Yes.</strong>
                </p>
                <a
                    href="#"
                    className="mt-6 inline-flex items-center gap-1 text-base font-medium text-neutral-400 transition-colors hover:text-neutral-900"
                >
                    {"Explore my projects "}
                    <span aria-hidden="true">&rarr;</span>
                </a>
            </div>

            <BlogList />
        </section>
    )
}