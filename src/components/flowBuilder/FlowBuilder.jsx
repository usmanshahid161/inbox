// src/pages/FlowBuilder.jsx
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Trash2 } from 'lucide-react'
import { showToast } from '../../features/ui/uiSlice.js'

import FlowTopBar          from './FlowTopBar'
import NodePalette         from './NodePalette'
import NodeConfigPanel     from './NodeConfigPanel.jsx'
import FlowTestPanel       from './FlowTestPanel.jsx'
import {nodeTypes}         from './index.jsx';
import { NODE_TYPES_META } from './Flowconstants.jsx'
import {
  fetchFlowById,
  createFlow,
  updateFlow,
  deleteFlow,
  clearCurrentFlow,
  selectCurrentFlow,
  selectCurrentFlowStatus,
  selectFlowSaving,
}                          from '../../features/flows/flowsSlice.js'

let idCounter = 1000
const nextId = (type) => `${type}_${idCounter++}`

const BLANK_FLOW_NODES = [{ id: 'start', type: 'start', position: { x: 360, y: 80 }, data: { label: 'Start' } }]
const BLANK_FLOW_EDGES = []

function FlowCanvas() {
  const { id } = useParams()
  const isNewFlow = id === 'new'
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { screenToFlowPosition } = useReactFlow()

  const currentFlow = useSelector(selectCurrentFlow)
  const currentFlowStatus = useSelector(selectCurrentFlowStatus)
  const saving = useSelector(selectFlowSaving)

  const [nodes, setNodes, onNodesChange] = useNodesState(isNewFlow ? BLANK_FLOW_NODES : [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(isNewFlow ? BLANK_FLOW_EDGES : [])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [flowName, setFlowName] = useState(isNewFlow ? 'Untitled Flow' : '')
  const [status, setStatus] = useState('Draft')
  const [isTestOpen, setIsTestOpen] = useState(false)

  const [history, setHistory] = useState([{ nodes: isNewFlow ? BLANK_FLOW_NODES : [], edges: isNewFlow ? BLANK_FLOW_EDGES : [] }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Load existing flow on mount (skip for "new")

  console.log(isNewFlow, "isnewwwwwwwwwww")
  useEffect(() => {
    if (!isNewFlow) dispatch(fetchFlowById(id))
    return () => dispatch(clearCurrentFlow())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Populate canvas once the fetched flow arrives
  useEffect(() => {
    if (!isNewFlow && currentFlow && currentFlow._id === id) {
      setNodes(currentFlow.nodes || [])
      setEdges(currentFlow.edges || [])
      setFlowName(currentFlow.name)
      setStatus(currentFlow.status === 'PUBLISHED' ? 'Published' : 'Draft')
      setHistory([{ nodes: currentFlow.nodes || [], edges: currentFlow.edges || [] }])
      setHistoryIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlow])

  const pushHistory = useCallback((newNodes, newEdges) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), { nodes: newNodes, edges: newEdges }])
    setHistoryIndex((i) => i + 1)
  }, [historyIndex])

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId])

  const onConnect = useCallback((connection) => {
    setEdges((eds) => {
      const next = addEdge({ ...connection, animated: false }, eds)
      pushHistory(nodes, next)
      return next
    })
  }, [nodes, setEdges, pushHistory])

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/flow-node-type')
    if (!type || !NODE_TYPES_META[type]) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const nid = nextId(type)
    const newNode = { id: nid, type, position, data: { ...NODE_TYPES_META[type].defaultData } }
    setNodes((nds) => {
      const next = nds.concat(newNode)
      pushHistory(next, edges)
      return next
    })
    setSelectedNodeId(nid)
  }, [screenToFlowPosition, setNodes, edges, pushHistory])

  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), [])
  const onPaneClick = useCallback(() => setSelectedNodeId(null), [])

  const updateNodeData = useCallback((nid, data) => {
    setNodes((nds) => nds.map((n) => (n.id === nid ? { ...n, data } : n)))
  }, [setNodes])

  const handleDeleteNode = useCallback((nid) => {
    setNodes((nds) => {
      const next = nds.filter((n) => n.id !== nid)
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.source !== nid && e.target !== nid)
        pushHistory(next, nextEdges)
        return nextEdges
      })
      return next
    })
    setSelectedNodeId(null)
  }, [setNodes, setEdges, pushHistory])

  const handleDuplicateNode = useCallback((nid) => {
    const node = nodes.find((n) => n.id === nid)
    if (!node) return
    const newId = nextId(node.type)
    const newNode = { ...node, id: newId, position: { x: node.position.x + 40, y: node.position.y + 40 }, selected: false }
    setNodes((nds) => {
      const next = nds.concat(newNode)
      pushHistory(next, edges)
      return next
    })
    setSelectedNodeId(newId)
  }, [nodes, edges, setNodes, pushHistory])

  const handleUndo = useCallback(() => {
    if (historyIndex === 0) return
    const i = historyIndex - 1
    setHistoryIndex(i)
    setNodes(history[i].nodes)
    setEdges(history[i].edges)
    setSelectedNodeId(null)
  }, [history, historyIndex, setNodes, setEdges])

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const i = historyIndex + 1
    setHistoryIndex(i)
    setNodes(history[i].nodes)
    setEdges(history[i].edges)
    setSelectedNodeId(null)
  }, [history, historyIndex, setNodes, setEdges])

  const persist = async (nextStatus) => {
    const payload = { name: flowName, status: nextStatus, nodes, edges }
    if (isNewFlow) {
      const result = await dispatch(createFlow(payload)).unwrap().catch((err) => {
        dispatch(showToast({ message: err || 'Failed to create flow', tone: 'danger' }))
        return null
      })

      if (result?.data) {
        dispatch(showToast({ message: 'Flow created', tone: 'success' }))
        navigate(`/app/flows/${result?.data?._id}`, { replace: true })
      }
    } else {
      const result = await dispatch(updateFlow({ id, payload })).unwrap().catch((err) => {
        dispatch(showToast({ message: err || 'Failed to save flow', tone: 'danger' }))
        return null
      })
      if (result) {
        setStatus(result.status === 'PUBLISHED' ? 'Published' : 'Draft')
        dispatch(showToast({ message: nextStatus === 'PUBLISHED' ? 'Flow published' : 'Flow saved', tone: 'success' }))
      }
    }
  }

  const handleSaveDraft = () => persist('DRAFT')
  const handlePublish = () => persist('PUBLISHED')

  const handleDeleteFlow = () => {
    if (isNewFlow) return navigate('/app/flows')
    if (!confirm(`Delete "${flowName}"? This cannot be undone.`)) return
    dispatch(deleteFlow(id)).unwrap().then(() => {
      dispatch(showToast({ message: 'Flow deleted', tone: 'success' }))
      navigate('/app/flows')
    })
  }

  if (!isNewFlow && currentFlowStatus === 'loading') {
    return <div className="flex h-screen items-center justify-center text-sm text-ink-400">Loading flow...</div>
  }

  return (
    <div className="flex h-screen w-full flex-col bg-ink-50 dark:bg-navy-950">
      <FlowTopBar
        flowName={flowName}
        onFlowNameChange={setFlowName}
        status={status}
        onBack={() => navigate('/app/flows')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onSaveDraft={handleSaveDraft}
        onTestFlow={() => setIsTestOpen(true)}
        onPublish={handlePublish}
        saving={saving}
        extraAction={
          !isNewFlow && (
            <button
              onClick={handleDeleteFlow}
              className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
              title="Delete flow"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )
        }
      />

      <div className="flex min-h-0 flex-1">
        <NodePalette />

        <div className="relative min-w-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={() => pushHistory(nodes, edges)}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{ style: { stroke: '#94a3b8', strokeWidth: 1.5 } }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} color="#cbd5e1" />
            <Controls className="!shadow-md" />
            <MiniMap maskColor="rgba(0,0,0,0.06)" nodeColor="#94a3b8" pannable zoomable />
          </ReactFlow>
        </div>

        <NodeConfigPanel
          node={selectedNode}
          onChange={updateNodeData}
          onClose={() => setSelectedNodeId(null)}
          onDelete={handleDeleteNode}
          onDuplicate={handleDuplicateNode}
        />
      </div>

      {isTestOpen && <FlowTestPanel nodes={nodes} edges={edges} onClose={() => setIsTestOpen(false)} />}
    </div>
  )
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}