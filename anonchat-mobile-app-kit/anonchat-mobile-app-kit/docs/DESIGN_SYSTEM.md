# Mobile Design System (matches web tokens)

Use the same palette as the web kit (violet primary `#7C3AED`/`#8B5CF6`, accent gradient violet→pink, bg `#F7F7FB`/`#0E0F1A`, surface `#FFFFFF`/`#161827`, surface-2 `#F0F1F7`/`#1E2033`, border `#E4E6F0`/`#2A2D45`, text `#12131F`/`#ECEDF7`, muted `#6B6F8A`/`#8E92B0`, online `#22C55E`, danger `#EF4444`). Define in `tailwind.config.js` (NativeWind) AND `src/theme/tokens.ts` for non-class usage (e.g. icons, gradients).

- Dark/light: `System|Light|Dark` (NativeWind `useColorScheme`/`colorScheme.set`), persisted; also PATCH `/me {theme}`. StatusBar style follows theme.
- Typography: Inter (400/500/600/700) via expo-google-fonts; message text 16/22.
- Shapes: rounded-2xl cards, pill chips, 44pt min touch targets, 12–16 px screen padding, large title headers.
- Gradients: `expo-linear-gradient` for primary buttons, own bubbles, welcome screen.
- Motion: Reanimated — screen transitions (native stack), list item enter (FadeInDown), bubble pop, typing dots, button press scale, shimmer skeletons, pull-to-refresh. Respect reduce-motion (`AccessibilityInfo.isReduceMotionEnabled`).
- Components: Button (loading/disabled/haptic), TextField (label, error, secure toggle), SegmentedControl (Male/Female), Card, Avatar (+online dot), Badge, BottomSheet (actions: Report/Block/End/Delete — use `@gorhom/bottom-sheet` or Modal), ConfirmDialog, Toast, Skeleton, EmptyState, FilterChips (All/Male/Female/Online), OtpInput (6 cells, SMS-style autofill not applicable — email OTP; support paste), ListSeparator.
- Bubbles: same rules as web (mine right gradient, theirs left surface-2, grouping, date separators, ✓/✓✓ ticks, long-press copy).
- Accessibility: `accessibilityLabel/Role` on all touchables, dynamic type friendly, contrast AA both themes.
