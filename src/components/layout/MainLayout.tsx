import React, { ReactNode, useState, Fragment } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Insights as InsightsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  children?: Array<{ text: string; path: string }>;
}

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  noSidebar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'OfficeFlow', noSidebar = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get the current page title based on the route
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    if (path === 'dashboard') return 'Dashboard';
    if (path === 'expenses') return 'Expenses';
    if (path === 'inventory') return 'Inventory';
    if (path === 'reports') return 'Reports';
    if (path === 'upload-bills') return 'Upload Bills';
    return title;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
    { text: 'Upload Bills', icon: <ReceiptIcon />, path: '/upload-bills' },
    { 
      text: 'Inventory', 
      icon: <InventoryIcon />, 
      path: '/inventory',
      children: [
        { text: 'Manage Inventory', path: '/inventory' },
        { text: 'Reorder', path: '/inventory/order' }
      ]
    },
    { text: 'Reports', icon: <InsightsIcon />, path: '/reports' },
    ...(isAdmin ? [{ text: 'User Management', icon: <PeopleIcon />, path: '/user-management' }] : []),
  ];

  const adminMenuItems: MenuItem[] = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          OfficeFlow
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Fragment key={item.text}>
            <ListItem 
              onClick={() => {
                if (!item.children) {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }
              }}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
            {item.children && (
              <Box sx={{ pl: 3 }}>
                {item.children.map((child) => (
                  <ListItem 
                    key={child.path}
                    component={Link}
                    to={child.path}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{
                      cursor: 'pointer',
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                      py: 0.5,
                      pl: 4,
                    }}
                  >
                    <ListItemText 
                      primary={child.text} 
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          fontWeight: location.pathname === child.path ? 'bold' : 'normal',
                          color: location.pathname === child.path ? 'primary.main' : 'inherit',
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </Box>
            )}
          </Fragment>
        ))}

        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
              Admin
            </Typography>
            {adminMenuItems.map((item) => (
              <ListItem 
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  pl: 4,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </>
        )}
      </List>
      <Divider />
      <List>
        <ListItem 
          onClick={handleLogout}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {!noSidebar && (
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            zIndex: (theme) => theme.zIndex.drawer + 1,
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            color: 'text.primary',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {getPageTitle()}
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      {!noSidebar && (
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          
          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                position: 'fixed',
                height: '100vh',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                borderRight: 'none',
                boxShadow: theme.shadows[2],
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          ml: { sm: noSidebar ? 0 : `${drawerWidth}px` },
          pt: noSidebar ? 0 : '64px', // Only add padding if AppBar is present
          position: 'relative',
          zIndex: 1,
          overflow: 'auto',
          '&.MuiBox-root': {
            margin: 0,
            padding: 0,
          },
          '& > .MuiBox-root': {
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: 3,
          }
        }}
      >
        {isAdmin && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'success.light', color: 'white', borderRadius: 1 }}>
            <Typography variant="body2">
              Admin Mode: You have full access to all features
            </Typography>
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
