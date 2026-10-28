# ORKOD Recovery — Screenshot Gallery

**Date:** 2026-10-28  
**Branch:** 1.0.1  
**Dev server:** http://localhost:5173  
**Browser:** Headless Edge (Chromium) — `--use-gl=angle --use-angle=swiftshader`

Verification of the seven recovered files against the running dev server.

## /start — StartJourney.vue

Both visitor choices are visible and navigable:

| Viewport | Screenshot |
|---|---|
| Desktop (1440x900) | [start-desktop.png](start/start-desktop.png) |
| Tablet (768x1024) | [start-tablet.png](start/start-tablet.png) |
| Mobile (390x844) | [start-mobile.png](start/start-mobile.png) |
| Mobile-narrow (360x800) | [start-mobile-narrow.png](start/start-mobile-narrow.png) |

## /home — HomePage.vue

Both chapters render correctly. Chapter 2 scrolls into view after wheel scroll.

| Viewport | Chapter 1 | Chapter 2 (after scroll) |
|---|---|---|
| Desktop (1440x900) | [home-ch1-desktop.png](home/home-ch1-desktop.png) | [home-ch2-scroll-desktop.png](home/home-ch2-scroll-desktop.png) |
| Tablet (768x1024) | [home-ch1-tablet.png](home/home-ch1-tablet.png) | [home-ch2-scroll-tablet.png](home/home-ch2-scroll-tablet.png) |
| Mobile (390x844) | [home-ch1-mobile.png](home/home-ch1-mobile.png) | [home-ch2-scroll-mobile.png](home/home-ch2-scroll-mobile.png) |
| Mobile-narrow (360x800) | [home-ch1-mobile-narrow.png](home/home-ch1-mobile-narrow.png) | [home-ch2-scroll-mobile-narrow.png](home/home-ch2-scroll-mobile-narrow.png) |

## /body — BodyExplorer3D.vue + HumanBody3D.vue

The 3D anatomical figure loads and renders. All seven organs are selectable.

| View | Screenshot |
|---|---|
| Body default (desktop) | [body-default-desktop.png](body/body-default-desktop.png) |
| Body default (tablet) | [body-default-tablet.png](body/body-default-tablet.png) |
| Body default (mobile) | [body-default-mobile.png](body/body-default-mobile.png) |
| Body default (mobile-narrow) | [body-default-mobile-narrow.png](body/body-default-mobile-narrow.png) |
| Org: Brain | [body-brain.png](body/body-brain.png) |
| Org: Lungs | [body-lungs.png](body/body-lungs.png) |
| Organ: Heart | [body-heart.png](body/body-heart.png) |
| Organ: Liver | [body-liver.png](body/body-liver.png) |
| Organ: Stomach | [body-stomach.png](body/body-stomach.png) |
| Organ: Intestines | [body-intestines.png](body/body-intestines.png) |
| Organ: Kidneys | [body-kidneys.png](body/body-kidneys.png) |

## Verification Results

| Check | Result |
|---|---|
| `/start` — both choice cards visible | PASS |
| `/start` — both CTAs visible without hover | PASS |
| `/start` — no horizontal overflow (any viewport) | PASS |
| `/home` — chapter 1 at top, heading visible | PASS |
| `/home` — chapter 2 scrolls into view | PASS |
| `/home` — footer below chapter 1 | PASS |
| `/home` — no horizontal overflow | PASS |
| `/body` — 3D body renders (`human3d--ready`) | PASS |
| `/body` — all 7 organs selectable (brain, lungs, heart, liver, stomach, intestines, kidneys) | PASS |
| `/body` — callout + detail title on organ selection | PASS |
| `/body` — deselect clears callout | PASS |
| `/body` — no missing images | PASS |
| Console errors | 0 |
| Arabic RTL (via LanguageGate → /start) | Works as designed |
