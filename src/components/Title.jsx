import { useEffect } from 'react';

export default function Title({ text }) {
  useEffect(() => {
    document.title = text;
  }, [text]);

  return null;
}