export type AcademyCategory = 'foundation' | 'practitioner' | 'specialised' | 'protection';

export interface AcademyCourse {
  slug: string;
  titleKey: string;
  descriptionKey: string;
  levelKey: 'Level_1' | 'Level_2' | 'Level_3';
  icon: string;
  category: AcademyCategory;
  days: number;
  lessons: number;
  accent: { from: string; to: string };
  modules: { title: string; items: string[] }[];
}

export const ACADEMY_CATEGORIES: { key: AcademyCategory; labelKey: string }[] = [
  { key: 'foundation', labelKey: 'Academy_Category_foundation' },
  { key: 'practitioner', labelKey: 'Academy_Category_practitioner' },
  { key: 'specialised', labelKey: 'Academy_Category_specialised' },
  { key: 'protection', labelKey: 'Academy_Category_protection' },
];

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    slug: 'divine-healing',
    titleKey: 'divine_healing',
    descriptionKey: 'Academy_Course_divine-healing_desc',
    levelKey: 'Level_1',
    icon: 'mdi-spa',
    category: 'foundation',
    days: 2,
    lessons: 6,
    accent: { from: '#D4AF37', to: '#8C6A24' },
    modules: [
      {
        title: 'Day 1 — Foundations',
        items: [
          'Introduction to the energy body and energy anatomy',
          'Energy scanning and assessment techniques',
          'Cleansing methods: sweeping, cord-cutting and flushing',
        ],
      },
      {
        title: 'Day 2 — Practice',
        items: [
          'Energising techniques for different body systems',
          'Chakra balancing basics and aura cleansing',
          'Supervised self-practice and simple case studies',
        ],
      },
    ],
  },
  {
    slug: 'advanced-divine-healing',
    titleKey: 'Advanced_divine_healing',
    descriptionKey: 'Academy_Course_advanced-divine-healing_desc',
    levelKey: 'Level_2',
    icon: 'mdi-creation',
    category: 'practitioner',
    days: 2,
    lessons: 6,
    accent: { from: '#8C6A24', to: '#8C6A24' },
    modules: [
      {
        title: 'Day 1 — Advanced techniques',
        items: [
          'Deep scanning and subtle energy assessment',
          'Colour prana selection and application',
          'Foundations of distant healing',
        ],
      },
      {
        title: 'Day 2 — Protocols',
        items: [
          'Disease-specific treatment protocols',
          'Treatment planning and session sequencing',
          'Supervised practice with peer feedback',
        ],
      },
    ],
  },
  {
    slug: 'pranic-psychotherapy',
    titleKey: 'Pranic_Psychotherapy_Healing',
    descriptionKey: 'Academy_Course_pranic-psychotherapy_desc',
    levelKey: 'Level_2',
    icon: 'mdi-brain',
    category: 'specialised',
    days: 4,
    lessons: 8,
    accent: { from: '#23B14D', to: '#1A7D38' },
    modules: [
      {
        title: 'Day 1 — Emotional energy anatomy',
        items: ['How emotions connect to the energy body', 'Identifying thought forms and mental patterns'],
      },
      {
        title: 'Day 2 — Subconscious patterns',
        items: ['Reading subconscious programming through energy', 'Cleansing accumulated psychological debris'],
      },
      {
        title: 'Day 3 — Psychotherapeutic protocols',
        items: ['Structured protocols for emotional healing', 'Inner child work and past-pattern release'],
      },
      {
        title: 'Day 4 — Integration',
        items: ['Case discussions and group practice', 'Building a personal practice plan and ongoing supervision'],
      },
    ],
  },
  {
    slug: 'pranic-crystal',
    titleKey: 'Pranic_Cristal_Healing',
    descriptionKey: 'Academy_Course_pranic-crystal_desc',
    levelKey: 'Level_2',
    icon: 'mdi-diamond-stone',
    category: 'specialised',
    days: 2,
    lessons: 5,
    accent: { from: '#D4AF83', to: '#B8963A' },
    modules: [
      {
        title: 'Day 1 — Crystal basics',
        items: [
          'How crystals interact with pranic energy',
          'Selecting, cleansing and programming crystals',
          'Cleansing and energising techniques with crystals',
        ],
      },
      {
        title: 'Day 2 — Application',
        items: [
          'Chakra-specific crystal placement protocols',
          'Advanced crystal grids for focused healing',
          'Supervised practice sessions',
        ],
      },
    ],
  },
  {
    slug: 'psychic-self-defence',
    titleKey: 'Practical_Psychic_Self_Defence',
    descriptionKey: 'Academy_Course_psychic-self-defence_desc',
    levelKey: 'Level_3',
    icon: 'mdi-shield-star-outline',
    category: 'protection',
    days: 1,
    lessons: 4,
    accent: { from: '#4A6C8C', to: '#26364A' },
    modules: [
      {
        title: 'Morning — Understanding',
        items: [
          'What psychic influence is and how it manifests',
          'Identifying negative energy sources and attachments',
        ],
      },
      {
        title: 'Afternoon — Protection',
        items: [
          'Shielding techniques and daily protection practices',
          'Cord-cutting, salt cleansing and case-study review',
        ],
      },
    ],
  },
];

export function getCourse(slug: string): AcademyCourse | undefined {
  return ACADEMY_COURSES.find((c) => c.slug === slug);
}