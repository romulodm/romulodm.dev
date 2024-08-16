import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ListAltOutlined, StarBorderOutlined } from "@mui/icons-material";

import FakeTimeline from "../timeline/FakeTimeline";
import HeroWriter from "./HeroWriter";

export default function Hero() {
  const { t, i18n } = useTranslation('hero');

  const [visitors, setVisitors] = useState([]);
  const [greetingLine, setGreetingLine] = useState('');
  const [visitor, setVisitor] = useState('');
  const [key, setKey] = useState(0); // Single key to force restart TypeWriter

  const getGreetingMessage = () => {
    const date = new Date();
    const hours = date.getHours();
    if (hours < 3) return t('greeting-4');
    if (hours < 12) return t('greeting-1');
    if (hours < 18) return t('greeting-2');
    return t('greeting-4');
  };

  useEffect(() => {
    setGreetingLine(getGreetingMessage());
    const updatedVisitors = [
      t('visitor-1'),
      t('visitor-2'),
      t('visitor-3'),
      t('visitor-4'),
      t('visitor-5'),
      t('visitor-6'),
    ];

    setVisitors(updatedVisitors);

    // Immediately changes the displayed word
    setVisitor(updatedVisitors[0]);

    // Update key to force HeroWriter restart
    setKey(prevKey => prevKey + 1);

  }, [i18n.language, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisitor((prev) => {
        const nextIndex = (visitors.indexOf(prev) + 1) % visitors.length;
        return visitors[nextIndex];
      });
      setGreetingLine(getGreetingMessage());
    }, 5000);
    return () => clearInterval(interval);
  }, [visitors]);

  return (
    <div className="flex flex-col items-center justify-center mb-2">
      <div className="responsive-content sm:pt-10 lg:pt-6 mx-auto text-center">
        <HeroWriter
          key={key}
          mainText={greetingLine}
          wordToType={visitor}
        />
        
        <p className="mb-8 text-md md:text-lg text-gray-500">
          {t('content')}
        </p>
        
        <FakeTimeline />

        <div className="flex w-full flex-col sm:flex-row mb-4 space-y-4 sm:justify-center sm:space-y-0 sm:space-x-4">
          <NavLink to="/resume">
            <button id="resume-button" className="inline-flex w-72 justify-between items-center p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              <span className="flex items-center bg-blue-500 rounded-full text-white p-2 mr-2">
                <ListAltOutlined style={{fontSize: '1.3rem'}} />
              </span>
              
              <div className="flex w-full flex-col">
                <p className="text-lg font-semibold text-left">
                  {t('resume-title')}
                </p>
                <p className="text-xs font-medium text-left">
                  {t('resume-content')}
                </p>
              </div>
            </button>
          </NavLink>

          <a href="https://github.com/romulodm/my-portfolio" target="_blank" rel="noopener noreferrer">
            <button id="resume-button" className="inline-flex w-72 justify-center sm:justify-between items-center p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              <span className="flex items-center bg-blue-500 rounded-full text-white p-2 mr-2">
                <StarBorderOutlined style={{fontSize: '1.3rem'}} />
              </span>

              <div className="flex w-full flex-col">
                <p className="text-lg font-semibold text-left">
                  {t('star-title')}
                </p>
                <p className="text-xs font-medium text-left">
                  {t('star-content')}
                </p>
              </div>
            </button>
          </a>
        </div>
        
      </div>
    </div>
  );
}
