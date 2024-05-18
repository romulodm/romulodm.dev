import { useEffect, useState } from 'react';
import './WelcomeAnimation.css';

const WelcomeAnimation = () => {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHide(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`welcome-container ${hide ? 'hide' : ''}`}>
      <div className="emoji">👋</div>
    </div>
  );
};

export default WelcomeAnimation;
