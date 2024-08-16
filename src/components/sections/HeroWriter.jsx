import React, { useEffect, useState, useRef } from 'react';

export default function HeroWriter({
  mainText,
  wordToType,
  typeInterval = 40,
  onTransitionEnd = () => {},
}) {
  const [currentWord, setCurrentWord] = useState('');
  const cursorRef = useRef(null);

  useEffect(() => {
    if (wordToType === currentWord) {
      onTransitionEnd();
      return () => {};
    }
    const interval = setInterval(() => {
      if (wordToType === currentWord) {
        clearInterval(interval);
        return;
      }

      if (wordToType.startsWith(currentWord)) {
        setCurrentWord(wordToType.slice(0, currentWord.length + 1));
      } else {
        setCurrentWord(currentWord.slice(0, currentWord.length - 1));
      }
    }, Math.random() * 6 * typeInterval);
    return () => { clearInterval(interval); };
  }, [wordToType, currentWord, onTransitionEnd, typeInterval]);

  useEffect(() => {
    const typing = currentWord !== wordToType;
    if (cursorRef.current) {
      cursorRef.current.style.animation = typing ? 'none' : 'blink 1s infinite';
    }
  }, [currentWord, wordToType]);

  return (

    <h1 className="w-full text-gray-800 py-5 text-5xl sm:text-6xl z-50 font-extrabold tracking-tight leading-none">
      {mainText},
      <span> </span>
      <br className="sm:hidden"/>
      <p className="inset-0 z-50 bg-white text-blue-600" style={{ display: 'inline-block' }}>{currentWord}</p>
      
      <p ref={cursorRef} className="text-black" style={{ fontWeight: '200', display: 'inline-block' }}>|</p>
    </h1>
  );
}
