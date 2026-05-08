import { ethers } from 'ethers';
import { RPC_URL } from '../config/constants.js';
import { STAKING_CONTRACT_ADDRESS, DTOOLS_TOKEN_ADDRESS, STAKING_ABI, TOKEN_ABI } from '../config/contracts.js';

export function getDefaultProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getStakingContract(providerOrSigner) {
  return new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, providerOrSigner);
}

export function getTokenContract(providerOrSigner) {
  return new ethers.Contract(DTOOLS_TOKEN_ADDRESS, TOKEN_ABI, providerOrSigner);
}
