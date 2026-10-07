---
name: Clinical Evidence Engine
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#3f4850'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006399'
  on-secondary: '#ffffff'
  secondary-container: '#7bc2ff'
  on-secondary-container: '#004f7b'
  tertiary: '#00628d'
  on-tertiary: '#ffffff'
  tertiary-container: '#007cb1'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#94ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004b74'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.015em
  evidence-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system is engineered for healthcare practitioners, clinical researchers, and medical analysts evaluating clinical evidence, pharmacological trials, and diagnostic literature. The emotional objective is cognitive clarity, scientific precision, and absolute trust under high-stakes analytical conditions. The aesthetic fuses strict minimalism with high-density data architecture—eliminating visual noise while maximizing typographic legibility and rapid structural scanning.

Key brand tenets:
- **Absolute Objectivity**: Every element communicates verifiable hierarchy without decorative ambiguity.
- **Cognitive Relief**: High-exposure white and cool gray surfaces provide sustained viewing comfort during extensive analytical sessions.
- **Precision Engineering**: Micro-radii, hairline dividers, and systematic evidence pill badges convey scientific discipline.

## Colors

The palette establishes an authentic clinical atmosphere using cool light gray structural tiers, focused cobalt and cerulean accents, and dark slate neutrals. Absolute pitch black (`#000000`) is strictly prohibited to prevent harsh contrast and visual fatigue.

### Core Architecture
- **Primary (`#0284C7`)**: Primary clinical action, focus rings, confirmed validation markers.
- **Secondary (`#0369A1`)**: High-contrast interactive states, key categorical headers, deep blue emphasis.
- **Tertiary (`#0EA5E9`)**: Active tab markers, micro-charts, and tertiary highlights.
- **Neutral Primary (`#1E293B`)**: Dominant typography, high-contrast structural borders, and critical metric values.

### Supporting Surfaces & Borders
- **Canvas Base**: `#FFFFFF` for data cards, modals, and focal surfaces.
- **Surface Tier 1**: `#F8FAFC` for page canvases and side panel rails.
- **Surface Tier 2**: `#F1F5F9` for nested tables, inactive inputs, and badge fills.
- **Hairline Dividers**: `#E2E8F0` for structural borders, metric splitters, and data grids.
- **Muted Text**: `#334155` for secondary descriptions and metadata; `#475569` for tabular labels, captions, and tooltips.

### Evidence & Confidence Status (GRADE Framework)
- **High Quality**: Background `#F0FDF4`, Border `#BBF7D0`, Foreground `#15803D`.
- **Moderate Quality**: Background `#F0F9FF`, Border `#BAE6FD`, Foreground `#0369A1`.
- **Low Quality**: Background `#FFFBEB`, Border `#FDE68A`, Foreground `#B45309`.
- **Very Low / High Risk**: Background `#FEF2F2`, Border `#FECACA`, Foreground `#B91C1C`.

## Typography

The type scale relies entirely on Inter, specified for its neutral, highly engineered grotesque letterforms and legible numerals. 

- **Tabular Figures**: All data displays, cohort counts, p-values, and statistical intervals must use the `tnum` (tabular numbers) OpenType feature flag.
- **Hierarchical Discipline**: Body text never drops below 13px in analytical work surfaces to guarantee accessibility under variable monitor calibrations.
- **Evidence Labeling**: The `evidence-badge` level utilizes uppercase transformation with 0.04em tracking for instant evaluation across scanning panes.

## Layout & Spacing

The layout operates on a compact 4px base rhythm within a 12-column fluid grid system, scaling into a fixed maximum analytical canvas of 1600px.

- **Desktop (>= 1200px)**: 12-column layout with 24px (`margin-lg`) canvas bounds and 24px (`gutter-lg`) gutters. Allows persistent dual-pane workflows (e.g., protocol document side-by-side with evaluation matrix).
- **Tablet (768px - 1199px)**: 8-column layout with 24px margins and 16px gutters. Secondary data inspectors collapse into sliding clinical trays.
- **Mobile (< 768px)**: 4-column layout with 16px (`margin`) margins and 16px (`gutter`) gutters. Scientific tables switch from multi-column grids to card-based metric stacks.

