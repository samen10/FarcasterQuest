# Farcaster Mini-App Design Guidelines

## Design Approach
**Hybrid Web3 Pattern + Material Design System**
Drawing inspiration from Base.org, Rainbow Wallet, and Farcaster's design language, combined with Material Design for form elements and feedback states. The focus is on trust, clarity, and guiding users through blockchain interactions with confidence.

## Core Design Principles
1. **Progressive Trust Building**: Each completed task builds visual momentum toward the mint action
2. **Transparent State**: Users always know where they are in the process
3. **Blockchain Clarity**: Make Web3 interactions feel safe and understandable

## Typography
- **Primary Font**: Inter (Google Fonts) for clean, crypto-native readability
- **Hierarchy**:
  - H1: 2.5rem (40px), font-weight: 700 - Main title
  - H2: 1.875rem (30px), font-weight: 600 - Section headers
  - Body: 1rem (16px), font-weight: 400 - Main content
  - Small: 0.875rem (14px), font-weight: 500 - Labels, secondary info
  - Monospace: JetBrains Mono for wallet addresses, transaction hashes

## Layout System
**Spacing**: Use Tailwind units of 2, 4, 6, 8, 12, 16 (e.g., p-4, mt-8, gap-6)
- Compact mobile-first layout optimized for Farcaster Frame dimensions
- Maximum width: 600px (Farcaster Frame constraint)
- Consistent padding: p-6 for containers, p-4 for cards

## Component Library

### Task Verification Cards
Three prominent cards showing Like, Recast, Follow tasks:
- Uncompleted state: Outlined card with icon + task description + "Complete" CTA
- In-progress state: Subtle loading indicator
- Completed state: Filled card with checkmark icon, green accent
- Stack vertically with gap-4

### Wallet Connection
Prominent "Connect Wallet" button at top if not connected
- Shows truncated address (0x1234...5678) when connected
- Includes small Base network indicator icon

### SBT Mint Section
Large, centered mint card that becomes active only after all three tasks complete:
- Before completion: Disabled state with lock icon and "Complete all tasks" message
- After completion: Prominent gradient button with "Mint Your SBT" text
- Post-mint: Shows success state with SBT preview and entry confirmation

### Lottery Information Panel
Sticky or fixed panel showing:
- Total participants counter (large, prominent number)
- Time remaining (countdown format)
- Prize pool amount in ETH with USD equivalent
- Winner allocation (dynamically updates based on participant count)
- Visual progress indicator showing participant milestones (100, 500, 1000, 2000+)

### Transaction States
Clear feedback for blockchain interactions:
- Pending: Animated spinner with "Processing transaction..." message
- Success: Checkmark animation with transaction hash link
- Error: Error icon with clear message and retry option

### Admin Panel (Desktop-optimized)
Dashboard layout with:
- Campaign status card (active/ended)
- Participant statistics
- Lottery execution controls
- Emergency controls clearly separated

## Animations
**Minimal and Purposeful**:
- Task completion: Subtle scale + fade-in checkmark (300ms)
- Button states: Simple opacity transitions (150ms)
- Mint success: Celebratory confetti burst (one-time, 2s duration)
- NO scroll animations or parallax effects

## Icons
**Heroicons** (outline style) via CDN:
- Check circle for completed tasks
- Lock for disabled mint button
- Wallet icon for connection
- Trophy for lottery section
- Clock for countdown

## Images
**Hero Section**: Yes - Abstract geometric illustration or 3D rendered SBT token visual (800x400px)
- Position: Top of frame, above task cards
- Treatment: Subtle gradient overlay for text readability
- Purpose: Establish visual identity and gamification appeal

**Additional Images**:
- SBT Token Preview: Small badge/token graphic next to mint button (120x120px)
- Success State: Larger SBT visualization after successful mint (300x300px)

## Accessibility
- High contrast ratios for all text (WCAG AA minimum)
- Clear focus indicators on all interactive elements (2px outline)
- Status announcements for screen readers on task completion
- Loading states announced to assistive tech
- Wallet address readable by screen readers (full address in aria-label)

## Mobile Frame Optimization
- Single column layout throughout
- Thumb-friendly touch targets (minimum 44px height)
- Fixed header with wallet connection always visible
- Scroll-friendly content with clear visual sections
- Bottom-aligned primary CTAs for easy reach

## Trust & Security Indicators
- "Verified on Base" badge near contract interaction
- Small shield icon for security messaging
- Clear gas fee estimation before transactions
- "One mint per wallet" rule prominently displayed
- Transaction hash always linkable to Base block explorer