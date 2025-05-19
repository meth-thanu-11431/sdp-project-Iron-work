import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaCogs, FaHammer, FaTools, FaTruck, FaWarehouse, FaWrench } from 'react-icons/fa';
import { assest } from '../../assest/assest';

const ShopItems = () => {
  // Data for Jayalath Iron Works services and products
  const shops = [
    {
      name: 'Custom Gates & Railings',
      image: assest.s1,
      description: 'Elevate your property with our premium custom-designed gates and railings.',
      features: [
        'Modern & Traditional Designs',
        'High-Quality Materials',
        'Corrosion Resistant Finish',
        'Custom Dimensions'
      ],
      category: 'residential'
    },
    {
      name: 'Metal Fabrication',
      image: assest.s2,
      description: 'Professional metal fabrication services for commercial and industrial projects.',
      features: [
        'Precision Engineering',
        'Advanced Welding Techniques',
        'Custom Specifications',
        'Structural Steel Work'
      ],
      category: 'industrial'
    },
    {
      name: 'Decorative Ironworks',
      image: assest.s3,
      description: 'Artistic ironwork that combines beauty and functionality for your space.',
      features: [
        'Ornamental Designs',
        'Interior & Exterior Options',
        'Handcrafted Details',
        'Bespoke Solutions'
      ],
      category: 'artistic'
    },
    {
      name: 'Security Solutions',
      image: assest.s4,
      description: 'Enhance your property security with our durable metal security products.',
      features: [
        'Window Guards',
        'Security Doors',
        'Reinforced Gates',
        'Anti-Theft Features'
      ],
      category: 'security'
    },
    {
      name: 'Industrial Equipment',
      image: assest.s5,
      description: 'Specialized metal equipment and structures for industrial applications.',
      features: [
        'Heavy-Duty Construction',
        'Custom Industrial Racks',
        'Equipment Frames',
        'Metal Enclosures'
      ],
      category: 'industrial'
    },
    {
      name: 'Architectural Metal',
      image: assest.s6,
      description: 'Distinctive architectural metal elements that define your space.',
      features: [
        'Staircases & Balustrades',
        'Feature Walls',
        'Metal Signage',
        'Structural Elements'
      ],
      category: 'architectural'
    }
  ];
  
  // Services with enhanced descriptions
  const services = [
    {
      icon: <FaHammer />,
      title: 'Custom Metal Fabrication',
      description: 'From concept to completion, our skilled craftsmen create precision metalwork tailored to your exact specifications with superior quality and attention to detail.'
    },
    {
      icon: <FaTools />,
      title: 'Welding & Assembly',
      description: 'Our certified welders employ advanced techniques and equipment to ensure strong, precise joints and flawless assembly for all metal components.'
    },
    {
      icon: <FaWarehouse />,
      title: 'Metal Supply & Sourcing',
      description: 'Access high-grade metals and specialized alloys through our extensive supplier network, ensuring optimal materials for your specific project requirements.'
    },
    {
      icon: <FaTruck />,
      title: 'Delivery & Installation',
      description: 'Complete project management with professional delivery and expert installation services, ensuring your metalwork is perfectly fitted and finished.'
    },
    {
      icon: <FaWrench />,
      title: 'Maintenance & Repair',
      description: 'Protect your investment with our comprehensive maintenance services and expert repairs that restore function and appearance to damaged metalwork.'
    },
    {
      icon: <FaCogs />,
      title: 'Engineering Solutions',
      description: 'Our engineering team designs custom metal solutions for complex challenges, providing technical expertise and innovative approaches to every project.'
    }
  ];

  return (
    <div id='about' style={styles.mainContainer}>
      {/* Products Section */}
      <Container fluid="lg">
        <div style={styles.sectionHeader}>
          <h6 style={styles.sectionSubtitle}>OUR PRODUCTS</h6>
          <h2 style={styles.sectionTitle}>Premium Metal Solutions</h2>
          <div style={styles.separator}></div>
        </div>

        <Row className="g-4">
          {shops.map((shop, index) => (
            <Col lg={4} md={6} sm={12} key={index}>
              <Card style={styles.productCard}>
                <div style={styles.imageContainer}>
                  <Card.Img 
                    variant="top" 
                    src={shop.image} 
                    alt={shop.name} 
                    style={styles.productImage} 
                  />
                  <div style={styles.imageOverlay}></div>
                  <div style={styles.categoryBadge}>{shop.category}</div>
                </div>
                
                <Card.Body style={styles.cardBody}>
                  <Card.Title style={styles.productTitle}>{shop.name}</Card.Title>
                  <Card.Text style={styles.productDescription}>{shop.description}</Card.Text>
                  
                  <div style={styles.featuresList}>
                    {shop.features.map((feature, i) => (
                      <div key={i} style={styles.featureItem}>
                        <div style={styles.featureIcon}>✓</div>
                        <div style={styles.featureText}>{feature}</div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Services Section */}
      <div id='services' style={styles.servicesSection}>
        <Container fluid="lg">
          <div style={styles.sectionHeader}>
            <h6 style={styles.sectionSubtitleAlt}>OUR SERVICES</h6>
            <h2 style={styles.sectionTitleAlt}>Expert Metalwork Services</h2>
            <div style={styles.separatorAlt}></div>
          </div>

          <Row className="g-4">
            {services.map((service, index) => (
              <Col lg={4} md={6} sm={12} key={index}>
                <div style={styles.serviceCard}>
                  <div style={styles.serviceIconContainer}>
                    {service.icon}
                  </div>
                  <h3 style={styles.serviceTitle}>{service.title}</h3>
                  <p style={styles.serviceDescription}>{service.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  mainContainer: {
    fontFamily: "'Poppins', sans-serif",
    padding: '80px 0',
    backgroundColor: '#f9fafb',
    overflowX: 'hidden',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    letterSpacing: '2px',
    marginBottom: '12px',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a2142',
    marginBottom: '20px',
  },
  separator: {
    width: '60px',
    height: '3px',
    backgroundColor: '#3b82f6',
    margin: '0 auto',
    borderRadius: '3px',
  },
  // Product card styles
  productCard: {
    border: 'none',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    height: '100%',
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    height: '240px',
    objectFit: 'cover',
    width: '100%',
    transition: 'transform 1s ease',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)',
  },
  categoryBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  cardBody: {
    padding: '24px',
  },
  productTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a2142',
    marginBottom: '12px',
  },
  productDescription: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  featuresList: {
    margin: '20px 0 0 0',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  featureIcon: {
    color: '#10b981',
    marginRight: '8px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  featureText: {
    fontSize: '14px',
    color: '#334155',
  },
  // Services section styles
  servicesSection: {
    backgroundColor: '#1a2142',
    padding: '80px 0',
    marginTop: '80px',
  },
  sectionSubtitleAlt: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#93c5fd',
    letterSpacing: '2px',
    marginBottom: '12px',
    textTransform: 'uppercase',
  },
  sectionTitleAlt: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '20px',
  },
  separatorAlt: {
    width: '60px',
    height: '3px',
    backgroundColor: '#93c5fd',
    margin: '0 auto',
    borderRadius: '3px',
  },
  serviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '30px',
    height: '100%',
    transition: 'transform 0.3s ease, background-color 0.3s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    ':hover': {
      transform: 'translateY(-5px)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  serviceIconContainer: {
    fontSize: '36px',
    color: '#3b82f6',
    marginBottom: '20px',
  },
  serviceTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '15px',
  },
  serviceDescription: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.7',
  },
};

export default ShopItems;