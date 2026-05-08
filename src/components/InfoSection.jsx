import { useState } from 'react';
import { DTOOLS_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from '../config/contracts.js';
import { getExplorerAddressUrl } from '../utils/format.js';

function FAQItem({ question, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-slate-300">{question}</span>
        <span className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="pb-3 text-sm text-slate-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

export default function InfoSection() {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-blue-500 rounded-full" />
        Information
      </h2>

      <div className="mb-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="text-amber-400 font-medium">Community-built tool:</span> This interface was created by{' '}
          <a
            href="https://www.dbot.dog/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            DBOT
          </a>{' '}
          to help DTOOLS holders manage their staked tokens after the original front-end went offline. This site is not affiliated with the original DTOOLS team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* FAQ */}
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Frequently Asked Questions</h3>
          <FAQItem question="Is this the official DTOOLS website?" defaultOpen={true}>
            <p>No. This is a community-built interface created by DBOT on Dogechain. The original DTOOLS front-end is no longer accessible, so we built this tool to help users interact with the verified on-chain staking contract directly. This site is not affiliated with, endorsed by, or connected to the original DTOOLS team.</p>
          </FAQItem>
          <FAQItem question="Why was this site created?">
            <p>When the DTOOLS project's front-end went offline, users who had staked their $DTOOLS tokens had no way to manage their positions — no way to check balances, claim rewards, or withdraw their staked tokens. This interface was built by DBOT to give the community back control of their assets by connecting directly to the verified smart contracts on the Dogechain blockchain. All contract interactions happen on-chain — your tokens never pass through our systems.</p>
          </FAQItem>
          <FAQItem question="Is it safe to use?">
            <p>This interface connects directly to the verified staking contract on the Dogechain blockchain. You can verify the contract addresses yourself using the Dogechain block explorer. All transactions are executed through your own wallet (MetaMask) — we never have access to your funds. The contract addresses used are publicly verified and can be audited by anyone.</p>
          </FAQItem>
          <FAQItem question="Who is DBOT?">
            <p>DBOT is a Dogechain community project dedicated to building tools and infrastructure for the Dogechain ecosystem. Visit us at{' '}
              <a
                href="https://www.dbot.dog/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                https://www.dbot.dog/
              </a>{' '}
              to learn more about our projects and how we're supporting the Dogechain community.
            </p>
          </FAQItem>
          <FAQItem question="How does staking work?">
            <p>Stake your DTOOLS tokens in the staking contract to earn rewards at the current APY rate. 
            Rewards accumulate over time based on your staked amount and the APY.</p>
          </FAQItem>
          <FAQItem question="What is the exit penalty?">
            <p>There is a 10% exit penalty when you withdraw your staked tokens. This means you'll receive 90% of your staked amount. 
            The penalty goes to the reward pool to fund future rewards for other stakers.</p>
          </FAQItem>
          <FAQItem question="What is the transfer tax?">
            <p>DTOOLS has a 3% transfer tax on all transfers: 1% goes to liquidity and 2% to marketing. 
            This means when you stake, the contract receives 97% of the tokens you send. Factor this into your calculations.</p>
          </FAQItem>
          <FAQItem question="How do I claim my rewards?">
            <p>Rewards are automatically claimed when you withdraw. There's no separate claim function — 
            when you call withdraw, you receive your staked tokens (minus penalty) plus all accumulated rewards.</p>
          </FAQItem>
          <FAQItem question="What is emergency withdraw?">
            <p>Emergency withdraw is a fallback option that allows you to withdraw your staked tokens in case of issues. 
            It may have different behavior than regular withdrawal. Use it only as a last resort.</p>
          </FAQItem>
          <FAQItem question="Is there a lock period?">
            <p>The lock period is set to 1 second, which effectively means there's no lock period. 
            You can withdraw at any time (subject to the exit penalty).</p>
          </FAQItem>
        </div>

        {/* Contract Info */}
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Contract Addresses</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">DTOOLS Token</p>
              <a
                href={getExplorerAddressUrl(DTOOLS_TOKEN_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-400 hover:text-amber-300 font-mono break-all transition-colors"
              >
                {DTOOLS_TOKEN_ADDRESS} ↗
              </a>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Staking Contract</p>
              <a
                href={getExplorerAddressUrl(STAKING_CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-400 hover:text-amber-300 font-mono break-all transition-colors"
              >
                {STAKING_CONTRACT_ADDRESS} ↗
              </a>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Block Explorer</p>
              <a
                href="https://explorer.dogechain.dog/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Dogechain Explorer ↗
              </a>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Network</span>
                <span className="text-slate-300">Dogechain (Chain ID: 2000)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token</span>
                <span className="text-slate-300">DTOOLS (18 decimals)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer Tax</span>
                <span className="text-orange-400">3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exit Penalty</span>
                <span className="text-orange-400">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lock Period</span>
                <span className="text-emerald-400">1 second (none)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
