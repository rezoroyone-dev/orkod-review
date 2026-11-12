# ORKOD /start — Performance & Body Explorer Evidence

**Branch:** visual-review/start-edge-body-selection-2026-11-11  
**Application commit:** f57c816  
**Branch:** nature-green-final

## Changes Made

### 1. /start — Right Edge White Line Fix

**Problem:** When scrolling horizontally or vertically on /start, a white vertical line appeared on the right edge of the screen.

**Root cause:** The hero image (`OrkodMark.webp`) had `width: 100%` with `object-fit: cover`, which caused it to overflow the container horizontally when scaled.

**Fix:** Changed `height: 100%` to `min-height: 100%` on `.start-scene-img`, and added `overflow: hidden` to `.start-scene-media` to clip any overflow.

### 2. Body Explorer — White Selection Glow

**Problem:** The Body Explorer didn't have a clear visual indication of which organ/hand was selected.

**Fix:** Added white glow effect (`new THREE.Color(0xffffff)`) to selected organs and hands, with increased opacity for selected state.

## Screenshots

### /start - Before and After

| Viewport | Before | After |
|----------|--------|-------|
| 1440×900 Desktop | [before/start_desktop_before.png](before/start_desktop_before.png) | [after/start_desktop_after.png](after/start_desktop_after.png) |
| 1366×768 Desktop | [before/start_1366x768_before.png](before/start_1366x768_before.png) | [after/start_1366x768_after.png](after/start_1366x768_after.png) |
| 768×1024 Tablet | [before/start_768x1024_before.png](before/start_768x1024_before.png) | [after/start_768x1024_after.png](after/start_768x1024_after.png) |
| 390×844 Mobile | [before/start_390x844_before.png](before/start_390x844_before.png) | [after/start_390x844_after.png](after/start_390x844_after.png) |
| 360×800 Mobile | [before/start_360x800_before.png](before/start_360x800_before.png) | [after/start_360x800_after.png](after/start_360x800_after.png) |

### Body Explorer - Hand Selection

| Hand | Viewport | Screenshot |
|------|----------|------------|
| Left Hand | Desktop | [hand_left_desktop_selected.png](hand_left_desktop_selected.png) |
| Right Hand | Desktop | [hand_right_desktop_selected.png](hand_right_desktop_selected.png) |

## Verification

- TypeScript typecheck: PASS
- Build: PASS  
- Tests: 194 passed, 84 failed (pre-existing failures, no new failures)
