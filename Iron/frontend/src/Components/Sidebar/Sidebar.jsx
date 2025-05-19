import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
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
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MenuIcon from "@mui/icons-material/Menu";
import axios from "axios";

const Sidebar = () => {
  const theme = useTheme();
  const [image, setImage] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const goToHomePage = () => {
    navigate("/");
  };

  // Check if current route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:4000/api/user/get_user",
          {
            headers: {
              token: token,
            },
          }
        );
        if (response.data.success) {
          setUser(response.data.user);
          setImage(
            response.data.user.profile_image ||
              "https://via.placeholder.com/150"
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  const menuItems = [
    {
      text: "Create New Job",
      icon: <AddIcon />,
      path: "/dashboard/quotations",
    },
    {
      text: "My Invoices",
      icon: <ListAltIcon />,
      path: "/dashboard/invoices",
    },
    {
      text: "My Jobs",
      icon: <InfoIcon />,
      path: "/dashboard/bills",
    },
    {
      text: "My Quotations ",
      icon: <InfoIcon />,
      path: "/dashboard/customerQuotations",
    },
    {
      text: "Payment Due",
      icon: <InfoIcon />,
      path: "/dashboard/customerPaymentDue",
    },
    {
      text: "Profile",
      icon: <AccountCircleIcon />,
      path: "/profile",
    },
  ];

  return (
    <Box>
      {isMobile && (
        <AppBar position="sticky" sx={{ backgroundColor: "#1e293b" }}>
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
            <Typography variant="h6">Dashboard</Typography>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        sx={{
          width: 280,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            backgroundColor: "#111827",
            color: "white",
            paddingTop: "20px",
            boxShadow: "0 4px 12px 0 rgba(0,0,0,0.5)",
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
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <Box
                sx={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: "#44b700",
                  borderRadius: "50%",
                  border: "2px solid #111827",
                }}
              />
            }
          >
            <Avatar
              src={`http://localhost:4000/images/${image}`}
              alt="Profile"
              sx={{
                width: 90,
                height: 90,
                margin: "auto",
                marginBottom: "12px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                border: "3px solid #3b82f6",
              }}
            />
          </Badge>
          <Typography
            variant="h6"
            sx={{ color: "white", fontWeight: 600, fontSize: "18px" }}
          >
            {user.customer_name || "Guest User"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8", fontSize: "14px" }}
          >
            {user.role || "Customer"}
          </Typography>
        </Box>

        {/* Navigation Menu */}
        <List sx={{ px: 2 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.text}>
              <ListItem
                button
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: "8px",
                  mb: 0.7,
                  backgroundColor: isActive(item.path)
                    ? "rgba(59, 130, 246, 0.15)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive(item.path)
                      ? "rgba(59, 130, 246, 0.2)"
                      : "rgba(59, 130, 246, 0.08)",
                  },
                  transition: "all 0.2s ease",
                  py: 1.2,
                }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      color: isActive(item.path) ? "#3b82f6" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: isActive(item.path) ? 600 : 400,
                      color: isActive(item.path) ? "#3b82f6" : "white",
                    },
                  }}
                />
              </ListItem>
              {index < menuItems.length - 1 && (
                <Divider
                  sx={{ backgroundColor: "rgba(255,255,255,0.08)", my: 0.5 }}
                />
              )}
            </React.Fragment>
          ))}
        </List>

        {/* Home Page Button */}
        <Box
          sx={{
            position: "absolute",
            bottom: "20px",
            width: "85%",
            left: "7.5%",
          }}
        >
          <Button
            variant="contained"
            onClick={goToHomePage}
            startIcon={<HomeIcon />}
            sx={{
              backgroundColor: "#3b82f6",
              "&:hover": {
                backgroundColor: "#2563eb",
              },
              borderRadius: "8px",
              py: 1.2,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              textTransform: "none",
              fontWeight: 500,
            }}
            fullWidth
          >
            Back to Home Page
          </Button>
        </Box>
      </Drawer>

      {/* Main content would go here */}
      <Box
        component="main"
        sx={{
          marginLeft: isMobile ? 0 : 280,
          p: 3,
          transition: "margin 0.3s",
        }}
      >
        {/* Main content would go here */}
      </Box>
    </Box>
  );
};

export default Sidebar;
