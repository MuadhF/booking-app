import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import App from './App';
import ContactPage from './components/ContactPage';
import VenuesPage from './components/VenuesPage';
import VenueLogin from './components/VenueLogin';
import VenueDashboard from './components/VenueDashboard';
import PlayerLogin from './components/PlayerLogin';
import PlayerProfile from './components/PlayerProfile';
import PasswordReset from './components/PasswordReset';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQs from './components/FAQs';
import CancellationPolicy from './components/CancellationPolicy';
import Header from './components/Header';
import Footer from './components/Footer';
import { playerAuthApi } from './lib/supabase';

function PageLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await playerAuthApi.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error checking auth:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await playerAuthApi.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onSignOut={handleSignOut} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function VenueDashboardWrapper() {
  const navigate = useNavigate();
  const [venueSession, setVenueSession] = useState<{venueId: string, venueName: string} | null>(() => {
    const saved = sessionStorage.getItem('venueSession');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!venueSession) {
      navigate('/venue-login');
    }
  }, [venueSession, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('venueSession');
    setVenueSession(null);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (page: string) => {
    const pageMap: {[key: string]: string} = {
      'home': '/',
      'contact': '/contact',
      'venues': '/venues',
      'terms': '/terms',
      'privacy': '/privacy',
      'faqs': '/faqs',
      'cancellation': '/cancellation-policy',
      'venue-portal': '/venue-login',
      'login': '/login'
    };
    const path = pageMap[page] || '/';
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!venueSession) {
    return null;
  }

  return (
    <VenueDashboard
      venueId={venueSession.venueId}
      venueName={venueSession.venueName}
      onLogout={handleLogout}
      onPageChange={handlePageChange}
    />
  );
}

function VenueLoginWrapper() {
  const navigate = useNavigate();

  const handleLogin = (venueId: string, venueName: string) => {
    const session = { venueId, venueName };
    sessionStorage.setItem('venueSession', JSON.stringify(session));
    navigate('/venue-dashboard');
  };

  return (
    <PageLayout>
      <VenueLogin onLogin={handleLogin} />
    </PageLayout>
  );
}

export default function AppRouter() {
  const [user, setUser] = useState<any>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await playerAuthApi.getCurrentUser();
      setUser(currentUser);

      if (currentUser?.id) {
        try {
          const profile = await playerAuthApi.getProfile(currentUser.id);
          setPlayerProfile(profile);
        } catch (err) {
          console.error('Error fetching player profile:', err);
          setPlayerProfile(null);
        }
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/contact" element={<PageLayout><ContactPage /></PageLayout>} />
        <Route path="/venues" element={<PageLayout><VenuesPage /></PageLayout>} />
        <Route path="/venue-login" element={<VenueLoginWrapper />} />
        <Route path="/venue-dashboard" element={<VenueDashboardWrapper />} />
        <Route path="/login" element={<PageLayout><PlayerLogin onLogin={checkAuthState} /></PageLayout>} />
        <Route
          path="/profile"
          element={
            user ? (
              <PageLayout>
                <PlayerProfile user={user} playerProfile={playerProfile} onSignOut={checkAuthState} />
              </PageLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/reset-password" element={<PageLayout><PasswordReset /></PageLayout>} />
        <Route path="/terms" element={<PageLayout><TermsAndConditions /></PageLayout>} />
        <Route path="/privacy" element={<PageLayout><PrivacyPolicy /></PageLayout>} />
        <Route path="/faqs" element={<PageLayout><FAQs /></PageLayout>} />
        <Route path="/cancellation-policy" element={<PageLayout><CancellationPolicy /></PageLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
