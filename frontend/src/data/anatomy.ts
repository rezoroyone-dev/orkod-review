/**
 * Shared anatomy metadata for the 3D body explorer.
 *
 * Kept in one place so the rendered organ colours and the organ chips in the UI
 * can never drift apart.
 *
 * Geometry: BodyParts3D (c) Database Center for Life Science, CC BY 4.0,
 * curated by frontend/scripts/build-anatomy.mjs. See
 * /public/models/anatomy/ATTRIBUTION.md.
 */

export interface AnatomyOrgan {
  id: string;
  titleKey: string;
  descKey: string;
  /** CSS colour, matching the Three.js material colour below. */
  color: string;
}

/**
 * The individually selectable internal organs, in torso order.
 *
 * These are medical-illustration colours chosen to read against a near-black
 * void. Two of them were corrected because they fought the page:
 *
 *   intestines  was `#86b96b`, a grass green. It is the single largest organ
 *               mass on screen (it fills the whole lower abdomen), so a green
 *               bowel turned the stage green. Real bowel is a pinkish-tan
 *               tube, so this is now a muted clay-rose — anatomically closer
 *               and it no longer recolours the page.
 *   liver       was `#7d3a24`, a dark rust that read as brown. Liver is dark
 *               *red*, not brown; this deepens it toward crimson so it stays
 *               medically legible without dragging the palette warm.
 *
 * The remaining colours (brain, lungs, heart, stomach, kidneys) are unchanged:
 * they were already correct and already on-palette.
 */
export const ANATOMY_ORGANS: AnatomyOrgan[] = [
  { id: 'brain', titleKey: 'Region_Brain', descKey: 'Region_Brain_desc', color: '#cfe0ea' },
  { id: 'lungs', titleKey: 'Region_Lungs', descKey: 'Region_Lungs_desc', color: '#f2a6c0' },
  { id: 'heart', titleKey: 'Region_Heart', descKey: 'Region_Heart_desc', color: '#d93a3f' },
  { id: 'liver', titleKey: 'Region_Liver', descKey: 'Region_Liver_desc', color: '#8f2f2f' },
  { id: 'stomach', titleKey: 'Region_Stomach', descKey: 'Region_Stomach_desc', color: '#f2b03c' },
  { id: 'intestines', titleKey: 'Region_Intestines', descKey: 'Region_Intestines_desc', color: '#c98d86' },
  { id: 'kidneys', titleKey: 'Region_Kidneys', descKey: 'Region_Kidneys_desc', color: '#9d6bd6' },
];

export const ORGAN_IDS = new Set(ANATOMY_ORGANS.map((o) => o.id));

export function isOrgan(id: string | null | undefined): boolean {
  return !!id && ORGAN_IDS.has(id);
}

/** Three.js colour per anatomical region (organs + the two surface layers). */
export const REGION_COLORS: Record<string, number> = {
  ...Object.fromEntries(ANATOMY_ORGANS.map((o) => [o.id, parseInt(o.color.slice(1), 16)])),
  // Dead entries, kept so the manifest's region names still resolve. `skin` is
  // filtered out of the bundle before anything is built or drawn — the human
  // body GLB is the only external shell. `skeleton` is the optional toggle layer
  // and is recoloured for the dark stage below.
  skin: 0xe9cbb0,
  skeleton: 0xd6d0e4,
};
