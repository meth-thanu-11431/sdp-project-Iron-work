import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Telephone, EnvelopeFill, GeoAltFill } from "react-bootstrap-icons";
import { assest } from "../../assest/assest";
import "./Footer.css";

const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" id="footer">
      <Container>
        <Row className="footer-content-row">
          {/* Company Info Column */}
          <Col lg={4} md={12} className="footer-company">
            <div className="footer-logo-wrapper">
              <img 
                src={assest.expo} 
                alt="Jayalath Iron Works Logo" 
                className="footer-logo" 
              />
            </div>
            <p className="company-description">
              Discover exceptional craftsmanship with Jayalath Iron Works. We are dedicated to 
              delivering precision metalwork solutions with quality materials and expert guidance 
              for all your custom fabrication needs.
            </p>
            <div className="certification-badges">
              <span className="certification-badge iso">ISO 9001:2015</span>
              <span className="certification-badge established">Est. 1995</span>
            </div>
          </Col>

          {/* Quick Links Column */}
          <Col lg={2} md={4} className="footer-column">
            <h3 className="footer-heading">
              Quick Links
              <span className="heading-underline"></span>
            </h3>
            <ul className="footer-links">
              <li><a href="#home"><span className="link-arrow">›</span> Home</a></li>
              <li><a href="#services"><span className="link-arrow">›</span> Our Services</a></li>
              <li><a href="#projects"><span className="link-arrow">›</span> Projects</a></li>
              <li><a href="#about"><span className="link-arrow">›</span> About Us</a></li>
              <li><a href="#contact"><span className="link-arrow">›</span> Request a Quote</a></li>
            </ul>
          </Col>

          {/* Business Hours Column */}
          <Col lg={3} md={4} className="footer-column">
            <h3 className="footer-heading">
              Business Hours
              <span className="heading-underline"></span>
            </h3>
            <ul className="business-hours">
              <li>
                <span className="day">Monday - Friday:</span>
                <span className="hours">8:00 AM - 6:00 PM</span>
              </li>
              <li>
                <span className="day">Saturday:</span>
                <span className="hours">9:00 AM - 4:00 PM</span>
              </li>
              <li>
                <span className="day">Sunday:</span>
                <span className="hours">Closed</span>
              </li>
            </ul>
          </Col>

          {/* Contact Info Column */}
          <Col lg={3} md={4} className="footer-column">
            <h3 className="footer-heading">
              Contact Us
              <span className="heading-underline"></span>
            </h3>
            <ul className="contact-info">
              <li className="contact-item">
                <Telephone className="contact-icon" />
                <div className="contact-text">
                  <a href="tel:+94714032456">+94 714 032 456</a>
                  <a href="tel:+94775734895">+94 775 734 895</a>
                </div>
              </li>
              <li className="contact-item">
                <EnvelopeFill className="contact-icon" />
                <div className="contact-text">
                  <a href="mailto:jayalatheng@gmail.com">jayalatheng@gmail.com</a>
                </div>
              </li>
              <li className="contact-item">
                <GeoAltFill className="contact-icon" />
                <div className="contact-text">
                  <span>123 Industrial Zone,<br />Colombo, Sri Lanka</span>
                </div>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
      
      {/* Copyright Section */}
      <div className="copyright-bar">
        <Container>
          <div className="copyright-content">
            <p>© {currentYear} Jayalath Iron Works™. All Rights Reserved.</p>
            <div className="legal-links">
              <a href="/privacy-policy">Privacy Policy</a> | <a href="/terms-of-service">Terms of Service</a>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;