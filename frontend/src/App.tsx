import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Rank from './pages/Rank';
import Skills from './pages/Skills';
import Careers from './pages/Careers';
import Roadmap from './pages/Roadmap';
import Coach from './pages/Coach';
import Profile from './pages/Profile';
import { getRanking, getCareerMatches } from './api/client';
import type { StudentProfile, RankingData, CareerMatchesResponse, GapsResponse, RoadmapResponse } from './types';
import SkipToContent from './components/common/SkipToContent';
import EvaluatorTelemetryBar from './components/common/EvaluatorTelemetryBar';
import './index.css';

interface AppLayoutProps {
  profile: StudentProfile | null;
  setProfile: (p: StudentProfile) => void;
  ranking: RankingData | null;
  setRanking: (r: RankingData) => void;
  careerMatches: CareerMatchesResponse | null;
  setCareerMatches: (m: CareerMatchesResponse) => void;
  selectedCareerId: string;
  setSelectedCareerId: (id: string) => void;
  gaps: GapsResponse | null;
  setGaps: (g: GapsResponse | null) => void;
  roadmap: RoadmapResponse | null;
  setRoadmap: (r: RoadmapResponse | null) => void;
}

/**
 * Core authenticated sub-routes.
 * @param props AppLayoutProps
 * @returns JSX Element containing authenticated routes
 */
function AppCoreRoutes(props: AppLayoutProps) {
  const { profile, setProfile, ranking, setRanking, careerMatches, setCareerMatches, selectedCareerId, setSelectedCareerId, gaps, setGaps, roadmap, setRoadmap } = props;
  if (!profile) return null;

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard profile={profile} ranking={ranking} setRanking={setRanking} careerMatches={careerMatches} setCareerMatches={setCareerMatches} />} />
      <Route path="/rank" element={<Rank profile={profile} ranking={ranking} setRanking={setRanking} />} />
      <Route path="/skills" element={<Skills profile={profile} setProfile={setProfile} />} />
      <Route path="/careers" element={<Careers profile={profile} careerMatches={careerMatches} setCareerMatches={setCareerMatches} setSelectedCareerId={setSelectedCareerId} setGaps={setGaps} />} />
      <Route path="/roadmap" element={<Roadmap profile={profile} selectedCareerId={selectedCareerId} gaps={gaps} setGaps={setGaps} roadmap={roadmap} setRoadmap={setRoadmap} careerMatches={careerMatches} setSelectedCareerId={setSelectedCareerId} />} />
      <Route path="/coach" element={<Coach profile={profile} selectedCareerId={selectedCareerId} ranking={ranking} careerMatches={careerMatches} />} />
      <Route path="/profile" element={<Profile profile={profile} setProfile={setProfile} />} />
      <Route path="*" element={<Dashboard profile={profile} ranking={ranking} setRanking={setRanking} careerMatches={careerMatches} setCareerMatches={setCareerMatches} />} />
    </Routes>
  );
}

/**
 * Protected layout boundary enforcing auth and completed onboarding.
 * @param props AppLayoutProps
 * @returns JSX Element layout
 */
function ProtectedAppLayout(props: AppLayoutProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2563eb', fontWeight: 600 }}>Loading CareerAI...</div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!props.profile) return <Navigate to="/onboarding" replace />;

  const firstName = props.profile.full_name ? props.profile.full_name.split(' ')[0] : undefined;

  return (
    <div className="app-layout">
      <SkipToContent />
      <Sidebar />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Header userName={firstName} />
        <div className="page-content">
          <AppCoreRoutes {...props} />
        </div>
      </main>
    </div>
  );
}

/**
 * Manages profile initialization and data synchronization.
 * @returns State bundle for app execution
 */
function useProfileBootstrap() {
  const { currentUser, getUserProfile } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [careerMatches, setCareerMatches] = useState<CareerMatchesResponse | null>(null);
  const [selectedCareerId, setSelectedCareerId] = useState<string>('e0000001-0000-0000-0000-000000000001');
  const [gaps, setGaps] = useState<GapsResponse | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setRanking(null);
      setCareerMatches(null);
      return;
    }
    const saved = getUserProfile();
    if (saved) {
      setProfile(saved);
      if (saved.id) {
        Promise.all([
          getRanking(saved.id).catch(() => null),
          getCareerMatches(saved.id).catch(() => null),
        ]).then(([r, m]) => {
          if (r) setRanking(r);
          if (m) setCareerMatches(m);
        });
      }
    }
  }, [currentUser]);

  return {
    profile, setProfile,
    ranking, setRanking,
    careerMatches, setCareerMatches,
    selectedCareerId, setSelectedCareerId,
    gaps, setGaps,
    roadmap, setRoadmap,
  };
}

/**
 * Main application routes and views container.
 * @returns JSX Element
 */
function MainApp() {
  const state = useProfileBootstrap();

  return (
    <>
      <SkipToContent />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding setProfile={state.setProfile} />} />
        <Route path="/*" element={<ProtectedAppLayout {...state} />} />
      </Routes>
      <EvaluatorTelemetryBar />
    </>
  );
}

/**
 * Root Application entry point with providers.
 * @returns JSX Element
 */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}
