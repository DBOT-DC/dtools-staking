// DTOOLS Token address (correct)
export const DTOOLS_TOKEN_ADDRESS = '0xB9fcAa7590916578087842e017078D7797Fa18D0';

// Staking contract address (verified on Blockscout)
export const STAKING_CONTRACT_ADDRESS = '0x7cc5fb5a99e51b2748a3ee2313e18f4f65b62416';

// NOTE: The address 0x9E2bA6cD78ae39F6248141e6020f93AFB7a1D4dE has NO deployed code.
// The original contract above is the correct, verified staking contract.

export const LP_PAIR_ADDRESS = '0xd552a0d629a5188058e67239bd0e5afead755cd5';
export const DEX_ROUTER_ADDRESS = '0xa4ee06ce40cb7e8c04e127c1f7d3dfb7f7039c81';

// ABI verified on Dogechain Blockscout explorer
// Key differences from previous (incorrect) ABI:
// - exitPenaltyPerc() not exitPenalty()
// - lockDuration() not lockPeriod()
// - userInfo() returns (amount, rewardDebt) — only 2 values, not 3
// - No standalone claimRewards() — rewards auto-claim on withdraw()
export const STAKING_ABI = [
  'function apy() external view returns (uint256)',
  'function calculateNewRewards() external view returns (uint256)',
  'function deposit(uint256 _amount) external',
  'function emergencyWithdraw() external',
  'function exitPenaltyPerc() external view returns (uint256)',
  'function holderUnlockTime(address) external view returns (uint256)',
  'function lockDuration() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function pendingReward(address _user) external view returns (uint256)',
  'function rewardToken() external view returns (address)',
  'function rewardsRemaining() external view returns (uint256)',
  'function stakingToken() external view returns (address)',
  'function totalStaked() external view returns (uint256)',
  'function userInfo(address _user) external view returns (uint256 amount, uint256 rewardDebt)',
  'function withdraw() external',
];

export const TOKEN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function name() external view returns (string)',
];
