import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mail, Shield, CheckCircle2, AlertCircle, Loader2, ArrowRight, Activity, Terminal, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8001';

interface ProgressData {
  current: number;
  total: number;
  log: string;
  percent: number;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const connectAndStart = () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setLogs(['Connecting to server...']);
    setFinished(false);

    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setLogs(prev => [...prev, '✔ Server connected']);
      socket.emit('start_process', { email, password });
    });

    socket.on('progress', (data: ProgressData) => {
      setProgress(data);
      if (data.log) {
        setLogs(prev => {
          const newLogs = [...prev, data.log];
          return newLogs.slice(-100); // Keep last 100 logs
        });
      }
    });

    socket.on('finished', () => {
      setFinished(true);
      setIsProcessing(false);
      socket.disconnect();
    });

    socket.on('error', (data) => {
      setError(data.message);
      setIsProcessing(false);
      socket.disconnect();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  };

  const reset = () => {
    setIsProcessing(false);
    setFinished(false);
    setProgress(null);
    setLogs([]);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 flex items-center justify-center p-6 selection:bg-indigo-500/30">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <AnimatePresence mode="wait">
        {!isProcessing && !finished ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md glass-card p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

            <div className="flex justify-center mb-8">
              <div className="p-4 bg-indigo-500/10 rounded-2xl ring-1 ring-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-10 h-10 text-indigo-400" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">AI Gmail Filter</h1>
              <p className="text-zinc-500 text-sm">Organize your inbox with automated AI grouping.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Gmail Address</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="input-field pl-12"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">App Password</label>
                </div>
                <div className="relative group/input">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your App Password"
                    className="input-field pl-12"
                  />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                onClick={connectAndStart}
                disabled={!email || !password}
                className="btn-primary group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span>Start Processing</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>
          </motion.div>
        ) : isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl glass-card p-8 flex flex-col h-[600px]"
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
                  <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Scanning Inbox</h2>
                  <p className="text-zinc-500 text-xs">Real-time AI Categorization...</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold tabular-nums text-indigo-400">
                  {Math.round(progress?.percent || 0)}%
                </span>
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Progress</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-zinc-900 rounded-full mb-8 overflow-hidden border border-zinc-800 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress?.percent || 0}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-indigo-600 bg-[length:200%_100%] animate-[gradient_2s_linear_infinite] rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Processed</p>
                <p className="text-xl font-mono font-bold text-zinc-300">{progress?.current || 0}</p>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-mono font-bold text-zinc-300">{progress?.total || '...'}</p>
              </div>
            </div>

            {/* Console Output */}
            <div className="flex-1 min-h-0 flex flex-col bg-black/40 rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live Activity Log</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scrollbar-hide">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 group"
                  >
                    <span className="text-zinc-700 shrink-0">{(i + 1).toString().padStart(3, '0')}</span>
                    <span className={`${log.includes('Error') ? 'text-red-400' : log.includes('Categorized') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {log}
                    </span>
                  </motion.div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md glass-card p-10 text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/20">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3">All Done!</h1>
            <p className="text-zinc-400 mb-8">
              Processed <span className="text-white font-bold">{progress?.total}</span> emails and applied labels successfully.
            </p>
            <button
              onClick={reset}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
