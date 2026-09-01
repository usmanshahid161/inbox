import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import tenantReducer from '../features/tenant/tenantSlice'
import interactionsReducer from '../features/interactions/interactionsSlice'
import messagesReducer from '../features/messages/messagesSlice'
import channelsReducer from '../features/channels/channelsSlice'
import agentsReducer from '../features/agents/agentsSlice'
import contactsReducer from '../features/contacts/contactsSlice'
import uiReducer from '../features/ui/uiSlice'
import analyticsReducer from '../features/analytics/analyticsSlice'
import { injectStore } from '../services/api'
import { createLogger } from 'redux-logger'
import templatesSlice   from '../features/templates/templatesSlice';
import flowsReducer from '../features/flows/flowsSlice'
import tagsReducer from '../features/tags/tagsSlice'
import queuesReducer from '../features/queues/queuesSlice'
import groupsReducer from '../features/groups/groupsSlice'
import teamsReducer from '../features/teams/teamsSlice'
import manageAgentsReducer from '../features/manageAgents/manageAgentsSlice'
import whatsappNumbersReducer from '../features/whatsappChannel/whatsappNumbersSlice'
import quickRepliesReducer from '../features/quickReplies/quickRepliesSlice'
import breakTypesReducer from '../features/breakTypes/breakTypesSlice'
import presenceReducer from '../features/presence/presenceSlice'
import interactionRequestsReducer from '../features/interactionRequests/interactionRequestsSlice'

const logger = createLogger({
  collapsed: true,
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    interactions: interactionsReducer,
    messages: messagesReducer,
    channels: channelsReducer,
    agents: agentsReducer,
    contacts: contactsReducer,
    ui: uiReducer,
    analytics: analyticsReducer,
    templates: templatesSlice,
    flows: flowsReducer,
    tags: tagsReducer,
    queues: queuesReducer,
    groups: groupsReducer,
    teams: teamsReducer,
    manageAgents: manageAgentsReducer,
    whatsappNumbers: whatsappNumbersReducer,
    quickReplies: quickRepliesReducer,
    breakTypes: breakTypesReducer,
    presence: presenceReducer,
    interactionRequests: interactionRequestsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger),
})

// Lets the axios instance read the current token and dispatch on 401
// without creating a circular import between the store and services/api.js.
injectStore(store)

export default store