// src/components/flowbuilder/FlowTestPanel.jsx
import { useState, useEffect, useRef } from 'react'
import { X, RotateCcw, Bot, User } from 'lucide-react'

// Finds the single node of type 'start', and helpers to walk the graph.
function findStartNode(nodes) {
  return nodes.find((n) => n.type === 'start')
}
function findNode(nodes, id) {
  return nodes.find((n) => n.id === id)
}
function outgoingEdges(edges, nodeId) {
  return edges.filter((e) => e.source === nodeId)
}

function evaluateCondition(variables, { variable, operator, value }) {
  const actual = variables[variable]
  if (actual === undefined) return false
  switch (operator) {
    case 'equals': return String(actual) === String(value)
    case 'not_equals': return String(actual) !== String(value)
    case 'contains': return String(actual).includes(String(value))
    case 'greater_than': return Number(actual) > Number(value)
    case 'less_than': return Number(actual) < Number(value)
    default: return false
  }
}

export default function FlowTestPanel({ nodes, edges, onClose }) {
  const [transcript, setTranscript] = useState([]) // { from: 'bot'|'user'|'system', text }
  const [currentNodeId, setCurrentNodeId] = useState(null)
  const [variables, setVariables] = useState({})
  const [awaitingInput, setAwaitingInput] = useState(null) // { type: 'text'|'buttons', options? }
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef(null)

  const pushMessage = (from, text) => setTranscript((prev) => [...prev, { from, text, id: Date.now() + Math.random() }])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript, awaitingInput])

  const restart = () => {
    setTranscript([])
    setVariables({})
    setAwaitingInput(null)
    setInputValue('')
    const start = findStartNode(nodes)
    if (!start) {
      pushMessage('system', 'No Start node found in this flow.')
      return
    }
    pushMessage('system', '— Flow started —')
    advance(start.id)
  }

  useEffect(() => {
    restart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Moves execution to nodeId, rendering it, and continues automatically
  // unless the node type requires user input (buttons/question).
  const advance = (nodeId, varsOverride) => {
    const node = findNode(nodes, nodeId)
    if (!node) {
      pushMessage('system', 'Flow ended (dead end — no node found).')
      setCurrentNodeId(null)
      return
    }
    setCurrentNodeId(nodeId)
    const vars = varsOverride || variables

    switch (node.type) {
      case 'start': {
        const next = outgoingEdges(edges, nodeId)[0]
        if (next) advance(next.target, vars)
        break
      }
      case 'message': {
        pushMessage('bot', fillVars(node.data.text, vars))
        const next = outgoingEdges(edges, nodeId)[0]
        if (next) setTimeout(() => advance(next.target, vars), 300)
        else finishFlow()
        break
      }
      case 'list': {
        pushMessage('bot', fillVars(node.data.text, vars))
        pushMessage('bot', (node.data.items || []).map((it, i) => `${i + 1}. ${it}`).join('\n'))
        const next = outgoingEdges(edges, nodeId)[0]
        if (next) setTimeout(() => advance(next.target, vars), 300)
        else finishFlow()
        break
      }
      case 'buttons': {
        pushMessage('bot', fillVars(node.data.text, vars))
        const outs = outgoingEdges(edges, nodeId)
        const options = (node.data.buttons || []).map((label, i) => {
          const edge = outs.find((e) => e.sourceHandle === `button-${i}`)
          return { label, targetId: edge?.target }
        })
        setAwaitingInput({ type: 'buttons', options })
        break
      }
      case 'question': {
        pushMessage('bot', node.data.question)
        setAwaitingInput({ type: 'text', variable: node.data.variable, nodeId })
        break
      }
      case 'condition': {
        const result = evaluateCondition(vars, node.data)
        pushMessage('system', `Condition "${node.data.variable} ${node.data.operator} ${node.data.value}" → ${result ? 'TRUE' : 'FALSE'}`)
        const outs = outgoingEdges(edges, nodeId)
        const edge = outs.find((e) => e.sourceHandle === (result ? 'true' : 'false'))
        if (edge) setTimeout(() => advance(edge.target, vars), 300)
        else finishFlow('No branch configured for this outcome.')
        break
      }
      case 'api': {
        pushMessage('system', `Calling ${node.data.method || 'GET'} ${node.data.url} (simulated — no real request made)`)
        const next = outgoingEdges(edges, nodeId)[0]
        if (next) setTimeout(() => advance(next.target, vars), 500)
        else finishFlow()
        break
      }
      case 'delay': {
        pushMessage('system', `Waiting ${node.data.seconds ?? 3}s...`)
        const next = outgoingEdges(edges, nodeId)[0]
        setTimeout(() => {
          if (next) advance(next.target, vars)
          else finishFlow()
        }, Math.min((node.data.seconds ?? 3) * 1000, 3000)) // capped for testing convenience
        break
      }
      case 'agent': {
        pushMessage('bot', `You're being connected to ${node.data.team || 'a live agent'}...`)
        pushMessage('system', `— Handed off (${node.data.assignment || 'Automatic'}) —`)
        setCurrentNodeId(null)
        break
      }
      case 'end': {
        pushMessage('system', '— End of flow —')
        setCurrentNodeId(null)
        break
      }
      default:
        finishFlow()
    }
  }

  const finishFlow = (note) => {
    pushMessage('system', note || '— Flow ended (no further steps configured) —')
    setCurrentNodeId(null)
  }

  const handleButtonChoice = (option) => {
    pushMessage('user', option.label)
    setAwaitingInput(null)
    if (option.targetId) advance(option.targetId)
    else finishFlow('This button has no connected next step.')
  }

  const handleTextSubmit = () => {
    if (!inputValue.trim()) return
    pushMessage('user', inputValue)
    const node = findNode(nodes, awaitingInput.nodeId)
    const nextVars = { ...variables, [awaitingInput.variable]: inputValue }
    setVariables(nextVars)
    setInputValue('')
    setAwaitingInput(null)
    const next = outgoingEdges(edges, node.id)[0]
    if (next) advance(next.target, nextVars)
    else finishFlow()
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-ink-100 bg-white shadow-2xl dark:border-navy-800 dark:bg-navy-950">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-navy-800">
        <h3 className="text-sm font-semibold text-ink-800 dark:text-white">Test Flow</h3>
        <div className="flex items-center gap-1">
          <button onClick={restart} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-navy-800" title="Restart">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-navy-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto bg-ink-50 p-4 dark:bg-navy-900/40">
        {transcript.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'system' ? (
              <span className="mx-auto rounded-full bg-ink-200 px-2.5 py-1 text-[11px] text-ink-500 dark:bg-navy-800 dark:text-ink-400">
                {m.text}
              </span>
            ) : (
              <div
                className={`flex max-w-[80%] items-start gap-1.5 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${m.from === 'bot' ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20' : 'bg-ink-200 text-ink-500 dark:bg-navy-700'}`}>
                  {m.from === 'bot' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                </div>
                <div
                  className={`whitespace-pre-wrap rounded-lg px-3 py-1.5 text-sm ${
                    m.from === 'bot'
                      ? 'bg-white text-ink-800 shadow-sm dark:bg-navy-800 dark:text-white'
                      : 'bg-brand-600 text-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interactive input area */}
      <div className="border-t border-ink-100 p-3 dark:border-navy-800">
        {awaitingInput?.type === 'buttons' && (
          <div className="flex flex-wrap gap-2">
            {awaitingInput.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleButtonChoice(opt)}
                className="rounded-full border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {awaitingInput?.type === 'text' && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Type a reply..."
              className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            />
            <button onClick={handleTextSubmit} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              Send
            </button>
          </div>
        )}

        {!awaitingInput && currentNodeId === null && (
          <p className="text-center text-xs text-ink-400">Conversation ended. Click restart to try again.</p>
        )}
      </div>
    </div>
  )
}

function fillVars(text = '', vars = {}) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{{${key}}}`))
}