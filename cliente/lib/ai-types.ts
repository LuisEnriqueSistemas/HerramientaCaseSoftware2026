import type { UmlDiagram } from './uml-types';

export interface AiDiagramGeneratedPayload {
  projectId: string;
  diagram: UmlDiagram;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AiProviderStatus {
  available: boolean;
  provider: "deepseek";
  model: string;
  message: string;
}
