export interface TopicConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  gradeRange: [number, number];
  prerequisites?: string[];
  estimatedMinutes: number;
  hasInteractive: boolean;
  hasPractice: boolean;
  generatorKey: string | null;
}

export interface SubjectConfig {
  id: string;
  name: string;
  icon: string;
  teacherName: string;
  topics: TopicConfig[];
}

export const TOPIC_CATALOG: Record<string, SubjectConfig> = {
  math: {
    id: "math",
    name: "Mathematics",
    icon: "📐",
    teacherName: "Ms. Eleanor Chen",
    topics: [
      {
        id: "fractions",
        slug: "fractions",
        name: "Fractions",
        description: "Understanding, comparing, and operating with fractions",
        gradeRange: [6, 8],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "decimals",
        slug: "decimals",
        name: "Decimals",
        description: "Working with decimal numbers and conversions",
        gradeRange: [6, 8],
        prerequisites: ["fractions"],
        estimatedMinutes: 25,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "percentages",
        slug: "percentages",
        name: "Percentages",
        description: "Understanding percentages and their applications",
        gradeRange: [6, 9],
        prerequisites: ["fractions", "decimals"],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "linear_equations",
        slug: "linear-equations",
        name: "Linear Equations",
        description: "Solving single-variable linear equations",
        gradeRange: [7, 10],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: "linear_equations",
      },
      {
        id: "index_laws",
        slug: "index-laws",
        name: "Index Laws",
        description: "Understanding and applying the laws of indices",
        gradeRange: [8, 10],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "expanding_brackets",
        slug: "expanding-brackets",
        name: "Expanding Brackets",
        description: "Expanding and simplifying algebraic expressions with brackets",
        gradeRange: [8, 10],
        prerequisites: ["algebra_basics"],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "inequalities",
        slug: "inequalities",
        name: "Inequalities",
        description: "Solving and graphing linear inequalities",
        gradeRange: [8, 10],
        prerequisites: ["linear_equations"],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: "inequalities",
      },
      {
        id: "fractional_indices",
        slug: "fractional-indices",
        name: "Fractional Indices",
        description: "Working with fractional and negative fractional exponents",
        gradeRange: [9, 11],
        prerequisites: ["index_laws"],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: "fractional_indices",
      },
      {
        id: "surds_intro",
        slug: "introduction-to-surds",
        name: "Introduction to Surds",
        description: "Simplifying, combining, multiplying surds and rationalising denominators",
        gradeRange: [9, 11],
        prerequisites: ["index_laws"],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: "surds_intro",
      },
      {
        id: "geometry_basics",
        slug: "geometry-basics",
        name: "Geometry Basics",
        description: "Angles, triangles, and basic geometric shapes",
        gradeRange: [6, 9],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "quadratic_equations",
        slug: "quadratic-equations",
        name: "Quadratic Equations",
        description: "Solving and graphing quadratic equations",
        gradeRange: [9, 11],
        prerequisites: ["linear_equations"],
        estimatedMinutes: 40,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "trigonometry",
        slug: "trigonometry",
        name: "Trigonometry",
        description: "Sine, cosine, tangent and their applications",
        gradeRange: [9, 12],
        prerequisites: ["geometry_basics"],
        estimatedMinutes: 45,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "algebra_basics",
        slug: "algebra-basics",
        name: "Algebra Basics",
        description: "Variables, expressions, and basic algebraic operations",
        gradeRange: [7, 9],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "statistics_basics",
        slug: "statistics-basics",
        name: "Statistics Basics",
        description: "Mean, median, mode, and data representation",
        gradeRange: [8, 11],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "probability",
        slug: "probability",
        name: "Probability",
        description: "Basic probability concepts and calculations",
        gradeRange: [8, 12],
        prerequisites: ["statistics_basics"],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      }
    ]
  },
  english: {
    id: "english",
    name: "English",
    icon: "📚",
    teacherName: "Mr. James Mitchell",
    topics: [
      {
        id: "reading_comprehension",
        slug: "reading-comprehension",
        name: "Reading Comprehension",
        description: "Understanding and analyzing written texts",
        gradeRange: [6, 12],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "grammar_basics",
        slug: "grammar-basics",
        name: "Grammar Basics",
        description: "Parts of speech, sentence structure, and punctuation",
        gradeRange: [6, 9],
        estimatedMinutes: 25,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "vocabulary",
        slug: "vocabulary",
        name: "Vocabulary Building",
        description: "Word meanings, context clues, and word roots",
        gradeRange: [6, 12],
        estimatedMinutes: 20,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "paragraph_structure",
        slug: "paragraph-structure",
        name: "Paragraph Structure",
        description: "Topic sentences, supporting details, and conclusions",
        gradeRange: [6, 10],
        prerequisites: ["grammar_basics"],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "essay_writing",
        slug: "essay-writing",
        name: "Essay Writing",
        description: "Introduction, body paragraphs, and conclusion",
        gradeRange: [7, 12],
        prerequisites: ["paragraph_structure"],
        estimatedMinutes: 40,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "literary_analysis",
        slug: "literary-analysis",
        name: "Literary Analysis",
        description: "Analyzing themes, characters, and literary devices",
        gradeRange: [8, 12],
        prerequisites: ["reading_comprehension"],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "persuasive_writing",
        slug: "persuasive-writing",
        name: "Persuasive Writing",
        description: "Arguments, evidence, and rhetorical techniques",
        gradeRange: [8, 12],
        prerequisites: ["essay_writing"],
        estimatedMinutes: 40,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "creative_writing",
        slug: "creative-writing",
        name: "Creative Writing",
        description: "Narrative techniques, dialogue, and descriptive writing",
        gradeRange: [6, 12],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "grammar_advanced",
        slug: "grammar-advanced",
        name: "Advanced Grammar",
        description: "Complex sentences, clauses, and advanced punctuation",
        gradeRange: [9, 12],
        prerequisites: ["grammar_basics"],
        estimatedMinutes: 30,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      },
      {
        id: "research_skills",
        slug: "research-skills",
        name: "Research Skills",
        description: "Finding sources, citations, and research organization",
        gradeRange: [8, 12],
        estimatedMinutes: 35,
        hasInteractive: true,
        hasPractice: true,
        generatorKey: null,
      }
    ]
  }
};

