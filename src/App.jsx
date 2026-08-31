import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute              from './routes/ProtectedRoute'
import RoleRoute                   from './routes/RoleRoute'
import DefaultRedirect              from './routes/DefaultRedirect'
import AppLayout                   from './components/layout/AppLayout'
import Login                       from './pages/Login'
import Inbox                       from './pages/Inbox'
import Contacts                    from './pages/Contacts'
import Channels                    from './pages/Channels'
import Agents                      from './pages/Agents'
import Analytics                   from './pages/Analytics'
import Settings          from './pages/Settings'
import Templates   from './pages/Templates.jsx';
import FlowsList from './components/flowBuilder/FlowsList.jsx';
import FlowBuilder from './components/flowBuilder/FlowBuilder.jsx';
import Tags from './pages/Tags.jsx';
import TagForm from './pages/TagForm.jsx';
import Queues from './pages/Queues.jsx';
import QueueForm from './pages/QueueForm.jsx';
import Groups from './pages/Groups.jsx';
import GroupForm from './pages/GroupForm.jsx';
import Teams from './pages/Teams.jsx';
import TeamForm from './pages/TeamForm.jsx';
import ManageAgents from './pages/ManageAgents.jsx';
import AgentForm from './pages/AgentForm.jsx';
import WhatsAppChannel from './pages/WhatsAppChannel.jsx';
import QuickReplies from './pages/QuickReplies.jsx';
import QuickReplyForm from './pages/QuickReplyForm.jsx';
import BreakTypes from './pages/BreakTypes.jsx';
import BreakTypeForm from './pages/BreakTypeForm.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DefaultRedirect />} />
        <Route
          path="inbox"
          element={
            <RoleRoute allow={['AGENT']}>
              <Inbox />
            </RoleRoute>
          }
        />
        <Route path="contacts" element={<Contacts />} />
        <Route
          path="channels"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Channels />
            </RoleRoute>
          }
        />
        <Route
          path="channels/whatsapp"
          element={
            <RoleRoute allow={['ADMIN']}>
              <WhatsAppChannel />
            </RoleRoute>
          }
        />
        <Route
          path="agents"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Agents />
            </RoleRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
        <Route
          path="templates"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Templates />
            </RoleRoute>
          }
        />

        <Route
          path="flows"
          element={
            <RoleRoute allow={['ADMIN']}>
              <FlowsList />
            </RoleRoute>
          }
        />
        {/*<Route path="flows/new" element={<FlowBuilder />} />*/}
        <Route
          path="flows/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <FlowBuilder />
            </RoleRoute>
          }
        />

        {/* Admin — tag/team/queue/group/agent management. Kept under
         /app/admin/* so it never collides with /app/agents, which is the
         existing page for the logged-in agent's own workspace view.
         Create/edit are dedicated pages, not modals — there's too much
         to fill in (searchable agent/queue/team/group pickers) for a
         popup to stay comfortable.
         Every route below is wrapped in RoleRoute allow={['ADMIN']} —
         the sidebar already hides these from agents, but that's only a
         display filter; without this guard an agent could still reach
         them by typing the URL directly. */}
        <Route
          path="admin/tags"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Tags />
            </RoleRoute>
          }
        />
        <Route
          path="admin/tags/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <TagForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/tags/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <TagForm />
            </RoleRoute>
          }
        />

        <Route
          path="admin/queues"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Queues />
            </RoleRoute>
          }
        />
        <Route
          path="admin/queues/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <QueueForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/queues/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <QueueForm />
            </RoleRoute>
          }
        />

        <Route
          path="admin/groups"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Groups />
            </RoleRoute>
          }
        />
        <Route
          path="admin/groups/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <GroupForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/groups/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <GroupForm />
            </RoleRoute>
          }
        />

        <Route
          path="admin/teams"
          element={
            <RoleRoute allow={['ADMIN']}>
              <Teams />
            </RoleRoute>
          }
        />
        <Route
          path="admin/teams/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <TeamForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/teams/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <TeamForm />
            </RoleRoute>
          }
        />

        <Route
          path="admin/agents"
          element={
            <RoleRoute allow={['ADMIN']}>
              <ManageAgents />
            </RoleRoute>
          }
        />
        <Route
          path="admin/agents/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <AgentForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/agents/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <AgentForm />
            </RoleRoute>
          }
        />

        <Route
          path="admin/quick-replies"
          element={
            <RoleRoute allow={['ADMIN']}>
              <QuickReplies />
            </RoleRoute>
          }
        />
        <Route
          path="admin/quick-replies/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <QuickReplyForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/quick-replies/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <QuickReplyForm />
            </RoleRoute>
          }
        />

        <Route
          path="admin/break-types"
          element={
            <RoleRoute allow={['ADMIN']}>
              <BreakTypes />
            </RoleRoute>
          }
        />
        <Route
          path="admin/break-types/new"
          element={
            <RoleRoute allow={['ADMIN']}>
              <BreakTypeForm />
            </RoleRoute>
          }
        />
        <Route
          path="admin/break-types/:id"
          element={
            <RoleRoute allow={['ADMIN']}>
              <BreakTypeForm />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}