import React, { useEffect, useState } from 'react';
import { Carousel, Container, Button } from 'react-bootstrap';
import { ChevronDown } from 'react-bootstrap-icons';
import { assest } from '../../assest/assest';
import './Header.css';

function Header() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Content for multiple carousel slides
  const slides = [
    {
      id: 1,
      imageUrl: assest.g,
      title: "Premium Metal Fabrication",
      subtitle: "Precision Engineering & Custom Solutions",
      description: "Specializing in high-quality metalwork with industry-leading standards and techniques."
    },
    {
      id: 2,
      imageUrl: assest.workshop || assest.g, // Fallback to first image if workshop image doesn't exist
      title: "Advanced Machinery",
      subtitle: "State-of-the-Art Equipment",
      description: "Utilizing the latest technology to deliver exceptional results for all your metalwork needs."
    },
    {
      id: 3,
      imageUrl: assest.craftsmanship || assest.g, // Fallback to first image if craftsmanship image doesn't exist
      title: "Expert Craftsmanship",
      subtitle: "Decades of Combined Experience",
      description: "Our skilled team brings precision and artistry to every project, large or small."
    }
  ];

  // Fade-in animation on load
  useEffect(() => {
    setIsVisible(true);
    
    // Optional: Scroll listener for additional animations
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // You can add additional scroll-based animations here
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Smooth scroll function for the "Explore" button
  const scrollToServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Container id='home' fluid className="p-0 header-container">
      <Carousel 
        className={`header-carousel ${isVisible ? 'visible' : ''}`} 
        interval={6000} 
        fade={true}
        indicators={true}
        pause={false}
      >
        {slides.map(slide => (
          <Carousel.Item key={slide.id}>
            <div className="carousel-image-container">
              <img
                className="d-block w-100 carousel-image"
                src={slide.imageUrl}
                alt={slide.title}
              />
              {/* Gradient overlay with animated pattern */}
              <div className="gradient-overlay"></div>
              <div className="pattern-overlay"></div>
            </div>
            
            <Carousel.Caption className="carousel-caption text-start">
              <div className="caption-content">
                <div className="logo-container">
                  <img src={assest.icon} alt="ExpoMachinery Logo" className="header-logo" />
                </div>
                
                <h5 className="subtitle">{slide.subtitle}</h5>
                <h1 className="main-title">{slide.title}</h1>
                
                <div className="separator"></div>
                
                <p className="description">
                  {slide.description}
                </p>
                
                <div className="cta-container">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="main-cta-button"
                    href="#services"
                  >
                    Our Services
                  </Button>
                  
                  <Button 
                    variant="outline-light" 
                    size="lg" 
                    className="secondary-cta-button"
                    href="#footer"
                  >
                    Get a Quote
                  </Button>
                </div>
              </div>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>
      
      {/* Scroll down indicator */}
      <div className="scroll-indicator" onClick={scrollToServices}>
        <span>Explore</span>
        <ChevronDown className="bounce" />
      </div>
    </Container>
  );
}

export default Header;