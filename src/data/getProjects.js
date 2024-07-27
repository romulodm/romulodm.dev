const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

import axios from 'axios';

const apiRequest = axios.create({
  baseURL: 'https://api.github.com/users/romulodm',
});

export async function getGitHubProjects() {
    const response = await apiRequest.get(`/repos`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    });

    return response.data;
}

function transformGitHubRepoToProject(repo) {
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
        extraLanguages: []
    };
}

const mainProjects = [
    {
        name: 'go-chess',
        extraLanguages: ['/ Golang']
    },
    {
        name: 'go-bet',
        extraLanguages: ['/ Golang']
    },
    {
        name: 'pac-man',
        extraLanguages: []
    },
    {
        name: 'e-commerce',
        extraLanguages: []
    },
    {
        name: '2048',
        extraLanguages: []
    },
    {
        name: 'git-minicurso-saicc',
        extraLanguages: []
    }
];

export async function getMainProjects() {
    const repos = await getGitHubProjects();
    const projects = repos.map(transformGitHubRepoToProject);

    const projectMap = new Map(projects.map(project => [project.title, project]));

    const filteredAndOrderedProjects = mainProjects
        .filter(mainProject => projectMap.has(mainProject.name))
        .map(mainProject => {
            const project = projectMap.get(mainProject.name);
            project.extraLanguages = mainProject.extraLanguages;
            return project;
        });

    return {
        length: projects.length,
        filteredAndOrderedProjects
    };
}