export function getTopicsForGrade(subject: string, grade: number): TopicConfig[] {
  const subjectConfig = TOPIC_CATALOG[subject];
  if (!subjectConfig) return [];
  
  return subjectConfig.topics.filter(
    topic => grade >= topic.gradeRange[0] && grade <= topic.gradeRange[1]
  );
}

export function getTopic(subject: string, topicId: string): TopicConfig | undefined {
  const subjectConfig = TOPIC_CATALOG[subject];
  if (!subjectConfig) return undefined;
  
  return subjectConfig.topics.find(topic => topic.id === topicId);
}

export function getTopicBySlug(slug: string): TopicConfig | undefined {
  for (const subject of Object.values(TOPIC_CATALOG)) {
    const topic = subject.topics.find(t => t.slug === slug || t.id === slug);
    if (topic) return topic;
  }
  return undefined;
}

export function getTopicByGeneratorKey(key: string): TopicConfig | undefined {
  for (const subject of Object.values(TOPIC_CATALOG)) {
    const topic = subject.topics.find(t => t.generatorKey === key);
    if (topic) return topic;
  }
  return undefined;
}

export function getNextTopic(subject: string, currentTopicId: string, grade: number): TopicConfig | undefined {
  const topics = getTopicsForGrade(subject, grade);
  const currentIndex = topics.findIndex(t => t.id === currentTopicId);
  
  if (currentIndex === -1 || currentIndex >= topics.length - 1) {
    return topics[0];
  }
  
  return topics[currentIndex + 1];
}

export const SUBJECTS = Object.keys(TOPIC_CATALOG);
