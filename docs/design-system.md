# Design system

The Creator OS brand is fixed: premium, minimal, focused, and dark—not a generic admin dashboard. The checked-in implementation uses Inter, `#080808` background, `#111111`/`#161616` surfaces, `#FAFAFA` foreground, `#A1A1AA`/`#71717A` muted text, and signature purple `#7C3AED` (`primary`). Global radius is 16px; individual controls commonly use 10–12px and cards 16–20px.

Use subdued white-opacity borders, compact typography, Lucide icons, Framer Motion fade/scale/layout transitions, and responsive padding already established in `DashboardLayout.tsx`. Preserve the wordmark, grouped sidebar, low-contrast cards, premium empty states, and mobile drawer. The pipeline’s deliberate responsive behavior is full Kanban at `md+` and a vertical list below that breakpoint.
