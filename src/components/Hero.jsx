import { useEffect, useState } from "react";
import { ListAltOutlined, StarBorderOutlined } from "@mui/icons-material";
import { NavLink } from "react-router-dom";
import Timeline from "./Timeline";
import TypeWriter from "./TypeWriter";
import greetingMessage from "../utils/greetingMessage";

export const visitors = [
  'stranger',
  'collaborator',
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
    <div className="flex flex-col items-center justify-center">
      <div className="pt-8 pb-3 mx-auto max-w-screen-xl text-center">
        <TypeWriter
            mainText={greetingLine}
            wordToType={visitor}
        />


        <p className="mb-8 text-md md:text-lg text-gray-700">
          Me chamo Romulo de Moraes, sou estudante e desenvolvedor full-stack. 
          Criei esse site com a intenção de mostrar um pouco do que eu fiz, mostrar o que pretendo fazer e compartilhar ideias.
        </p>
        
        <div className="flex w-full flex-col sm:flex-row mb-8 space-y-4 sm:justify-center sm:space-y-0 sm:space-x-4">
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

          <NavLink to="/resume">
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
          </NavLink>
        </div>
      </div>

    </div>
  )
}