## Elevation & Depth

Visual hierarchy is maintained through subtle tonal layering and crisp, low-contrast structural outlines rather than heavy atmospheric shadows.

- **Base Elevation (Flat)**: Pure white `#FFFFFF` cards sit directly on `#F8FAFC` backgrounds, defined by a 1px solid `#E2E8F0` border.
- **Interactive Hover**: Cards transition cleanly with a subtle border tint to `#CBD5E1` paired with a zero-spread micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Flyout Panels & Popovers**: Clinical references and contextual inspector drawers leverage an elevation shadow tinted with deep slate: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`, bounded by a 1px `#E2E8F0` edge.
- **Modal Dialogs**: System alerts utilize `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` over a translucent `#0F172A`/40 backdrop blur (2px).

## Shapes

The interface embraces a disciplined "Soft" geometric profile (`roundedness: 1`). 

- **Inputs, Buttons, and Data Cells**: 4px (`0.25rem`) corner radius. This conveys architectural precision, structural rigidity, and data density.
- **Cards & Data Modules**: 8px (`0.5rem`) corner radius, avoiding overly organic or playful curvature.
- **Evidence Rating Indicators (GRADE pills)**: Fully rounded (`9999px` pill architecture), distinctly separating semantic classification badges from interactive controls and content containers.

## Components

### Buttons
- **Primary**: Solid `#0284C7` background, `#FFFFFF` text, 4px radius, 36px fixed height (`space-sm` vertical, `space-lg` horizontal padding). Active state `#0369A1`. Focus outline: 2px `#0EA5E9` with 2px `#FFFFFF` offset.
- **Secondary**: `#FFFFFF` background, 1px `#E2E8F0` border, `#1E293B` text. Hover state `#F8FAFC` background with `#CBD5E1` border.
- **Ghost / Action**: Transparent background, `#334155` text. Hover state `#F1F5F9`.

### Chips & Evidence Badges
- **Scientific Evidence Pills (GRADE)**: 20px fixed height, pill-shaped radius, uppercase `evidence-badge` font, 8px horizontal padding, 1px solid border matching semantic level (e.g., High Quality: `#BBF7D0` border, `#F0FDF4` fill, `#15803D` text).
- **Filter Chips**: 28px height, 4px radius, `#F1F5F9` background, `#334155` text, 1px `#E2E8F0` border. When selected: `#E0F2FE` background, `#0369A1` text, `#0284C7` border.

### Form Inputs
- **Text & Numeric Inputs**: Pure white canvas, 1px `#CBD5E1` outline, `#1E293B` text, 36px height, 4px radius. Focus: border shifts to `#0284C7` accompanied by an inline halo `0 0 0 1px #0284C7`.
- **Labels**: Positioned strictly top-aligned, `label-sm` font, `#334155` color, accompanied by a 4px bottom gap.

### Selection Controls
- **Checkboxes & Radios**: 16px square/circle, 1px `#CBD5E1` border, 3px corner radius (checkbox). Checked state: `#0284C7` fill with crisp white internal mark.

### Data Tables & Cards
- **Cards**: Pure white `#FFFFFF` surface, 1px solid `#E2E8F0` border, 8px radius, `space-lg` padding. Headers feature a bottom `#E2E8F0` hairline divider.
- **Clinical Data Tables**: Row height 40px (compact) or 48px (standard). Alternating rows disabled; headers use `#F8FAFC` background, `label-sm` uppercase text in `#475569`, and a 1px solid bottom border in `#E2E8F0`. Numeric values enforce `metric-tabular` font.

### Specialized Component: Confidence Score Meter
- Horizontal segmented micro-bar (4 segments) embedded within metadata rows. Unfilled segments use `#F1F5F9`; filled segments dynamically mirror the evidence grade color (High = 4 green bars, Moderate = 3 blue bars, Low = 2 amber bars, Very Low = 1 red bar).