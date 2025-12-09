/**
 * CLAIMS DATABASE
 * Research-backed claims for epistemic training
 *
 * AUDIT STATUS: Verified December 2024
 * All claims reviewed for factual accuracy, appropriate difficulty,
 * and educational value. TRUE claims verified against peer-reviewed
 * sources. FALSE/MIXED claims designed to teach specific error patterns.
 *
 * Each claim has:
 * - id: Unique identifier (format: difficulty-number)
 * - text: The claim to evaluate
 * - answer: 'TRUE' | 'FALSE' | 'MIXED'
 * - source: 'ai-generated' | 'expert-sourced'
 * - explanation: Why the answer is what it is
 * - errorPattern: Type of error for AI-generated claims
 * - subject: Academic subject area
 * - difficulty: 'easy' | 'medium' | 'hard'
 */

export const CLAIMS_DATABASE = [
  // ==================== EASY DIFFICULTY ====================
  {
    id: 'easy-001',
    text: 'The mitochondria converts glucose into ATP through a process called photosynthesis, which occurs in all animal cells.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Mitochondria use cellular respiration, not photosynthesis. Photosynthesis occurs in chloroplasts in plant cells.',
    errorPattern: 'Confident terminology swap',
    subject: 'Biology',
    difficulty: 'easy'
  },
  {
    id: 'easy-002',
    text: "Your brain uses about 20% of your body's total energy, even though it's only about 2% of your body weight.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: "Well-documented in neuroscience literature (Raichle & Gusnard, 2002). The brain's high metabolic demand reflects its computational complexity.",
    errorPattern: 'N/A - Accurate',
    subject: 'Neuroscience',
    difficulty: 'easy'
  },
  {
    id: 'easy-003',
    text: 'The Great Wall of China is the only human-made structure visible from space with the naked eye.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: "This is a persistent myth. Astronauts confirm it's not visible without aid from low Earth orbit. Other structures like highways and cities are actually more visible.",
    errorPattern: 'Myth perpetuation',
    subject: 'Geography',
    difficulty: 'easy'
  },
  {
    id: 'easy-004',
    text: 'Water boils at 100 degrees Celsius (212°F) at sea level.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is a well-established physical property of water at standard atmospheric pressure (1 atm).',
    errorPattern: 'N/A - Accurate',
    subject: 'Physics',
    difficulty: 'easy'
  },
  {
    id: 'easy-005',
    text: 'Goldfish have a 3-second memory, which is why they seem content swimming in small bowls.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Studies show goldfish can remember things for months! They can learn mazes, recognize their owners, and remember feeding times.',
    errorPattern: 'Myth perpetuation',
    subject: 'Animal Science',
    difficulty: 'easy'
  },
  {
    id: 'easy-006',
    text: 'Bananas are berries, but strawberries are not.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Botanically, berries develop from a single ovary and have seeds embedded in flesh. Bananas qualify; strawberries are "accessory fruits."',
    errorPattern: 'N/A - Accurate',
    subject: 'Botany',
    difficulty: 'easy'
  },
  {
    id: 'easy-007',
    text: 'Humans only use 10% of their brains.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Brain scans show we use virtually all parts of our brain, and most of the brain is active almost all the time.',
    errorPattern: 'Myth perpetuation',
    subject: 'Neuroscience',
    difficulty: 'easy'
  },
  {
    id: 'easy-008',
    text: 'A group of flamingos is called a "flamboyance."',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is the official collective noun for flamingos, likely inspired by their vibrant pink color and dramatic appearance.',
    errorPattern: 'N/A - Accurate',
    subject: 'Animal Science',
    difficulty: 'easy'
  },
  {
    id: 'easy-009',
    text: 'Lightning never strikes the same place twice.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Lightning frequently strikes the same place multiple times. The Empire State Building is struck about 20-25 times per year!',
    errorPattern: 'Myth perpetuation',
    subject: 'Weather Science',
    difficulty: 'easy'
  },
  {
    id: 'easy-010',
    text: 'Octopuses have three hearts and blue blood.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Two hearts pump blood to the gills, while the third pumps it to the body. Their blood contains copper-based hemocyanin, making it blue.',
    errorPattern: 'N/A - Accurate',
    subject: 'Marine Biology',
    difficulty: 'easy'
  },
  {
    id: 'easy-011',
    text: 'The planet Venus spins in the opposite direction from most other planets in our solar system.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Venus has retrograde rotation, spinning clockwise when viewed from above its north pole, unlike Earth and most planets.',
    errorPattern: 'N/A - Accurate',
    subject: 'Astronomy',
    difficulty: 'easy'
  },
  {
    id: 'easy-012',
    text: 'Cracking your knuckles causes arthritis.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Multiple studies have found no link between knuckle cracking and arthritis. The sound comes from gas bubbles popping in joint fluid.',
    errorPattern: 'Myth perpetuation',
    subject: 'Human Biology',
    difficulty: 'easy'
  },

  // ==================== MEDIUM DIFFICULTY ====================
  {
    id: 'med-001',
    text: "Isaac Newton discovered gravity in 1687 when an apple fell on his head at Cambridge University, leading him to immediately publish the Principia Mathematica that same day.",
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Newton did publish Principia in 1687, but the apple story is likely apocryphal, and "same day" is fabricated.',
    errorPattern: 'Timeline compression',
    subject: 'History of Science',
    difficulty: 'medium'
  },
  {
    id: 'med-002',
    text: "The Amazon River is the longest river in the world at 6,992 kilometers, flowing through Brazil, Peru, and Argentina.",
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: "The Nile is generally considered the longest river. The Amazon doesn't flow through Argentina—it flows through Brazil, Peru, Colombia, and other countries.",
    errorPattern: 'Geographic fabrication',
    subject: 'Geography',
    difficulty: 'medium'
  },
  {
    id: 'med-003',
    text: 'Sound travels faster through water than through air because water molecules are packed more closely together.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: "Sound travels about 4.3 times faster in water (~1,480 m/s) than in air (~343 m/s) due to water's higher density and elasticity.",
    errorPattern: 'N/A - Accurate',
    subject: 'Physics',
    difficulty: 'medium'
  },
  {
    id: 'med-004',
    text: "Albert Einstein failed mathematics in school, which proves that grades don't matter for future success.",
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Einstein excelled at mathematics. This myth arose from confusion about Swiss grading scales. He mastered calculus by age 15.',
    errorPattern: 'Myth perpetuation',
    subject: 'History of Science',
    difficulty: 'medium'
  },
  {
    id: 'med-005',
    text: "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: "Honey's low moisture content, acidic pH, and hydrogen peroxide production make it inhospitable to bacteria and microorganisms.",
    errorPattern: 'N/A - Accurate',
    subject: 'Chemistry',
    difficulty: 'medium'
  },
  {
    id: 'med-006',
    text: 'The human body contains enough iron to make a 3-inch nail, enough carbon to make 900 pencils, and enough phosphorus to make 2,200 match heads.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The iron claim is roughly accurate (~3-4g of iron). However, the pencil and match head numbers are exaggerated fabrications with false precision.',
    errorPattern: 'Confident specificity',
    subject: 'Chemistry',
    difficulty: 'medium'
  },
  {
    id: 'med-007',
    text: 'When you blush, the lining of your stomach also turns red.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'While adrenaline does affect blood flow to both the face and digestive system, claiming the stomach "turns red" like facial blushing oversimplifies the biology. This claim is widely repeated but lacks strong peer-reviewed evidence.',
    errorPattern: 'Plausible adjacency',
    subject: 'Human Biology',
    difficulty: 'medium'
  },
  {
    id: 'med-008',
    text: 'The Statue of Liberty was originally intended to be placed in Egypt at the entrance of the Suez Canal before being gifted to America.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Sculptor Bartholdi did propose a similar lighthouse statue for the Suez Canal, but it was a different design. The Statue of Liberty was always intended for America as a gift from France.',
    errorPattern: 'Plausible adjacency',
    subject: 'History',
    difficulty: 'medium'
  },
  {
    id: 'med-009',
    text: 'A day on Venus is longer than a year on Venus.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Venus rotates so slowly that one day (243 Earth days) is longer than its year (225 Earth days to orbit the Sun).',
    errorPattern: 'N/A - Accurate',
    subject: 'Astronomy',
    difficulty: 'medium'
  },
  {
    id: 'med-010',
    text: 'Vikings wore horned helmets into battle, which made them appear more fearsome to their enemies.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'No archaeological evidence supports horned Viking helmets in battle. This myth comes from 19th-century romanticized artwork and opera costumes.',
    errorPattern: 'Myth perpetuation',
    subject: 'History',
    difficulty: 'medium'
  },
  {
    id: 'med-011',
    text: 'Sharks have been around longer than trees.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Sharks appeared about 450 million years ago. Trees evolved about 350 million years ago. Sharks predate trees by 100 million years!',
    errorPattern: 'N/A - Accurate',
    subject: 'Evolution',
    difficulty: 'medium'
  },
  {
    id: 'med-012',
    text: 'Mount Everest is the tallest mountain on Earth, measuring exactly 29,032 feet from base to peak.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Everest is highest above sea level, but Mauna Kea is taller base-to-peak (33,500 ft, mostly underwater). The "exact" measurement changes with snow and tectonic activity.',
    errorPattern: 'Confident specificity',
    subject: 'Geography',
    difficulty: 'medium'
  },

  // ==================== HARD DIFFICULTY ====================
  {
    id: 'hard-001',
    text: "During the April 2024 solar eclipse, the moon's shadow traveled across North America at approximately 1,500 miles per hour, and the path of totality passed through Austin, Texas on April 8th.",
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Date and Austin are correct, but shadow speed varies significantly (~1,000-5,000 mph depending on location). The specific number presented as fact without context is misleading.',
    errorPattern: 'Confident specificity',
    subject: 'Astronomy',
    difficulty: 'hard'
  },
  {
    id: 'hard-002',
    text: 'The inventor of the Pringles can is buried in one, as specified in his will after he designed the iconic tube in 1966.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: "Fredric Baur's ashes were indeed buried in a Pringles can (true), but he was a chemist who helped develop the shape/packaging, not the sole inventor, and the year is imprecise.",
    errorPattern: 'Timeline compression',
    subject: 'History',
    difficulty: 'hard'
  },
  {
    id: 'hard-003',
    text: 'Oxford University is older than the Aztec Empire.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Teaching at Oxford began around 1096. The Aztec Empire was founded in 1428 when the Triple Alliance was formed. Oxford is over 300 years older!',
    errorPattern: 'N/A - Accurate',
    subject: 'History',
    difficulty: 'hard'
  },
  {
    id: 'hard-004',
    text: 'The shortest war in history lasted exactly 38 minutes, fought between Britain and Zanzibar on August 27, 1896, resulting in exactly 500 Zanzibari casualties.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Anglo-Zanzibar War did occur on that date and lasted 38-45 minutes, but casualty numbers vary (roughly 500) and "exactly" is fabricated precision.',
    errorPattern: 'Confident specificity',
    subject: 'History',
    difficulty: 'hard'
  },
  {
    id: 'hard-005',
    text: 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Great Pyramid was built around 2560 BCE. Cleopatra lived around 30 BCE (2,530 years later). The Moon landing was 1969 CE (1,999 years after Cleopatra).',
    errorPattern: 'N/A - Accurate',
    subject: 'History',
    difficulty: 'hard'
  },
  {
    id: 'hard-006',
    text: 'CRISPR gene editing was discovered when scientists noticed bacteria defending themselves against viruses, leading to the first human trials in China in 2015 at Beijing University.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'CRISPR was discovered from bacterial immune systems (true), but the first human trials were in 2016, not 2015, and occurred at Sichuan University, not Beijing University.',
    errorPattern: 'Geographic fabrication',
    subject: 'Biotechnology',
    difficulty: 'hard'
  },
  {
    id: 'hard-007',
    text: 'There are more possible iterations of a game of chess than there are atoms in the observable universe.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Shannon number estimates 10^120 possible chess games. The observable universe has roughly 10^80 atoms. Chess possibilities vastly exceed atoms!',
    errorPattern: 'N/A - Accurate',
    subject: 'Mathematics',
    difficulty: 'hard'
  },
  {
    id: 'hard-008',
    text: "The first computer programmer was a woman named Ada Lovelace, who wrote the first algorithm in 1843 for Charles Babbage's Difference Engine.",
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Ada Lovelace did write the first algorithm (true), but it was for the Analytical Engine, not the Difference Engine. These were different machines with different purposes.',
    errorPattern: 'Plausible adjacency',
    subject: 'Computer Science',
    difficulty: 'hard'
  },
  {
    id: 'hard-009',
    text: 'A single bolt of lightning contains enough energy to toast 100,000 slices of bread.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: "Lightning energy varies enormously (1-5 billion joules total, but only 1-5% is electrical). A toaster uses about 60,000 joules per slice (1000W × 60 seconds). The actual number of slices would be far fewer than 100,000 - the specific number is fabricated precision.",
    errorPattern: 'Confident specificity',
    subject: 'Physics',
    difficulty: 'hard'
  },
  {
    id: 'hard-010',
    text: 'The human brain generates approximately 23 watts of electrical power when awake, enough to power a standard LED light bulb, which was first measured by Dr. Hans Berger in 1929.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The brain uses about 12-20 watts (close but "23" is false precision). Berger did pioneer EEG in 1929, but he measured brain waves, not power consumption.',
    errorPattern: 'Confident specificity',
    subject: 'Neuroscience',
    difficulty: 'hard'
  },
  {
    id: 'hard-011',
    text: 'Neutron stars are so dense that a teaspoon of neutron star material would weigh about 6 billion tons on Earth.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Neutron stars have densities of 10^17 kg/m³. A teaspoon (about 5 mL) would indeed weigh several billion tons due to this extreme density.',
    errorPattern: 'N/A - Accurate',
    subject: 'Astronomy',
    difficulty: 'hard'
  },
  {
    id: 'hard-012',
    text: 'The placebo effect can work even when patients know they\'re taking a placebo, a phenomenon discovered at Harvard Medical School in 2010 and replicated in exactly 47 subsequent studies.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Open-label placebos do work (demonstrated around 2010 at Harvard), but "exactly 47 studies" is fabricated. The real number of replications varies and isn\'t precisely 47.',
    errorPattern: 'Confident specificity',
    subject: 'Medical Science',
    difficulty: 'hard'
  }
];

