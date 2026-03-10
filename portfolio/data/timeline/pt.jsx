import { FaBaby, FaGraduationCap, FaPlaneDeparture, FaWifi, FaFacebook, FaGift, FaSteam, FaBitcoin, FaCarCrash, FaCode, FaGasPump, FaBook, FaUniversity, FaQuestionCircle } from 'react-icons/fa';
import { MdOutlineWork } from 'react-icons/md';
import { SiCounterstrike } from 'react-icons/si';
import { IoLanguage, IoTelescope } from 'react-icons/io5';
import { FaComputer } from 'react-icons/fa6';
import { PiSoccerBallFill } from 'react-icons/pi';

export const PT_TIMELINE = {
  "2003": [
    {
      date: "2003-09-22",
      heading: "Nascimento",
      description: "Em Passo Fundo - RS, Brasil.",
      Icon: ({ className = "" }) => <FaBaby className={className} />,
    },
  ],
  "2008": [
    {
      date: "2008-06-22",
      heading: "Computador",
      description: "Meu primeiro contato com um computador, na casa do meu primo... Joguei GTA SA e fiquei 🤯",
      Icon: ({ className = "" }) => <FaComputer className={className} />,
    },
    {
      date: "2008-07-05",
      heading: "LAN",
      description: "Minha primeira vez em uma LAN house, indo para jogar CS 1.6 com alguns amigos.",
      Icon: ({ className = "" }) => <FaWifi className={className} />,
    },
  ],
  "2010": [
    {
      date: "2010-08-18",
      heading: "Internacional",
      description: "Assisti o meu time SC Internacional vencer o Chivas Guadalajara e ser campeão da Libertadores pela 2ª vez - vamo Inter!",
      Icon: ({ className = "" }) => <PiSoccerBallFill className={className} />,
    }
  ],
  "2012": [
    {
      date: "2012-02-15",
      heading: "Primeira viagem",
      description: "Primeira vez que fiz uma viagem de avião, fui para Brasília - DF visitar meus tios. Foi uma experiência transformadora.",
      Icon: ({ className = "" }) => <FaPlaneDeparture className={className} />,
    },
  ],
  "2013": [
    {
      date: "2013-09-22",
      heading: "Primeiro Computador",
      description: "Ganhei meu primeiro computador dos meus pais no meu aniversário. Tinha um AMD Atlhon II, 4GB de RAM e uma GT430.",
      Icon: ({ className = "" }) => <FaGift className={className} />,
    },
    {
      date: "2013-10-22",
      heading: "Conta no Facebook",
      description: "Minha irmã mais velha criou uma conta para mim no Facebook, achei tudo aquilo incrível - ter um grupo sem ver as pessoas? 🤯",
      Icon: ({ className = "" }) => <FaFacebook className={className} />,
    },
    {
      date: "2013-11-22",
      heading: "Título de CS 1.6",
      description: "Pela primeira vez, depois de muitas tentativas, ganhei um campeonato de CS 1.6. Ganhei R$ 100, pagou só a passagem 🥲",
      Icon: ({ className = "" }) => <SiCounterstrike className={className} />,
    },
  ],
  "2014": [
    {
      date: "2014-04-10",
      heading: "Crossfire",
      description: "Parei de jogar CS 1.6 e, por influência de amigos, comecei a jogar Crossfire com eles.",
      Icon: ({ className = "" }) => <SiCounterstrike className={className} />,
    },
    {
      date: "2014-08-15",
      heading: "Bitcoin",
      description: "Comprei 140k de ZP no Crossfire (moeda do jogo) por ≈ 0.1818 BTC, quando 1 BTC custava aproximadamente US$ 300. Deveria ter guardado 😞",
      Icon: ({ className = "" }) => <FaBitcoin className={className} />,
    },
    {
      date: "2014-12-25",
      heading: "Segunda viagem",
      description: "Fiz minha segunda viagem de avião, novamente para Brasília - DF. Não foi tão legal quanto a primeira.",
      Icon: ({ className = "" }) => <FaPlaneDeparture className={className} />,
    },
  ],
  "2015": [
    {
      date: "2015-05-15",
      heading: "Dirigi um carro",
      description: "Aprendi a dirigir carro, infelizmente ralei a roda ao mudar a marcha olhando para o câmbio (puxei o carro para a direita tentando achar a marcha certa).",
      Icon: ({ className = "" }) => <FaCarCrash className={className} />,
    },
    {
      date: "2015-11-15",
      heading: "Steam",
      description: "Criei a minha conta na Steam e comecei a jogar CS:GO com os mesmos amigos que jogavam 1.6 comigo antigamente.",
      Icon: ({ className = "" }) => <FaSteam className={className} />,
    },
  ],
  "2016": [
    {
      date: "2016-06-20",
      heading: "Programação",
      description: "Pela primeira vez entendi o que era programação e como os jogos que eu jogava eram feitos.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
    {
      date: "2016-11-20",
      heading: "Rebaixamento",
      description: "Vi o meu time ser rebaixado pela primeira vez na história, perdi um pouco da vontade de assistir os jogos",
      Icon: ({ className = "" }) => <PiSoccerBallFill className={className} />,
    },
    {
      date: "2022-16-10",
      heading: "Inglês",
      description: "Comecei a estudar mais a fundo a língua inglesa, para conseguir consumir conteúdos de fora do meu país.",
      Icon: ({ className = "" }) => <IoLanguage className={className} />,
    },
  ],
  "2018": [
    {
      date: "2018-02-15",
      heading: "Primeiro emprego",
      description: "Comecei a trabalhar como repositor em um mercado da minha cidade.",
      Icon: ({ className = "" }) => <MdOutlineWork className={className} />,
    },
  ],
  "2019": [
    {
      date: "2018-02-15",
      heading: "Futuro",
      description: "Decidi que seguiria na área da tecnologia quando fosse pra universidade. Falava para todos que faria Engenharia de Computação.",
      Icon: ({ className = "" }) => <IoTelescope className={className} />,
    },
  ],
  "2020": [
    {
      date: "2020-04-22",
      heading: "Segundo emprego",
      description: "Comecei a trabalhar como frentista durante meio período. No resto do tempo eu estudava.",
      Icon: ({ className = "" }) => <FaGasPump className={className} />,
    },
  ],
  "2021": [
    {
      date: "2013-09-22",
      heading: "Segundo computador",
      description: "Comprei meu segundo computador com alguns salários que guardei, tinha um i3 9100f, uma RX 480 8GB...",
      Icon: ({ className = "" }) => <FaComputer className={className} />,
    },
    {
      date: "2021-02-19",
      heading: "ENEM - Treineiro",
      description: "Fiz o ENEM (prova para entrar em universidades) pela primeira vez para ver como era. Fui relativamente bem.",
      Icon: ({ className = "" }) => <FaBook className={className} />,
    },
    {
      date: "2021-12-19",
      heading: "Me formei",
      description: "Concluí o ensino médio sendo o orador da minha turma na formatura, chorei muito.",
      Icon: ({ className = "" }) => <FaGraduationCap className={className} />,
    },
  ],
  "2022": [
    {
      date: "2022-02-10",
      heading: "ENEM - Definitivo ",
      description: "Saí do segundo dia de prova do ENEM confiante com o meu desempenho.",
      Icon: ({ className = "" }) => <FaBook className={className} />,
    },
    {
      date: "2022-03-03",
      heading: "SISU",
      description: "Fiquei acompanhando a minha nota do ENEM, queria fazer CS na UFSM (Universidade Federal de Santa Maria).",
      Icon: ({ className = "" }) => <FaQuestionCircle className={className} />,
    },
    {
      date: "2022-04-22",
      heading: "FURG",
      description: "Fiquei em 9º na lista de espera da UFSM e então resolvi entrar na FURG para cursar Sistemas de Informação.",
      Icon: ({ className = "" }) => <FaUniversity className={className} />,
    },
    {
      date: "2022-16-10",
      heading: "PETC3",
      description: "Passei no processo seletivo do PETC3 e virei bolsista, foi quando vi que tinha feito a escolha correta.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
  ],
  "2024": [
    {
      date: "2024-02-28",
      heading: "Codeforces",
      description: "Started studying competitive programming to improve my algorithm and data structure skills.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
  ],
};
