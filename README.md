# Threadline — Omnichannel Support Inbox

A multi-tenant customer messaging frontend (WhatsApp, Instagram, Messenger, TikTok) built with React, Redux Toolkit, React Router, Axios, and Centrifuge for realtime updates.

The UI is fully explorable right now with realistic mock data — no backend required. Swapping in the real API is a one-line env change.

## Stack

- React 18, JavaScript (no TypeScript)
- Redux Toolkit for global state
- React Router DOM for routing
- Axios for HTTP, with a JWT interceptor and automatic 401 handling
- Centrifuge for realtime messaging/presence
- Tailwind CSS, Lucide icons
- Vite

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs against an in-memory mock backend by default (`VITE_USE_MOCK_API=true`), so `npm run dev` gives you a fully working inbox immediately — any email/password signs you in.

## Connecting the real backend

1. Set `VITE_API_URL` and `VITE_CENTRIFUGE_URL` in `.env`.
2. Set `VITE_USE_MOCK_API=false`.
3. Each file in `src/services/*Api.js` already has the real `axios` call written next to its mock counterpart — nothing else needs to change structurally. Adjust request/response field mapping there if your backend's shape differs from the conceptual shapes in the build brief.

## Project structure

```
src/
  app/store.js              Redux store composition
  features/                 One slice per domain (auth, tenant, interactions,
                             messages, channels, agents, contacts, ui, analytics)
  services/                 Axios instance + one API module per domain,
                             each with a real call and a mock fallback
  mocks/                    In-memory mock dataset + mock API implementation
  components/
    layout/                 AppLayout, Sidebar, MobileSidebar, Header
    inbox/                  ConversationList, ConversationHeader, MessageList,
                             MessageBubble, MessageComposer, CustomerDetails, ...
    common/                 Avatar, Badge, Button, Modal, Dropdown, Loader, ...
  pages/                    Login, Inbox, Contacts, Channels, Agents,
                             Analytics, Settings
  routes/                   ProtectedRoute
  hooks/                    useAuth, useCentrifugeSubscription, useDebounce,
                             useMediaQuery, useThemeEffect, useClickOutside
  utils/                    constants, formatters, resetOnLogout
```

## Multi-tenant & security notes

- Tenant identity always comes from the authenticated session (the login response's `tenant` object), never from a route or query parameter. There is no `/tenant/:tenantId/...` route.
- `services/centrifuge.js` only exposes `subscribeToTenantChannel(suffix, ...)`, which always builds the channel name from the tenant id the service connected with (`tenant:{tenantId}:{suffix}`). There is no way to pass an arbitrary channel name in from a component.
- On logout (or a 401 from the API), every tenant-scoped Redux slice resets to its initial state via a shared `auth/logout` / `auth/sessionExpired` matcher (see `utils/resetOnLogout.js`), and the Centrifuge connection is torn down. Nothing from one session can leak into the next login on the same tab.
- Route guarding for admin-only screens (Agents, Channels) is done both in navigation (hidden from Sidebar for non-admins) and at the page level (`Navigate` redirect if a non-admin somehow lands there).

## Realtime flow

```
Centrifuge event → services/centrifuge.js → useCentrifugeSubscription handler
  → Redux action (messagesSlice / interactionsSlice / agentsSlice)
  → Redux state → React UI
```

Components never talk to Centrifuge directly — `useCentrifugeSubscription` (mounted once in `AppLayout`) is the single place realtime events are translated into Redux actions.

## Theming

Light and dark mode are both implemented (`ui.theme` in Redux, persisted to `localStorage`, toggled from the header). The sidebar and login screen use a fixed dark navy regardless of theme, matching the product's visual identity; the rest of the app switches between light and dark via Tailwind's `dark:` class strategy.

## What's intentionally out of scope

- OAuth channel connection flows (Channels page has clean placeholder actions for the backend to hook into)
- Real file uploads (attachments use local object URLs until wired to a real upload endpoint)
- Message pagination/infinite scroll (each conversation loads its full mock history; add cursor-based pagination in `messageApi.list` and `messagesSlice` when the backend supports it)
