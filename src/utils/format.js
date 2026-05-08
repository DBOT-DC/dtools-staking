import { ethers } from 'ethers';

export function formatTokenAmount(weiValue, decimals = 18, displayDecimals = 4) {
  if (!weiValue || weiValue === 0n) return '0';
  const formatted = ethers.formatUnits(weiValue, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return num.toFixed(2);
  if (num < 0.0001) return '< 0.0001';
  return num.toFixed(displayDecimals);
}

export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num, decimals = 2) {
  if (num === undefined || num === null) return '0';
  const n = parseFloat(num);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  return n.toFixed(decimals);
}

export function formatPercent(value) {
  if (value === undefined || value === null) return '0%';
  return `${value}%`;
}

export function getExplorerTxUrl(txHash) {
  return `https://explorer.dogechain.dog/tx/${txHash}`;
}

export function getExplorerAddressUrl(address) {
  return `https://explorer.dogechain.dog/address/${address}`;
}
