import type { DOMNodeData } from './dom-analyzer'

export type PickedElementMeta = {
  role: string | null
  name: string | null
  selector: string
  detailedAnalysis?: DOMNodeData
}

export type RuntimeMessage =
  | { type: 'ELEMENT_PICKED'; payload: PickedElementMeta }
  | { type: 'PING' }
  | { type: 'START_INSPECT' }
  | { type: 'STOP_INSPECT' } 