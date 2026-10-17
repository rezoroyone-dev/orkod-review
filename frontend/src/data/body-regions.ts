// Shared body-region catalogue for the 3D Body Explorer, the region legend on
// the homepage and the dedicated organ/body-area info pages. Each region maps to
// existing, non-invented educational content (i18n keys + wellness topic slugs).

export interface BodyRegion {
  id: string;
  titleKey: string;
  descKey: string;
  group: 'front' | 'back';
  /**
   * Primary wellness topic slug used by the symptom-guide CTA.
   */
  symptomSlug: string;
  /**
   * Related topic slugs shown on the organ info page (subjects link to the
   * existing data-driven symptom guides in /symptoms).
   */
  topicSlugs: string[];
}

export const BACK_BODY_REGIONS: BodyRegion[] = [
  { id: 'head', titleKey: 'Region_Head', descKey: 'Region_Head_desc', group: 'back', symptomSlug: 'headache', topicSlugs: ['headache', 'eye-strain', 'stress-anxiety'] },
  { id: 'neck', titleKey: 'Region_Neck', descKey: 'Region_Neck_desc', group: 'back', symptomSlug: 'neck-pain', topicSlugs: ['neck-pain', 'shoulder-tension', 'headache'] },
  { id: 'shoulders', titleKey: 'Region_Shoulder', descKey: 'Region_Shoulder_desc', group: 'back', symptomSlug: 'shoulder-tension', topicSlugs: ['shoulder-tension', 'neck-pain', 'back-pain'] },
  { id: 'back', titleKey: 'Region_Back', descKey: 'Region_Back_desc', group: 'back', symptomSlug: 'back-pain', topicSlugs: ['back-pain', 'shoulder-tension', 'joint-pain'] },
  { id: 'lowerback', titleKey: 'Region_LowerBack', descKey: 'Region_LowerBack_desc', group: 'back', symptomSlug: 'back-pain', topicSlugs: ['back-pain', 'knee-pain'] },
  { id: 'pelvis', titleKey: 'Region_Pelvis', descKey: 'Region_Pelvis_desc', group: 'back', symptomSlug: 'digestive-discomfort', topicSlugs: ['digestive-discomfort', 'low-energy'] },
  { id: 'legs', titleKey: 'Region_Legs', descKey: 'Region_Legs_desc', group: 'back', symptomSlug: 'knee-pain', topicSlugs: ['knee-pain', 'low-energy', 'joint-pain'] },
  { id: 'knees', titleKey: 'Region_Knees', descKey: 'Region_Knees_desc', group: 'back', symptomSlug: 'knee-pain', topicSlugs: ['knee-pain', 'joint-pain'] },
  { id: 'ankle', titleKey: 'Region_Ankle', descKey: 'Region_Ankle_desc', group: 'back', symptomSlug: 'joint-pain', topicSlugs: ['joint-pain', 'knee-pain'] },
  { id: 'feet', titleKey: 'Region_Feet', descKey: 'Region_Feet_desc', group: 'back', symptomSlug: 'joint-pain', topicSlugs: ['joint-pain', 'knee-pain'] },
];

