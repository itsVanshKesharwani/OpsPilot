import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { usePoll } from './hooks'
import { api } from './api'
import { ToastProvider } from './components/ui'

import Overview from './pages/Overview'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import Agents from './pages/Agents'
import WarRoom from './pages/WarRoom'
import Tasks from './pages/Tasks'
import Approvals from './pages/Approvals'
import Analytics from './pages/Analytics'

export default function App() {
  const { data: stats, refresh } = usePoll(api.stats, 3000)
  const location = useLocation()

  return (
    <ToastProvider>
      <div className="min-h-screen grid-bg">
        <Sidebar
          pending={stats?.pending_approvals ?? 0}
          active={stats?.active_incidents ?? 0}
        />
        <div className="pl-4 md:pl-[236px]">
          <Topbar pending={stats?.pending_approvals ?? 0} onSimulated={refresh} />
          <main className="px-6 py-6 max-w-[1500px] mx-auto">
            <Routes location={location}>
              <Route path="/" element={<Overview stats={stats} />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/war-room" element={<WarRoom />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}