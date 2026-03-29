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
    description: string | null;
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
    platform: 'github';
    extraLanguages: string[];
}

interface MainProjectConfig {
    name: string;
    extraLanguages: string[];
}

interface GetMainProjectsResult {
    length: number;
    filteredAndOrderedProjects: Project[];
}

function transformGitHubRepoToProject(repo: GitHubRepo): Project {
    return {
        title: repo.name,
        description: repo.description,
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
        platform: 'github',
        extraLanguages: [],
    };
}

const mainProjects: MainProjectConfig[] = [
    { name: 'go-chess', extraLanguages: ['/ Golang'] },
    { name: 'go-bet', extraLanguages: ['/ Golang'] },
    { name: 'pac-man', extraLanguages: [] },
    { name: 'e-commerce', extraLanguages: [] },
    { name: 'git-minicourse-saicc', extraLanguages: [] },
    { name: '2048', extraLanguages: [] },
];

export async function getMainProjects(): Promise<GetMainProjectsResult> {
    const repos = await getGitHubProjects();
    const projects = repos.map(transformGitHubRepoToProject);

    const projectMap = new Map<string, Project>(
        projects.map((project) => [project.title, project])
    );

    const filteredAndOrderedProjects = mainProjects
        .filter((mainProject) => projectMap.has(mainProject.name))
        .map((mainProject) => {
            const project = { ...projectMap.get(mainProject.name)! };
            project.extraLanguages = mainProject.extraLanguages;
            return project;
        });

    return {
        length: projects.length,
        filteredAndOrderedProjects,
    };
}