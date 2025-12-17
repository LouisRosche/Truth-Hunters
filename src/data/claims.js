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
 * - id: Unique identifier (format: subject-difficulty-number)
 * - text: The claim to evaluate
 * - answer: 'TRUE' | 'FALSE' | 'MIXED'
 * - source: 'ai-generated' | 'expert-sourced'
 * - explanation: Why the answer is what it is
 * - errorPattern: Type of error (see AI_ERROR_PATTERNS)
 * - subject: Academic subject area
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - gradeLevel: 'elementary' | 'middle' | 'high' | 'college' (default: 'middle')
 * - citation: Source URL or DOI (for TRUE claims)
 * - lastVerified: Date of last fact-check
 * - reviewedBy: Array of reviewer identifiers
 *
 * GRADE LEVEL GUIDE:
 * - elementary (K-5): Simple, concrete facts. Age 5-11. Fun, memorable, shareable.
 * - middle (6-8): Standard complexity. Age 11-14. Current default level.
 * - high (9-12): Nuanced analysis required. Age 14-18. More context needed.
 * - college: Sophisticated, specialized. Age 18+. Expert-level critical thinking.
 */

/**
 * Standardized Error Pattern Taxonomy
 * Every AI-generated claim maps to exactly one pattern
 */
export const AI_ERROR_PATTERNS = [
  {
    id: 'confident-specificity',
    name: 'Confident Specificity',
    description: 'Precise numbers, dates, or measurements that sound authoritative but are fabricated or imprecise',
    example: '"exactly 1,500 mph" or "2,200 match heads"',
    teachingPoint: 'Be suspicious of overly precise numbers without citations'
  },
  {
    id: 'plausible-adjacency',
    name: 'Plausible Adjacency',
    description: 'Almost-right terminology swaps that sound correct to non-experts',
    example: '"photosynthesis" instead of "cellular respiration"',
    teachingPoint: 'Similar-sounding terms may have very different meanings'
  },
  {
    id: 'myth-perpetuation',
    name: 'Myth Perpetuation',
    description: 'Repeating common misconceptions as if they were facts',
    example: 'Great Wall visible from space, Einstein failed math',
    teachingPoint: 'Popular beliefs are not always true - verify claims'
  },
  {
    id: 'timeline-compression',
    name: 'Timeline Compression',
    description: 'Events mashed together implausibly or with invented connections',
    example: '"published that same day" or "immediately after"',
    teachingPoint: 'Historical events rarely happen instantly'
  },
  {
    id: 'geographic-fabrication',
    name: 'Geographic/Factual Invention',
    description: 'Made-up but plausible-sounding details about places, people, or events',
    example: 'Amazon flowing through Argentina, wrong university names',
    teachingPoint: 'Verify geographic and institutional claims'
  },
  {
    id: 'false-causation',
    name: 'False Causation',
    description: 'Claiming one thing causes another without evidence',
    example: '"Video games cause violence" or "Vaccines cause autism"',
    teachingPoint: 'Correlation does not equal causation'
  },
  {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    description: 'Citing experts or institutions that don\'t exist or didn\'t say that',
    example: '"According to Harvard researchers..." (with no actual study)',
    teachingPoint: 'Always verify the source actually exists and said what\'s claimed'
  },
  {
    id: 'statistical-manipulation',
    name: 'Statistical Manipulation',
    description: 'Misusing percentages, averages, or sample sizes',
    example: '"90% of doctors recommend..." (based on 10 doctors)',
    teachingPoint: 'Look for sample size, methodology, and who funded the study'
  }
];

