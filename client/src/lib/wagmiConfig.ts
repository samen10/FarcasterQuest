import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

// Configure wagmi for Base network
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({
      appName: 'Base SBT Lottery',
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  SBT: '0x0000000000000000000000000000000000000000',
  LOTTERY: '0x0000000000000000000000000000000000000000',
} as const;

// ABI for SBT contract
export const SBT_ABI = [
  {
    inputs: [
      { name: 'farcasterFid', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'hasMinted',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ABI for Lottery contract
export const LOTTERY_ABI = [
  {
    inputs: [],
    name: 'getParticipantCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPrizePool',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEndTime',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWinnersCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'drawWinners',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimPrize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Utility to format ETH values
export function formatEth(value: bigint | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value) / 1e18;
  return num.toFixed(4);
}

// Utility to truncate wallet address
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
