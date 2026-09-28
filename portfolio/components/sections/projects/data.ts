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

export interface Project {
    title: string;
    /**
     * Key under `home.projects.items` in messages/*.json. The copy is written by
     * hand rather than taken from the repo's `description`: the GitHub field is
     * English-only and too generic for the home page. `null` until the repo is
     * matched against mainProjects.
     */
    descriptionKey: string | null;
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
    /** Key under `home.projects.items` in messages/*.json. */
    descriptionKey: string;
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
        descriptionKey: null, // filled in from mainProjects
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
        name: 'romulodm.dev',
        extraLanguages: ['/ Golang'],
        descriptionKey: 'romulodm',
    },
    {
        name: 'seedicon',
        extraLanguages: [],
        npmPackage: 'seedicon',
        iconSeed: '0xba32a6076cd558947b3da6148fc4994b421eed56',
        descriptionKey: 'seedicon',
    },
    {
        name: 'modernlivemessenger.com.br',
        extraLanguages: [],
        descriptionKey: 'modernLiveMessenger',
    },
    {
        name: 'go-chess',
        extraLanguages: ['/ Golang'],
        descriptionKey: 'goChess',
    },
    {
        name: 'go-bet',
        extraLanguages: ['/ Golang'],
        descriptionKey: 'goBet',
    },
    {
        name: 'interzap',
        extraLanguages: [],
        descriptionKey: 'interzap',
    },
    {
        name: 'pac-man',
        extraLanguages: [],
        descriptionKey: 'pacMan',
    },
    {
        name: 'e-commerce',
        extraLanguages: [],
        descriptionKey: 'eCommerce',
    },
    {
        name: '2048',
        extraLanguages: [],
        descriptionKey: 'game2048',
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
        descriptionKey: mainProject.descriptionKey,
        extraLanguages: mainProject.extraLanguages,
        weeklyDownloads: downloads[index],
        iconSeed: mainProject.iconSeed ?? null,
    }));

    return {
        length: projects.length,
        filteredAndOrderedProjects,
    };
}
