import './ScrollToTopButton.css'; // Create a CSS file for styling

import React, { useEffect, useState } from 'react';

import { assest } from '../../assest/assest';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 100) { // Show button after scrolling down 100px
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clearActiveClasses = () => {
    const activeElements = document.querySelectorAll('.active');
    activeElements.forEach(el => el.classList.remove('active'));
  };

  const handleClick = () => {
    clearActiveClasses();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    isVisible && (
      <img src={assest.up} className="scroll-to-top-button" alt="up" onClick={handleClick}>
      </img>
    )
  );
};

export default ScrollToTopButton;
