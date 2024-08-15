import { useEffect, useState } from "react";
import { ListAltOutlined, StarBorderOutlined } from "@mui/icons-material";
import { Link, NavLink } from "react-router-dom";
import FakeTimeline from "../timeline/FakeTimeline";
import TypeWriter from "../TypeWriter";
import greetingMessage from "../../utils/greetingMessage";

export const visitors = [
  'stranger',
  'honey',
  'developer',
  'human',
  'visitor',
  'friend',
];

export default function Hero() {
  const [greetingLine, setGreetingLine] = useState(greetingMessage());
  const [visitor, setVisitor] = useState(visitors[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisitor((prev) => {
        const nextIndex = (visitors.indexOf(prev) + 1) % visitors.length;
        return visitors[nextIndex];
      });
      setGreetingLine(greetingMessage());
    }, 5000);
    return () => { clearInterval(interval); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center mb-2">
      <div className="responsive-content sm:pt-10 lg:pt-6 mx-auto text-center">

        <TypeWriter
            mainText={greetingLine}
            wordToType={visitor}
        />

        <p className="mb-8 text-md md:text-lg text-gray-700">
        Me chamo Romulo de Moraes, sou estudante e desenvolvedor full-stack. 
        Criei esse site com a intenção de mostrar um pouco de quem sou eu, do que eu fiz, o que pretendo fazer e compartilhar algumas ideias.
        </p>
        
        <FakeTimeline/>
  
        <div className="flex w-full flex-col sm:flex-row mb-4 space-y-4 sm:justify-center sm:space-y-0 sm:space-x-4">
          <NavLink to="/resume">
            <button id="resume-button" className="inline-flex w-72 justify-between items-center p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              <span className="flex items-center bg-blue-500 rounded-full text-white p-2 mr-2">
                <ListAltOutlined style={{fontSize: '1.3rem'}} />
              </span>
              
              <div className="flex w-full flex-col">
                <p className="text-lg font-semibold text-left">
                  Access online resume
                </p>
                <p className="text-xs font-medium text-left">
                  Dynamic, interactive and up-to-date...
                </p>
              </div>
            </button>
          </NavLink>

          <a href="https://github.com/romulodm/my-portfolio" target="_blank">
            <button id="resume-button" className="inline-flex w-72 justify-center sm:justify-between items-center p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              <span className="flex items-center bg-blue-500 rounded-full text-white p-2 mr-2">
                <StarBorderOutlined style={{fontSize: '1.3rem'}} />
              </span>

              <div className="flex w-full flex-col">
                <p className="text-lg font-semibold text-left">
                  Give a star
                </p>
                <p className="text-xs font-medium text-left">
                  Access the repository of this site.
                </p>
              </div>
            </button>
          </a>
        </div>
        
      </div>

    </div>
  )
}
