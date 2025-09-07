# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production with Turbopack  
- `bun start` - Start production server
- `bun run lint` - Run ESLint

## Architecture

This is a Next.js 15 project using the App Router with TypeScript and Tailwind CSS. The project includes shadcn/ui components for a comprehensive UI component library.

**Key Structure:**
- `src/app/` - App Router pages and layouts
- `src/components/ui/` - shadcn/ui components (40+ prebuilt components)
- `src/lib/utils.ts` - Utility functions including `cn()` for className merging
- `src/hooks/` - Custom React hooks

**UI Framework:**
- Uses shadcn/ui with "new-york" style variant
- Radix UI primitives for accessibility
- Tailwind CSS with CSS variables for theming
- Lucide React for icons
- Component aliases configured: `@/components`, `@/lib`, `@/hooks`, etc.

**Forms & Validation:**
- React Hook Form with Zod resolvers
- Form components available in `src/components/ui/form.tsx`

**Additional Libraries:**
- `next-themes` for theme switching
- `sonner` for toast notifications
- `recharts` for data visualization
- `embla-carousel-react` for carousels
- `date-fns` for date utilities
- `konva` & `react-konva` for high-performance 2D canvas with media support (drag, resize, rotate)
- Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) for AI integration with Google Gemini models
- AI Elements - Professional React components for AI chat interfaces, built on shadcn/ui

**Path Mapping:**
- `@/*` maps to `./src/*` for clean imports

**Font Configuration:**
- Uses Be Vietnam Pro font family instead of default Geist fonts
- Configured with all weight variants (100-900) for design flexibility

**Notes:**
- No test framework currently configured
- Project uses Bun as package manager and runtime
- Uses Turbopack for faster builds and development