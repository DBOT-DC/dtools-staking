import { useEffect, useState } from 'react';
import { getExplorerTxUrl } from '../utils/format.js';

export default function TransactionToast({ txStatus, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (txStatus) {
      setVisible(true);
      setExiting(false);
    }
  }, [txStatus]);

  useEffect(() => {
    if (txStatus && (txStatus.type === 'confirmed' || txStatus.type === 'error')) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [txStatus, onDismiss]);

  if (!visible || !txStatus) return null;

  const configs = {
    pending: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: '⏳',
      text: 'text-blue-300',
    },
    submitted: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: '📤',
      text: 'text-amber-300',
    },
    confirmed: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: '✅',
      text: 'text-emerald-300',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: '❌',
      text: 'text-red-300',
    },
  };

  const config = configs[txStatus.type] || configs.pending;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm">
      <div className={`${config.bg} border rounded-xl p-4 backdrop-blur-sm shadow-2xl ${exiting ? 'toast-exit' : 'toast-enter'}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${config.text}`}>{txStatus.message}</p>
            {txStatus.hash && (
              <a
                href={getExplorerTxUrl(txStatus.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors break-all"
              >
                TX: {txStatus.hash.slice(0, 10)}...{txStatus.hash.slice(-8)} ↗
              </a>
            )}
          </div>
          <button
            onClick={() => {
              setExiting(true);
              setTimeout(() => {
                setVisible(false);
                onDismiss?.();
              }, 300);
            }}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
