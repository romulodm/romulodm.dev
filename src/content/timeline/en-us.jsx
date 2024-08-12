import { FaBaby, FaGraduationCap, FaPlaneDeparture, FaWifi, FaFacebook, FaGift, FaSteam, FaBitcoin, FaCarCrash, FaCode, FaGasPump, FaBook, FaUniversity, FaQuestionCircle } from 'react-icons/fa';
import { MdOutlineWork } from 'react-icons/md';
import { SiCounterstrike } from 'react-icons/si';
import { IoLanguage, IoTelescope } from 'react-icons/io5';
import { FaComputer } from 'react-icons/fa6';
import { PiSoccerBallFill } from 'react-icons/pi';

export const EN_TIMELINE = {
  "2003": [
    {
      date: "2003-09-22",
      heading: "Birth",
      description: "In Passo Fundo - RS, Brazil.",
      Icon: ({ className = "" }) => <FaBaby className={className} />,
    },
  ],
  "2008": [
    {
      date: "2008-06-22",
      heading: "Computer",
      description: "My first contact with a computer at my cousin's house... Played GTA SA and was 🤯",
      Icon: ({ className = "" }) => <FaComputer className={className} />,
    },
    {
      date: "2008-07-05",
      heading: "LAN",
      description: "My first time at a LAN house, went to play CS 1.6 with some friends.",
      Icon: ({ className = "" }) => <FaWifi className={className} />,
    },
  ],
  "2010": [
    {
      date: "2010-08-18",
      heading: "Internacional",
      description: "Watched my team SC Internacional beat Chivas Guadalajara and win the Libertadores for the 2nd time - go Inter!",
      Icon: ({ className = "" }) => <PiSoccerBallFill className={className} />,
    }
  ],
  "2012": [
    {
      date: "2012-02-15",
      heading: "First trip",
      description: "First time I flew on a plane, went to Brasília - DF to visit my uncles. It was a transformative experience.",
      Icon: ({ className = "" }) => <FaPlaneDeparture className={className} />,
    },
  ],
  "2013": [
    {
      date: "2013-09-22",
      heading: "First Computer",
      description: "Got my first computer from my parents on my birthday. It had an AMD Atlhon II, 4GB RAM, and a GT430.",
      Icon: ({ className = "" }) => <FaGift className={className} />,
    },
    {
      date: "2013-10-22",
      heading: "Facebook Account",
      description: "My older sister created a Facebook account for me, I found it all incredible - having a group without seeing people? 🤯",
      Icon: ({ className = "" }) => <FaFacebook className={className} />,
    },
    {
      date: "2013-11-22",
      heading: "CS 1.6 Title",
      description: "For the first time, after many attempts, I won a CS 1.6 tournament. Won R$ 100, it barely covered the travel expenses 🥲",
      Icon: ({ className = "" }) => <SiCounterstrike className={className} />,
    },
  ],
  "2014": [
    {
      date: "2014-04-10",
      heading: "Crossfire",
      description: "Stopped playing CS 1.6 and, under the influence of friends, started playing Crossfire with them.",
      Icon: ({ className = "" }) => <SiCounterstrike className={className} />,
    },
    {
      date: "2014-08-15",
      heading: "Bitcoin",
      description: "Bought 140k ZP in Crossfire (in-game currency) for ≈ 0.1818 BTC when 1 BTC was about US$ 300. Should have kept it 😞",
      Icon: ({ className = "" }) => <FaBitcoin className={className} />,
    },
    {
      date: "2014-12-25",
      heading: "Second trip",
      description: "Made my second flight, again to Brasília - DF. It wasn't as exciting as the first one.",
      Icon: ({ className = "" }) => <FaPlaneDeparture className={className} />,
    },
  ],
  "2015": [
    {
      date: "2015-05-15",
      heading: "Drove a car",
      description: "Learned to drive a car, unfortunately scraped the wheel while shifting gears looking at the gearstick (pulled the car to the right trying to find the right gear).",
      Icon: ({ className = "" }) => <FaCarCrash className={className} />,
    },
    {
      date: "2015-11-15",
      heading: "Steam",
      description: "Created my Steam account and started playing CS:GO with the same friends who used to play 1.6 with me.",
      Icon: ({ className = "" }) => <FaSteam className={className} />,
    },
  ],
  "2016": [
    {
      date: "2016-06-20",
      heading: "Programming",
      description: "For the first time I understood what programming was and how the games I played were made.",
      Icon: ({ className = "" }) => <FaCode className={className} />,
    },
    {
      date: "2016-11-20",
      heading: "Relegation",
      description: "Saw my team get relegated for the first time in history, lost some of the desire to watch the games.",
      Icon: ({ className = "" }) => <PiSoccerBallFill className={className} />,
    },
    {
      date: "2022-16-10",
      heading: "English",
      description: "Started studying the English language in-depth to consume content from outside my country.",
      Icon: ({ className = "" }) => <IoLanguage className={className} />,
    },
  ],
  "2018": [
    {
      date: "2018-02-15",
      heading: "First job",
      description: "Started working as a stock clerk at a supermarket in my city.",
      Icon: ({ className = "" }) => <MdOutlineWork className={className} />,
    },
  ],
  "2019": [
    {
      date: "2018-02-15",
      heading: "Future",
      description: "Decided that I would pursue a career in technology when I went to university. I told everyone I would study Computer Engineering.",
      Icon: ({ className = "" }) => <IoTelescope className={className} />,
    },
  ],
  "2020": [
    {
      date: "2020-04-22",
      heading: "Second job",
      description: "Started working as a gas station attendant part-time. The rest of the time I was studying.",
      Icon: ({ className = "" }) => <FaGasPump className={className} />,
    },
  ],
  "2021": [
    {
      date: "2013-09-22",
      heading: "Second computer",
      description: "Bought my second computer with some saved salaries, it had an i3 9100f, an RX 480 8GB...",
      Icon: ({ className = "" }) => <FaComputer className={className} />,
    },
    {
      date: "2021-02-19",
      heading: "ENEM - Practice",
      description: "Took the ENEM (a test to enter universities) for the first time to see what it was like. Did relatively well.",
      Icon: ({ className = "" }) => <FaBook className={className} />,
    },
    {
      date: "2021-12-19",
      heading: "Graduated",
      description: "Finished high school as the valedictorian of my class at graduation, cried a lot.",
      Icon: ({ className = "" }) => <FaGraduationCap className={className} />,
    },
  ],
  "2022": [
    {
      date: "2022-02-10",
      heading: "ENEM - Final",
      description: "Left the second day of the ENEM exam confident about my performance.",
      Icon: ({ className = "" }) => <FaBook className={className} />,
    },
    {
      date: "2022-03-03",
      heading: "SISU",
      description: "Followed my ENEM score closely, wanted to study CS at UFSM (Federal University of Santa Maria).",
      Icon: ({ className = "" }) => <FaQuestionCircle className={className} />,
    },
    {
      date: "2022-04-22",
      heading: "FURG",
      description: "Ranked 9th on the waiting list for UFSM, so I decided to enroll at FURG to study Information Systems.",
      Icon: ({ className = "" }) => <FaUniversity className={className} />,
    },
    {
      date: "2022-16-10",
      heading: "PETC3",
      description: "Passed the selection process for PETC3 and became a scholarship holder, it was when I realized I had made the right choice.",
      Icon: ({ className = "" }) => <FaGraduationCap className={className} />,
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
