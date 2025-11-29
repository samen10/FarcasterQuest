# Base SBT Lottery - Farcaster Mini App

## Overview
A Farcaster mini-app that allows users to complete social tasks (like, recast, follow) and mint a Soulbound Token (SBT) to participate in an ETH lottery on the Base network.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── TaskCard.tsx        # Task completion cards
│   │   │   ├── MintSection.tsx     # SBT minting UI
│   │   │   ├── LotteryInfo.tsx     # Lottery stats display
│   │   │   ├── CountdownTimer.tsx  # Countdown component
│   │   │   ├── WalletConnect.tsx   # Wallet connection
│   │   │   ├── Header.tsx          # App header
│   │   │   └── ThemeProvider.tsx   # Dark/light mode
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Main lottery page
│   │   │   └── Admin.tsx           # Admin panel
│   │   └── lib/
│   │       ├── wagmiConfig.ts      # Web3 configuration
│   │       └── queryClient.ts      # React Query setup
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # In-memory data storage
│   └── neynar.ts           # Farcaster API integration
├── contracts/              # Solidity smart contracts
│   ├── SoulboundToken.sol  # Non-transferable ERC721
│   └── Lottery.sol         # Lottery logic
└── shared/
    └── schema.ts           # Shared TypeScript types
```

## Features

### User Features
- Complete 3 social tasks on Farcaster (like, recast, follow)
- Automatic task verification via Neynar API
- Mint a Soulbound Token (SBT) after completing all tasks
- View lottery status, participant count, and countdown

### Admin Features
- Configure target cast and user for tasks
- Set lottery end time
- View participant statistics
- Draw winners (pseudo-random selection)

### Lottery Rules
- Winner count based on participants:
  - 100-499: 1 winner
  - 500-999: 2 winners
  - 1000-1999: 3 winners
  - 2000+: 4 winners
- Each winner receives ~0.002 ETH (~$5)
- One mint per wallet address

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui
- wagmi + viem for Web3
- TanStack Query for data fetching
- Framer Motion for animations

### Backend
- Express.js
- Neynar API for Farcaster
- In-memory storage (MemStorage)

### Smart Contracts (Base Network)
- SoulboundToken.sol: ERC721 non-transferable token
- Lottery.sol: Prize distribution logic

## Environment Variables

Required secrets:
- `NEYNAR_API_KEY`: Neynar API key for Farcaster verification
- `SESSION_SECRET`: Session encryption key

## API Endpoints

### Public
- `GET /api/lottery/stats` - Get lottery statistics
- `GET /api/user/status?address=0x...` - Get user task status
- `POST /api/tasks/verify` - Verify completed tasks
- `POST /api/mint` - Mint SBT

### Admin
- `GET /api/admin/config` - Get lottery configuration
- `PATCH /api/admin/config` - Update configuration
- `GET /api/admin/winners` - Get winner list
- `GET /api/admin/participants` - Get participant list
- `POST /api/admin/draw` - Draw winners

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Run production build
```

## Recent Changes
- Initial implementation of lottery mini-app
- Created TaskCard, MintSection, LotteryInfo components
- Implemented Neynar API integration for task verification
- Added wallet connection with wagmi
- Created admin panel for lottery management
- Added dark/light theme support
