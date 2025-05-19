import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { 
  Wrench,  // Instead of Tool
  Award, 
  People, 
  CheckCircleFill 
} from "react-bootstrap-icons";

// Import Poppins font
const fontImport = document.createElement('link');
fontImport.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
fontImport.rel = 'stylesheet';
document.head.appendChild(fontImport);

const Footprints = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    years: 0,
    projects: 0,
    clients: 0,
    certifications: 0
  });

  // Target stats values
  const targetStats = {
    years: 20,
    projects: 1000,
    clients: 500,
    certifications: 5
  };

  // Animation duration in milliseconds
  const animationDuration = 2000;

  // Detect when the section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.querySelector(".footprints-section");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  // Animate numbers when section becomes visible
  useEffect(() => {
    if (isVisible) {
      const stepTime = animationDuration / 60;
      const stepsCount = 60;
      
      const incrementValues = {
        years: targetStats.years / stepsCount,
        projects: targetStats.projects / stepsCount,
        clients: targetStats.clients / stepsCount,
        certifications: targetStats.certifications / stepsCount
      };
      
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep += 1;
        
        if (currentStep >= stepsCount) {
          clearInterval(timer);
          setAnimatedStats(targetStats);
        } else {
          setAnimatedStats(prev => ({
            years: Math.min(Math.round(prev.years + incrementValues.years), targetStats.years),
            projects: Math.min(Math.round(prev.projects + incrementValues.projects), targetStats.projects),
            clients: Math.min(Math.round(prev.clients + incrementValues.clients), targetStats.clients),
            certifications: Math.min(Math.round(prev.certifications + incrementValues.certifications), targetStats.certifications)
          }));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    }
  }, [isVisible]);

  // Styles
  const styles = {
    section: {
      background: 'linear-gradient(135deg, #f4f4f9 0%, #e8eaf6 100%)',
      padding: '100px 0',
      fontFamily: "'Poppins', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.8s ease, transform 0.8s ease',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233f51b5' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      backgroundRepeat: 'repeat',
      backgroundPosition: 'center'
    },
    sectionIntro: {
      marginBottom: '60px',
      textAlign: 'center'
    },
    sectionSubtitle: {
      color: '#5e35b1',
      fontSize: '16px',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      marginBottom: '15px',
      display: 'block'
    },
    sectionTitle: {
      color: '#3f51b5',
      fontSize: '36px',
      fontWeight: 700,
      marginBottom: '20px'
    },
    titleSeparator: {
      width: '80px',
      height: '3px',
      background: 'linear-gradient(90deg, #5e35b1, #3f51b5)',
      margin: '0 auto 30px',
      borderRadius: '3px'
    },
    statsRow: {
      marginBottom: '60px'
    },
    statCol: {
      padding: '15px',
      transition: 'transform 0.3s ease'
    },
    statContent: {
      zIndex: 2,
      position: 'relative'
    },
    statLabel: {
      fontSize: '15px',
      fontWeight: 500,
      color: '#616161',
      transition: 'color 0.3s ease'
    },
    testimonialQuote: {
      textAlign: 'center',
      padding: '30px',
      position: 'relative'
    },
    quoteText: {
      fontSize: '22px',
      fontStyle: 'italic',
      color: '#303f9f',
      fontWeight: 400,
      maxWidth: '80%',
      margin: '0 auto 20px',
      lineHeight: 1.6,
      position: 'relative'
    },
    quoteAuthor: {
      fontWeight: 600,
      fontSize: '16px',
      color: '#5e35b1',
      position: 'relative',
      display: 'inline-block',
      paddingTop: '15px',
      borderTop: '2px solid #5e35b1',
      width: '40px'
    }
  };

  // Handle hover effect manually
  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-10px)';
    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
  };

  return (
    <section className="footprints-section" id="achievements" style={styles.section}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} style={styles.sectionIntro}>
            <span style={styles.sectionSubtitle}>Excellence in Metalwork</span>
            <h2 style={styles.sectionTitle}>Our Footprints in Metal Fabrication</h2>
            <div style={styles.titleSeparator}></div>
          </Col>
        </Row>
        
        <Row className="justify-content-center" style={styles.statsRow}>
          <Col lg={3} md={6} sm={6} style={styles.statCol}>
            <div 
              style={{
                background: 'white',
                height: '100%',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                borderTop: '8px solid #3f51b5',
                cursor: 'pointer'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Wrench style={{ fontSize: '36px', marginBottom: '15px', color: '#3f51b5' }} />
              <div style={styles.statContent}>
                <div style={{ fontSize: '42px', fontWeight: 700, marginBottom: '10px', color: '#3f51b5' }}>
                  {animatedStats.years}+
                </div>
                <div style={styles.statLabel}>Years of Experience</div>
              </div>
            </div>
          </Col>
          
          <Col lg={3} md={6} sm={6} style={styles.statCol}>
            <div 
              style={{
                background: 'white',
                height: '100%',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                borderTop: '8px solid #2196F3',
                cursor: 'pointer'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <CheckCircleFill style={{ fontSize: '36px', marginBottom: '15px', color: '#2196F3' }} />
              <div style={styles.statContent}>
                <div style={{ fontSize: '42px', fontWeight: 700, marginBottom: '10px', color: '#2196F3' }}>
                  {animatedStats.projects}+
                </div>
                <div style={styles.statLabel}>Projects Completed</div>
              </div>
            </div>
          </Col>
          
          <Col lg={3} md={6} sm={6} style={styles.statCol}>
            <div 
              style={{
                background: 'white',
                height: '100%',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                borderTop: '8px solid #4CAF50',
                cursor: 'pointer'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <People style={{ fontSize: '36px', marginBottom: '15px', color: '#4CAF50' }} />
              <div style={styles.statContent}>
                <div style={{ fontSize: '42px', fontWeight: 700, marginBottom: '10px', color: '#4CAF50' }}>
                  {animatedStats.clients}+
                </div>
                <div style={styles.statLabel}>Happy Clients</div>
              </div>
            </div>
          </Col>
          
          <Col lg={3} md={6} sm={6} style={styles.statCol}>
            <div 
              style={{
                background: 'white',
                height: '100%',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                borderTop: '8px solid #FF9800',
                cursor: 'pointer'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Award style={{ fontSize: '36px', marginBottom: '15px', color: '#FF9800' }} />
              <div style={styles.statContent}>
                <div style={{ fontSize: '42px', fontWeight: 700, marginBottom: '10px', color: '#FF9800' }}>
                  {animatedStats.certifications}
                </div>
                <div style={styles.statLabel}>Quality Certifications</div>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div style={styles.testimonialQuote}>
              <p style={{
                fontSize: '22px',
                fontStyle: 'italic',
                color: '#303f9f',
                fontWeight: 400,
                maxWidth: '80%',
                margin: '0 auto 20px',
                lineHeight: 1.6,
                position: 'relative',
                paddingTop: '20px'
              }}>
                "Crafting metal with passion and precision."
              </p>
              <div style={{
                fontWeight: 600,
                fontSize: '16px',
                color: '#5e35b1',
                position: 'relative',
                display: 'inline-block',
                paddingTop: '15px'
              }}>
                <div style={{
                  width: '40px',
                  height: '2px',
                  background: '#5e35b1',
                  margin: '0 auto 10px'
                }}></div>
                Jayalath Iron Works
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Footprints;