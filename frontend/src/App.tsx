import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Feed from './pages/Feed';
import Games from './pages/Games';
import Workshops from './pages/Workshops';
import Prayers from './pages/Prayers';
import Library from './pages/Library';
import Challenges from './pages/Challenges';
import StatsAdmin from './pages/StatsAdmin';
import Profile from './pages/Profile';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import Ia from './pages/Ia';
import Leaderboard from './pages/Leaderboard';
import WorkshopDetails from './pages/WorkshopDetails';
import CreateWorkshop from './pages/CreateWorkshop';
import CreatePrayer from './pages/CreatePrayer';
import PrayerDetail from './pages/PrayerDetail';
import CreateLibraryItem from './pages/CreateLibraryItem';
import LibraryDetail from './pages/LibraryDetail';
import CreateChallenge from './pages/CreateChallenge';
import ReadingPlans from './pages/ReadingPlans';
import ReadingPlanDetail from './pages/ReadingPlanDetail';
import CreateReadingPlan from './pages/CreateReadingPlan';
import Chat from './pages/Chat';
import ChatDetail from './pages/ChatDetail';
import NewChat from './pages/NewChat';


function App() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // ✅ Vérification robuste du rôle Super Admin
  const isSuperAdmin = user?.role === 'Super Admin' || user?.role?.name === 'Super Admin';

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protégées */}
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/feed" element={token ? <Feed /> : <Navigate to="/login" />} />
        <Route path="/games" element={token ? <Games /> : <Navigate to="/login" />} />
        <Route path="/workshops" element={token ? <Workshops /> : <Navigate to="/login" />} />
        <Route path="/workshops/:id" element={token ? <WorkshopDetails /> : <Navigate to="/login" />} />
        <Route path="/workshops/create" element={token ? <CreateWorkshop /> : <Navigate to="/login" />} />
        <Route path="/prayers" element={token ? <Prayers /> : <Navigate to="/login" />} />
        <Route path="/prayers/create" element={token ? <CreatePrayer /> : <Navigate to="/login" />} />
        <Route path="/prayers/:id" element={token ? <PrayerDetail /> : <Navigate to="/login" />} />
        <Route path="/library" element={token ? <Library /> : <Navigate to="/login" />} />
        <Route path="/library/create" element={token ? <CreateLibraryItem /> : <Navigate to="/login" />} />
        <Route path="/library/:id" element={token ? <LibraryDetail /> : <Navigate to="/login" />} />
        <Route path="/challenges" element={token ? <Challenges /> : <Navigate to="/login" />} />
        <Route path="/challenges/create" element={token ? <CreateChallenge /> : <Navigate to="/login" />} />
        <Route path="/reading-plans" element={token ? <ReadingPlans /> : <Navigate to="/login" />} />
        <Route path="/reading-plans/create" element={token ? <CreateReadingPlan /> : <Navigate to="/login" />} />
        <Route path="/reading-plans/:id" element={token ? <ReadingPlanDetail /> : <Navigate to="/login" />} />
        <Route path="/events" element={token ? <Events /> : <Navigate to="/login" />} />
        <Route path="/events/create" element={token ? <CreateEvent /> : <Navigate to="/login" />} />
        <Route path="/ia" element={token ? <Ia /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={token ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />

        {/* ✅ Routes réservées au Super Admin */}
        <Route path="/admin" element={token && isSuperAdmin ? <Admin /> : <Navigate to="/dashboard" />} />
        <Route path="/stats" element={token && isSuperAdmin ? <StatsAdmin /> : <Navigate to="/dashboard" />} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/chat/:id" element={token ? <ChatDetail /> : <Navigate to="/login" />} />
        <Route path="/chat/new" element={token ? <NewChat /> : <Navigate to="/login" />} />
        

// ...
<Route path="/challenges/create" element={<CreateChallenge />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;