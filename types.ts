export enum AgentType {
  ORCHESTRATOR = 'ORCHESTRATOR',
  PATIENT_AGENT = 'PATIENT_AGENT',
  APPOINTMENT_AGENT = 'APPOINTMENT_AGENT',
  BILLING_AGENT = 'BILLING_AGENT',
  RECORDS_AGENT = 'RECORDS_AGENT'
}

export interface OrchestratorDecision {
  agent: AgentType;
  reason: string;
  parameters: Record<string, any>;
}

export interface AgentResponse {
  action?: string;
  message: string;
  next_steps?: string[];
  data?: Record<string, any>;
  document_url?: string;
}

export enum Sender {
  USER = 'USER',
  BOT = 'BOT'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  agent?: AgentType; // The agent that handled this message
  structuredResponse?: AgentResponse; // The raw JSON data from the agent
  timestamp: Date;
}
