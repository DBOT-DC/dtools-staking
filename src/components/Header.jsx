import { formatAddress } from '../utils/format.js';

export default function Header({ account, isConnecting, isCorrectChain, onConnect, onDisconnect, onSwitchNetwork, hasMetaMask }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-900 text-lg">
              D
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">DTOOLS Staking</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5 tracking-wider uppercase">Dogechain Network</p>
            </div>
          </div>

          {/* Right side: Network + Wallet */}
          <div className="flex items-center gap-3">
            {/* Network indicator */}
            {account && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isCorrectChain
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCorrectChain ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isCorrectChain ? 'Dogechain' : 'Wrong Network'}
              </div>
            )}

            {/* Wallet button */}
            {!account ? (
              <button
                onClick={onConnect}
                disabled={isConnecting || !hasMetaMask}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {!hasMetaMask ? 'Install MetaMask' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!isCorrectChain && (
                  <button
                    onClick={onSwitchNetwork}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                  >
                    Switch Network
                  </button>
                )}
                <button
                  onClick={onDisconnect}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {formatAddress(account)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
