// Data-driven quiz scenario used by QuizPage and the homepage suggestion card.
// Question text/options live in the i18n locale files (Quiz_Q* keys); this module
// only wires the values to their translation keys and maps answers to existing
// wellness topic slugs (nothing invented or medically prescriptive).

export interface QuizOption {
  value: string;
  labelKey: string;
  icon?: string;
}

export interface QuizQuestion {
  id: string;
  textKey: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'location',
    textKey: 'Quiz_Q1',
    options: [
      { value: 'head', labelKey: 'Quiz_Q1_Head', icon: 'mdi-head' },
      { value: 'neck', labelKey: 'Quiz_Q1_Neck', icon: 'mdi-human-handsdown' },
      { value: 'chest', labelKey: 'Quiz_Q1_Chest', icon: 'mdi-heart-pulse' },
      { value: 'abdomen', labelKey: 'Quiz_Q1_Abdomen', icon: 'mdi-stomach' },
      { value: 'back', labelKey: 'Quiz_Q1_Back', icon: 'mdi-human' },
      { value: 'legs', labelKey: 'Quiz_Q1_Legs', icon: 'mdi-run' },
    ],
  },
  {
    id: 'duration',
    textKey: 'Quiz_Q2',
    options: [
      { value: 'days', labelKey: 'Quiz_Q2_Days' },
      { value: 'weeks', labelKey: 'Quiz_Q2_Weeks' },
      { value: 'months', labelKey: 'Quiz_Q2_Months' },
    ],
  },
  {
    id: 'feeling',
    textKey: 'Quiz_Q3',
    options: [
      { value: 'mild', labelKey: 'Quiz_Q3_Mild' },
      { value: 'moderate', labelKey: 'Quiz_Q3_Moderate' },
      { value: 'severe', labelKey: 'Quiz_Q3_Severe' },
    ],
  },
  {
    id: 'energy',
    textKey: 'Quiz_Q4',
    options: [
      { value: 'good', labelKey: 'Quiz_Q4_Good' },
      { value: 'okay', labelKey: 'Quiz_Q4_Okay' },
      { value: 'low', labelKey: 'Quiz_Q4_Low' },
    ],
  },
];

/** Location answer -> related wellness topic slugs (must exist in data/wellness). */
export const REGION_RECOMMENDATIONS: Record<string, string[]> = {
  head: ['headache', 'eye-strain', 'stress-anxiety'],
  neck: ['neck-pain', 'shoulder-tension', 'headache'],
  chest: ['breathing-topic', 'heart-topic', 'low-energy'],
  abdomen: ['digestive-discomfort', 'low-energy', 'stress-anxiety'],
  back: ['back-pain', 'shoulder-tension', 'joint-pain'],
  legs: ['knee-pain', 'joint-pain', 'low-energy'],
};

/** Resolve recommended topic slugs from the recorded answers. */
export function quizRecommendations(answers: Record<string, string>): string[] {
  const location = answers.location || 'back';
  return REGION_RECOMMENDATIONS[location] || REGION_RECOMMENDATIONS.back;
}