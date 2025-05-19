// Modified App.js to treat the profile page like dashboard pages

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes, useLocation, BrowserRouter as Router } from 'react-router-dom';
import './App.css';

// Components
import CustomNavbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import Footprints from './Components/Footprints/Footprints';
import Header from './Components/Header/Header';
import ShopItems from './Components/ShopItems/ShopItems';
import Testimonial from './Components/Testimonial/Testimonial';

// Customer Pages
import Dashboard from './Pages/Customer/Dashboard';
import JobsByUser from './Pages/Customer/Bill';
import ProfilePage from './Pages/Customer/ProfilePage';
import Quotations from './Pages/Customer/Quotations';
import UserInvoices from './Pages/Customer/UserInvoices';
import Sidebar from './Components/Sidebar/Sidebar';
// Supervisor Pages
import AddEmployee from './Pages/Supervisor/AddEmployee';
import AddMachine from './Pages/Supervisor/AddMachine';
import AddTour from './Pages/Supervisor/AddMaterial';
import EmployeeList from './Pages/Supervisor/EmployeeList';
import JobManagement from './Pages/Supervisor/Jobs';
import LoginSignup from './Pages/Supervisor/loginsingup';
import MachineList from './Pages/Supervisor/MachineList';
import MaterialList from './Pages/Supervisor/MaterialList';
import SupSidebar from './Pages/Supervisor/Sidebar';

// Admin Pages
import AdminInvoices from './Pages/Admin/AdminInvoices';
import AdminQuotations from './Pages/Admin/AdminQuotations';
import JobManagementAdmin from './Pages/Admin/Jobs';
import Analyze from './Pages/Admin/Analyze';
import SidebarAdmin from './Pages/Admin/Sidebar';
import CustomerQuotations from './Pages/Customer/CustomerQuotations';
import LowStockMaterial from './Pages/Supervisor/LowStockMaterial';
import ExpSoon from './Pages/Admin/ExpSoon';
import CustomerPaymentDue from './Pages/Customer/CustomerPaymentDue';
import MaterialListAnalyze from './Pages/Supervisor/MaterialListAnalyze';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  // Change: Move profile page to be treated like other dashboard pages
  const isProfilePage = false; // No longer a special case
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isSupervisorRoute = location.pathname.startsWith('/supervisor');
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Add a new condition for the profile page to show the customer sidebar
  const isCustomerProfilePage = location.pathname === '/profile';

  return (
    <div >
      {/* Navbar only appears on homepage now */}
      {isHomePage && <CustomNavbar />}

      {/* Home page specific components */}
      {isHomePage && (
        <>
          <Header />
          <ShopItems />
          <Footprints />
          <Testimonial />
        </>
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Customer Sidebar - now also shows on profile page */}
        {(isDashboardRoute || isCustomerProfilePage) && <Sidebar />}

        {/* Supervisor Sidebar */}
        {isSupervisorRoute && <SupSidebar />}

        {/* Admin Sidebar */}
        {isAdminRoute && <SidebarAdmin />}

        <div className={`main-content ${(isDashboardRoute || isSupervisorRoute || isAdminRoute || isCustomerProfilePage) ? 'with-sidebar' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<></>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/supLog" element={<LoginSignup />} />

            {/* Customer Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/customerQuotations" element={<CustomerQuotations />} />
            <Route path="/dashboard/customerPaymentDue" element={<CustomerPaymentDue />} />
            <Route path="/dashboard/quotations" element={<Quotations />} />
            <Route path="/dashboard/invoices" element={<UserInvoices />} />
            <Route path="/dashboard/bills" element={<JobsByUser />} />
            {/* Supervisor Routes */}
            <Route path="/supervisor/add-material" element={<AddTour />} />
            <Route path="/supervisor/add-machine" element={<AddMachine />} />
            <Route path="/supervisor/list-machine" element={<MachineList />} />
            <Route path="/supervisor/lowstock-material" element={<LowStockMaterial />} />
            <Route path="/supervisor/list-material" element={<MaterialList />} />
            <Route path="/supervisor/add-employee" element={<AddEmployee />} />
            <Route path="/supervisor/list-employee" element={<EmployeeList />} />
            <Route path="/supervisor/job-management" element={<JobManagement />} />
            <Route path="/supervisor/materialListAnalyze" element={<MaterialListAnalyze />} />

            {/* Admin Routes */}
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/Analyze" element={<Analyze />} />
            <Route path='/admin/quotations' element={<AdminQuotations />} />
            <Route path="/admin/jobs" element={<JobManagementAdmin />} />
            <Route path="/admin/expJobs" element={<ExpSoon />} />
          </Routes>
        </div>
      </div>

      {/* Footer - shown on home page only now */}
      {isHomePage && <Footer />}
    </div>
  );
}
export default App;