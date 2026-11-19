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

function ProtectedAppLayout({
  profile,
  setProfile,
  ranking,
  setRanking,
  careerMatches,
  setCareerMatches,
  selectedCareerId,
  setSelectedCareerId,
  gaps,
  setGaps,
  roadmap,
  setRoadmap,
}: {
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
}) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2563eb', fontWeight: 600 }}>Loading CareerAI...</div>
      </div>
    );
  }

  // Mandatory Authentication
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mandatory Onboarding: user must have completed onboarding before dashboard
  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-layout">
      <SkipToContent />
      <Sidebar />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Header userName={profile.full_name ? profile.full_name.split(' ')[0] : undefined} />
        <div className="page-content">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  profile={profile}
                  ranking={ranking}
                  setRanking={setRanking}
                  careerMatches={careerMatches}
                  setCareerMatches={setCareerMatches}
                />
              }
            />
            <Route
              path="/rank"
              element={<Rank profile={profile} ranking={ranking} setRanking={setRanking} />}
            />
            <Route
              path="/skills"
              element={<Skills profile={profile} setProfile={setProfile} />}
            />
            <Route
              path="/careers"
              element={
                <Careers
                  profile={profile}
                  careerMatches={careerMatches}
                  setCareerMatches={setCareerMatches}
                  setSelectedCareerId={setSelectedCareerId}
                  setGaps={setGaps}
                />
              }
            />
            <Route
              path="/roadmap"
              element={
                <Roadmap
                  profile={profile}
                  selectedCareerId={selectedCareerId}
                  gaps={gaps}
                  setGaps={setGaps}
                  roadmap={roadmap}
                  setRoadmap={setRoadmap}
                  careerMatches={careerMatches}
                  setSelectedCareerId={setSelectedCareerId}
                />
              }
            />
            <Route
              path="/coach"
              element={
                <Coach
                  profile={profile}
                  selectedCareerId={selectedCareerId}
                  ranking={ranking}
                  careerMatches={careerMatches}
                />
              }
            />
            <Route
              path="/profile"
              element={<Profile profile={profile} setProfile={setProfile} />}
            />
            <Route
              path="*"
              element={
                <Dashboard
                  profile={profile}
                  ranking={ranking}
                  setRanking={setRanking}
                  careerMatches={careerMatches}
                  setCareerMatches={setCareerMatches}
                />
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function MainApp() {
  const { currentUser, getUserProfile } = useAuth();

  // Blank initial state - no hardcoded Alex Rivera!
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [careerMatches, setCareerMatches] = useState<CareerMatchesResponse | null>(null);
  const [selectedCareerId, setSelectedCareerId] = useState<string>('e0000001-0000-0000-0000-000000000001');
  const [gaps, setGaps] = useState<GapsResponse | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);

  // Restore saved profile when user is authenticated
  useEffect(() => {
    if (currentUser) {
      const saved = getUserProfile();
      if (saved) {
        setProfile(saved);
        // Load live rankings and career matches for this profile
        if (saved.id) {
          Promise.all([
            getRanking(saved.id).catch(() => null),
            getCareerMatches(saved.id).catch(() => null),
          ]).then(([r, m]) => {
            if (r) setRanking(r);
            if (m) setCareerMatches(m);
          });
        }
      } else {
        setProfile(null);
        setRanking(null);
        setCareerMatches(null);
      }
    } else {
      setProfile(null);
      setRanking(null);
      setCareerMatches(null);
    }
  }, [currentUser]);

  return (
    <>
      <SkipToContent />
      <Routes>
        {/* 1. First page on visit is Landing (as requested) */}
        <Route path="/" element={<Landing />} />

        {/* 2. Auth Routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        {/* 3. Mandatory Onboarding: user uploads resume/url/form */}
        <Route
          path="/onboarding"
          element={<Onboarding setProfile={setProfile} />}
        />

        {/* 4. Protected Core Application Routes */}
        <Route
          path="/*"
          element={
            <ProtectedAppLayout
              profile={profile}
              setProfile={setProfile}
              ranking={ranking}
              setRanking={setRanking}
              careerMatches={careerMatches}
              setCareerMatches={setCareerMatches}
              selectedCareerId={selectedCareerId}
              setSelectedCareerId={setSelectedCareerId}
              gaps={gaps}
              setGaps={setGaps}
              roadmap={roadmap}
              setRoadmap={setRoadmap}
            />
          }
        />
      </Routes>
      <EvaluatorTelemetryBar />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}
