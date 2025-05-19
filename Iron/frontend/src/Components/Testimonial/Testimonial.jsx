import React, { useCallback, useEffect, useRef, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Slider from 'react-slick';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import { assest } from '../../assest/assest';

// Import required CSS
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Testimonial = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  const sliderRef = useRef(null);

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
    setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Enhanced testimonial data with ratings
  const testimonials = [
    { 
      image: assest.admin, 
      text: "The craftsmanship from Jayalath Iron Works exceeded my expectations. The custom gate they created for my home is not only secure but adds tremendous curb appeal. Their attention to detail is remarkable.",
      name: "Akhila Fernando", 
      position: "Property Developer",
      location: "Colombo, Sri Lanka",
      rating: 5
    },
    { 
      image: assest.admin, 
      text: "Working with this team was a pleasure from start to finish. They took my basic idea and transformed it into an exceptional iron railing that perfectly complements my home's architecture. The quality is outstanding.",
      name: "Nimal Perera", 
      position: "Architect",
      location: "Gampaha, Sri Lanka",
      rating: 5
    },
    { 
      image: assest.admin, 
      text: "As an interior designer, I've worked with many fabricators, but Jayalath's attention to detail and commitment to quality is unmatched. They delivered exactly what my client wanted for their custom staircase railings.",
      name: "Madhavi Silva", 
      position: "Interior Designer",
      location: "Kandy, Sri Lanka",
      rating: 5
    },
    { 
      image: assest.admin, 
      text: "When our business needed custom security grilles with a specific design, Jayalath Iron Works delivered perfectly. The installation was efficient and the finished product is both functional and aesthetically pleasing.",
      name: "Sanjay Patel", 
      position: "Business Owner",
      location: "Negombo, Sri Lanka",
      rating: 4
    },
    { 
      image: assest.admin, 
      text: "The quality of work from Jayalath Iron Works is exceptional. The ornamental iron features they created for our hotel lobby have become a talking point among our guests. Professional service from consultation to installation.",
      name: "Priya Mendis", 
      position: "Hotel Manager",
      location: "Bentota, Sri Lanka",
      rating: 5
    }
  ];

  // Custom next arrow component 
  const NextArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ 
          ...style, 
          display: "block", 
          right: 5,
          zIndex: 1,
          width: 40,
          height: 40,
          opacity: 0.8,
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0
        }}
        onClick={onClick}
      >
        <svg width="12" height="20" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L7 7L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  
  // Custom previous arrow component
  const PrevArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ 
          ...style, 
          display: "block", 
          left: 5,
          zIndex: 1,
          width: 40,
          height: 40,
          opacity: 0.8,
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0
        }}
        onClick={onClick}
      >
        <svg width="12" height="20" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 1L1 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  // Slider settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: isMobile ? 1 : isTablet ? 2 : 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  // Function to render stars
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <FaStar 
        key={index} 
        style={{ 
          color: index < rating ? '#FFD700' : '#e4e5e9',
          marginRight: '2px'
        }} 
      />
    ));
  };

  return (
    <div style={styles.testimonialSection} id="testimonials">
      {/* Background with overlay */}
      <div style={styles.backgroundImage}></div>
      <div style={styles.darkOverlay}></div>
      
      {/* Content */}
      <Container style={styles.container}>
        <Row className="justify-content-center">
          <Col md={10} lg={8} className="text-center mb-5">
            <div style={styles.sectionHeader}>
              <h6 style={styles.sectionSubtitle}>TESTIMONIALS</h6>
              <h2 style={styles.sectionTitle}>What Our Clients Say</h2>
              <div style={styles.separator}></div>
              <p style={styles.sectionDescription}>
                Read what our satisfied clients have to say about our craftsmanship, customer service, and dedication to quality.
              </p>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col xs={12}>
            <Slider ref={sliderRef} {...settings}>
              {testimonials.map((testimonial, idx) => (
                <div key={idx} style={styles.slideContainer}>
                  <div style={styles.testimonialCard}>
                    <div style={styles.quoteIconContainer}>
                      <FaQuoteLeft style={styles.quoteIcon} />
                    </div>
                    
                    <div style={styles.contentContainer}>
                      <div style={styles.starsContainer}>
                        {renderStars(testimonial.rating)}
                      </div>
                      
                      <p style={styles.testimonialText}>
                        "{testimonial.text}"
                      </p>
                      
                      <div style={styles.testimonialFooter}>
                        <div style={styles.avatarContainer}>
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            style={styles.avatar}
                          />
                        </div>
                        <div style={styles.authorInfo}>
                          <h5 style={styles.authorName}>{testimonial.name}</h5>
                          <p style={styles.authorPosition}>{testimonial.position}</p>
                          <p style={styles.authorLocation}>{testimonial.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

// Inline styles
const styles = {
  testimonialSection: {
    position: 'relative',
    padding: '100px 0',
    overflow: 'hidden',
  },
  backgroundImage: {
    backgroundImage: `url(${assest.workshopBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 33, 66, 0.9)',
    zIndex: 1,
  },
  container: {
    position: 'relative',
    zIndex: 2,
  },
  sectionHeader: {
    marginBottom: '50px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#93c5fd',
    letterSpacing: '2px',
    marginBottom: '12px',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '20px',
  },
  separator: {
    width: '60px',
    height: '3px',
    backgroundColor: '#93c5fd',
    margin: '0 auto 20px',
    borderRadius: '3px',
  },
  sectionDescription: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  slideContainer: {
    padding: '15px',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '30px',
    height: '100%',
    minHeight: '380px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
  },
  quoteIconContainer: {
    position: 'absolute',
    top: '20px',
    left: '20px',
  },
  quoteIcon: {
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.2)',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  starsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  testimonialText: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.7',
    textAlign: 'center',
    fontStyle: 'italic',
    flexGrow: 1,
    marginBottom: '20px',
  },
  testimonialFooter: {
    display: 'flex',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '20px',
  },
  avatarContainer: {
    marginRight: '15px',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255, 255, 255, 0.2)',
  },
  authorInfo: {
    textAlign: 'left',
  },
  authorName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '3px',
  },
  authorPosition: {
    fontSize: '14px',
    color: '#93c5fd',
    margin: '0 0 3px 0',
  },
  authorLocation: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
  },
};

export default Testimonial;