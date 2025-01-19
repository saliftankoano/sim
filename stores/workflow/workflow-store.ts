import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Edge } from 'reactflow'
import { Position, SubBlockState, WorkflowStore } from './types'
import { getBlock } from '@/blocks'
import { withHistory, WorkflowStoreWithHistory, pushHistory } from './history-middleware'

const initialState = {
  blocks: {},
  edges: [],
  history: {
    past: [],
    present: {
      state: { blocks: {}, edges: [] },
      timestamp: Date.now(),
      action: 'Initial state',
    },
    future: [],
  },
}

export const useWorkflowStore = create<WorkflowStoreWithHistory>()(
  devtools(
    withHistory((set, get) => ({
      ...initialState,
      undo: () => {},
      redo: () => {},
      canUndo: () => false,
      canRedo: () => false,

      updateSubBlock: (blockId: string, subBlockId: string, value: any) => {
        set((state) => ({
          blocks: {
            ...state.blocks,
            [blockId]: {
              ...state.blocks[blockId],
              subBlocks: {
                ...state.blocks[blockId].subBlocks,
                [subBlockId]: {
                  ...state.blocks[blockId].subBlocks[subBlockId],
                  value,
                },
              },
            },
          },
        }))
      },

      addBlock: (id: string, type: string, name: string, position: Position) => {
        const blockConfig = getBlock(type)
        if (!blockConfig) return

        const subBlocks: Record<string, any> = {}
        blockConfig.workflow.subBlocks.forEach((subBlock) => {
          const subBlockId = subBlock.id || crypto.randomUUID()
          subBlocks[subBlockId] = {
            id: subBlockId,
            type: subBlock.type,
            value: null,
          }
        })

        const newState = {
          blocks: {
            ...get().blocks,
            [id]: {
              id,
              type,
              name,
              position,
              subBlocks,
              outputType: 
                typeof blockConfig.workflow.outputType === 'string'
                  ? blockConfig.workflow.outputType
                  : blockConfig.workflow.outputType.default,
            },
          },
          edges: [...get().edges],
        }

        set(newState)
        pushHistory(set, get, newState, `Add ${type} block`)
      },

      updateBlockPosition: (id: string, position: Position) => {
        set((state) => ({
          blocks: {
            ...state.blocks,
            [id]: {
              ...state.blocks[id],
              position,
            },
          },
          edges: [...state.edges],
        }))
      },

      removeBlock: (id: string) => {
        const newState = {
          blocks: { ...get().blocks },
          edges: [...get().edges].filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
        }
        delete newState.blocks[id]
        
        set(newState)
        pushHistory(set, get, newState, 'Remove block')
      },

      addEdge: (edge: Edge) => {
        const newState = {
          blocks: { ...get().blocks },
          edges: [
            ...get().edges,
            {
              id: edge.id || crypto.randomUUID(),
              source: edge.source,
              target: edge.target,
            },
          ],
        }
        
        set(newState)
        pushHistory(set, get, newState, 'Add connection')
      },

      removeEdge: (edgeId: string) => {
        const newState = {
          blocks: { ...get().blocks },
          edges: get().edges.filter((edge) => edge.id !== edgeId),
        }
        
        set(newState)
        pushHistory(set, get, newState, 'Remove connection')
      },

      clear: () => {
        const newState = initialState
        set(newState)
        pushHistory(set, get, newState, 'Clear workflow')
      },
    })),
    { name: 'workflow-store' }
  )
) 