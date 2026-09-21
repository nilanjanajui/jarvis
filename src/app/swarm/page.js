'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function SwarmDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const task = searchParams.get('task') || 'Analyze optimal J.A.R.V.I.S. deployment strategies.';
  
  const [logs, setLogs] = useState([]);
  const [agents, setAgents] = useState({
    Planner: { status: 'Idle', type: 'idle' },
    Coder: { status: 'Idle', type: 'idle' },
    Reviewer: { status: 'Idle', type: 'idle' },
    System: { status: 'Idle', type: 'idle' }
  });
  const [completed, setCompleted] = useState(false);
  const logEndRef = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const runSwarm = async () => {
      try {
        const response = await fetch('/api/swarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task }),
        });

        if (!response.body) throw new Error('No readable stream');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              try {
                const data = JSON.parse(part.slice(6));
                
                setAgents(prev => ({
                  ...prev,
                  [data.agent]: { status: data.status, type: data.type }
                }));

                setLogs(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  agent: data.agent,
                  status: data.status,
                  message: data.message,
                  type: data.type
                }]);

                if (data.type === 'complete') {
                  setCompleted(true);
                }
              } catch (e) {
                console.error('Failed to parse SSE JSON:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
        setLogs(prev => [...prev, { id: Date.now(), agent: 'System', status: 'Error', message: err.message, type: 'error' }]);
      }
    };

    runSwarm();
  }, [task]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="min-h-screen bg-black text-cyan-400 p-8 font-mono flex flex-col items-center">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="mb-8 border-b border-cyan-900 pb-4 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <button 
                onClick={() => router.push('/')}
                className="text-cyan-500 hover:text-cyan-300 border border-cyan-900 hover:border-cyan-500 rounded px-3 py-1 text-sm transition-colors uppercase tracking-widest font-bold flex items-center"
              >
                ← Back
              </button>
              <h1 className="text-4xl tracking-[0.2em] font-bold text-cyan-500 uppercase m-0">J.A.R.V.I.S. Swarm Orchestrator</h1>
            </div>
            <p className="text-cyan-700 uppercase tracking-widest text-sm mt-2">Deployment Task: {task}</p>
          </div>
          <div className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest ${completed ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-400' : 'bg-orange-900/50 text-orange-400 border border-orange-400 animate-pulse'}`}>
            {completed ? 'Deployment Complete' : 'Swarm Active'}
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(agents).map(([name, data]) => {
            const isActive = data.status !== 'Idle' && data.status !== 'Done' && data.status !== 'Complete' && data.status !== 'Error';
            const isDone = data.status === 'Done' || data.status === 'Complete';
            const isError = data.status === 'Error';

            return (
              <motion.div 
                key={name}
                layout
                className={`p-6 rounded-lg border bg-black relative overflow-hidden ${
                  isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' :
                  isDone ? 'border-cyan-800 opacity-70' :
                  isError ? 'border-red-500' : 'border-cyan-900 opacity-50'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 overflow-hidden">
                    <div className="w-1/2 h-full bg-white opacity-50 animate-[translate_1s_infinite_linear]" style={{ animationName: 'progress' }} />
                  </div>
                )}
                <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-white">{name}</h3>
                <div className={`text-sm uppercase tracking-widest ${
                  isActive ? 'text-cyan-300' :
                  isDone ? 'text-cyan-600' :
                  isError ? 'text-red-400' : 'text-cyan-800'
                }`}>
                  {data.status}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Terminal Log */}
        <div className="border border-cyan-900 bg-black/50 rounded-lg p-6 h-[50vh] overflow-y-auto relative backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent opacity-50"></div>
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={log.id} 
                className="mb-4 text-sm"
              >
                <div className="flex items-center space-x-3 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    log.type === 'error' ? 'bg-red-900/50 text-red-400' :
                    log.type === 'complete' ? 'bg-cyan-400 text-black' : 'bg-cyan-900/50 text-cyan-300'
                  }`}>
                    {log.agent} : {log.status}
                  </span>
                  <span className="text-cyan-800 text-xs">{new Date(log.id).toISOString().split('T')[1].slice(0,-1)}</span>
                </div>
                <div className={`pl-4 border-l-2 py-1 ${
                  log.type === 'error' ? 'border-red-500/50 text-red-200' :
                  'border-cyan-800 text-cyan-100 whitespace-pre-wrap'
                }`}>
                  {log.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
}

export default function SwarmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center font-mono">INITIALIZING SWARM...</div>}>
      <SwarmDashboard />
    </Suspense>
  );
}