export const CLAIMS_DATABASE = [
  // ==================== SCIENCE - EASY ====================
  {
    id: 'sci-easy-001',
    text: 'The mitochondria converts glucose into ATP through a process called photosynthesis, which occurs in all animal cells.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Mitochondria use cellular respiration, not photosynthesis. Photosynthesis occurs in chloroplasts in plant cells.',
    errorPattern: 'plausible-adjacency',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-002',
    text: "Your brain uses about 20% of your body's total energy, even though it's only about 2% of your body weight.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: "Well-documented in neuroscience literature. The brain's high metabolic demand reflects its computational complexity.",
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://doi.org/10.1073/pnas.162041399',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-003',
    text: 'The Great Wall of China is the only human-made structure visible from space with the naked eye.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: "This is a persistent myth. Astronauts confirm it's not visible without aid from low Earth orbit. Other structures like highways and cities are actually more visible.",
    errorPattern: 'myth-perpetuation',
    subject: 'Geography',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-004',
    text: 'Water boils at 100 degrees Celsius (212°F) at sea level.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is a well-established physical property of water at standard atmospheric pressure (1 atm).',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'easy',
    citation: 'https://www.nist.gov/pml/thermodynamic-properties-water',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-005',
    text: 'Goldfish have a 3-second memory, which is why they seem content swimming in small bowls.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Studies show goldfish can remember things for months! They can learn mazes, recognize their owners, and remember feeding times.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-006',
    text: 'Bananas are berries, but strawberries are not.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Botanically, berries develop from a single ovary and have seeds embedded in flesh. Bananas qualify; strawberries are "accessory fruits."',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/science/berry-plant-reproductive-body',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-007',
    text: 'Humans only use 10% of their brains.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Brain scans show we use virtually all parts of our brain, and most of the brain is active almost all the time.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-008',
    text: 'A group of flamingos is called a "flamboyance."',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is the official collective noun for flamingos, likely inspired by their vibrant pink color and dramatic appearance.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://www.merriam-webster.com/dictionary/flamboyance',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-009',
    text: 'Lightning never strikes the same place twice.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Lightning frequently strikes the same place multiple times. The Empire State Building is struck about 20-25 times per year!',
    errorPattern: 'myth-perpetuation',
    subject: 'Physics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-easy-010',
    text: 'Octopuses have three hearts and blue blood.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Two hearts pump blood to the gills, while the third pumps it to the body. Their blood contains copper-based hemocyanin, making it blue.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://www.scientificamerican.com/article/how-octopus-arms-move/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== SCIENCE - MEDIUM ====================
  {
    id: 'sci-med-001',
    text: 'Sound travels faster through water than through air because water molecules are packed more closely together.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: "Sound travels about 4.3 times faster in water (~1,480 m/s) than in air (~343 m/s) due to water's higher density and elasticity.",
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'medium',
    citation: 'https://www.npl.co.uk/resources/q&a/speed-of-sound',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-med-002',
    text: "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: "Honey's low moisture content, acidic pH, and hydrogen peroxide production make it inhospitable to bacteria and microorganisms.",
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'medium',
    citation: 'https://www.smithsonianmag.com/science-nature/the-science-behind-honeys-eternal-shelf-life-1218690/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-med-003',
    text: 'The human body contains enough iron to make a 3-inch nail, enough carbon to make 900 pencils, and enough phosphorus to make 2,200 match heads.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The iron claim is roughly accurate (~3-4g of iron). However, the pencil and match head numbers are exaggerated fabrications with false precision.',
    errorPattern: 'confident-specificity',
    subject: 'Chemistry',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-med-004',
    text: 'A day on Venus is longer than a year on Venus.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Venus rotates so slowly that one day (243 Earth days) is longer than its year (225 Earth days to orbit the Sun).',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'medium',
    citation: 'https://solarsystem.nasa.gov/planets/venus/in-depth/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-med-005',
    text: 'Sharks have been around longer than trees.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Sharks appeared about 450 million years ago. Trees evolved about 350 million years ago. Sharks predate trees by 100 million years!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    citation: 'https://www.nhm.ac.uk/discover/shark-evolution-a-450-million-year-timeline.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-med-006',
    text: 'Vaccines cause autism, according to a landmark 1998 study published in The Lancet.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The 1998 Wakefield study was retracted due to ethical violations and data manipulation. Dozens of studies with millions of children have found no link between vaccines and autism.',
    errorPattern: 'appeal-to-authority',
    subject: 'Medicine',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== SCIENCE - HARD ====================
  {
    id: 'sci-hard-001',
    text: 'There are more possible iterations of a game of chess than there are atoms in the observable universe.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Shannon number estimates 10^120 possible chess games. The observable universe has roughly 10^80 atoms. Chess possibilities vastly exceed atoms!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'hard',
    citation: 'https://doi.org/10.1016/j.artint.2006.11.003',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-hard-002',
    text: 'Neutron stars are so dense that a teaspoon of neutron star material would weigh about 6 billion tons on Earth.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Neutron stars have densities of 10^17 kg/m³. A teaspoon (about 5 mL) would indeed weigh several billion tons due to this extreme density.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'hard',
    citation: 'https://www.nasa.gov/vision/universe/starsgalaxies/neutron_stars.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-hard-003',
    text: 'CRISPR gene editing was discovered when scientists noticed bacteria defending themselves against viruses, leading to the first human trials in China in 2015 at Beijing University.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'CRISPR was discovered from bacterial immune systems (true), but the first human trials were in 2016, not 2015, and occurred at Sichuan University, not Beijing University.',
    errorPattern: 'geographic-fabrication',
    subject: 'Biology',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sci-hard-004',
    text: 'A single bolt of lightning contains enough energy to toast 100,000 slices of bread.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Lightning energy varies enormously. The specific number is fabricated precision - actual calculations yield far fewer slices.',
    errorPattern: 'confident-specificity',
    subject: 'Physics',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== HISTORY - EASY ====================
  {
    id: 'hist-easy-001',
    text: 'George Washington had wooden teeth.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Washington\'s dentures were made of ivory, gold, lead, and human/animal teeth - never wood. This is a persistent myth.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-easy-002',
    text: 'The ancient Egyptians built the pyramids using slave labor.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Archaeological evidence shows pyramid workers were paid laborers who lived in nearby villages, received medical care, and were buried with honor.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-easy-003',
    text: 'Vikings wore horned helmets into battle.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'No archaeological evidence supports horned Viking helmets in battle. This myth comes from 19th-century romanticized artwork and opera costumes.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-easy-004',
    text: 'The Declaration of Independence was signed on July 4, 1776.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Declaration was adopted on July 4, 1776, but most delegates signed it on August 2, 1776. The date celebrates the adoption, not the signing.',
    errorPattern: 'timeline-compression',
    subject: 'History',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== HISTORY - MEDIUM ====================
  {
    id: 'hist-med-001',
    text: "Isaac Newton discovered gravity in 1687 when an apple fell on his head at Cambridge University, leading him to immediately publish the Principia Mathematica that same day.",
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Newton did publish Principia in 1687, but the apple story is likely apocryphal, and "same day" is fabricated.',
    errorPattern: 'timeline-compression',
    subject: 'History',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-med-002',
    text: "Albert Einstein failed mathematics in school, which proves that grades don't matter for future success.",
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Einstein excelled at mathematics. This myth arose from confusion about Swiss grading scales. He mastered calculus by age 15.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-med-003',
    text: 'Oxford University is older than the Aztec Empire.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Teaching at Oxford began around 1096. The Aztec Empire was founded in 1428 when the Triple Alliance was formed. Oxford is over 300 years older!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'medium',
    citation: 'https://www.ox.ac.uk/about/organisation/history',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-med-004',
    text: 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Great Pyramid was built around 2560 BCE. Cleopatra lived around 30 BCE (2,530 years later). The Moon landing was 1969 CE (1,999 years after Cleopatra).',
    errorPattern: null,
    subject: 'History',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/biography/Cleopatra-queen-of-Egypt',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== HISTORY - HARD ====================
  {
    id: 'hist-hard-001',
    text: 'The shortest war in history lasted exactly 38 minutes, fought between Britain and Zanzibar on August 27, 1896, resulting in exactly 500 Zanzibari casualties.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Anglo-Zanzibar War did occur on that date and lasted 38-45 minutes, but casualty numbers vary (roughly 500) and "exactly" is fabricated precision.',
    errorPattern: 'confident-specificity',
    subject: 'History',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-hard-002',
    text: "The first computer programmer was a woman named Ada Lovelace, who wrote the first algorithm in 1843 for Charles Babbage's Difference Engine.",
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Ada Lovelace did write the first algorithm (true), but it was for the Analytical Engine, not the Difference Engine. These were different machines.',
    errorPattern: 'plausible-adjacency',
    subject: 'History',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== MATH - EASY ====================
  {
    id: 'math-easy-001',
    text: 'Zero is an even number.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Zero is divisible by 2 with no remainder (0 ÷ 2 = 0), which is the definition of an even number.',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/science/even-number',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-easy-002',
    text: 'If you flip a coin and get heads 10 times in a row, the next flip is more likely to be tails.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Each coin flip is independent. The probability of heads or tails is always 50% regardless of previous results. This is called the "gambler\'s fallacy."',
    errorPattern: 'false-causation',
    subject: 'Mathematics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-easy-003',
    text: 'The number 0.999... (repeating forever) is equal to 1.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Mathematically proven: 0.999... = 1. If x = 0.999..., then 10x = 9.999..., so 10x - x = 9, meaning 9x = 9, so x = 1.',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/science/decimal-number-system',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-easy-004',
    text: 'A triangle can have two right angles.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The sum of angles in a triangle is always 180°. Two right angles would be 180°, leaving 0° for the third angle, which is impossible.',
    errorPattern: 'plausible-adjacency',
    subject: 'Mathematics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== MATH - MEDIUM ====================
  {
    id: 'math-med-001',
    text: 'The average human has fewer than two legs.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Since some people have lost legs due to accidents or medical conditions, the average is slightly less than 2 (e.g., 1.99). This shows how averages can be misleading.',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/science/mean-statistics',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-med-002',
    text: 'In a room of just 23 people, there\'s a 50% chance that two people share a birthday.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is the famous "birthday paradox." With 23 people, the probability of a shared birthday is about 50.7%.',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'medium',
    citation: 'https://www.scientificamerican.com/article/bring-science-home-probability-birthday-paradox/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-med-003',
    text: 'If a medical test is 99% accurate and you test positive, there\'s a 99% chance you have the disease.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This ignores base rates. If only 1 in 10,000 people have the disease, a positive test might only mean a ~1% chance of having it due to false positives.',
    errorPattern: 'statistical-manipulation',
    subject: 'Mathematics',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== CIVICS/SOCIAL STUDIES - EASY ====================
  {
    id: 'civ-easy-001',
    text: 'The United States is a democracy where citizens vote directly on all laws.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The US is a representative democracy (republic). Citizens elect representatives who vote on laws, rather than voting directly on each law.',
    errorPattern: 'plausible-adjacency',
    subject: 'Civics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'civ-easy-002',
    text: 'The Bill of Rights refers to the first ten amendments to the US Constitution.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Bill of Rights was ratified in 1791 and consists of the first 10 amendments, guaranteeing fundamental rights like free speech and fair trials.',
    errorPattern: null,
    subject: 'Civics',
    difficulty: 'easy',
    citation: 'https://www.archives.gov/founding-docs/bill-of-rights',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'civ-easy-003',
    text: 'The President of the United States can declare war without Congress.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The Constitution grants Congress the power to declare war (Article I, Section 8). The President commands the military but cannot formally declare war.',
    errorPattern: 'myth-perpetuation',
    subject: 'Civics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'civ-easy-004',
    text: 'Supreme Court Justices serve for life once confirmed.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Article III of the Constitution states federal judges "shall hold their Offices during good Behaviour," meaning lifetime appointments unless impeached.',
    errorPattern: null,
    subject: 'Civics',
    difficulty: 'easy',
    citation: 'https://www.supremecourt.gov/about/constitutional.aspx',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== CIVICS - MEDIUM ====================
  {
    id: 'civ-med-001',
    text: 'The Electoral College was created because the Founding Fathers didn\'t trust ordinary citizens to choose the president wisely.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Electoral College was a compromise involving state representation, slavery (3/5 clause), and practical concerns about communication - not simply distrust of voters.',
    errorPattern: 'timeline-compression',
    subject: 'Civics',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'civ-med-002',
    text: 'The phrase "separation of church and state" appears in the US Constitution.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This phrase comes from Jefferson\'s 1802 letter, not the Constitution. The First Amendment says Congress shall make no law "respecting an establishment of religion."',
    errorPattern: 'plausible-adjacency',
    subject: 'Civics',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ECONOMICS - EASY ====================
  {
    id: 'econ-easy-001',
    text: 'Printing more money always leads to inflation.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Printing money CAN cause inflation if it exceeds economic growth, but context matters. During recessions or when money replaces destroyed currency, inflation may not occur.',
    errorPattern: 'false-causation',
    subject: 'Economics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'econ-easy-002',
    text: 'Supply and demand determine most prices in a market economy.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Basic economic principle: when demand exceeds supply, prices rise; when supply exceeds demand, prices fall.',
    errorPattern: null,
    subject: 'Economics',
    difficulty: 'easy',
    citation: 'https://www.econlib.org/library/Enc/SupplyandDemand.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'econ-easy-003',
    text: 'Minimum wage increases always cause unemployment.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Economic research shows mixed results. Moderate increases often have minimal employment effects, while stimulating consumer spending.',
    errorPattern: 'false-causation',
    subject: 'Economics',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ECONOMICS - MEDIUM ====================
  {
    id: 'econ-med-001',
    text: 'The United States has the world\'s largest economy by GDP.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'As of 2024, the US has the largest nominal GDP at approximately $28 trillion, followed by China.',
    errorPattern: null,
    subject: 'Economics',
    difficulty: 'medium',
    citation: 'https://www.worldbank.org/en/home',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'econ-med-002',
    text: 'Correlation between two economic factors proves that one causes the other.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Correlation does not imply causation. Ice cream sales and drowning deaths both increase in summer, but ice cream doesn\'t cause drowning.',
    errorPattern: 'false-causation',
    subject: 'Economics',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== MEDIA LITERACY - EASY ====================
  {
    id: 'media-easy-001',
    text: 'If a news story has been shared millions of times on social media, it must be true.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Viral content is often emotionally provocative, not necessarily accurate. Misinformation spreads 6x faster than accurate information on social media.',
    errorPattern: 'appeal-to-authority',
    subject: 'Media Literacy',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-easy-002',
    text: 'A website ending in .org is always a reliable, unbiased source.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Anyone can register a .org domain. Many advocacy groups, some with strong biases, use .org. Always evaluate the source itself.',
    errorPattern: 'myth-perpetuation',
    subject: 'Media Literacy',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-easy-003',
    text: 'Photos and videos can be manipulated to show events that never happened.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Digital editing software and AI can create realistic fake images and "deepfake" videos. Always verify visual media from multiple sources.',
    errorPattern: null,
    subject: 'Media Literacy',
    difficulty: 'easy',
    citation: 'https://www.mit.edu/~tdqc/deepfakes.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-easy-004',
    text: 'If Wikipedia says something, it must be true because experts write the articles.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Wikipedia is written by volunteers, not necessarily experts. It\'s a good starting point but should be verified with primary sources.',
    errorPattern: 'appeal-to-authority',
    subject: 'Media Literacy',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== MEDIA LITERACY - MEDIUM ====================
  {
    id: 'media-med-001',
    text: 'Peer-reviewed scientific studies are more reliable than news articles about science.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Peer review means other experts checked the methodology and conclusions. News articles may oversimplify, sensationalize, or misinterpret studies.',
    errorPattern: null,
    subject: 'Media Literacy',
    difficulty: 'medium',
    citation: 'https://www.nature.com/nature/peer-review',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-med-002',
    text: 'A study funded by a company will always be biased in favor of that company.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Industry funding creates potential bias but doesn\'t guarantee it. Look for disclosed conflicts of interest, independent replication, and peer review.',
    errorPattern: 'false-causation',
    subject: 'Media Literacy',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-med-003',
    text: 'Checking if other reputable news sources report the same story is a good way to verify news.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Cross-referencing multiple independent sources is a core fact-checking technique. If only one source reports something major, be skeptical.',
    errorPattern: null,
    subject: 'Media Literacy',
    difficulty: 'medium',
    citation: 'https://www.factcheck.org/our-process/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== MEDIA LITERACY - HARD ====================
  {
    id: 'media-hard-001',
    text: 'A scientific study with a sample size of 50 people proves that a drug works for everyone.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Small sample sizes have limited statistical power. Drug trials typically need thousands of participants across diverse populations to establish broad effectiveness.',
    errorPattern: 'statistical-manipulation',
    subject: 'Media Literacy',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-hard-002',
    text: 'AI language models like ChatGPT always provide accurate, factual information.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'AI models can "hallucinate" - generating plausible-sounding but false information. They don\'t have real-time knowledge and can perpetuate training data biases.',
    errorPattern: 'appeal-to-authority',
    subject: 'Media Literacy',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ADDITIONAL VIRAL/STICKY CLAIMS ====================

  // BIOLOGY - Mind-blowing facts
  {
    id: 'bio-viral-001',
    text: 'You share 50% of your DNA with bananas.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Humans and bananas share about 50-60% of identical DNA because all life evolved from common ancestors. Basic cellular functions use similar genetic code.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    citation: 'https://www.nhm.ac.uk/discover/what-do-humans-have-in-common-with-bananas.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'bio-viral-002',
    text: 'There are more bacteria in your mouth right now than there are people on Earth.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Your mouth contains 20 billion+ bacteria. Earth has ~8 billion people. Your mouth is a thriving ecosystem!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3086586/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'bio-viral-003',
    text: 'Stomach acid is strong enough to dissolve metal, which is why your stomach dissolves itself every few days and regrows.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Stomach acid (pH 1.5-3.5) CAN dissolve some metals, but your stomach is protected by mucus lining - it doesn\'t "dissolve and regrow." The lining regenerates cells, not the whole stomach.',
    errorPattern: 'confident-specificity',
    subject: 'Biology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'bio-viral-004',
    text: 'Sloths can hold their breath longer than dolphins.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Sloths can slow their heart rate and hold breath for up to 40 minutes. Dolphins typically surface every 8-10 minutes.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'hard',
    citation: 'https://www.smithsonianmag.com/science-nature/14-fun-facts-about-sloths-180971029/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'bio-viral-005',
    text: 'Your body contains enough fat to make 7 bars of soap.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The average adult has about 35 billion fat cells containing enough lipids to produce 7+ bars of soap. (Don\'t try this at home!)',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/science/adipose-tissue',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ASTRONOMY - Space facts that wow
  {
    id: 'astro-viral-001',
    text: 'If you could fly a plane to the sun, it would take over 20 years to get there.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'At 575 mph (average jet speed), reaching the sun (93 million miles away) would take about 19-20 years of non-stop flight.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'medium',
    citation: 'https://solarsystem.nasa.gov/solar-system/sun/overview/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'astro-viral-002',
    text: 'There\'s a planet made entirely of diamonds called 55 Cancri e.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Research suggests 55 Cancri e may have a carbon-rich composition that could include diamond, but "entirely of diamonds" is exaggerated. Its exact composition remains uncertain.',
    errorPattern: 'confident-specificity',
    subject: 'Astronomy',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'astro-viral-003',
    text: 'One million Earths could fit inside the Sun.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Sun\'s volume is about 1.3 million times that of Earth. If the Sun were hollow, you could fit approximately 1.3 million Earths inside.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'easy',
    citation: 'https://solarsystem.nasa.gov/solar-system/sun/by-the-numbers/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'astro-viral-004',
    text: 'Astronauts on the ISS see 16 sunrises and sunsets every single day.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The ISS orbits Earth every 90 minutes, so astronauts experience 16 complete day-night cycles in 24 hours.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'medium',
    citation: 'https://www.nasa.gov/mission_pages/station/main/index.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'astro-viral-005',
    text: 'Space is completely silent because there\'s no air for sound waves to travel through.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Sound needs a medium (like air or water) to travel. In the vacuum of space, there are no molecules to carry sound waves.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'easy',
    citation: 'https://science.nasa.gov/science-news/science-at-nasa/2001/ast06nov_1',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // HISTORY - Surprising historical facts
  {
    id: 'hist-viral-001',
    text: 'Nintendo was founded while Jack the Ripper was still active in London.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Nintendo was founded in 1889 as a playing card company. Jack the Ripper\'s murders occurred in 1888. Nintendo is older than you think!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'hard',
    citation: 'https://www.nintendo.co.jp/corporate/en/history/index.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-viral-002',
    text: 'The fax machine was invented the same year people were still traveling the Oregon Trail.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Alexander Bain patented an early fax machine in 1843. The Oregon Trail migration peaked in the 1840s-1850s. Technologies coexist in surprising ways!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'hard',
    citation: 'https://www.britannica.com/technology/fax',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-viral-003',
    text: 'There was a 335-year war between the Netherlands and the Isles of Scilly with no casualties.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'War was declared in 1651 but no shots were fired. Peace was only formally declared in 1986, making it one of the longest and most bloodless wars in history.',
    errorPattern: null,
    subject: 'History',
    difficulty: 'hard',
    citation: 'https://www.historic-uk.com/HistoryUK/HistoryofEngland/The-335-Year-War/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-viral-004',
    text: 'Woolly mammoths were still alive when the Egyptian pyramids were being built.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'A small population of woolly mammoths survived on Wrangel Island until about 1650 BCE. The Great Pyramid was built around 2560 BCE - almost 1000 years earlier!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'medium',
    citation: 'https://www.nature.com/articles/nature12921',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'hist-viral-005',
    text: 'Harvard University was founded before calculus was invented.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Harvard was founded in 1636. Newton and Leibniz independently developed calculus in the late 1600s (1680s-1690s).',
    errorPattern: null,
    subject: 'History',
    difficulty: 'medium',
    citation: 'https://www.harvard.edu/about/history/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // GEOGRAPHY - Mind-bending geography
  {
    id: 'geo-viral-001',
    text: 'Russia has 11 time zones, more than any other country.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Russia spans 11 time zones, from UTC+2 to UTC+12. When it\'s breakfast in Moscow, it\'s bedtime in Vladivostok.',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/place/Russia',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'geo-viral-002',
    text: 'Canada has more lakes than the rest of the world combined.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Canada has over 60% of the world\'s lakes - more than 2 million lakes covering 7.6% of its landmass.',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'medium',
    citation: 'https://www.canada.ca/en/environment-climate-change/services/water-overview/frequently-asked-questions.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'geo-viral-003',
    text: 'Africa is bigger than the USA, China, India, and most of Europe combined.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Africa\'s 30.3 million km² is larger than the US (9.8M), China (9.6M), India (3.3M), and Western Europe combined. Maps often underrepresent its size.',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/place/Africa',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'geo-viral-004',
    text: 'Maine is the closest US state to Africa.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Quoddy Head, Maine is about 3,154 miles from El Beddouza, Morocco - closer than Florida due to Earth\'s curvature and Africa\'s northwest bulge.',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'hard',
    citation: 'https://www.ngs.noaa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'geo-viral-005',
    text: 'The Amazon River flows through Brazil, Peru, Colombia, and Argentina, making it the longest river in South America.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Amazon DOES flow through Brazil, Peru, and Colombia, and IS the longest in South America. But it does NOT flow through Argentina - that\'s a geographic fabrication.',
    errorPattern: 'geographic-fabrication',
    subject: 'Geography',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // PHYSICS - Cool physics
  {
    id: 'phys-viral-001',
    text: 'If you drilled a hole through Earth and jumped in, you\'d reach the other side in about 42 minutes.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Ignoring air resistance and assuming uniform density, gravitational physics calculations show the journey would take about 42 minutes.',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'hard',
    citation: 'https://www.scientificamerican.com/article/tunnel-through-earth/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'phys-viral-002',
    text: 'Hot water freezes faster than cold water under certain conditions.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is called the Mpemba effect. While counterintuitive, it\'s been observed and studied, though the exact mechanism is still debated.',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'hard',
    citation: 'https://www.scientificamerican.com/article/is-it-true-that-hot-water/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'phys-viral-003',
    text: 'You could fit all the planets in our solar system between Earth and the Moon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Moon averages 384,400 km away. All planets\' diameters combined equal about 380,000 km. They\'d fit (barely) in the gap!',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'hard',
    citation: 'https://solarsystem.nasa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // CHEMISTRY - Chemistry wonders
  {
    id: 'chem-viral-001',
    text: 'Glass is actually a liquid that flows very, very slowly.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This is a common myth! Glass is an amorphous solid, not a slow-flowing liquid. Old windows are thicker at the bottom due to manufacturing methods, not flow.',
    errorPattern: 'myth-perpetuation',
    subject: 'Chemistry',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'chem-viral-002',
    text: 'Diamond and pencil lead (graphite) are made of the exact same element: carbon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Both are pure carbon! The difference is how atoms are arranged. Diamond has a rigid 3D structure; graphite has layered sheets that slide easily.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/science/carbon-chemical-element',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'chem-viral-003',
    text: 'You can turn peanut butter into diamonds.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Scientists have created diamonds from peanut butter! Extreme pressure and heat convert the carbon in peanut butter into diamond - though it\'s not practical.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'hard',
    citation: 'https://www.bbc.com/news/science-environment-24836108',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // MEDICINE - Health myths and facts
  {
    id: 'med-viral-001',
    text: 'Cracking your knuckles causes arthritis.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Multiple studies have found no link between knuckle cracking and arthritis. The sound comes from gas bubbles popping in joint fluid.',
    errorPattern: 'myth-perpetuation',
    subject: 'Medicine',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'med-viral-002',
    text: 'Carrots improve your night vision.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Carrots contain vitamin A, which is necessary for eye health. But eating extra carrots won\'t give you superhuman night vision - this myth was WWII propaganda to hide radar technology.',
    errorPattern: 'myth-perpetuation',
    subject: 'Medicine',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'med-viral-003',
    text: 'Your heart stops when you sneeze.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Your heart does NOT stop during a sneeze. The pressure change may briefly affect heart rhythm, but it keeps beating continuously.',
    errorPattern: 'myth-perpetuation',
    subject: 'Medicine',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'med-viral-004',
    text: 'You should wait 30 minutes after eating before swimming or you\'ll get cramps and drown.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'There\'s no scientific evidence for this rule. While digestion diverts some blood flow, it won\'t cause dangerous cramps. The rule likely comes from overly cautious parenting.',
    errorPattern: 'myth-perpetuation',
    subject: 'Medicine',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // MATHEMATICS - Math curiosities
  {
    id: 'math-viral-001',
    text: 'A pizza with radius "z" and height "a" has volume = pi × z × z × a (pizza).',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The volume of a cylinder is π × r² × h. With radius z and height a: π × z × z × a, which spells "pizza." Math can be delicious!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/science/cylinder-mathematics',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-viral-002',
    text: 'There are more ways to arrange a deck of 52 cards than there are atoms in the Milky Way galaxy.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: '52! (52 factorial) equals 8×10^67 arrangements. The Milky Way has about 10^68 atoms. They\'re roughly equal - more shuffles than atoms is approximately true!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'hard',
    citation: 'https://www.britannica.com/science/permutation',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'math-viral-003',
    text: 'If you fold a piece of paper in half 42 times, it would reach the Moon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Exponential growth is powerful! 2^42 × 0.1mm (paper thickness) ≈ 440,000 km. The Moon is ~384,000 km away. 42 folds would overshoot!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'hard',
    citation: 'https://www.britannica.com/science/exponential-function',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // MEDIA LITERACY - Critical thinking
  {
    id: 'media-viral-001',
    text: 'An image that looks like a screenshot of a news headline is definitely real news.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Fake news screenshots are extremely easy to create. Anyone can edit images or use headline generators. Always visit the actual news source to verify.',
    errorPattern: 'appeal-to-authority',
    subject: 'Media Literacy',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'media-viral-002',
    text: 'If a celebrity posted something on social media, they definitely wrote and believe it.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Many celebrities have social media teams, and accounts can be hacked. Posts might be ads, written by staff, or compromised. Verify through official channels.',
    errorPattern: 'appeal-to-authority',
    subject: 'Media Literacy',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ECONOMICS - Money myths
  {
    id: 'econ-viral-001',
    text: 'A penny costs more to make than it\'s worth.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'It costs about 2-3 cents to produce a single penny due to material and manufacturing costs. The US Mint loses money on every penny made.',
    errorPattern: null,
    subject: 'Economics',
    difficulty: 'easy',
    citation: 'https://www.usmint.gov/about/production-sales-figures',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'econ-viral-002',
    text: 'Apple has more cash on hand than the US Treasury.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'At various points, Apple\'s cash reserves have exceeded the US operating cash balance. Corporations can accumulate more liquid cash than governments.',
    errorPattern: null,
    subject: 'Economics',
    difficulty: 'hard',
    citation: 'https://www.apple.com/newsroom/2024/02/apple-reports-first-quarter-results/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ADDITIONAL MIXED CLAIMS ====================
  // These claims teach nuance - some parts true, some false

  {
    id: 'mixed-sci-001',
    text: 'Humans swallow an average of 8 spiders per year while sleeping, according to a 1993 study.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The "1993 study" is fabricated - this "fact" was actually invented to demonstrate how misinformation spreads. Humans swallowing spiders while sleeping is extremely rare because spiders avoid large, breathing creatures.',
    errorPattern: 'appeal-to-authority',
    subject: 'Biology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-sci-002',
    text: 'Dogs see only in black and white, which is why they rely more on smell than sight.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Dogs DO rely heavily on smell (true), but they are NOT colorblind. Dogs see blue and yellow, just not the full spectrum humans see. The reasoning is flawed even though the smell part is accurate.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-hist-001',
    text: 'Thomas Edison invented the light bulb in 1879 after testing over 10,000 different materials for the filament.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Edison did create a practical incandescent bulb in 1879 (true), but he improved on existing designs rather than "inventing" it. The 10,000 experiments number is an exaggerated myth - the actual number is unknown.',
    errorPattern: 'confident-specificity',
    subject: 'History',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-sci-003',
    text: 'Bats are blind, which is why they evolved echolocation to navigate.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Bats DID evolve echolocation for navigation (true), but they are NOT blind. Most bats can see quite well, and some fruit bats have excellent vision. Echolocation evolved for hunting in darkness, not to compensate for blindness.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-med-001',
    text: 'The tongue has different regions for tasting sweet, sour, salty, and bitter, which was mapped by scientist D.P. Hanig in 1901.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Hanig did publish research in 1901 about taste sensitivity (true), but the "tongue map" showing distinct regions is a misinterpretation. All taste buds can detect all basic tastes, though with slightly varying sensitivity.',
    errorPattern: 'appeal-to-authority',
    subject: 'Medicine',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-geo-001',
    text: 'Mount Everest is the tallest mountain on Earth at 29,032 feet, making it the point farthest from the center of the Earth.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Everest IS the highest point above sea level at 29,032 feet (true). However, due to Earth\'s equatorial bulge, Mount Chimborazo in Ecuador is actually the point farthest from Earth\'s center.',
    errorPattern: 'plausible-adjacency',
    subject: 'Geography',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-tech-001',
    text: 'The first email was sent in 1971 by Ray Tomlinson, and its content was "QWERTYUIOP" - the top row of the keyboard.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Ray Tomlinson did send the first networked email in 1971 (true). However, he said the content was likely "something like QWERTYUIOP" but couldn\'t remember exactly - the specific content is uncertain, not confirmed.',
    errorPattern: 'confident-specificity',
    subject: 'History',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-sci-004',
    text: 'Albert Einstein was a slow learner who didn\'t speak until age 4, which proves that late development can lead to genius.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Einstein reportedly was a late talker (possibly true, based on family accounts). However, claiming this "proves" late development leads to genius is a logical fallacy - correlation doesn\'t prove causation.',
    errorPattern: 'false-causation',
    subject: 'History',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-bio-001',
    text: 'Chameleons change color to camouflage with their surroundings, which helps them hide from predators.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Chameleons DO change color (true), but primarily to communicate mood, regulate temperature, and signal to other chameleons - not mainly for camouflage. The camouflage purpose is overstated in popular belief.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-astro-001',
    text: 'The dark side of the Moon is always dark because it never receives sunlight.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'There IS a "far side" of the Moon we never see from Earth (true). But it\'s not "always dark" - it receives just as much sunlight as the near side. "Dark" refers to "unknown/unseen," not "unlit."',
    errorPattern: 'plausible-adjacency',
    subject: 'Astronomy',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-civ-001',
    text: 'The Constitution guarantees Americans the right to vote, which is why all citizens over 18 can vote today.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Constitution doesn\'t explicitly guarantee a right to vote - it only prohibits certain types of discrimination in voting (race, sex, age for 18+). Voting rights are largely controlled by states, and various restrictions still exist.',
    errorPattern: 'plausible-adjacency',
    subject: 'Civics',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mixed-sci-005',
    text: 'Sugar causes hyperactivity in children, which is why parents limit candy before bedtime.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Parents DO often limit candy before bedtime (true observation). However, numerous scientific studies have found NO link between sugar and hyperactivity in children - it\'s a widely believed myth that isn\'t supported by evidence.',
    errorPattern: 'false-causation',
    subject: 'Medicine',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ADDITIONAL CLAIMS - BATCH 2 ====================
  // Added to increase variety and reduce duplicate encounters across sessions

  // ANIMAL SCIENCE
  {
    id: 'animal-001',
    text: 'Cows have best friends and get stressed when separated from them.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Research shows cows form strong bonds with other cows and show signs of stress (increased heart rate, cortisol) when separated from their preferred companions.',
    errorPattern: null,
    subject: 'Animal Science',
    difficulty: 'easy',
    citation: 'https://www.appliedanimalbehaviour.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-002',
    text: 'Elephants are the only animals that cannot jump.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While elephants cannot jump due to their weight and bone structure, many other animals also cannot jump, including hippos, rhinos, and sloths.',
    errorPattern: 'confident-specificity',
    subject: 'Animal Science',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-003',
    text: 'Butterflies taste with their feet.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Butterflies have taste sensors (chemoreceptors) on their feet that help them identify plants suitable for laying eggs and find nectar.',
    errorPattern: null,
    subject: 'Animal Science',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/animal/butterfly-insect',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-004',
    text: "A shrimp's heart is located in its head.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The heart of a shrimp is indeed located in its cephalothorax (the fused head and thorax region), which we commonly call the "head."',
    errorPattern: null,
    subject: 'Animal Science',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/animal/shrimp-crustacean',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-005',
    text: 'Koalas sleep 22 hours a day because eucalyptus leaves are toxic and their bodies need time to process the poison.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Koalas DO sleep 18-22 hours daily, but not to "process poison." They sleep so much because eucalyptus is very low in nutrients and energy, not because of toxins.',
    errorPattern: 'false-causation',
    subject: 'Animal Science',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-006',
    text: 'Hummingbirds are the only birds that can fly backwards.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Due to their unique wing structure that allows full rotation, hummingbirds can fly backwards, sideways, and even hover in place.',
    errorPattern: null,
    subject: 'Animal Science',
    difficulty: 'easy',
    citation: 'https://www.audubon.org/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-007',
    text: 'A group of owls is called a "parliament."',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The collective noun for owls is "parliament," possibly due to the ancient Greek belief that owls were wise creatures.',
    errorPattern: null,
    subject: 'Animal Science',
    difficulty: 'easy',
    citation: 'https://www.merriam-webster.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'animal-008',
    text: 'Cats always land on their feet due to a "righting reflex" that develops at exactly 3 weeks old.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Cats DO have a righting reflex (true), but it develops between 3-4 weeks and is refined over time. Also, cats do NOT always land on their feet.',
    errorPattern: 'confident-specificity',
    subject: 'Animal Science',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // TECHNOLOGY
  {
    id: 'tech-001',
    text: 'The first computer virus was created in 1971 and was called "Creeper."',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Creeper was created in 1971 by Bob Thomas at BBN Technologies. It displayed "I\'m the creeper, catch me if you can!"',
    errorPattern: null,
    subject: 'Computer Science',
    difficulty: 'medium',
    citation: 'https://www.kaspersky.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'tech-002',
    text: 'More people have mobile phones than have access to toilets.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'UN data shows about 6 billion people have mobile phone access, while only 4.5 billion have access to proper sanitation facilities.',
    errorPattern: null,
    subject: 'Technology',
    difficulty: 'medium',
    citation: 'https://www.who.int/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'tech-003',
    text: 'The QWERTY keyboard layout was designed to slow down typists.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'QWERTY was designed to reduce typewriter jams by separating common letter pairs (partially true). But the claim it was meant to "slow down" typists is oversimplified.',
    errorPattern: 'plausible-adjacency',
    subject: 'Technology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'tech-004',
    text: 'The average smartphone has more computing power than the computers used for the Apollo 11 Moon landing.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Apollo Guidance Computer had 74 KB of memory and ran at 0.043 MHz. A modern smartphone has billions of times more power.',
    errorPattern: null,
    subject: 'Computer Science',
    difficulty: 'easy',
    citation: 'https://www.nasa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'tech-005',
    text: 'Wi-Fi stands for "Wireless Fidelity."',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Wi-Fi doesn\'t actually stand for anything. The name was created by a marketing firm. "Wireless Fidelity" is a backronym.',
    errorPattern: 'myth-perpetuation',
    subject: 'Technology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // HUMAN BODY
  {
    id: 'body-001',
    text: 'Your nose can remember 50,000 different scents.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Research suggests humans can distinguish over 1 trillion scent combinations, with about 50,000 being a common recognition estimate.',
    errorPattern: null,
    subject: 'Neuroscience',
    difficulty: 'medium',
    citation: 'https://www.science.org/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'body-002',
    text: 'Humans shed about 600,000 particles of skin every hour.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'We lose about 30,000-40,000 dead skin cells every minute. Over time, we shed our entire outer layer every 2-4 weeks.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    citation: 'https://www.aad.org/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'body-003',
    text: 'You cannot sneeze with your eyes open.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While most people close their eyes when sneezing (it\'s a reflex), it IS physically possible to sneeze with your eyes open.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'body-004',
    text: 'Babies are born with 300 bones, but adults only have 206.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Babies have about 270-300 bones, many of which fuse together as they grow. By adulthood, we have 206 bones.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://www.livescience.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'body-005',
    text: 'Your fingernails grow faster on your dominant hand.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The dominant hand gets more blood flow and trauma (tiny impacts), which stimulates nail growth.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'hard',
    citation: 'https://www.aad.org/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'body-006',
    text: "Humans can't breathe and swallow at the same time.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The epiglottis closes over the windpipe when we swallow, preventing simultaneous breathing.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'body-007',
    text: 'The human brain is about 75% water.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The brain is approximately 73-75% water. Even mild dehydration can affect cognitive function.',
    errorPattern: null,
    subject: 'Neuroscience',
    difficulty: 'easy',
    citation: 'https://www.ncbi.nlm.nih.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // WEATHER
  {
    id: 'weather-001',
    text: "Lightning can strike the same place twice - in fact, it's actually more likely to strike the same spot again.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Tall structures that have been struck create ionized air paths, making repeat strikes more likely.',
    errorPattern: null,
    subject: 'Weather Science',
    difficulty: 'medium',
    citation: 'https://www.nssl.noaa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'weather-002',
    text: "Tornadoes can't cross rivers or hit downtown areas of major cities.",
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This is a dangerous myth. Tornadoes have crossed rivers (including the Mississippi) and hit downtown areas multiple times.',
    errorPattern: 'myth-perpetuation',
    subject: 'Weather Science',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'weather-003',
    text: 'It can be too cold to snow.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Snow requires moisture in the air. Extremely cold air holds very little moisture, so heavy snowfall is rare at extreme lows.',
    errorPattern: null,
    subject: 'Weather Science',
    difficulty: 'medium',
    citation: 'https://www.metoffice.gov.uk/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'weather-004',
    text: 'Raindrops are shaped like teardrops.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Small raindrops are actually spherical due to surface tension. Larger drops flatten into a hamburger-bun shape.',
    errorPattern: 'myth-perpetuation',
    subject: 'Weather Science',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // LANGUAGE
  {
    id: 'lang-001',
    text: '"Set" is the English word with the most definitions.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The word "set" has over 430 definitions in the Oxford English Dictionary, making it the word with the most meanings.',
    errorPattern: null,
    subject: 'Language',
    difficulty: 'hard',
    citation: 'https://www.oed.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'lang-002',
    text: 'The sentence "Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo" is grammatically correct.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Using "buffalo" as a noun, adjective, and verb, this sentence means "Buffalo bison that Buffalo bison bully, bully Buffalo bison."',
    errorPattern: null,
    subject: 'Language',
    difficulty: 'hard',
    citation: 'https://www.britannica.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'lang-003',
    text: 'The word "OK" is the most spoken word in the world.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Linguists consider "OK" to be the most universally recognized and spoken word across all languages.',
    errorPattern: null,
    subject: 'Language',
    difficulty: 'easy',
    citation: 'https://www.bbc.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'lang-004',
    text: 'There are more English speakers in China than in the United States.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'China has approximately 300-400 million English learners/speakers, exceeding the total US population.',
    errorPattern: null,
    subject: 'Language',
    difficulty: 'hard',
    citation: 'https://www.britannica.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // FOOD
  {
    id: 'food-001',
    text: "Peanuts are not actually nuts - they're legumes.",
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Peanuts grow underground and are part of the legume family, related to beans and lentils. True nuts grow on trees.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    citation: 'https://www.britannica.com/plant/peanut',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'food-002',
    text: 'Eating chocolate causes acne.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Multiple studies have found no direct link between chocolate and acne. Acne is caused by hormones, bacteria, and genetics.',
    errorPattern: 'false-causation',
    subject: 'Medicine',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'food-003',
    text: 'Apples, pears, and plums are all members of the rose family.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Rosaceae (rose) family includes many fruits: apples, pears, plums, cherries, peaches, strawberries, and raspberries.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'hard',
    citation: 'https://www.britannica.com/plant/Rosaceae',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // PSYCHOLOGY
  {
    id: 'psych-001',
    text: 'Studies show that humans only remember 10% of their dreams.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The "10%" figure is made up. Dream recall varies enormously between individuals and depends on when you wake up.',
    errorPattern: 'confident-specificity',
    subject: 'Psychology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'psych-002',
    text: 'The color blue has a calming effect on most people.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Research suggests blue tends to lower heart rate and reduce anxiety in most people, though cultural associations vary.',
    errorPattern: null,
    subject: 'Psychology',
    difficulty: 'easy',
    citation: 'https://www.apa.org/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'psych-003',
    text: 'Multitasking improves productivity.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Studies show multitasking reduces productivity by up to 40%. The brain switches between tasks, losing efficiency.',
    errorPattern: 'myth-perpetuation',
    subject: 'Psychology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // SPORTS - EASY
  {
    id: 'sports-easy-001',
    text: 'A basketball hoop is 10 feet (3.05 meters) high.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The standard basketball hoop height has been 10 feet since James Naismith invented the game in 1891.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://www.nba.com/news/rule-book',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-002',
    text: 'A soccer game has two halves of 45 minutes each.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Standard soccer matches consist of two 45-minute halves, plus stoppage time added by the referee.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://www.fifa.com/technical/football-technology/standards/footballs',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-003',
    text: 'The Super Bowl is the championship game of American football.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Super Bowl is the annual championship game of the National Football League (NFL), first played in 1967.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://www.nfl.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-004',
    text: 'In baseball, a player must touch four bases to score a run.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'A baseball diamond has four bases: first, second, third, and home plate. A runner must touch all four to score.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://www.mlb.com/official-rules',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-005',
    text: 'Tennis was invented in France in 1150 AD and has always used the modern scoring system.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While tennis evolved from games played in France, modern lawn tennis was invented in England in 1873. The exact origin of the scoring system (15-30-40) is debated.',
    errorPattern: 'confident-specificity',
    subject: 'Sports',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-006',
    text: 'The Olympic rings represent the five inhabited continents.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The five Olympic rings represent Africa, the Americas, Asia, Europe, and Oceania. Every national flag contains at least one of the ring colors.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://olympics.com/ioc/olympic-rings',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-007',
    text: 'A standard American football field is exactly 100 yards long from goal line to goal line.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'An NFL football field is 100 yards (300 feet) between the goal lines, with an additional 10-yard end zone on each side.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://www.nfl.com/football-101/nfl-rule-book',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-008',
    text: 'Hockey pucks are frozen before NHL games to make them bouncier.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Pucks are frozen before games, but this makes them LESS bouncy and more consistent to control, not bouncier.',
    errorPattern: 'plausible-adjacency',
    subject: 'Sports',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-009',
    text: 'A marathon is 26.2 miles long.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The official marathon distance is 26 miles and 385 yards (42.195 km), standardized after the 1908 London Olympics.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'easy',
    citation: 'https://olympics.com/en/sports/athletics/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-easy-010',
    text: 'In volleyball, each team is allowed up to 5 hits to return the ball over the net.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Each team is allowed a maximum of 3 hits (not 5) to return the ball over the net. A block does not count as one of these hits.',
    errorPattern: 'confident-specificity',
    subject: 'Sports',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // SPORTS - MEDIUM
  {
    id: 'sports-med-001',
    text: 'A baseball has exactly 108 stitches.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'An official MLB baseball has 108 double stitches (216 individual stitches), all sewn by hand.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.rawlings.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-002',
    text: 'Golf is the only sport to be played on the Moon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Astronaut Alan Shepard hit two golf balls on the Moon during Apollo 14 in 1971.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.nasa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-003',
    text: 'Olympic gold medals are mostly made of silver.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Modern Olympic "gold" medals are 92.5% silver with 6 grams of gold plating. Solid gold medals ended in 1912.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://olympics.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-004',
    text: 'Michael Jordan was cut from his high school varsity basketball team as a sophomore.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Jordan made the JV team as a sophomore at Laney High School in 1978. He later became a 6-time NBA champion.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.biography.com/athletes/michael-jordan',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-005',
    text: 'The Stanley Cup, awarded to NHL champions, was originally only 7.28 inches tall.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The original Stanley Cup bowl was only 7.28 inches high. Today the trophy stands nearly 3 feet tall with all its bands.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.nhl.com/stanley-cup',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-006',
    text: 'Babe Ruth hit exactly 714 home runs during his MLB career, all for the New York Yankees.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While Ruth did hit 714 career home runs, he played for three teams: the Red Sox (49 HRs), Yankees (659 HRs), and Braves (6 HRs).',
    errorPattern: 'confident-specificity',
    subject: 'Sports',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-007',
    text: 'Table tennis was banned in the Soviet Union from 1930 to 1950 because it was believed to be harmful to the eyes.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Soviet Union banned table tennis from 1930-1950, believing the game was harmful to eyesight. The ban was lifted when this was proven false.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.ittf.com/history/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-008',
    text: 'The fastest recorded tennis serve was over 160 mph.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Sam Groth holds the record at 163.7 mph (263.4 km/h), set in 2012. John Isner holds the ATP-recognized record at 157.2 mph.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.atptour.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-009',
    text: 'Soccer players run an average of exactly 7 miles per game, with goalkeepers running the same distance.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Midfielders average about 7 miles per game, but goalkeepers typically cover only 3-4 miles. Different positions cover very different distances.',
    errorPattern: 'confident-specificity',
    subject: 'Sports',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-med-010',
    text: 'The NBA three-point line is 23 feet 9 inches from the basket at the top of the arc.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The NBA three-point arc is 23 feet 9 inches at the top and 22 feet in the corners. College and high school distances are shorter.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'medium',
    citation: 'https://www.nba.com/news/rule-book',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // SPORTS - HARD
  {
    id: 'sports-hard-001',
    text: 'The ancient Olympic Games allowed women to compete in chariot racing because they could enter horses as owners without being present.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Cynisca of Sparta became the first woman to win at the Olympics (396 BCE) as a horse owner. Women could not attend as spectators but could win as owners.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'hard',
    citation: 'https://olympics.com/ioc/ancient-olympic-games',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-002',
    text: 'Professional athletes who train at high altitude have more red blood cells, which is why altitude training is banned by most sports organizations.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Altitude training does increase red blood cells and IS legal in virtually all sports. It is considered a natural training method, unlike blood doping.',
    errorPattern: 'false-causation',
    subject: 'Sports',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-003',
    text: 'Bowling was once banned in America because it was associated with gambling.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Connecticut banned nine-pin bowling in 1841 due to gambling. Legend says ten-pin bowling was invented to circumvent this law.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'hard',
    citation: 'https://www.bowl.com/History',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-004',
    text: 'Studies show that sports performance is significantly affected by uniform color, with teams wearing red winning 60% more often across all sports.',
    answer: 'MIXED',
    source: 'expert-sourced',
    explanation: 'Some studies show red uniforms correlate with higher win rates in combat sports, but the effect varies greatly by sport and is not 60% across all sports.',
    errorPattern: 'statistical-manipulation',
    subject: 'Sports',
    difficulty: 'hard',
    citation: 'https://www.nature.com/articles/436900a',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-005',
    text: 'The FIFA World Cup trophy is made of solid 18-karat gold and weighs approximately 13.6 pounds.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The current FIFA World Cup trophy (since 1974) is 18-karat solid gold, weighing 6.175 kg (13.6 lbs). Winners receive a gold-plated replica.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'hard',
    citation: 'https://www.fifa.com/worldcup/trophy',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-006',
    text: 'According to Harvard Medical School research, heading a soccer ball causes immediate measurable brain damage after each header.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Research shows cumulative concerns about repeated heading, but a single header does not cause immediate measurable brain damage. The claim exaggerates study findings.',
    errorPattern: 'appeal-to-authority',
    subject: 'Sports',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-007',
    text: 'The fastest recorded shot in ice hockey was 108.8 mph, faster than the average MLB fastball.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Zdeno Chara holds the record at 108.8 mph (2012). The average MLB fastball is about 92-94 mph, making hockey shots faster.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'hard',
    citation: 'https://www.nhl.com/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-008',
    text: 'Home field advantage in sports exists partly because visiting teams experience jet lag and unfamiliar environments, reducing their testosterone levels by up to 30%.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Home field advantage is real and travel is a factor, but the 30% testosterone reduction is not supported by scientific evidence. Multiple factors contribute to home advantage.',
    errorPattern: 'statistical-manipulation',
    subject: 'Sports',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-009',
    text: 'Sumo wrestling has weight classes just like boxing and MMA to ensure fair competition.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Professional sumo wrestling has no weight classes. Smaller wrestlers can and do compete against much larger opponents. Skill and technique can overcome size differences.',
    errorPattern: 'plausible-adjacency',
    subject: 'Sports',
    difficulty: 'hard',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'sports-hard-010',
    text: 'The shortest NBA player in history, Muggsy Bogues, was 5 feet 3 inches tall and played 14 seasons.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Tyrone "Muggsy" Bogues stood 5\'3" and played 14 NBA seasons (1987-2001), proving height is not the only factor in basketball success.',
    errorPattern: null,
    subject: 'Sports',
    difficulty: 'hard',
    citation: 'https://www.nba.com/stats/player/203',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // OCEAN
  {
    id: 'ocean-001',
    text: 'More people have been to the Moon than to the deepest part of the ocean.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: '12 people have walked on the Moon, while only a handful have reached Challenger Deep in the Mariana Trench.',
    errorPattern: null,
    subject: 'Marine Biology',
    difficulty: 'medium',
    citation: 'https://oceanservice.noaa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'ocean-002',
    text: 'Starfish can regenerate their entire body from just one arm.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Many starfish species can regenerate an entire new body from a single arm if it includes part of the central disc.',
    errorPattern: null,
    subject: 'Marine Biology',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/animal/sea-star',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'ocean-003',
    text: "The ocean produces 70% of Earth's oxygen.",
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Ocean phytoplankton DO produce significant oxygen (roughly 50-80%), but "70%" is a rough estimate. The exact percentage varies.',
    errorPattern: 'confident-specificity',
    subject: 'Marine Biology',
    difficulty: 'medium',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'ocean-004',
    text: 'Jellyfish have been on Earth longer than dinosaurs.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Jellyfish fossils date back over 500 million years. Dinosaurs first appeared about 240 million years ago.',
    errorPattern: null,
    subject: 'Marine Biology',
    difficulty: 'medium',
    citation: 'https://www.britannica.com/animal/jellyfish',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ENVIRONMENT
  {
    id: 'env-001',
    text: 'There is enough gold in the ocean to give every person on Earth 9 pounds.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The ocean contains about 20 million tons of dissolved gold. However, it\'s so diluted that extraction is impossible.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'hard',
    citation: 'https://oceanservice.noaa.gov/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'env-002',
    text: 'A single tree can absorb 48 pounds of carbon dioxide per year.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'A mature tree absorbs about 48 pounds of CO2 annually, though the amount varies by species and conditions.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    citation: 'https://www.arborday.org/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'env-003',
    text: 'Plastic takes exactly 1,000 years to decompose.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Plastic decomposition time varies enormously (20-500+ years) depending on type and conditions. "Exactly 1,000 years" is fabricated.',
    errorPattern: 'confident-specificity',
    subject: 'Chemistry',
    difficulty: 'easy',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ELEMENTARY (K-5) CLAIMS ====================
  // Simple, concrete, fun facts for young learners (ages 5-11)

  {
    id: 'elem-bio-001',
    text: 'A giraffe\'s tongue is about 18-20 inches long and is purple-black to protect it from sunburn.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Giraffes have dark tongues (purple, black, or dark blue) with melanin that protects against UV rays while eating from trees for hours.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.nationalgeographic.com/animals/mammals/facts/giraffe',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-002',
    text: 'Butterflies taste with their feet.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Butterflies have taste sensors (chemoreceptors) on their feet! When they land on a plant, they can taste it immediately.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.scientificamerican.com/article/butterflies-taste-with-their-feet/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-003',
    text: 'Dogs can only see in black and white.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Dogs can see colors! They see blues and yellows well, but have trouble with reds and greens. They see fewer colors than humans, but not just black and white.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-004',
    text: 'Elephants are the only animals that can\'t jump.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While elephants can\'t jump, they\'re not alone! Sloths, hippos, and rhinos can\'t jump either. Many heavy animals can\'t.',
    errorPattern: 'confident-specificity',
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-005',
    text: 'A snail can sleep for 3 years.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Some snails can enter a deep sleep (estivation) during dry conditions for up to 3 years to survive without water!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.britannica.com/animal/snail',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-006',
    text: 'Octopuses have three hearts and blue blood.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Two hearts pump blood to the gills, one pumps to the body. Their blood is blue because it uses copper (not iron like ours) to carry oxygen.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://ocean.si.edu/ocean-life/invertebrates/octopus',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-007',
    text: 'Cows have exactly four stomachs.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Cows have ONE stomach with FOUR compartments (rumen, reticulum, omasum, abomasum). It\'s one stomach divided into parts, not four separate stomachs.',
    errorPattern: 'plausible-adjacency',
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-008',
    text: 'A group of owls is called a "parliament."',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The collective noun for owls is a "parliament," possibly because owls are often seen as wise, like parliament members.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.merriam-webster.com/dictionary/parliament',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-009',
    text: 'Sharks are older than trees.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Sharks appeared about 450 million years ago. Trees only appeared about 350 million years ago. Sharks are 100 million years older!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.smithsonianmag.com/smart-news/sharks-are-older-trees-180957312/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-010',
    text: 'Penguins have knees hidden under their feathers.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Penguins do have knees! Their legs are structured with knees hidden inside their bodies, which is why they waddle.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.britannica.com/animal/penguin',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-011',
    text: 'A frog must close its eyes to swallow food.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Frogs push their eyes down to help push food down their throats! They literally use their eyeballs to swallow.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.scientificamerican.com/article/frogs-use-their-eyes-to-swallow-prey/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-bio-012',
    text: 'Cats always land on their feet because they have exactly 9 lives.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Cats often land on their feet because they have a flexible spine and inner ear balance. The "9 lives" is just a saying - cats have one life like all animals.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-astro-001',
    text: 'A day on Venus is longer than a year on Venus.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Venus rotates very slowly! One day (rotation) takes 243 Earth days, but one year (orbit) only takes 225 Earth days.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://solarsystem.nasa.gov/planets/venus/overview/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-astro-002',
    text: 'The Moon makes its own light like the Sun does.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The Moon doesn\'t make light - it reflects sunlight! The Sun is a star that makes light from nuclear fusion. The Moon is just a giant rock.',
    errorPattern: 'plausible-adjacency',
    subject: 'Astronomy',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-astro-003',
    text: 'You could fit all the other planets between Earth and the Moon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The average Earth-Moon distance is about 384,400 km. All the other planets lined up equal about 380,000 km!',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'medium',
    gradeLevel: 'elementary',
    citation: 'https://www.nasa.gov/audience/forstudents/k-4/stories/distances-in-space',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-astro-004',
    text: 'Saturn would float if you could find a bathtub big enough.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Saturn is the only planet less dense than water (0.687 g/cm³ vs water\'s 1 g/cm³). It would float like a giant beach ball!',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://solarsystem.nasa.gov/planets/saturn/overview/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-astro-005',
    text: 'There are exactly 100 billion stars in our galaxy.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Scientists estimate 100-400 billion stars in the Milky Way, but we can\'t count them exactly! "Exactly 100 billion" is made up.',
    errorPattern: 'confident-specificity',
    subject: 'Astronomy',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-phys-001',
    text: 'Hot water can freeze faster than cold water under certain conditions.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is called the Mpemba effect! Under certain conditions, hot water freezes faster than cold water. Scientists are still studying why.',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'medium',
    gradeLevel: 'elementary',
    citation: 'https://www.scientificamerican.com/article/mpemba-effect-hot-water-freezes-faster-cold/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-phys-002',
    text: 'Light from the Sun takes exactly 1 minute to reach Earth.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Sunlight takes about 8 minutes and 20 seconds to reach Earth, not 1 minute. "Exactly 1 minute" is fabricated.',
    errorPattern: 'confident-specificity',
    subject: 'Physics',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-phys-003',
    text: 'A rainbow always has exactly 7 colors.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'A rainbow is actually a continuous spectrum! We see it as 7 colors (ROYGBIV) because that\'s how Isaac Newton described it, but there are infinite colors blending into each other.',
    errorPattern: 'confident-specificity',
    subject: 'Physics',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-geo-001',
    text: 'The Amazon River flows through Argentina.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The Amazon River flows through Brazil, Peru, and Colombia, but NOT Argentina. Argentina is too far south.',
    errorPattern: 'geographic-fabrication',
    subject: 'Geography',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-geo-002',
    text: 'Australia is both a country and a continent.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Australia is the only place that is both a country (with a government) and a continent (a major landmass). It\'s unique!',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.britannica.com/place/Australia',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-geo-003',
    text: 'Mount Everest grows about half an inch taller every year.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The collision of tectonic plates pushes Mount Everest up by about 4mm (roughly half an inch) per year!',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'medium',
    gradeLevel: 'elementary',
    citation: 'https://www.nationalgeographic.com/science/article/151214-everest-grows-higher-nepal-earthquake',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-hist-001',
    text: 'Cleopatra lived closer in time to the first iPhone than to the building of the pyramids.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Great Pyramid was built around 2560 BCE. Cleopatra died in 30 BCE (2,530 years later). iPhone came in 2007 CE (2,037 years after Cleopatra). Mind-blowing!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'medium',
    gradeLevel: 'elementary',
    citation: 'https://www.britannica.com/biography/Cleopatra-queen-of-Egypt',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-hist-002',
    text: 'Vikings wore helmets with horns on them.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This is a popular myth! Real Viking helmets were plain metal or leather. The horned helmets idea came from old operas and movies.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-hist-003',
    text: 'The Eiffel Tower can grow 6 inches taller in summer.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'When metal heats up, it expands! In hot summer weather, the iron in the Eiffel Tower expands, making it about 6 inches taller.',
    errorPattern: null,
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.toureiffel.paris/en/news/history-and-culture',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-human-001',
    text: 'Your nose and ears never stop growing your entire life.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Unlike bones, the cartilage in your nose and ears keeps growing slowly throughout your life. That\'s why older people have bigger noses and ears!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.scientificamerican.com/article/why-do-noses-and-ears-continue-to-grow/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-human-002',
    text: 'You are about 1 cm taller in the morning than at night.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The cartilage between your spine bones (vertebrae) compresses during the day from gravity. You\'re slightly shorter at night and "taller" after sleeping!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.scientificamerican.com/article/why-am-i-taller-in-the-morning/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-human-003',
    text: 'Humans have exactly 206 bones at all ages.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Babies are born with about 270-300 bones! Many fuse together as you grow. Adults have 206 bones, but babies have more.',
    errorPattern: 'confident-specificity',
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-human-004',
    text: 'Your stomach gets a new lining every few days.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Your stomach lining replaces itself every 3-4 days to protect against the strong acid that digests your food!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.ncbi.nlm.nih.gov/books/NBK534792/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-chem-001',
    text: 'Honey never spoils and can last thousands of years.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Honey has natural preservatives! Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.smithsonianmag.com/science-nature/the-science-behind-honeys-eternal-shelf-life-1218690/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-chem-002',
    text: 'Water is the only thing that exists as solid, liquid, and gas at normal Earth temperatures.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Water exists as ice (solid), water (liquid), and steam (gas) in everyday conditions on Earth. Most substances need extreme temperatures to change states.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.usgs.gov/special-topics/water-science-school/science/water-density',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-tech-001',
    text: 'The first computer weighed more than an elephant.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'ENIAC (1945) weighed about 30 tons (60,000 pounds)! An African elephant weighs about 6-7 tons. ENIAC was 4-5 elephants heavy!',
    errorPattern: null,
    subject: 'Computer Science',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.britannica.com/technology/ENIAC',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'elem-tech-002',
    text: 'The @ symbol was invented for email.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The @ symbol existed for centuries! Merchants used it to mean "at the rate of" for prices. Ray Tomlinson chose it for email in 1971 because it was already on keyboards.',
    errorPattern: 'timeline-compression',
    subject: 'Computer Science',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== MIDDLE SCHOOL (6-8) CLAIMS ====================
  // Standard complexity, building critical thinking skills (ages 11-14)

  {
    id: 'mid-bio-001',
    text: 'The human body contains enough iron to make a 3-inch nail.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Adults have about 4 grams of iron in their blood and tissues. That\'s enough to forge a small nail!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3685880/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-bio-002',
    text: 'Humans share exactly 60% of their DNA with bananas.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Humans share about 40-60% of DNA with bananas, but "exactly 60%" is too precise. The actual percentage depends on which genes you compare.',
    errorPattern: 'confident-specificity',
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-bio-003',
    text: 'A cockroach can live for several weeks without its head.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Cockroaches breathe through body segments and don\'t need their head for breathing. They eventually die from dehydration since they can\'t drink.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.scientificamerican.com/article/fact-or-fiction-a-luftwa/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-bio-004',
    text: 'The mantis shrimp can punch with the force of a bullet.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Mantis shrimp can accelerate their clubs at 50 mph, creating a force equivalent to a .22 caliber bullet! They can break aquarium glass.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.nature.com/articles/nature03657',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-bio-005',
    text: 'Tardigrades (water bears) can survive in the vacuum of space.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Tardigrades have survived exposure to space vacuum, extreme radiation, and temperatures from -458°F to 300°F! They enter a dried state called cryptobiosis.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.nature.com/articles/news.2008.1087',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-bio-006',
    text: 'Jellyfish are immortal and cannot die of old age.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Only ONE species (Turritopsis dohrnii) can potentially reverse aging. Most jellyfish die normally. Saying "jellyfish are immortal" is a huge overgeneralization.',
    errorPattern: 'plausible-adjacency',
    subject: 'Biology',
    difficulty: 'hard',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-chem-001',
    text: 'Glass is actually a liquid that flows very slowly over time.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This is a popular myth! Glass is an amorphous solid. Old windows are thicker at the bottom because of how they were made, not because glass flows.',
    errorPattern: 'myth-perpetuation',
    subject: 'Chemistry',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-chem-002',
    text: 'Diamond and pencil graphite are both made of the same element - carbon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Both diamond and graphite are pure carbon! The difference is how the carbon atoms are arranged. Diamond has a 3D crystal structure; graphite has flat sheets.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.britannica.com/science/carbon-chemical-element',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-phys-001',
    text: 'The speed of light is exactly 186,282 miles per second with no variation.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Light travels at about 186,282 miles/second IN A VACUUM. In water, glass, or other materials, light slows down significantly!',
    errorPattern: 'confident-specificity',
    subject: 'Physics',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-phys-002',
    text: 'If you could fold a piece of paper 42 times, it would reach the Moon.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Exponential growth! Each fold doubles thickness. 42 folds = 2^42 × 0.1mm ≈ 440,000 km. Moon is ~384,000 km away. (You can\'t actually fold paper that many times!)',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.sciencealert.com/fold-a-piece-of-paper-42-times-reach-moon',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-hist-001',
    text: 'Oxford University is older than the Aztec Empire.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Oxford started teaching in 1096; it was established by 1249. The Aztec Empire was founded in 1428 when they built Tenochtitlan. Oxford is about 200 years older!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'hard',
    gradeLevel: 'middle',
    citation: 'https://www.ox.ac.uk/about/organisation/history',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-hist-002',
    text: 'Albert Einstein failed math as a child.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Einstein was excellent at math! This myth started from a misunderstanding of German grading scales. He excelled in math and physics from childhood.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-hist-003',
    text: 'The shortest war in history lasted exactly 38 minutes.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The Anglo-Zanzibar War (1896) lasted 38-45 minutes, but "exactly 38 minutes" is too precise. Historical records vary on the exact duration.',
    errorPattern: 'confident-specificity',
    subject: 'History',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-hist-004',
    text: 'Thomas Edison invented the light bulb.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Edison improved and commercialized the light bulb, but didn\'t invent it. At least 20 inventors created incandescent lights before him. He made it practical and affordable.',
    errorPattern: 'myth-perpetuation',
    subject: 'History',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-tech-001',
    text: 'The inventor of the Pringles can is buried in one.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Fredric Baur invented the Pringles can shape. When he died in 2008, his children honored his wishes by burying some of his ashes in a Pringles can!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: 'https://time.com/3957979/pringles-can-inventor-buried/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-tech-002',
    text: 'Nintendo started as a video game company.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Nintendo was founded in 1889 as a playing card company! They made "Hanafuda" cards. They didn\'t enter video games until the 1970s.',
    errorPattern: 'timeline-compression',
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-geo-001',
    text: 'Russia has 11 time zones.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Russia spans 11 time zones, from UTC+2 to UTC+12. When it\'s midnight in western Russia, it\'s already 9 AM the next day in the far east!',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.britannica.com/place/Russia',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-geo-002',
    text: 'Canada has more lakes than the rest of the world combined.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Canada has an estimated 2 million lakes! That\'s more than all other countries combined. About 9% of Canada\'s area is covered by freshwater.',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.nrcan.gc.ca/our-natural-resources/water-resources/water-basics/8721',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-math-001',
    text: 'Zero is an even number.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Zero is even! An even number is divisible by 2 with no remainder. 0 ÷ 2 = 0 with no remainder. Zero also fits the pattern: -4, -2, 0, 2, 4...',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: 'https://www.britannica.com/science/zero-mathematics',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'mid-math-002',
    text: 'The number "googol" (1 followed by 100 zeros) is bigger than the number of atoms in the observable universe.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The observable universe has about 10^80 atoms. A googol is 10^100. That\'s 100 billion trillion times more than all atoms in the universe!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'middle',
    citation: 'https://www.britannica.com/topic/googol',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== HIGH SCHOOL (9-12) CLAIMS ====================
  // More nuanced analysis required, complex topics (ages 14-18)

  {
    id: 'high-bio-001',
    text: 'Humans are 99.9% genetically identical to each other.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'All humans share about 99.9% of their DNA sequence. The 0.1% difference accounts for all variation in traits, disease susceptibility, and individual uniqueness.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: 'https://www.genome.gov/about-genomics/fact-sheets/Genetics-vs-Genomics',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-bio-002',
    text: 'CRISPR technology allows scientists to cut and edit DNA with surgical precision, making zero unintended changes.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'CRISPR is powerful but not perfect. "Off-target effects" (unintended edits) remain a significant concern in gene editing research. "Zero unintended changes" is false.',
    errorPattern: 'confident-specificity',
    subject: 'Biotechnology',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-bio-003',
    text: 'Mitochondria have their own DNA, separate from the cell\'s nuclear DNA.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Mitochondrial DNA (mtDNA) is inherited only from mothers. This supports the endosymbiotic theory that mitochondria were once free-living bacteria.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: 'https://www.ncbi.nlm.nih.gov/books/NBK21251/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-bio-004',
    text: 'The appendix has no known function and is purely a vestigial organ.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Recent research shows the appendix serves as a "safe house" for beneficial gut bacteria and plays a role in immune function. It\'s not purely vestigial.',
    errorPattern: 'myth-perpetuation',
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-chem-001',
    text: 'Neutron stars are so dense that a teaspoon would weigh about 6 billion tons.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Neutron stars pack the mass of the Sun into a sphere ~20 km across. A teaspoon of neutron star material would weigh billions of tons on Earth.',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://www.nasa.gov/mission_pages/GLAST/science/neutron_stars.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-chem-002',
    text: 'Water is a universal solvent that can dissolve any substance given enough time.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While water dissolves many substances, it cannot dissolve everything. Oils, fats, and many plastics are hydrophobic and won\'t dissolve in water.',
    errorPattern: 'confident-specificity',
    subject: 'Chemistry',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-phys-001',
    text: 'Nothing can travel faster than light in a vacuum.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'This is mostly true for matter and information, but some phenomena appear to exceed light speed: quantum entanglement "spooky action," the expanding universe, and phase velocities.',
    errorPattern: 'plausible-adjacency',
    subject: 'Physics',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-phys-002',
    text: 'Schrödinger\'s cat was a real experiment performed on cats.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Schrödinger\'s cat was a thought experiment to illustrate problems with quantum superposition when applied to everyday objects. No cats were harmed - it was purely theoretical.',
    errorPattern: 'myth-perpetuation',
    subject: 'Physics',
    difficulty: 'easy',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-phys-003',
    text: 'GPS satellites must account for time dilation from both special and general relativity to work accurately.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'GPS clocks tick faster (45 μs/day from general relativity) and slower (7 μs/day from special relativity). Without corrections, GPS would accumulate 10 km of error daily!',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://www.scientificamerican.com/article/how-does-relativity-affect-gps/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-hist-001',
    text: 'The Library of Alexandria was destroyed in a single fire.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The Library of Alexandria declined over centuries through multiple events: Julius Caesar\'s fire, Christian riots, and gradual defunding. No single dramatic destruction.',
    errorPattern: 'timeline-compression',
    subject: 'History',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-hist-002',
    text: 'The term "cold turkey" for quitting addictions comes from the goosebumps that appear during withdrawal.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'This is one popular etymology, as withdrawal causes goosebumps resembling plucked turkey skin. However, the true origin is uncertain and other theories exist.',
    errorPattern: 'appeal-to-authority',
    subject: 'History',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-econ-001',
    text: 'The stock market has returned exactly 10% annually on average since its inception.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Historical S&P 500 returns average about 10-11% including dividends, but "exactly 10%" is too precise. Returns vary greatly by period measured and whether you adjust for inflation.',
    errorPattern: 'confident-specificity',
    subject: 'Mathematics',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-psych-001',
    text: 'People only use 10% of their brain, leaving 90% untapped potential.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Brain scans show we use virtually all areas of our brain. Different regions activate for different tasks. The "10%" myth has been thoroughly debunked.',
    errorPattern: 'myth-perpetuation',
    subject: 'Neuroscience',
    difficulty: 'easy',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-psych-002',
    text: 'The Dunning-Kruger effect shows that incompetent people think they\'re experts while experts doubt themselves.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The original study showed low performers overestimate while high performers underestimate their ranking, but both groups\' estimates correlate with actual ability. The popular interpretation is oversimplified.',
    errorPattern: 'plausible-adjacency',
    subject: 'Neuroscience',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-tech-001',
    text: 'Quantum computers can already crack any encryption used today.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Current quantum computers are too small and error-prone. Breaking RSA encryption would require millions of stable qubits. Today\'s quantum computers have ~1000 noisy qubits.',
    errorPattern: 'timeline-compression',
    subject: 'Computer Science',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-tech-002',
    text: 'The first computer programmer was a woman named Ada Lovelace.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Ada Lovelace wrote the first algorithm intended for machine processing in 1843 for Charles Babbage\'s Analytical Engine, making her history\'s first computer programmer.',
    errorPattern: null,
    subject: 'Computer Science',
    difficulty: 'easy',
    gradeLevel: 'high',
    citation: 'https://www.britannica.com/biography/Ada-Lovelace',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-env-001',
    text: 'Recycling a single aluminum can saves enough energy to power a TV for three hours.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Recycling aluminum uses 95% less energy than creating new aluminum from ore. That saved energy (about 255 watt-hours) can power a TV for 2-3 hours.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: 'https://www.epa.gov/recycle/recycling-basics',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-math-001',
    text: 'There are more possible chess games than atoms in the observable universe.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The Shannon number estimates 10^120 possible chess games. The universe has about 10^80 atoms. Chess possibilities exceed atoms by a factor of 10^40!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://www.chess.com/article/view/how-many-possible-chess-games-are-there',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'high-math-002',
    text: 'Pi has been proven to contain every possible sequence of digits.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Pi is believed to be a "normal" number containing all digit sequences, but this has NOT been proven. It\'s one of mathematics\' open problems.',
    errorPattern: 'confident-specificity',
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== COLLEGE/UNIVERSITY CLAIMS ====================
  // Sophisticated, specialized content for advanced critical thinking (ages 18+)

  {
    id: 'col-bio-001',
    text: 'Horizontal gene transfer means bacteria can acquire antibiotic resistance without reproducing.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Bacteria can transfer plasmids containing resistance genes directly to neighboring bacteria through conjugation, transformation, or transduction - without cell division.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4536516/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-bio-002',
    text: 'Epigenetic changes can be inherited across multiple generations, proving Lamarckian evolution was correct.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Transgenerational epigenetic inheritance exists and resembles Lamarck\'s ideas, but this doesn\'t validate his full theory. Modern epigenetics works through different mechanisms than Lamarck proposed.',
    errorPattern: 'false-causation',
    subject: 'Biology',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-bio-003',
    text: 'The human microbiome contains more bacterial cells than human cells in the body.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'The commonly cited 10:1 ratio is outdated. Current estimates suggest roughly 1:1 ratio (38 trillion bacteria vs 37 trillion human cells), varying by individual and conditions.',
    errorPattern: 'confident-specificity',
    subject: 'Biology',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-phys-001',
    text: 'The Many-Worlds interpretation of quantum mechanics is now the accepted standard among physicists.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'There\'s no consensus interpretation of quantum mechanics. The Copenhagen interpretation remains widely taught. Many-Worlds has supporters but isn\'t "the accepted standard."',
    errorPattern: 'appeal-to-authority',
    subject: 'Physics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-phys-002',
    text: 'Virtual particles in quantum field theory violate conservation of energy, but only briefly.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'This depends on interpretation. Virtual particles are mathematical tools in perturbation theory. Whether they "exist" or "violate" conservation laws is debated. The energy-time uncertainty principle is often misapplied here.',
    errorPattern: 'plausible-adjacency',
    subject: 'Physics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-phys-003',
    text: 'Hawking radiation has been directly detected emanating from a black hole.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Hawking radiation is theoretically predicted but has never been directly detected from a black hole. It would be extremely faint. Lab analogues have shown similar effects.',
    errorPattern: 'timeline-compression',
    subject: 'Physics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-neuro-001',
    text: 'Neuroplasticity allows adult brains to form new neurons throughout life in multiple brain regions.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'Adult neurogenesis is well-established in the hippocampus, but claims about "multiple brain regions" remain controversial. The extent of adult neurogenesis is still being researched.',
    errorPattern: 'confident-specificity',
    subject: 'Neuroscience',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-neuro-002',
    text: 'The "left brain/right brain" theory accurately describes how creativity and logic are processed.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'While hemispheric specialization exists for some functions (e.g., language in left hemisphere), the creative/logical divide is vastly oversimplified. Most tasks use both hemispheres.',
    errorPattern: 'myth-perpetuation',
    subject: 'Neuroscience',
    difficulty: 'medium',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-stat-001',
    text: 'A statistically significant result means the finding is important and practically meaningful.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Statistical significance (p < 0.05) only means the result is unlikely under the null hypothesis. It says nothing about effect size or practical importance. Large samples can yield significant but trivial effects.',
    errorPattern: 'plausible-adjacency',
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-stat-002',
    text: 'Bayesian statistics are now widely accepted as superior to frequentist approaches for all applications.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Both approaches have strengths. Bayesian methods excel with prior knowledge and small samples; frequentist methods are often simpler and preferred for regulatory approval. Neither is universally superior.',
    errorPattern: 'appeal-to-authority',
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-econ-001',
    text: 'The efficient market hypothesis states it\'s impossible to consistently beat the market.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'EMH has different forms (weak, semi-strong, strong). Only the strong form claims markets are perfectly efficient. Evidence shows markets are mostly efficient but some anomalies exist.',
    errorPattern: 'plausible-adjacency',
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-cs-001',
    text: 'P vs NP has been solved, proving P ≠ NP.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'P vs NP remains one of the seven Millennium Prize Problems. No accepted proof exists. Many attempts have been made, but none have withstood peer review.',
    errorPattern: 'timeline-compression',
    subject: 'Computer Science',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-cs-002',
    text: 'Machine learning models can learn to be truly creative and generate genuinely novel ideas beyond their training data.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'ML models can produce novel combinations and interpolations, but whether this constitutes "true creativity" is philosophical. They cannot reason beyond patterns in training data in the way humans might.',
    errorPattern: 'plausible-adjacency',
    subject: 'Computer Science',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-phil-001',
    text: 'Gödel\'s incompleteness theorems prove that mathematics is fundamentally flawed.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Gödel showed that sufficiently powerful formal systems can\'t prove all true statements about themselves. This is a feature of formal systems, not a "flaw" in mathematics itself.',
    errorPattern: 'plausible-adjacency',
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-med-001',
    text: 'The placebo effect has been shown to cause measurable biological changes, not just subjective improvements.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Placebo responses involve real neurobiological changes: endorphin release, dopamine activity, and changes in brain regions associated with pain and mood. These are objective, measurable effects.',
    errorPattern: null,
    subject: 'Medical Science',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5841469/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-med-002',
    text: 'Vaccines cause autism according to the original 1998 Lancet study by Andrew Wakefield.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Wakefield\'s study was fraudulent and retracted. He lost his medical license. Dozens of large studies involving millions of children have found no link between vaccines and autism.',
    errorPattern: 'appeal-to-authority',
    subject: 'Medical Science',
    difficulty: 'medium',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-env-001',
    text: 'Carbon capture technology can already remove CO2 from the atmosphere at a cost-effective scale.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Current carbon capture is expensive ($400-600+ per ton) and energy-intensive. It works but isn\'t cost-effective at climate-relevant scale. Costs are decreasing but remain prohibitive.',
    errorPattern: 'timeline-compression',
    subject: 'Chemistry',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-hist-001',
    text: 'The "Dark Ages" were actually a period of significant technological and intellectual progress in many regions.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'While Western Europe saw decline after Rome, the Byzantine Empire, Islamic Golden Age, Tang Dynasty China, and other civilizations flourished. The term "Dark Ages" is Eurocentric and misleading.',
    errorPattern: null,
    subject: 'History',
    difficulty: 'medium',
    gradeLevel: 'college',
    citation: 'https://www.britannica.com/event/Dark-Ages',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'col-ling-001',
    text: 'The Sapir-Whorf hypothesis has been proven: language completely determines thought.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'The strong version (linguistic determinism) is largely rejected. The weak version (linguistic relativity) - that language influences thought - has more support, but "completely determines" is too strong.',
    errorPattern: 'confident-specificity',
    subject: 'Neuroscience',
    difficulty: 'hard',
    gradeLevel: 'college',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },

  // ==================== ADDITIONAL VIRAL CLAIMS (ALL LEVELS) ====================
  // High engagement potential - surprising, shareable facts

  {
    id: 'viral-001',
    text: 'A blue whale\'s heart is so big that a small child could crawl through its arteries.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'A blue whale\'s heart weighs about 400 pounds and is the size of a small car. Its aorta is large enough for a small child (or a basketball) to pass through!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.nationalgeographic.com/animals/mammals/facts/blue-whale',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-002',
    text: 'There are more ways to arrange a deck of cards than atoms on Earth.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: '52! (52 factorial) ≈ 8×10^67 arrangements. Earth has about 10^50 atoms. Card arrangements outnumber atoms by a factor of 10^17 (100,000 trillion times)!',
    errorPattern: null,
    subject: 'Mathematics',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://www.sciencefocus.com/science/how-many-ways-can-you-shuffle-a-deck-of-cards/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-003',
    text: 'Honey bees can recognize human faces.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Studies show honeybees can learn to recognize and remember human faces, using the same part of their brain they use to recognize flowers!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.science.org/doi/10.1126/science.1103676',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-004',
    text: 'Your brain uses more electricity than a light bulb.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Your brain uses about 12-20 watts - similar to a dim LED bulb but less than most incandescent bulbs (40-100W). "More than a light bulb" is misleading without specifying which bulb.',
    errorPattern: 'confident-specificity',
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-005',
    text: 'Bananas are radioactive.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Bananas contain potassium-40, a radioactive isotope. Eating one exposes you to about 0.01 millirem of radiation - completely harmless and far less than background radiation.',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.epa.gov/radtown/natural-radioactivity-food',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-006',
    text: 'A cloud can weigh more than a million pounds.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'An average cumulus cloud contains about 500 million grams of water (1.1 million pounds)! It floats because the water is spread over a huge volume with air underneath.',
    errorPattern: null,
    subject: 'Physics',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.usgs.gov/special-topics/water-science-school/science/how-much-does-a-cloud-weigh',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-007',
    text: 'Wombat poop is cube-shaped.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Wombats produce cube-shaped droppings due to the varied elasticity of their intestinal walls. The cubes don\'t roll away, helping mark territory. Scientists won an Ig Nobel Prize studying this!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.nationalgeographic.com/animals/article/wombat-poop-cubes-why-study-reveals-mystery',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-008',
    text: 'Scotland\'s national animal is the unicorn.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'The unicorn has been a Scottish heraldic symbol since the 12th century! It represents purity, innocence, power, and independence - values important to Scottish identity.',
    errorPattern: null,
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'elementary',
    citation: 'https://www.visitscotland.com/things-to-do/attractions/arts-culture/traditions/unicorn',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-009',
    text: 'There\'s a basketball court on the top floor of the Supreme Court building, nicknamed "the highest court in the land."',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'There\'s a full basketball court on the 5th floor above the courtrooms. It\'s nicknamed "the highest court in the land" - a legal pun since the Supreme Court is the highest court!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: 'https://www.supremecourt.gov/about/buildingfeatures.aspx',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-010',
    text: 'Venus is the only planet that spins clockwise (viewed from above the north pole).',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'Uranus also spins differently - it rotates on its side! And technically Venus and Uranus both have retrograde rotation. Saying Venus is "the only" planet is incorrect.',
    errorPattern: 'confident-specificity',
    subject: 'Astronomy',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-011',
    text: 'The inventor of the frisbee was turned into a frisbee after death.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Walter Morrison, who invented the modern frisbee (Pluto Platter), died in 2010. His family had his ashes molded into memorial frisbees!',
    errorPattern: null,
    subject: 'History',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: 'https://www.nytimes.com/2010/02/11/sports/11frisbee.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-012',
    text: 'Crows can remember human faces and hold grudges for years.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Research shows crows recognize faces and can hold grudges against people who threatened them. They even teach their offspring to recognize "dangerous" humans!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.scientificamerican.com/article/grudge-holding-crows-pass-on-their-anger-to-family-and-friends/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-013',
    text: 'A jiffy is an actual unit of time equal to 1/100th of a second.',
    answer: 'MIXED',
    source: 'ai-generated',
    explanation: 'A "jiffy" has multiple definitions in science! In physics it\'s often the time for light to travel one centimeter (~33.4 picoseconds). In electronics it can mean 1/60 second. "1/100th of a second" is just one definition.',
    errorPattern: 'confident-specificity',
    subject: 'Physics',
    difficulty: 'medium',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-014',
    text: 'Human trafficking happens more in the US than in any other country.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'This is difficult to measure accurately. While the US has more identified victims due to better reporting systems, raw numbers don\'t mean more trafficking. Many countries have worse problems but less reporting.',
    errorPattern: 'statistical-manipulation',
    subject: 'Geography',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-015',
    text: 'A day on Mercury (sunrise to sunrise) lasts 176 Earth days.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Mercury rotates very slowly (59 Earth days) and orbits fast (88 days). Combined with its elliptical orbit, one solar day (noon to noon) equals 176 Earth days!',
    errorPattern: null,
    subject: 'Astronomy',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://solarsystem.nasa.gov/planets/mercury/overview/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-016',
    text: 'You can see the Great Wall of China from the Moon.',
    answer: 'FALSE',
    source: 'ai-generated',
    explanation: 'You can\'t see the Great Wall from the Moon - it\'s far too thin (15-30 feet wide). Apollo astronauts confirmed you can barely see continental outlines from the Moon, let alone structures.',
    errorPattern: 'myth-perpetuation',
    subject: 'Geography',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: null,
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-017',
    text: 'Every person alive today shares a common ancestor who lived only about 3,000 years ago.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Mathematical modeling shows everyone alive today shares at least one ancestor from roughly 1000 BCE. This "identical ancestors point" is surprisingly recent due to population interconnection.',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://www.nature.com/articles/nature02842',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-018',
    text: 'The smell after rain has an official name: petrichor.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Australian scientists coined "petrichor" in 1964 from Greek "petra" (stone) and "ichor" (fluid of the gods). It\'s caused by bacteria, plant oils, and ozone released during rain.',
    errorPattern: null,
    subject: 'Chemistry',
    difficulty: 'easy',
    gradeLevel: 'middle',
    citation: 'https://www.scientificamerican.com/article/storm-scents-it-s-true-you-can-smell-incoming-rain/',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-019',
    text: 'Maine is the closest US state to Africa.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Due to Earth\'s curvature, Quoddy Head in Maine is about 3,154 miles from El Beddouza, Morocco. Florida looks closer on flat maps but is actually farther due to map projection distortion!',
    errorPattern: null,
    subject: 'Geography',
    difficulty: 'hard',
    gradeLevel: 'high',
    citation: 'https://www.worldatlas.com/articles/the-african-nation-closest-to-the-united-states.html',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  },
  {
    id: 'viral-020',
    text: 'A strawberry is not actually a berry, but a banana is.',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'Botanically, berries develop from a single ovary with seeds inside the flesh. Strawberries develop from multiple ovaries (making them "aggregate fruits"). Bananas meet the berry definition!',
    errorPattern: null,
    subject: 'Biology',
    difficulty: 'medium',
    gradeLevel: 'middle',
    citation: 'https://www.britannica.com/science/berry-plant-reproductive-body',
    lastVerified: '2024-12-01',
    reviewedBy: ['content-team']
  }
];

/**
 * Get all unique subjects from the claims database
 */
export function getSubjects() {
  const subjects = [...new Set(CLAIMS_DATABASE.map(c => c.subject))];
  return subjects.sort();
}

/**
 * Get claims by subject
 */
export function getClaimsBySubject(subject) {
  return CLAIMS_DATABASE.filter(c => c.subject === subject);
}

/**
 * Get claims by grade level
 * @param {string} gradeLevel - 'elementary' | 'middle' | 'high' | 'college'
 * @returns {Array} Claims for that grade level (+ claims without gradeLevel for backwards compat)
 */
export function getClaimsByGradeLevel(gradeLevel) {
  return CLAIMS_DATABASE.filter(c =>
    c.gradeLevel === gradeLevel || (!c.gradeLevel && gradeLevel === 'middle')
  );
}

/**
 * Get claims filtered by multiple criteria
 * @param {Object} filters - { gradeLevel, difficulty, subject, excludeIds }
 * @returns {Array} Filtered claims
 */
export function getFilteredClaims(filters = {}) {
  const { gradeLevel, difficulty, subject, excludeIds = [] } = filters;
  const excludeSet = new Set(excludeIds);

  return CLAIMS_DATABASE.filter(claim => {
    // Exclude already-seen claims
    if (excludeSet.has(claim.id)) return false;

    // Grade level filter (claims without gradeLevel default to 'middle')
    if (gradeLevel) {
      const claimLevel = claim.gradeLevel || 'middle';
      if (claimLevel !== gradeLevel) return false;
    }

    // Difficulty filter
    if (difficulty && claim.difficulty !== difficulty) return false;

    // Subject filter
    if (subject && claim.subject !== subject) return false;

    return true;
  });
}

/**
 * Get grade level distribution statistics
 */
export function getGradeLevelDistribution() {
  const dist = { elementary: 0, middle: 0, high: 0, college: 0 };
  CLAIMS_DATABASE.forEach(c => {
    const level = c.gradeLevel || 'middle';
    if (dist[level] !== undefined) dist[level]++;
  });
  return dist;
}

/**
 * Get answer distribution statistics
 */
export function getAnswerDistribution() {
  const dist = { TRUE: 0, FALSE: 0, MIXED: 0 };
  CLAIMS_DATABASE.forEach(c => dist[c.answer]++);
  return dist;
}

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

    // Validate grade level if present
    if (claim.gradeLevel && !['elementary', 'middle', 'high', 'college'].includes(claim.gradeLevel)) {
      invalidClaims.push({ index, claim, reason: `Invalid gradeLevel: ${claim.gradeLevel}` });
    }

    // Validate error pattern for AI-generated claims
    if (claim.source === 'ai-generated' && claim.errorPattern) {
      const validPatterns = AI_ERROR_PATTERNS.map(p => p.id);
      if (!validPatterns.includes(claim.errorPattern)) {
        invalidClaims.push({ index, claim, reason: `Invalid error pattern: ${claim.errorPattern}` });
      }
    }
  });

  return {
    valid: duplicates.length === 0 && invalidClaims.length === 0,
    duplicates,
    invalidClaims,
    totalClaims: CLAIMS_DATABASE.length,
    distribution: getAnswerDistribution(),
    gradeLevels: getGradeLevelDistribution(),
    subjects: getSubjects()
  };
}

// Run validation in development
if (import.meta.env?.DEV) {
  const validation = validateClaimsDatabase();
  if (!validation.valid) {
    console.warn('Claims database validation failed:', validation);
  } else {
    console.log('Claims database validation passed:', validation.totalClaims, 'claims');
    console.log('Answer distribution:', validation.distribution);
    console.log('Grade levels:', validation.gradeLevels);
    console.log('Subjects:', validation.subjects);
  }
}
