import furg from "/furg_logo.jpg"
import raquel from "/itec2_logo.jpg";
import byte from "/bytejr_logo.jpg";
import itec from "/itec2_logo.jpg";
import lamsa from "/lamsa_logo.jpg";
import petc3 from '/petc3_logo.jpg';

export const PORTUGUESE_INFORMATIONS = {
  infos: {
    name: 'Romulo de Moraes',
    position: 'Estudante',
    bio: 'Perfil do LinkedIn',
  },
  contact: {
    address: 'Rio Grande, Brasil',
    email: 'romulotg12@gmail.com',
    linkedin: 'https://www.linkedin.com/in/romulo-de-moraes-918793258/',
    github: 'https://www.github.com/romulodm',
  },
  education: [
    {
      school: 'Universidade Federal do Rio Grande - FURG',
      url: 'https://www.furg.br',
      icon: furg,
      location: 'Rio Grande, Brasil',
      degree: 'Graduação',
      major: 'Sistemas de Informação',
      start: 'Abril 2022',
      end: 'Atualmente',
    }
  ],
  experience: [
    {
      company: 'Byte Jr.',
      url: 'https://www.linkedin.com/company/bytejr/',
      icon: byte,
      location: 'Rio Grande, Brasil',
      contract: 'Voluntário',
      position: 'Presidente',
      start: 'Março 2024',
      end: 'Atualmente',
      description: [
        'Reestruturação da empresa júnior Byte Jr. em colaboração com o professor Dr. Luciano Maciel Ribeiro e colegas do C3 – FURG.',
        'Gestão de projetos em aberto, contato com novos clientes e regularização junto à FEJERS.',
      ],
      skills: [
        'HTML/CSS',
        'JavaScript',
        'Angular',
        'React',
        'Flutter',
        'PHP',
        'Express',
        'NestJS',
      ],
    },
    {
      company: 'iTEC - Plena ',
      url: 'https://www.linkedin.com/company/raquel-menopausa/?originalSubdomain=br',
      icon: raquel,
      location: 'Rio Grande, Brasil',
      contract: 'Estágio',
      position: 'Desenvolvedor Backend',
      start: 'Abril 2024',
      end: 'Atualmente',
      description: [
        'Construção do aplicativo Raquel Menopausa usando arquitetura de microsserviços.',
        'Colaboração com as equipes de frontend, visão computacional e machine learning para seguir o backlog e as definições do projeto.',
      ],
      skills: [
        'NestJS',
        'TypeORM',
        'ESLint',
        'Jest',
        'PostgreSQL',
        'Azure DevOps',
        'Docker',
        'Terraform',
        'AWS S3',
      ],
    },
    {
      company: 'iTEC - MexTec',
      url: 'https://itecfurg.org/?p=4101',
      icon: itec,
      location: 'Rio Grande, Brasil',
      contract: 'Bolsista',
      position: 'Desenvolvedor',
      start: 'Dezembro 2023',
      end: 'Atualmente',
      description: [
        'Desenvolvimento de um sistema web para monitoramento contínuo de dados coletados de sensores.',
        'Integração com equipes responsáveis pela manutenção e operação dos sensores.',
      ],
      skills: [
        'React',
        'Tailwind CSS',
        'Material UI',
        'React-Flow',
        'Redux',
        'Express',
        'MongoDB/Mongoose',
        'JSON Web Token',
        'WebSockets',
        'MQTT',
        'ESP32',
        'LoRa',
      ],
    },
    {
      company: 'EMAJ',
      url: 'https://www.furg.br/comunidade/escritorio-modelo-assessoria-juridica',
      icon: furg,
      location: 'Rio Grande, Brasil',
      contract: 'Voluntário',
      position: 'Desenvolvedor',
      start: 'Agosto 2023',
      end: 'Dezembro 2023',
      description: [
        'Desenvolvimento de um sistema para auxiliar o EMAJ em suas atividades diárias.',
        'Projeto realizado sob orientação do professor André Prisco como parte do TCC de alunos de Engenharia de Computação.',
      ],
      skills: [
        'React',
        'Tailwind CSS',
        'Material UI',
        'Redux',
        'Express',
        'JSON Web Token',
        'AWS S3',
        'PostgresSQL/Sequelize',
      ],
    },
    {
      company: 'LAMSA',
      url: 'https://www.linkedin.com/company/lamsa-furg/',
      icon: lamsa,
      location: 'Rio Grande, Brasil',
      contract: 'Voluntário',
      position: 'Desenvolvedor Unity',
      start: 'Maio 2023',
      end: 'Novembro 2023',
      description: [
        'Desenvolvimento de um jogo de realidade virtual para educação ambiental sobre a preservação dos oceanos.',
        'Participação na pesquisa e desenvolvimento do jogo usando Unity.',
      ],
      skills: [
        'C#',
        'Unity',
      ],
    },
    {
      company: 'PETC3',
      url: 'https://www.instagram.com/petc3furg/',
      icon: petc3,
      location: 'Rio Grande, Brasil',
      contract: 'Bolsista',
      position: 'Bolsista',
      start: 'Junho 2022',
      end: 'Dezembro 2023',
      description: [
        'Primeira experiência acadêmica na FURG, aprimorando habilidades de comunicação e trabalho em equipe.',
        'Participação no desenvolvimento do PET.APP em Flutter e na criação de aplicações automatizadas no PETCode.',
      ],
      skills: [
        'Flutter',
        'JavaScript',
        'Python',
        'Flask',
        'React',
        'Express',
        'JSON Web Token',
        'PostgresSQL',
        'MongoDB',
      ],
    },
  ],
  languages: [
    {
      name: 'Português',
      level: 'C2',
      native: true,
    },
    {
      name: 'Inglês',
      level: 'B1',
    }
  ],
};
