import './TourDetails.css';

import { Box, Button, Container, Paper, Typography } from '@mui/material';

import React from 'react';

// Static tours data
const tours = [
  { id: 1, name: 'Tour 1', description: 'Explore the beauty of nature', price: '$100', duration: '5 days' },
  { id: 2, name: 'Tour 2', description: 'A thrilling adventure awaits', price: '$150', duration: '7 days' },
  { id: 3, name: 'Tour 3', description: 'Relax on the beaches', price: '$200', duration: '10 days' },
  { id: 4, name: 'Tour 4', description: 'Discover the city lights', price: '$80', duration: '3 days' },
];

// Function to get a random tour
const getRandomTour = () => {
  const randomIndex = Math.floor(Math.random() * tours.length); // Generate random index
  return tours[randomIndex];
};

const TourDetails = () => {
  const tour = getRandomTour(); // Get a random tour

  return (
    <Container sx={{ padding: 3 }}>
      <Paper elevation={4} sx={{ padding: 3, borderRadius: 2, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
          {tour.name}
        </Typography>

        <Typography variant="body1" sx={{ marginTop: 2, color: '#555' }}>
          <strong>Description:</strong> {tour.description}
        </Typography>

        <Typography variant="body1" sx={{ marginTop: 2, color: '#555' }}>
          <strong>Price:</strong> {tour.price}
        </Typography>

        <Typography variant="body1" sx={{ marginTop: 2, color: '#555' }}>
          <strong>Duration:</strong> {tour.duration}
        </Typography>

        {/* Book Now Button */}
        <Button
          variant="contained"
          color="primary"
          sx={{
            marginTop: 3,
            padding: '12px 30px',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: 5,
            backgroundColor: '#3f51b5',
            ':hover': {
              backgroundColor: '#303f9f',
            },
          }}
          onClick={() => alert('Booking functionality not implemented')}
        >
          Book Now
        </Button>
      </Paper>
    </Container>
  );
};

export default TourDetails;