export const FRONT_BODY_REGIONS: BodyRegion[] = [
  { id: 'head', titleKey: 'Region_Head', descKey: 'Region_Head_desc', group: 'front', symptomSlug: 'headache', topicSlugs: ['headache', 'eye-strain', 'stress-anxiety'] },
  { id: 'eyes', titleKey: 'Region_Eyes', descKey: 'Region_Eyes_desc', group: 'front', symptomSlug: 'eye-strain', topicSlugs: ['eye-strain', 'headache'] },
  { id: 'neck', titleKey: 'Region_Neck', descKey: 'Region_Neck_desc', group: 'front', symptomSlug: 'neck-pain', topicSlugs: ['neck-pain', 'shoulder-tension', 'headache'] },
  { id: 'shoulders', titleKey: 'Region_Shoulder', descKey: 'Region_Shoulder_desc', group: 'front', symptomSlug: 'shoulder-tension', topicSlugs: ['shoulder-tension', 'neck-pain', 'back-pain'] },
  { id: 'chest', titleKey: 'Region_Chest', descKey: 'Region_Chest_desc', group: 'front', symptomSlug: 'stress-anxiety', topicSlugs: ['stress-anxiety', 'breathing-topic', 'heart-topic'] },
  { id: 'heart', titleKey: 'Region_Heart', descKey: 'Region_Heart_desc', group: 'front', symptomSlug: 'heart-topic', topicSlugs: ['heart-topic', 'breathing-topic', 'stress-anxiety', 'low-energy'] },
  { id: 'lungs', titleKey: 'Region_Lungs', descKey: 'Region_Lungs_desc', group: 'front', symptomSlug: 'breathing-topic', topicSlugs: ['breathing-topic', 'stress-anxiety', 'low-energy'] },
  { id: 'liver', titleKey: 'Region_Liver', descKey: 'Region_Liver_desc', group: 'front', symptomSlug: 'digestive-discomfort', topicSlugs: ['digestive-discomfort', 'low-energy', 'stress-anxiety'] },
  { id: 'stomach', titleKey: 'Region_Stomach', descKey: 'Region_Stomach_desc', group: 'front', symptomSlug: 'digestive-discomfort', topicSlugs: ['digestive-discomfort', 'low-energy', 'stress-anxiety'] },
  { id: 'intestines', titleKey: 'Region_Intestines', descKey: 'Region_Intestines_desc', group: 'front', symptomSlug: 'digestive-discomfort', topicSlugs: ['digestive-discomfort', 'low-energy', 'stress-anxiety'] },
  { id: 'kidneys', titleKey: 'Region_Kidneys', descKey: 'Region_Kidneys_desc', group: 'front', symptomSlug: 'low-energy', topicSlugs: ['low-energy', 'back-pain', 'digestive-discomfort'] },
  { id: 'brain', titleKey: 'Region_Brain', descKey: 'Region_Brain_desc', group: 'front', symptomSlug: 'headache', topicSlugs: ['headache', 'stress-anxiety', 'insomnia', 'eye-strain'] },
  { id: 'abdomen', titleKey: 'Region_Abdomen', descKey: 'Region_Abdomen_desc', group: 'front', symptomSlug: 'digestive-discomfort', topicSlugs: ['digestive-discomfort', 'low-energy', 'stress-anxiety'] },
  { id: 'pelvis', titleKey: 'Region_Pelvis', descKey: 'Region_Pelvis_desc', group: 'front', symptomSlug: 'digestive-discomfort', topicSlugs: ['digestive-discomfort', 'low-energy'] },
  { id: 'arms', titleKey: 'Region_Arms', descKey: 'Region_Arms_desc', group: 'front', symptomSlug: 'joint-pain', topicSlugs: ['joint-pain', 'shoulder-tension'] },
  { id: 'thigh', titleKey: 'Region_Thigh', descKey: 'Region_Thigh_desc', group: 'front', symptomSlug: 'knee-pain', topicSlugs: ['knee-pain', 'joint-pain'] },
  { id: 'knees', titleKey: 'Region_Knees', descKey: 'Region_Knees_desc', group: 'front', symptomSlug: 'knee-pain', topicSlugs: ['knee-pain', 'joint-pain'] },
  { id: 'legs', titleKey: 'Region_Legs', descKey: 'Region_Legs_desc', group: 'front', symptomSlug: 'knee-pain', topicSlugs: ['knee-pain', 'low-energy', 'joint-pain'] },
  { id: 'feet', titleKey: 'Region_Feet', descKey: 'Region_Feet_desc', group: 'front', symptomSlug: 'joint-pain', topicSlugs: ['joint-pain', 'knee-pain'] },
];

export const BODY_REGIONS: BodyRegion[] = [...BACK_BODY_REGIONS, ...FRONT_BODY_REGIONS];

/** Small projection used by the 3D viewers (id + i18n keys). */
export interface RegionLabel {
  id: string;
  titleKey: string;
  descKey: string;
}

export const BACK_REGION_LABELS: RegionLabel[] = BACK_BODY_REGIONS;
export const FRONT_REGION_LABELS: RegionLabel[] = FRONT_BODY_REGIONS;

export function regionById(id: string): BodyRegion | undefined {
  return BODY_REGIONS.find((r) => r.id === id);
}

export function regionSymptomSlug(id: string): string {
  return regionById(id)?.symptomSlug ?? 'back-pain';
}