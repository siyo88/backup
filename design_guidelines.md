# Design Guidelines: Colorful Drawing Community Platform

## Design Approach
**Hybrid Reference Approach**: Drawing inspiration from creative community platforms (Oekaki boards, Pixiv) combined with modern web aesthetics. The design prioritizes playful, colorful interactions while maintaining functional clarity for the drawing tools.

**Core Aesthetic**: Bright, cheerful primary colors with a cute, welcoming atmosphere. Think vibrant candy colors (bright pink, electric blue, sunny yellow, lime green, purple) against clean white backgrounds.

---

## Typography

**Font Selection**: 
- Primary: Inter or DM Sans (clean, modern, highly legible)
- Headings: 600-700 weight
- Body: 400-500 weight

**Hierarchy**:
- Page Title ("The great me and The follower"): 40px, bold
- Tab Navigation: 16px, medium weight
- Card Titles: 20px, semibold
- Body Text/Memos: 14px, regular
- Button Labels: 14px, medium
- Comments: 13px, regular

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 8, 12, 16 for consistency
- Component padding: p-4 to p-8
- Section margins: mb-8 to mb-16
- Tight spacing: gap-2
- Standard spacing: gap-4
- Generous spacing: gap-8

**Grid Structure**:
- Max width container: max-w-7xl
- Member cards: 3-column grid on desktop (grid-cols-3), single column mobile
- Gallery images: Masonry-style grid with varying aspect ratios

---

## Component Library

### Navigation Tabs
- Centered horizontal layout with equal spacing (gap-8)
- Active tab: Colorful underline (4px thick) matching theme color
- Inactive tabs: Neutral gray with hover state showing lighter version of theme color
- Smooth transition on tab changes

### Member Cards
- Rounded corners (rounded-2xl)
- Subtle shadow (shadow-md) with hover lift effect (shadow-lg)
- Profile photo: Circular (rounded-full), 120px diameter
- Colorful border (4px) in different theme colors (pink for me, blue for follower1, purple for follower2)
- Memo area: Light gray background (bg-gray-50), rounded input field
- "View Board" button: Vibrant gradient matching card border color

### Paint Tool Interface
- Canvas: 500x500px centered with subtle drop shadow
- Tool panel: Left sidebar with colorful icon buttons (48px each)
- Active tool: Bright background highlight with white icon
- Color picker: Grid of primary colors with selected color showing checkmark
- Brush size indicator: Live preview circle following cursor
- Layer panel: Right sidebar with draggable layer items, thumbnail previews
- Keyboard shortcuts displayed on hover as tooltips

### Image Gallery
- Cards with rounded corners (rounded-xl)
- Original aspect ratio maintained
- Hover overlay: Semi-transparent gradient from bottom showing metadata
- Comment count badge: Colorful pill in top-right corner
- Upload button: Large, dashed border area with upload icon and "Upload your art!" text

### Comment Section
- Threaded layout below each image
- Comment bubbles: Alternating subtle background colors (blue-50, pink-50, purple-50)
- User avatars: Small circles (32px) with colorful borders
- Timestamp: Small gray text
- Input field: Rounded with emoji picker button

### Buttons
**Primary Actions** (Upload, Post, Save):
- Vibrant gradient backgrounds (pink-to-purple, blue-to-teal)
- White text, rounded-full
- Padding: px-8 py-3
- Hover: Slightly darker gradient with subtle scale transform

**Secondary Actions** (Cancel, Back):
- Outlined style with theme color border
- Transparent background
- Hover: Light background fill

**Tool Buttons**:
- Square (48x48px) with rounded corners
- Icon-only with tooltip
- Active state: Filled with theme color

---

## Visual Elements

**Icons**: Use Heroicons (outline style for inactive, solid for active states)

**Borders & Dividers**: 
- Cards: 2px solid borders in theme colors
- Sections: 1px light gray dividers
- Input fields: 2px border that brightens on focus

**Shadows**:
- Cards: shadow-md (rest), shadow-lg (hover)
- Modals: shadow-2xl
- Floating elements: shadow-xl

**Corners**:
- Small elements (buttons): rounded-lg
- Cards: rounded-2xl
- Images: rounded-xl
- Full circles: rounded-full

---

## Interactions

**Minimal Animations**:
- Tab transitions: 200ms ease
- Card hover lift: 150ms ease
- Button hover: 100ms ease
- Tool selection: Instant feedback with color change

**Cursor States**:
- Brush tool: Custom circular cursor showing brush size (opacity 50%)
- Draggable layers: Grab cursor
- Clickable elements: Pointer cursor

---

## Color Strategy (Applied Later)

Guidelines prepared for a vibrant palette featuring:
- Primary colors: Bright pink, electric blue, sunny yellow, lime green, purple
- Backgrounds: Pure white for main areas, light grays for input fields
- Text: Dark gray (not pure black) for readability
- Accents: Each member/board gets assigned theme color for consistency

---

## Images

**Profile Photos**: User-uploaded circular images with colorful borders, placeholder shows cute avatar icon

**Gallery Images**: User-uploaded artwork displayed at original aspect ratios with subtle shadows and rounded corners

**No hero image**: This is a utility application focused on functionality over marketing