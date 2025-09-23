import "./Vision.css";

import { useState } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi';
import { IoSparkles } from "react-icons/io5";

import { MdRocketLaunch, MdSecurity } from 'react-icons/md';
import { SiTeespring } from "react-icons/si";
import { Parallax } from 'react-scroll-parallax';
import { FaCode, FaPeopleCarry } from 'react-icons/fa';
import Comment from './container/Comment';
import useMobileMode from './Mobile';
import Development from "./container/Development";
import Productivity from "./container/Productivity";
import Frame from "./container/Frame";
import Icons from "./container/Icons";

export default function Container({ step }) {
    const mobile = useMobileMode();
    const [cardScrollProgress, setCardScrollProgress] = useState(0);

    return (
        <Parallax
            shouldAlwaysCompleteAnimation
            onProgressChange={(progress) => setCardScrollProgress(progress)} 
        >
            <div className="relative grid-background w-full h-[43rem] sm:h-[40rem] bg-transparent pointer-events-none">

                <Icons/>
                <Frame/>
                <Productivity cardScrollProgress={cardScrollProgress}/>
                <Development step={step}/>

            </div>
        </Parallax>
    );
}
