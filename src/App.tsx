import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { PWAUpdatePrompt } from '@/components/ui/PWAUpdatePrompt'
import { AppLayout } from '@/components/layout/AppLayout'
import { PinGate } from '@/components/layout/PinGate'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

// Pages
import { DashboardPage } from '@/pages/DashboardPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { JournalPage } from '@/pages/JournalPage'
import { HabitsPage } from '@/pages/HabitsPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'

function AppRoutes() {
  const { isAuthenticated, isLoading, hasSetup } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <PinGate isSetup={hasSetup} />

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<ItemDetailPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <OfflineBanner />
          <AppRoutes />
          <ToastContainer />
          <PWAUpdatePrompt />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
