import React, { useEffect, useState, useRef } from 'react';

export default function TypeWriter({
  mainText,
  wordToType,
  typeInterval = 45,
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
    <h1 className="mb-4 text-5xl font-semibold tracking-tight leading-none pb-3.5">
      {mainText}
      <span> </span>
      <p className="inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-blue-700 bg-clip-text text-transparent" style={{ display: 'inline-block' }}>{currentWord}</p>
      <p ref={cursorRef} style={{ fontWeight: '200', display: 'inline-block' }}>|</p>
    </h1>
  );
}
