// src/components/flowbuilder/flowConstants.js
import {
  Play, MessageSquare, ListChecks, List, HelpCircle,
  GitBranch, Webhook, UserCheck, Clock, Flag
} from 'lucide-react'

// One source of truth per node type: icon, accent color, label, description
// shown in the palette, and the default `data` a freshly-dropped node gets.
export const NODE_TYPES_META = {
  start: {
    label: 'Start',
    description: 'Where the flow begins',
    icon: Play,
    color: 'emerald',
    defaultData: { label: 'Start' },
  },
  message: {
    label: 'Message',
    description: 'Send a text message',
    icon: MessageSquare,
    color: 'sky',
    defaultData: { label: 'Message', text: 'Type your message...' },
  },
  buttons: {
    label: 'Buttons',
    description: 'Offer quick-reply options',
    icon: ListChecks,
    color: 'violet',
    defaultData: { label: 'Buttons', text: 'Choose an option:', buttons: ['Option 1', 'Option 2'] },
  },
  list: {
    label: 'List',
    description: 'Show a list menu',
    icon: List,
    color: 'indigo',
    defaultData: { label: 'List', text: 'Select from the list:', items: ['Item 1', 'Item 2', 'Item 3'] },
  },
  question: {
    label: 'Question',
    description: 'Ask and capture a reply',
    icon: HelpCircle,
    color: 'amber',
    defaultData: { label: 'Question', question: 'What is your question?', variable: 'answer' },
  },
  condition: {
    label: 'Condition',
    description: 'Branch based on a variable',
    icon: GitBranch,
    color: 'orange',
    defaultData: { label: 'Condition', variable: 'variableName', operator: 'equals', value: '' },
  },
  api: {
    label: 'API',
    description: 'Call an external API',
    icon: Webhook,
    color: 'teal',
    defaultData: { label: 'API Call', method: 'GET', url: 'https://api.example.com/...' },
  },
  agent: {
    label: 'Assign Agent',
    description: 'Hand off to a live agent',
    icon: UserCheck,
    color: 'rose',
    defaultData: { label: 'Assign Agent', team: 'Support Team', assignment: 'Automatic' },
  },
  delay: {
    label: 'Delay',
    description: 'Pause before continuing',
    icon: Clock,
    color: 'slate',
    defaultData: { label: 'Delay', seconds: 3 },
  },
  end: {
    label: 'End',
    description: 'Terminate the flow',
    icon: Flag,
    color: 'ink',
    defaultData: { label: 'End' },
  },
}

export const PALETTE_ORDER = ['start', 'message', 'buttons', 'list', 'question', 'condition', 'api', 'agent', 'delay', 'end']

// Tailwind color classes per accent — icon chip background/text + selection ring.
// Kept centralized so every node/badge uses the exact same swatch.
export const COLOR_CLASSES = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500' },
  slate: { bg: 'bg-ink-100 dark:bg-navy-800', text: 'text-ink-600 dark:text-ink-300', ring: 'ring-ink-400' },
  ink: { bg: 'bg-ink-800 dark:bg-navy-700', text: 'text-white', ring: 'ring-ink-600' },
}

// ---------------------------------------------------------------------
// Mock initial flow — matches the example in the brief:
// START -> Welcome -> Menu -> (Sales -> Ask Name -> Ask Product -> End)
//                           -> (Support -> Ask Issue -> End)
//                           -> (Talk to Agent -> Agent Handoff)
// ---------------------------------------------------------------------
export const INITIAL_NODES = [
  { id: 'start', type: 'start', position: { x: 400, y: 40 }, data: { label: 'Start' } },
  { id: 'welcome', type: 'message', position: { x: 360, y: 160 }, data: { label: 'Welcome Message', text: 'Welcome to ABC Support 👋' } },
  { id: 'menu', type: 'buttons', position: { x: 340, y: 300 }, data: { label: 'Main Menu', text: 'How can we help you today?', buttons: ['Sales', 'Support', 'Talk to Agent'] } },

  { id: 'ask_name', type: 'question', position: { x: 40, y: 460 }, data: { label: 'Ask Name', question: 'What is your name?', variable: 'customerName' } },
  { id: 'ask_product', type: 'question', position: { x: 40, y: 600 }, data: { label: 'Ask Product', question: 'Which product are you interested in?', variable: 'productInterest' } },
  { id: 'end_sales', type: 'end', position: { x: 40, y: 740 }, data: { label: 'End' } },

  { id: 'ask_issue', type: 'question', position: { x: 400, y: 460 }, data: { label: 'Ask Issue', question: 'Please describe your issue.', variable: 'issueDescription' } },
  { id: 'end_support', type: 'end', position: { x: 400, y: 600 }, data: { label: 'End' } },

  { id: 'agent_handoff', type: 'agent', position: { x: 720, y: 460 }, data: { label: 'Agent Handoff', team: 'Support Team', assignment: 'Automatic' } },
]

export const INITIAL_EDGES = [
  { id: 'e-start-welcome', source: 'start', target: 'welcome' },
  { id: 'e-welcome-menu', source: 'welcome', target: 'menu' },

  { id: 'e-menu-sales', source: 'menu', sourceHandle: 'button-0', target: 'ask_name', label: 'Sales' },
  { id: 'e-name-product', source: 'ask_name', target: 'ask_product' },
  { id: 'e-product-end', source: 'ask_product', target: 'end_sales' },

  { id: 'e-menu-support', source: 'menu', sourceHandle: 'button-1', target: 'ask_issue', label: 'Support' },
  { id: 'e-issue-end', source: 'ask_issue', target: 'end_support' },

  { id: 'e-menu-agent', source: 'menu', sourceHandle: 'button-2', target: 'agent_handoff', label: 'Talk to Agent' },
]