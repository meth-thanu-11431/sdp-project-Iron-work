import { Button, Card, CardContent, Container, Grid, Typography } from '@mui/material';
import React, { useRef, useState } from 'react';

// Sample data for users
const users = [
  { id: 1, name: 'John Doe', email: 'user1@example.com', role: 'Tourist', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'user2@example.com', role: 'Guide', status: 'Inactive' },
  { id: 3, name: 'Michael Brown', email: 'user3@example.com', role: 'Tourist', status: 'Active' },
  { id: 4, name: 'Sarah Johnson', email: 'user4@example.com', role: 'Guide', status: 'Active' },
  { id: 5, name: 'David Wilson', email: 'user5@example.com', role: 'Tourist', status: 'Inactive' },
];

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null); // To track selected user for profile details
  const userDetailsRef = useRef(null); // Reference to User Details section

  // Function to handle viewing user profile
  const handleViewProfile = (user) => {
    setSelectedUser(user);
    
    // Scroll to the User Details section
    if (userDetailsRef.current) {
      userDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, marginBottom: '20px' }}>
        User Management
      </Typography>

      {/* List of Users */}
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} key={user.id}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: 200, boxShadow: 3 }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: '10px' }}>
                  Email: {user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: '10px' }}>
                  Role: {user.role}
                </Typography>
                <Typography variant="body2" color={user.status === 'Active' ? 'green' : 'red'} sx={{ marginBottom: '10px' }}>
                  Status: {user.status}
                </Typography>
              </CardContent>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={() => handleViewProfile(user)} // Show details for the clicked user
              >
                View Profile
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Display User Details when a user is selected */}
      {selectedUser && (
        <div ref={userDetailsRef} style={{ marginTop: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            User Details
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Name:</Typography>
          <Typography variant="body1">{selectedUser.name}</Typography>
          
          <Typography variant="h6" sx={{ fontWeight: 600, marginTop: '10px' }}>Email:</Typography>
          <Typography variant="body1">{selectedUser.email}</Typography>
          
          <Typography variant="h6" sx={{ fontWeight: 600, marginTop: '10px' }}>Role:</Typography>
          <Typography variant="body1">{selectedUser.role}</Typography>
          
          <Typography variant="h6" sx={{ fontWeight: 600, marginTop: '10px' }}>Status:</Typography>
          <Typography variant="body1" sx={{ color: selectedUser.status === 'Active' ? 'green' : 'red' }}>
            {selectedUser.status}
          </Typography>
        </div>
      )}
    </Container>
  );
};

export default UserManagement;
