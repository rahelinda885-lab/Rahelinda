import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, AgentType } from './types';
import { orchestrateQuery, runSubAgent } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { Send, Activity, ShieldCheck, RefreshCcw, Loader2, Bot } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<string>('');
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: Sender.BOT,
      text: "Selamat datang di Hospital System Navigator. Saya adalah Orchestrator AI. Saya dapat membantu Anda dengan Pendaftaran, Janji Temu, Tagihan, atau Rekam Medis. Apa yang bisa saya bantu hari ini?",
      agent: AgentType.ORCHESTRATOR,
      timestamp: new Date()
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentProcess]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Orchestration
      setCurrentProcess('Orchestrating request...');
      setActiveAgent(AgentType.ORCHESTRATOR);
      
      const decision = await orchestrateQuery(userMsg.text);
      
      console.log('Orchestrator Decision:', decision);

      // Step 2: Agent Execution
      setCurrentProcess(`Delegating to ${decision.agent}...`);
      setActiveAgent(decision.agent);

      const agentResponse = await runSubAgent(decision.agent, userMsg.text, decision.parameters);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: Sender.BOT,
        text: agentResponse.message,
        agent: decision.agent,
        structuredResponse: agentResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: Sender.BOT,
        text: "Maaf, terjadi kesalahan sistem. Mohon coba lagi.",
        agent: AgentType.ORCHESTRATOR,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setCurrentProcess('');
      // Keep the active agent highlighted for context, or reset if desired:
      // setActiveAgent(null); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([messages[0]]);
    setActiveAgent(null);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* Sidebar / Status Panel - Hidden on mobile, visible on lg */}
      <div className="hidden lg:flex w-80 bg-slate-900 text-slate-100 flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-hospital-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">HSN AI</h1>
              <p className="text-xs text-slate-400">Hospital System Navigator</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded border border-slate-700 text-green-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Connection (Simulated)</span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Active Agents</h2>
          
          <div className="space-y-3">
            {[
              { id: AgentType.ORCHESTRATOR, name: 'Orchestrator', desc: 'Query Routing' },
              { id: AgentType.PATIENT_AGENT, name: 'Patient Services', desc: 'Registration & Info' },
              { id: AgentType.APPOINTMENT_AGENT, name: 'Appointments', desc: 'Scheduling' },
              { id: AgentType.BILLING_AGENT, name: 'Billing', desc: 'Finance & Insurance' },
              { id: AgentType.RECORDS_AGENT, name: 'Records', desc: 'Lab & Radiology' },
            ].map((agent) => (
              <div 
                key={agent.id}
                className={`
                  p-3 rounded-lg border transition-all duration-300
                  ${activeAgent === agent.id 
                    ? 'bg-hospital-900/50 border-hospital-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
                    : 'bg-transparent border-slate-800 text-slate-500'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${activeAgent === agent.id ? 'text-hospital-100' : ''}`}>
                    {agent.name}
                  </span>
                  {activeAgent === agent.id && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hospital-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-hospital-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] mt-1 opacity-70">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Powered by Gemini 2.5 Flash
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
        
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-slate-900 text-white flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-hospital-500" />
            <span className="font-bold">HSN AI</span>
          </div>
          <button onClick={resetChat} className="p-2 text-slate-400 hover:text-white">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Header Overlay */}
        <div className="hidden lg:flex absolute top-0 left-0 right-0 p-4 justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
          <div>
            <h2 className="text-slate-800 font-semibold">Orchestrator Interface</h2>
            <p className="text-xs text-slate-500">AI-Assisted Hospital Management</p>
          </div>
          <button 
            onClick={resetChat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <RefreshCcw className="w-3 h-3" />
            Reset Session
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 scrollbar-hide">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-6">
                 <div className="flex items-start gap-3">
                   <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center animate-pulse">
                     <Bot className="w-4 h-4 text-slate-400" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-xs text-hospital-600 font-medium animate-pulse">
                       {currentProcess}
                     </span>
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                     </div>
                   </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ex: Saya mau daftar pasien baru..."
                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500/20 focus:border-hospital-500 transition-all shadow-sm placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-hospital-600 text-white rounded-lg hover:bg-hospital-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              HSN AI orchestrates 5 specialized agents. Responses are simulated for demonstration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}