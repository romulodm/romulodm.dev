import { FaBaby, FaGraduationCap, FaPlaneDeparture, FaWifi, FaFacebook, FaGift, FaSteam, FaBitcoin, FaCarCrash, FaCode, FaGasPump, FaBook, FaUniversity, FaQuestionCircle } from 'react-icons/fa';
import { MdOutlineWork } from 'react-icons/md';
import { SiCounterstrike } from 'react-icons/si';
import { IoLanguage, IoTelescope } from 'react-icons/io5';
import { FaComputer } from 'react-icons/fa6';
import { PiSoccerBallFill } from 'react-icons/pi';

export const ES_TIMELINE = {
  "2003": [
    {
      date: "2003-09-22",
      heading: "Nacimiento",
      description: "En Passo Fundo - RS, Brasil.",
      Icon: ({ className = "" }) => <FaBaby className={className} />,
    },
  ],
  "2008": [
    {
      date: "2008-06-22",
      heading: "Computadora",
      description: "Mi primer contacto con una computadora, en la casa de mi primo... Jugué GTA SA y quedé 🤯",
      Icon: ({ className = "" }) => <FaComputer className={className} />,
    },
    {
      date: "2008-07-05",
      heading: "LAN",
      description: "Mi primera vez en un cibercafé, para jugar CS 1.6 con algunos amigos.",
      Icon: ({ className = "" }) => <FaWifi className={className} />,
    },
  ],
  "2010": [
    {
      date: "2010-08-18",
      heading: "Internacional",
      description: "Vi a mi equipo, el SC Internacional, vencer a Chivas de Guadalajara y ser campeón de la Libertadores por 2ª vez - ¡vamo Inter!",
      Icon: ({ className = "" }) => <PiSoccerBallFill className={className} />,
    }
  ],
  "2012": [
    {
      date: "2012-02-15",
      heading: "Primer viaje",
      description: "La primera vez que viajé en avión, fui a Brasilia - DF a visitar a mis tíos. Fue una experiencia transformadora.",
      Icon: ({ className = "" }) => <FaPlaneDeparture className={className} />,
    },
  ],
  "2013": [
    {
      date: "2013-09-22",
      heading: "Primera Computadora",
      description: "Mis padres me regalaron mi primera computadora en mi cumpleaños. Tenía un AMD Athlon II, 4GB de RAM y una GT430.",
      Icon: ({ className = "" }) => <FaGift className={className} />,
    },
    {
      date: "2013-10-22",
      heading: "Cuenta de Facebook",
      description: "Mi hermana mayor me creó una cuenta de Facebook, todo aquello me pareció increíble - ¿tener un grupo sin ver a las personas? 🤯",
      Icon: ({ className = "" }) => <FaFacebook className={className} />,
    },
    {
      date: "2013-11-22",
      heading: "Título de CS 1.6",
      description: "Por primera vez, después de muchos intentos, gané un campeonato de CS 1.6. Gané R$ 100, solo alcanzó para el pasaje 🥲",
      Icon: ({ className = "" }) => <SiCounterstrike className={className} />,
    },
  ],
  "2014": [
    {
      date: "2014-04-10",
      heading: "Crossfire",
      description: "Dejé de jugar CS 1.6 y, por influencia de mis amigos, empecé a jugar Crossfire con ellos.",
      Icon: ({ className = "" }) => <SiCounterstrike className={className} />,
    },
    {
      date: "2014-08-15",
      heading: "Bitcoin",
      description: "Compré 140k de ZP en Crossfire (la moneda del juego) por ≈ 0.1818 BTC, cuando 1 BTC costaba aproximadamente US$ 300. Debí haberlos guardado 😞",
      Icon: ({ className = "" }) => <FaBitcoin className={className} />,
    },
    {
      date: "2014-12-25",
      heading: "Segundo viaje",
      description: "Hice mi segundo viaje en avión, otra vez a Brasilia - DF. No fue tan genial como el primero.",
      Icon: ({ className = "" }) => <FaPlaneDeparture className={className} />,
    },
  ],
  "2015": [
    {
      date: "2015-05-15",
      heading: "Manejé un auto",
      description: "Aprendí a manejar, lamentablemente raspé la rueda al cambiar de marcha mirando la palanca (tiré el auto hacia la derecha buscando la marcha correcta).",
      Icon: ({ className = "" }) => <FaCarCrash className={className} />,
    },
    {
      date: "2015-11-15",
      heading: "Steam",
      description: "Creé mi cuenta de Steam y empecé a jugar CS:GO con los mismos amigos que antes jugaban 1.6 conmigo.",
      Icon: ({ className = "" }) => <FaSteam className={className} />,
    },
  ],
  "2016": [
    {
      date: "2016-06-20",
      heading: "Programación",
      description: "Por primera vez entendí qué era la programación y cómo se hacían los juegos que jugaba.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
    {
      date: "2016-11-20",
      heading: "Descenso",
      description: "Vi a mi equipo descender por primera vez en su historia, perdí un poco las ganas de ver los partidos",
      Icon: ({ className = "" }) => <PiSoccerBallFill className={className} />,
    },
    {
      date: "2022-16-10",
      heading: "Inglés",
      description: "Empecé a estudiar inglés más a fondo, para poder consumir contenidos de fuera de mi país.",
      Icon: ({ className = "" }) => <IoLanguage className={className} />,
    },
  ],
  "2018": [
    {
      date: "2018-02-15",
      heading: "Primer empleo",
      description: "Empecé a trabajar como reponedor en un supermercado de mi ciudad.",
      Icon: ({ className = "" }) => <MdOutlineWork className={className} />,
    },
  ],
  "2019": [
    {
      date: "2018-02-15",
      heading: "Futuro",
      description: "Decidí que seguiría en el área de tecnología cuando fuera a la universidad. Le decía a todos que estudiaría Ingeniería de Computación.",
      Icon: ({ className = "" }) => <IoTelescope className={className} />,
    },
  ],
  "2020": [
    {
      date: "2020-04-22",
      heading: "Segundo empleo",
      description: "Empecé a trabajar medio tiempo en una gasolinera. El resto del tiempo estudiaba.",
      Icon: ({ className = "" }) => <FaGasPump className={className} />,
    },
  ],
  "2021": [
    {
      date: "2013-09-22",
      heading: "Segunda computadora",
      description: "Compré mi segunda computadora con algunos sueldos que ahorré, tenía un i3 9100f, una RX 480 8GB...",
      Icon: ({ className = "" }) => <FaComputer className={className} />,
    },
    {
      date: "2021-02-19",
      heading: "ENEM - De práctica",
      description: "Hice el ENEM (el examen de ingreso a las universidades brasileñas) por primera vez para ver cómo era. Me fue relativamente bien.",
      Icon: ({ className = "" }) => <FaBook className={className} />,
    },
    {
      date: "2021-12-19",
      heading: "Me gradué",
      description: "Terminé la secundaria siendo el orador de mi clase en la graduación, lloré mucho.",
      Icon: ({ className = "" }) => <FaGraduationCap className={className} />,
    },
  ],
  "2022": [
    {
      date: "2022-02-10",
      heading: "ENEM - Definitivo ",
      description: "Salí del segundo día del ENEM confiado en mi desempeño.",
      Icon: ({ className = "" }) => <FaBook className={className} />,
    },
    {
      date: "2022-03-03",
      heading: "SISU",
      description: "Estuve siguiendo mi nota del ENEM, quería estudiar Ciencias de la Computación en la UFSM (Universidade Federal de Santa Maria).",
      Icon: ({ className = "" }) => <FaQuestionCircle className={className} />,
    },
    {
      date: "2022-04-22",
      heading: "FURG",
      description: "Quedé 9º en la lista de espera de la UFSM y entonces decidí entrar a la FURG para estudiar Sistemas de Información.",
      Icon: ({ className = "" }) => <FaUniversity className={className} />,
    },
    {
      date: "2022-16-10",
      heading: "PETC3",
      description: "Aprobé el proceso de selección del PETC3 y me convertí en becario, ahí vi que había tomado la decisión correcta.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
  ],
  "2024": [
    {
      date: "2024-02-28",
      heading: "Codeforces",
      description: "Empecé a estudiar programación competitiva para mejorar mis habilidades en algoritmos y estructuras de datos.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
  ],
};
