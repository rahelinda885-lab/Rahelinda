import React from 'react';
import { Message, Sender, AgentType } from '../types';
import { 
  User, 
  Bot, 
  FileText, 
  Calendar, 
  CreditCard, 
  Activity, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const AgentIcon: React.FC<{ agent?: AgentType }> = ({ agent }) => {
  switch (agent) {
    case AgentType.PATIENT_AGENT: return <User className="w-4 h-4" />;
    case AgentType.APPOINTMENT_AGENT: return <Calendar className="w-4 h-4" />;
    case AgentType.BILLING_AGENT: return <CreditCard className="w-4 h-4" />;
    case AgentType.RECORDS_AGENT: return <Activity className="w-4 h-4" />;
    default: return <Bot className="w-4 h-4" />;
  }
};

const AgentLabel: React.FC<{ agent?: AgentType }> = ({ agent }) => {
  if (!agent) return <span>System</span>;
  const labels: Record<string, string> = {
    [AgentType.PATIENT_AGENT]: 'Patient Services',
    [AgentType.APPOINTMENT_AGENT]: 'Appointments',
    [AgentType.BILLING_AGENT]: 'Billing & Finance',
    [AgentType.RECORDS_AGENT]: 'Medical Records',
  };
  return <span>{labels[agent] || agent}</span>;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-hospital-600 text-white' : 'bg-medical-500 text-white shadow-sm'}
        `}>
          {isUser ? <User className="w-5 h-5" /> : <AgentIcon agent={message.agent} />}
        </div>

        {/* Bubble Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          <span className="text-xs text-slate-400 mb-1 px-1">
            {isUser ? 'You' : <AgentLabel agent={message.agent} />}
          </span>

          <div className={`
            p-4 rounded-2xl shadow-sm text-sm leading-relaxed
            ${isUser 
              ? 'bg-hospital-600 text-white rounded-tr-none' 
              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}
          `}>
            {message.text}

            {/* Structured Data Visualization */}
            {!isUser && message.structuredResponse && (
              <div className="mt-4 pt-3 border-t border-slate-100 w-full">
                
                {/* Data Object Grid */}
                {message.structuredResponse.data && (
                  <div className="bg-slate-50 p-3 rounded-md mb-3 font-mono text-xs text-slate-600 border border-slate-200">
                    {Object.entries(message.structuredResponse.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-slate-200 last:border-0">
                        <span className="font-semibold capitalize text-slate-500">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-800 font-medium">
                          {typeof value === 'number' 
                            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value).replace('IDR', 'Rp') 
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Next Steps */}
                {message.structuredResponse.next_steps && message.structuredResponse.next_steps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommended Actions</p>
                    {message.structuredResponse.next_steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-hospital-600 bg-hospital-50 p-2 rounded text-xs font-medium">
                        <ArrowRight className="w-3 h-3" />
                        {step}
                      </div>
                    ))}
                  </div>
                )}

                {/* Document Mock */}
                {message.structuredResponse.document_url && (
                   <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 text-xs">
                     <FileText className="w-4 h-4" />
                     <span>Document generated: <span className="underline cursor-pointer">Download PDF</span></span>
                   </div>
                )}
              </div>
            )}
          </div>
          
          <span className="text-[10px] text-slate-300 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
