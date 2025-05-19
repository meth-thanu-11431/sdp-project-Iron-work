import "./Sidebar.css";

import {
  AppBar,
  Box,
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
  Button,
} from "@mui/material";
import React, { useState } from "react";
import { assets } from "../../assest/assestAdmin";
import { assest } from "../../assest/assest";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MenuIcon from "@mui/icons-material/Menu";
import PaymentIcon from "@mui/icons-material/Payment";
import InfoIcon from "@mui/icons-material/Info";
import EngineeringIcon from "@mui/icons-material/Engineering";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Check if a route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Logout handler function
  const handleLogout = () => {
    // Clear any authentication tokens or user data from localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    
    // You could also add API call to logout from backend if needed
    // Example: await logoutFromApi();
    
    // Redirect to login page
    navigate('/');
    
    // Close the drawer if on mobile
    if (isMobile) {
      setOpen(false);
    }
  };

  // Menu items array for cleaner rendering
  const menuItems = [
    {
      text: "Dashboard",
      icon: <EngineeringIcon />,
      path: "/admin/Analyze",
    },
    {
      text: "All Quotations",
      icon: <ListAltIcon />,
      path: "/admin/quotations",
    },
    {
      text: "All Invoices",
      icon: <PaymentIcon />,
      path: "/admin/invoices",
    },
    {
      text: "Jobs Management",
      icon: <EngineeringIcon />,
      path: "/admin/jobs",
    },
    
  ];

  return (
    <Box>
      {/* AppBar for small screens */}
      {isMobile && (
        <AppBar position="sticky" sx={{ backgroundColor: "#111827" }}>
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
            <Typography variant="h6">Admin Panel</Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      <Drawer
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            backgroundColor: "#111827",
            color: "white",
            paddingTop: "20px",
            boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.3)",
          },
        }}
        variant={isMobile ? "temporary" : "permanent"}
        anchor="left"
        open={isMobile ? open : true}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {/* Profile Section */}
        <Box
          sx={{
            textAlign: "center",
            padding: "16px",
            marginBottom: "16px",
            background:
              "linear-gradient(to bottom, rgba(49,66,99,0.5), rgba(25,33,49,0.5))",
            borderRadius: "0 0 12px 12px",
          }}
        >
          <img
            src={assest.expo}
            alt="Profile"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "12px",
              border: "3px solid #3b82f6",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            Jayalath Engineers
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Administrator
          </Typography>
        </Box>

        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.08)", mb: 2 }} />

        {/* Sidebar Menu */}
        <List sx={{ px: 2 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.text}>
              <ListItem
                button
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: "8px",
                  mb: 0.8,
                  py: 1.2,
                  backgroundColor: isActiveRoute(item.path)
                    ? "rgba(59, 130, 246, 0.15)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActiveRoute(item.path)
                      ? "rgba(59, 130, 246, 0.2)"
                      : "rgba(59, 130, 246, 0.08)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      color: isActiveRoute(item.path) ? "#3b82f6" : "white",
                      minWidth: "40px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {item.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      color: isActiveRoute(item.path) ? "#3b82f6" : "white",
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                      fontSize: "15px",
                    },
                  }}
                />
              </ListItem>
              {index < menuItems.length - 1 && (
                <Divider
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    my: 0.8,
                    opacity: 0.5,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </List>

        {/* Logout button */}
        <Box
          sx={{
            position: "absolute",
            bottom: "60px",
            width: "100%",
            px: 2,
          }}
        >
          <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.08)", mb: 2 }} />
          <Button
            fullWidth
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              borderRadius: "8px",
              py: 1.2,
              color: "#f87171",
              textAlign: "left",
              justifyContent: "flex-start",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.2)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <Typography sx={{ ml: 1, fontWeight: 500 }}>Logout</Typography>
          </Button>
        </Box>

        {/* Footer section */}
        <Box
          sx={{
            position: "absolute",
            bottom: "20px",
            width: "100%",
            textAlign: "center",
            px: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontSize: "12px" }}
          >
            © 2025 Iron Workstation
          </Typography>
        </Box>
      </Drawer>

      {/* Main content area */}
      <Box
        sx={{
          marginLeft: isMobile ? 0 : "240px",
          transition: "margin 0.3s",
          padding: "20px",
        }}
      >
        {/* Main content will go here, based on the selected route */}
      </Box>
    </Box>
  );
};

export default Sidebar;