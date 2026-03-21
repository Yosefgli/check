# Design System Specification: Editorial Precision

## 1. Overview & Creative North Star: "The Modern Architect"
This design system moves away from the "template" aesthetic of traditional management systems. Instead of a rigid grid of boxes and lines, we adopt the **Modern Architect** North Star. This philosophy treats the UI as a physical space defined by light, depth, and intentional hierarchy. 

We emphasize an **Editorial Layout** style: using generous whitespace (the "oxygen" of the interface) and high-contrast typography to guide the eye. By eliminating traditional borders and using tonal layering, we create a high-end, bespoke environment that feels authoritative yet breathable. In the context of a Hebrew-first (RTL) environment, this provides the clarity needed for complex data without the visual clutter.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a professional "Business Blue," but its application is sophisticated. We rely on Material Design 3 logic to ensure every element has a functional purpose.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section sitting on a `surface` background creates a natural boundary that feels integrated, not "caged."

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as stacked sheets of fine paper. 
- **Base Layer:** `surface` (#f7f9fb)
- **Content Sections:** `surface_container_low` (#f2f4f6)
- **Active Cards/Modals:** `surface_container_lowest` (#ffffff)
- **Navigation/Sidebars:** `surface_container_high` (#e6e8ea)

### Glass & Gradient Rule
To move beyond "out-of-the-box" blue, use **Glassmorphism** for floating elements (e.g., top navigation or dropdowns). Use a semi-transparent `surface_container_lowest` with a `backdrop-blur` of 12px.
- **Signature Gradient:** For primary CTAs, transition from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle. This adds a subtle "glow" that feels premium.

---

## 3. Typography: Hebrew Editorial Scale
We utilize a high-contrast scale where display text is bold and assertive, while body text is light and legible. The font family is **Heebo** or **Assistant**, optimized for Hebrew legibility.

*   **Display (lg/md/sm):** Used for dashboard summaries and high-level KPIs. Heavy weight (700). These should feel like magazine headlines.
*   **Headline (lg/md/sm):** Used for page titles and major section headers. Medium weight (500).
*   **Title (lg/md/sm):** Used for card headers and modal titles.
*   **Body (lg/md/sm):** The workhorse for data and descriptions. Use `on_surface_variant` (#434655) for secondary descriptions to reduce visual noise.
*   **Label (md/sm):** Used for button text and micro-copy. Always uppercase or slightly tracked out in English; in Hebrew, use a slightly heavier weight (600) to maintain presence at small sizes.

---

## 4. Elevation & Depth: Tonal Layering
Hierarchy is achieved through light and shadow, mimicking a natural office environment.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. The 2-step shift in hex value creates a soft, tactile lift.
*   **Ambient Shadows:** Use only when an element "floats" over content (e.g., a Sidebar or a Popover). 
    *   **Shadow Value:** `box-shadow: 0 12px 32px -4px rgba(25, 28, 30, 0.06);`
    *   The shadow is tinted with the `on_surface` color to look like a natural occlusion shadow rather than a grey smudge.
*   **The "Ghost Border":** If a border is required for accessibility in data tables, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Refined Utility

### Buttons & Chips
- **Primary Button:** Rounded at `DEFAULT` (8px). Use the Signature Gradient. No border.
- **Secondary Button:** `secondary_container` background with `on_secondary_container` text.
- **Action Chips:** Use `full` (9999px) roundedness. They should look like physical pebbles on the page.

### Data Tables (Clearance & Precision)
- **Rule:** Forbid divider lines.
- **Execution:** Use a `surface_container_low` background for the header row. Use a 12px vertical `Spacing` between rows. A hover state should trigger a `surface_container_highest` background shift to highlight the active row.

### Input Fields (RTL-First)
- **Logic:** Labels must be right-aligned. The "Focus" state should not just change border color, but slightly "lift" the input using a subtle shadow and a 2px `primary` bottom-bar highlight.

### Cards & Lists
- **Structure:** Avoid the "Box" look. Use `lg` (1rem) padding and rely on the spacing scale to separate items. A list item is separated from the next by a `12` (3rem) spacing gap, not a line.

---

## 6. Do’s and Don’ts

### Do
- **Do** prioritize RTL flow: Ensure the eye moves from top-right to bottom-left naturally.
- **Do** use `surface_container` levels to group related items instead of using "frames."
- **Do** use "Optical Alignment": In Hebrew, some characters have different visual weights; ensure icons are optically centered next to text.
- **Do** leave "Wasteful" White Space: Premium design requires room to breathe. Use the `16` and `20` spacing tokens between major sections.

### Don't
- **Don't** use 100% black (#000000) for text. Always use `on_surface` (#191c1e) to keep the contrast sophisticated.
- **Don't** use "Drop Shadows" on flat buttons. Only use elevation for elements that actually sit "above" the UI layer.
- **Don't** use sharp 0px corners. Every element, including images and progress bars, must respect the `8px` (DEFAULT) or `lg` (16px) radius to maintain the "Soft Minimalism" feel.
- **Don't** use high-contrast dividers. If you must separate content, use a 4px wide `surface_variant` vertical bar rather than a thin 1px horizontal line.