/**
 * AI Error Patterns - displayed during debrief
 */
export const AI_ERROR_PATTERNS = [
  {
    name: 'Confident Specificity',
    description: 'Precise numbers, dates, or measurements that sound authoritative but are fabricated',
    example: '"exactly 1,500 mph" or "2,200 match heads"'
  },
  {
    name: 'Plausible Adjacency',
    description: 'Almost-right terminology swaps that sound correct to non-experts',
    example: '"photosynthesis" instead of "cellular respiration"'
  },
  {
    name: 'Myth Perpetuation',
    description: 'Repeating common misconceptions as if they were facts',
    example: 'Great Wall visible from space, Einstein failed math'
  },
  {
    name: 'Timeline Compression',
    description: 'Events mashed together implausibly or with invented connections',
    example: '"published that same day"'
  },
  {
    name: 'Geographic/Factual Invention',
    description: 'Made-up but plausible-sounding details about places, people, or events',
    example: 'Amazon flowing through Argentina'
  }
];

/**
 * Validate claims database integrity
 */
export function validateClaimsDatabase() {
  const ids = new Set();
  const duplicates = [];
  const invalidClaims = [];

  CLAIMS_DATABASE.forEach((claim, index) => {
    // Check for required fields
    if (!claim.id || !claim.text || !claim.answer) {
      invalidClaims.push({ index, claim, reason: 'Missing required field (id, text, or answer)' });
      return;
    }

    // Check for duplicate IDs
    if (ids.has(claim.id)) {
      duplicates.push(claim.id);
    } else {
      ids.add(claim.id);
    }

    // Validate answer is valid
    if (!['TRUE', 'FALSE', 'MIXED'].includes(claim.answer)) {
      invalidClaims.push({ index, claim, reason: `Invalid answer: ${claim.answer}` });
    }

    // Validate difficulty if present
    if (claim.difficulty && !['easy', 'medium', 'hard'].includes(claim.difficulty)) {
      invalidClaims.push({ index, claim, reason: `Invalid difficulty: ${claim.difficulty}` });
    }
  });

  return {
    valid: duplicates.length === 0 && invalidClaims.length === 0,
    duplicates,
    invalidClaims,
    totalClaims: CLAIMS_DATABASE.length
  };
}

// Run validation in development
if (import.meta.env?.DEV) {
  const validation = validateClaimsDatabase();
  if (!validation.valid) {
    console.warn('⚠️ Claims database validation failed:', validation);
  } else {
    console.log('✓ Claims database validation passed:', validation.totalClaims, 'claims');
  }
}
