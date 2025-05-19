import './Sidebar.css';

import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import EngineeringIcon from '@mui/icons-material/Engineering';
import axios from 'axios';

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Check if a route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    // Try to get supervisor info from localStorage first
    const supervisorName = localStorage.getItem('supervisorName');
    const supervisorImage = localStorage.getItem('supervisorImage');
    if (supervisorName) {
      setUsername(supervisorName);
      setProfileImage(supervisorImage);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from backend
    const fetchSupervisor = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:4000/api/guides/get_guide', {
          headers: { token }
        });
        setUsername(response.data.user.supervisor_name);
        setProfileImage(response.data.user.profile_image);
        // Optionally store for later use
        localStorage.setItem('supervisorName', response.data.user.supervisor_name);
        localStorage.setItem('supervisorImage', response.data.user.profile_image);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching supervisor:', error);
        setLoading(false);
      }
    };

    fetchSupervisor();
  }, []);

  // Menu items array for cleaner rendering
  const menuItems = [
    {
      text: "Dashboard",
      icon: <FormatListBulletedIcon />,
      path: "/supervisor/materialListAnalyze"
    },

    {
      text: "Assign Resouces",
      icon: <EngineeringIcon />,
      path: "/supervisor/job-management"
    },

    {
      text: "Add Material",
      icon: <AddCircleIcon />,
      path: "/supervisor/add-material"
    },
    {
      text: "List Material",
      icon: <FormatListBulletedIcon />,
      path: "/supervisor/list-material"
    },
    
    {
      text: "Add Employee",
      icon: <PersonAddIcon />,
      path: "/supervisor/Add-employee"
    },
    {
      text: "List Employee",
      icon: <PeopleIcon />,
      path: "/supervisor/list-employee"
    },
    {
      text: "Add Machine",
      icon: <BuildIcon />,
      path: "/supervisor/add-machine"
    },
    {
      text: "List Machine",
      icon: <FormatListBulletedIcon />,
      path: "/supervisor/List-machine"
    },
    

  ];

  return (
    <Box>
      {isMobile && (
        <AppBar position="sticky" sx={{ backgroundColor: '#111827' }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleDrawer}
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">Supervisor Panel</Typography>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: '#111827',
            color: 'white',
            paddingTop: '20px',
            boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.3)'
          },
        }}
        variant={isMobile ? 'temporary' : 'permanent'}
        anchor="left"
        open={isMobile ? open : true}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {/* Profile Section with improved styling */}
        <Box sx={{
          textAlign: 'center',
          padding: '16px',
          marginBottom: '16px',
          background: 'linear-gradient(to bottom, rgba(49,66,99,0.5), rgba(25,33,49,0.5))',
          borderRadius: '0 0 12px 12px'
        }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.2)',
              width: '80px',
              height: '80px',
              margin: '0 auto',
              border: '3px solid #3b82f6',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            src={profileImage ? `http://localhost:4000/uploads/${profileImage}` : undefined}
          >
            {!profileImage && <PersonIcon sx={{ fontSize: '40px', color: '#3b82f6' }} />}
          </Avatar>

          {loading ? (
            <CircularProgress sx={{ color: '#3b82f6', mt: 1 }} size={20} />
          ) : (
            <Typography variant="subtitle1" sx={{
              color: 'white',
              fontWeight: 600,
              mt: 1,
              fontSize: '16px'
            }}>
              {username || 'Supervisor'}
            </Typography>
          )}
          <Typography variant="body2" sx={{
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Supervisor
          </Typography>
        </Box>

        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', mb: 2 }} />

        <List sx={{ px: 2 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.text}>
              <ListItem
                button
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: '8px',
                  mb: 0.8,
                  py: 1.2,
                  backgroundColor: isActiveRoute(item.path) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActiveRoute(item.path)
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(59, 130, 246, 0.08)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon>
                  <Box sx={{
                    color: isActiveRoute(item.path) ? '#3b82f6' : 'white',
                    minWidth: '40px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      color: isActiveRoute(item.path) ? '#3b82f6' : 'white',
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                      fontSize: '15px'
                    }
                  }}
                />
              </ListItem>
              {index < menuItems.length - 1 && (
                <Divider sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  my: 0.5,
                  opacity: 0.5
                }} />
              )}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{
          width: '85%',
          marginBottom: '20px',
          marginLeft: '20px',
        }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
            sx={{
              backgroundColor: '#10b981', // Green color
              '&:hover': {
                backgroundColor: '#059669' // Darker green on hover
              },
              borderRadius: '8px',
              py: 1.2,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box sx={{
        marginLeft: isMobile ? 0 : 240,
        transition: 'margin 0.3s',
        padding: '20px'
      }}>
        {/* Main content will go here, based on the selected route */}
      </Box>
    </Box>
  );
};

export default Sidebar;