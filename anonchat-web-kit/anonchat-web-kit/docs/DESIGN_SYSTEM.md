# Design System — premium, minimal, modern (Discord/Telegram feel, anonymous vibe)

## Mood
Calm, private, a little mysterious. Soft gradients, glass surfaces (subtle blur), rounded-2xl cards, generous spacing, one accent colour.

## Tokens (Tailwind `theme.extend` + CSS variables)
| Token | Light | Dark |
|---|---|---|
| bg | `#F7F7FB` | `#0E0F1A` |
| surface | `#FFFFFF` | `#161827` |
| surface-2 | `#F0F1F7` | `#1E2033` |
| border | `#E4E6F0` | `#2A2D45` |
| text | `#12131F` | `#ECEDF7` |
| muted | `#6B6F8A` | `#8E92B0` |
| primary (violet) | `#7C3AED` | `#8B5CF6` |
| accent gradient | `#7C3AED → #EC4899` | same |
| success/online | `#22C55E` | same |
| danger | `#EF4444` | same |
Male/Female badges use neutral-friendly colours (e.g. sky `#0EA5E9` / rose `#F43F5E`) with an icon + text label (never colour alone).
Avatars: circle with `avatarColor` background and the initials of the anon number (e.g. `48` from Anonymous_4821) or a generated ghost/mask glyph — **no photos**.

## Typography
Inter (or Plus Jakarta Sans) via `@fontsource`; sizes: 12/14/16/20/24/32/48; headings semibold, tight tracking; message text 15px/1.5.

## Layout
- Desktop ≥1024: left rail (logo, nav icons, theme toggle, profile) + conversation list (320px) + thread (Telegram/Discord style two-pane).
- Tablet 640–1023: collapsible rail + single pane with list/thread switching.
- Mobile <640: bottom tab bar (Home, Discover, Chats(+badge), Profile); chat opens full-screen with back button; input sticks above keyboard (`env(safe-area-inset-bottom)`, `100dvh`).

## Motion (framer-motion, respect `prefers-reduced-motion`)
Page fade/slide 200 ms; list items stagger; message bubble pop-in (scale .96→1, 150 ms); typing indicator three bouncing dots; button press scale .98; skeleton shimmer; theme change 200 ms colour transition.

## Components (build once in `components/ui`)
Button (primary/secondary/ghost/danger, loading state), Input (label, hint, error, password toggle), Select/Segmented control (Male/Female), Card, Avatar (+online dot), Badge, Modal/ConfirmDialog, Toast (top-right / bottom on mobile), Skeleton, EmptyState (illustration + CTA), Spinner, ThemeToggle (sun/moon animated), Tabs/Chips (filters), DropdownMenu (chat header ⋮: Report, Block, End chat, Delete chat).

## Message bubbles
Mine: right, primary gradient, white text. Theirs: left, surface-2. Group consecutive messages (<2 min). Timestamp on hover/tap + date separators ("Today", "Yesterday"). Ticks: ✓ sent, ✓✓ seen (primary colour). Long words wrap; preserve newlines (`whitespace-pre-wrap`).
