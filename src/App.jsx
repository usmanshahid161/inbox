import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute              from './routes/ProtectedRoute'
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
        <Route path="inbox" element={<Inbox />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="channels" element={<Channels />} />
        <Route path="channels/whatsapp" element={<WhatsAppChannel />} />
        <Route path="agents" element={<Agents />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="templates" element={<Templates />} />

        <Route path="flows" element={<FlowsList />} />
        {/*<Route path="flows/new" element={<FlowBuilder />} />*/}
        <Route path="flows/:id" element={<FlowBuilder />} />

        {/* Admin — tag/team/queue/group/agent management. Kept under
            /app/admin/* so it never collides with /app/agents, which is the
            existing page for the logged-in agent's own workspace view.
            Create/edit are dedicated pages, not modals — there's too much
            to fill in (searchable agent/queue/team/group pickers) for a
            popup to stay comfortable. */}
        <Route path="admin/tags" element={<Tags />} />
        <Route path="admin/tags/new" element={<TagForm />} />
        <Route path="admin/tags/:id" element={<TagForm />} />

        <Route path="admin/queues" element={<Queues />} />
        <Route path="admin/queues/new" element={<QueueForm />} />
        <Route path="admin/queues/:id" element={<QueueForm />} />

        <Route path="admin/groups" element={<Groups />} />
        <Route path="admin/groups/new" element={<GroupForm />} />
        <Route path="admin/groups/:id" element={<GroupForm />} />

        <Route path="admin/teams" element={<Teams />} />
        <Route path="admin/teams/new" element={<TeamForm />} />
        <Route path="admin/teams/:id" element={<TeamForm />} />

        <Route path="admin/agents" element={<ManageAgents />} />
        <Route path="admin/agents/new" element={<AgentForm />} />
        <Route path="admin/agents/:id" element={<AgentForm />} />

        <Route path="admin/quick-replies" element={<QuickReplies />} />
        <Route path="admin/quick-replies/new" element={<QuickReplyForm />} />
        <Route path="admin/quick-replies/:id" element={<QuickReplyForm />} />

        <Route path="admin/break-types" element={<BreakTypes />} />
        <Route path="admin/break-types/new" element={<BreakTypeForm />} />
        <Route path="admin/break-types/:id" element={<BreakTypeForm />} />
      </Route>

      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}