const GITHUB_TOKEN = process.env.NEXT_GITHUB_TOKEN;

const BASE_URL = 'https://api.github.com/users/romulodm';

const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
};

export async function getGitHubProjects(): Promise<GitHubRepo[]> {
    const response = await fetch(`${BASE_URL}/repos`, {
        headers,
        next: { revalidate: 3600 }, // revalida a cada 1h, evitando calls desnecessárias à API do GitHub
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Downloads da última semana no npm.
 *
 * Endpoint público, sem token. Devolve `null` em qualquer falha em vez de
 * estourar: a seção de projetos não pode desaparecer da home porque a API do
 * npm piscou — o card só volta a mostrar forks nesse caso.
 */
export async function getNpmWeeklyDownloads(
    packageName: string,
): Promise<number | null> {
    try {
        const response = await fetch(
            `https://api.npmjs.org/downloads/point/last-week/${packageName}`,
            { next: { revalidate: 3600 } }, // mesma janela do fetch do GitHub acima
        );

        if (!response.ok) return null;

        const data: unknown = await response.json();
        const downloads = (data as { downloads?: unknown })?.downloads;

        return typeof downloads === 'number' ? downloads : null;
    } catch {
        return null;
    }
}

interface GitHubRepo {
    name: string;
    description: string | null;
    owner: {
        avatar_url: string;
    };
    html_url: string;
    homepage: string | null;
    language: string | null;
    created_at: string;
    updated_at: string;
    stargazers_count: number;
    forks_count: number;
}

/** Os dois locales que o site realmente serve (ver i18n/routing.ts). */
export interface ProjectDescriptions {
    pt: string;
    en: string;
}

export interface Project {
    title: string;
    /**
     * Escrita à mão, não o `description` do repo: o campo do GitHub é só em
     * inglês e genérico demais para a home.
     */
    descriptions: ProjectDescriptions;
    thumbnail: string;
    source: string;
    demo: string | null;
    language: string | null;
    createdAt: string;
    updatedAt: string;
    interactions: {
        stars: number;
        forks: number;
    };
    /** Downloads semanais no npm, para os projetos que são pacotes publicados. */
    weeklyDownloads: number | null;
    /**
     * Seed for the card icon. When set, the card draws a seedicon avatar from it
     * instead of the GitHub mark; `null` keeps the mark. See MainProjectConfig.
     */
    iconSeed: string | null;
    platform: 'github';
    extraLanguages: string[];
}

interface MainProjectConfig {
    name: string;
    extraLanguages: string[];
    descriptions: ProjectDescriptions;
    /**
     * Nome no registro do npm. Quando presente, o card mostra downloads
     * semanais no lugar de forks — para um pacote, forks não dizem nada.
     */
    npmPackage?: string;
    /**
     * Seed for a seedicon avatar drawn in place of the GitHub mark on this card.
     * It exists for the seedicon project itself: a card that claims the package
     * draws the avatars on this site is more convincing showing one than showing
     * the same GitHub glyph as every other card. The value is a fixed string
     * picked for the drawing it produces, not something derived from the repo
     * name: any other seed is a different image, so it is written out here and
     * left alone. Omit it and the card keeps the GitHub mark.
     */
    iconSeed?: string;
}

interface GetMainProjectsResult {
    length: number;
    filteredAndOrderedProjects: Project[];
}

function transformGitHubRepoToProject(repo: GitHubRepo): Project {
    return {
        title: repo.name,
        descriptions: { pt: '', en: '' }, // preenchido a partir de mainProjects
        thumbnail: repo.owner.avatar_url,
        source: repo.html_url,
        demo: repo.homepage,
        language: repo.language,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        interactions: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
        },
        weeklyDownloads: null,
        iconSeed: null,
        platform: 'github',
        extraLanguages: [],
    };
}

const mainProjects: MainProjectConfig[] = [
    {
        name: 'seedicon',
        extraLanguages: [],
        npmPackage: 'seedicon',
        iconSeed: '0xba32a6076cd558947b3da6148fc4994b421eed56',
        descriptions: {
            pt: 'Pacote npm que transforma qualquer string em um avatar SVG determinístico. 17 estilos, zero dependências, nenhuma imagem armazenada. É o que desenha os avatares deste site.',
            en: 'An npm package that turns any string into a deterministic SVG avatar. 17 styles, zero dependencies, no image storage. It draws the avatars on this very site.',
        },
    },
    {
        name: 'modernlivemessenger.com.br',
        extraLanguages: [],
        descriptions: {
            pt: 'O MSN Messenger refeito no navegador com dois amigos, em React sobre o 7.css. Chat em tempo real, winks, o "chamar a atenção" que treme a janela e o ChatGPT como contato.',
            en: 'MSN Messenger rebuilt for the browser with two friends, in React on top of 7.css. Real-time chat, winks, the nudge that shakes the window, and ChatGPT as a contact.',
        },
    },
    {
        name: 'go-chess',
        extraLanguages: ['/ Golang'],
        descriptions: {
            pt: 'Xadrez multiplayer feito numa disciplina cujo objetivo era usar uma linguagem nova para nós. O tabuleiro é React e o Go sincroniza salas de dois jogadores por WebSocket.',
            en: 'Multiplayer chess for a course whose point was picking a language new to us. React draws the board, and Go keeps two-player rooms in sync over Gorilla WebSocket.',
        },
    },
    {
        name: 'go-bet',
        extraLanguages: ['/ Golang'],
        descriptions: {
            pt: 'Cassino de mentira para eu estudar microsserviços: serviços em Go de autenticação, e-mail e roleta conversando por gRPC, com JWT, queries geradas pelo sqlc e front em React.',
            en: 'A toy casino built to study microservices: Go services for auth, email and roulette talking over gRPC, with JWT, queries generated by sqlc and a React front end.',
        },
    },
    {
        name: 'interzap',
        extraLanguages: [],
        descriptions: {
            pt: 'Um WhatsApp de terminal com sockets em Python, feito para Redes de Computadores seguindo o protocolo do professor. Grupos, confirmação de leitura e SQLite guardando mensagens offline.',
            en: 'A terminal WhatsApp on Python sockets, built for a Computer Networks course following the professor\'s protocol. Groups, read receipts, and SQLite holding messages for offline users.',
        },
    },
    {
        name: 'pac-man',
        extraLanguages: [],
        descriptions: {
            pt: 'Pac-Man em Python, meu primeiro projeto da graduação. O mapa é uma matriz 28x31 e cada fantasma persegue do seu jeito, com o A* traçando a rota dos que caçam.',
            en: 'Pac-Man in Python, my first undergraduate project. The maze is a 28x31 matrix and each ghost chases in its own way, with A* plotting routes for the hunters.',
        },
    },
    {
        name: 'e-commerce',
        extraLanguages: [],
        descriptions: {
            pt: 'Loja completa feita para aprender a stack que o mercado pedia: React e Redux no front, Express e MySQL atrás, com login JWT, carrinho, painel de admin e recuperação de senha.',
            en: 'A full storefront built to learn the stack the market wanted: React and Redux up front, Express and MySQL behind, with JWT login, a cart, an admin panel and password recovery.',
        },
    },
    {
        name: 'git-minicourse-saicc',
        extraLanguages: [],
        descriptions: {
            pt: 'Material do minicurso de Git que dei na SAICC, feito para ser clonado e quebrado: um app React em que cada exercício é um commit, praticado sozinho e depois em equipe.',
            en: 'Material from the Git minicourse I taught at SAICC, meant to be cloned and broken: a React app where every exercise is a commit, done alone first and then as a team.',
        },
    },
    {
        name: '2048',
        extraLanguages: [],
        descriptions: {
            pt: '2048 em Python, feito por sugestão de um amigo. O jogo inteiro vive numa matriz 4x4: compactar linhas, juntar peças, checar vitória ou derrota. A interface só desenha.',
            en: '2048 in Python, made at a friend\'s suggestion. The whole game lives in a 4x4 matrix: compressing rows, merging tiles, checking for a win or a loss. The interface just draws it.',
        },
    },
];

export async function getMainProjects(): Promise<GetMainProjectsResult> {
    const repos = await getGitHubProjects();
    const projects = repos.map(transformGitHubRepoToProject);

    const projectMap = new Map<string, Project>(
        projects.map((project) => [project.title, project])
    );

    const pinned = mainProjects.filter((mainProject) =>
        projectMap.has(mainProject.name)
    );

    // Um fetch por pacote, em paralelo. Hoje é um só (o seedicon), mas este
    // formato evita virar uma cascata sequencial se aparecer outro.
    const downloads = await Promise.all(
        pinned.map((mainProject) =>
            mainProject.npmPackage
                ? getNpmWeeklyDownloads(mainProject.npmPackage)
                : Promise.resolve(null)
        )
    );

    const filteredAndOrderedProjects = pinned.map((mainProject, index) => ({
        ...projectMap.get(mainProject.name)!,
        descriptions: mainProject.descriptions,
        extraLanguages: mainProject.extraLanguages,
        weeklyDownloads: downloads[index],
        iconSeed: mainProject.iconSeed ?? null,
    }));

    return {
        length: projects.length,
        filteredAndOrderedProjects,
    };
}
