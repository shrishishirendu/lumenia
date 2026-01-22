export interface TopicConfig {
  id: string;
  name: string;
  description: string;
  gradeRange: [number, number]; // [minGrade, maxGrade]
  prerequisites?: string[]; // Topic IDs that should be completed first
  estimatedMinutes: number;
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
        name: "Fractions",
        description: "Understanding, comparing, and operating with fractions",
        gradeRange: [6, 8],
        estimatedMinutes: 30
      },
      {
        id: "decimals",
        name: "Decimals",
        description: "Working with decimal numbers and conversions",
        gradeRange: [6, 8],
        prerequisites: ["fractions"],
        estimatedMinutes: 25
      },
      {
        id: "percentages",
        name: "Percentages",
        description: "Understanding percentages and their applications",
        gradeRange: [6, 9],
        prerequisites: ["fractions", "decimals"],
        estimatedMinutes: 30
      },
      {
        id: "linear_equations",
        name: "Linear Equations",
        description: "Solving single-variable linear equations",
        gradeRange: [7, 10],
        estimatedMinutes: 35
      },
      {
        id: "geometry_basics",
        name: "Geometry Basics",
        description: "Angles, triangles, and basic geometric shapes",
        gradeRange: [6, 9],
        estimatedMinutes: 30
      },
      {
        id: "quadratic_equations",
        name: "Quadratic Equations",
        description: "Solving and graphing quadratic equations",
        gradeRange: [9, 11],
        prerequisites: ["linear_equations"],
        estimatedMinutes: 40
      },
      {
        id: "trigonometry",
        name: "Trigonometry",
        description: "Sine, cosine, tangent and their applications",
        gradeRange: [9, 12],
        prerequisites: ["geometry_basics"],
        estimatedMinutes: 45
      },
      {
        id: "algebra_basics",
        name: "Algebra Basics",
        description: "Variables, expressions, and basic algebraic operations",
        gradeRange: [7, 9],
        estimatedMinutes: 30
      },
      {
        id: "statistics_basics",
        name: "Statistics Basics",
        description: "Mean, median, mode, and data representation",
        gradeRange: [8, 11],
        estimatedMinutes: 35
      },
      {
        id: "probability",
        name: "Probability",
        description: "Basic probability concepts and calculations",
        gradeRange: [8, 12],
        prerequisites: ["statistics_basics"],
        estimatedMinutes: 35
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
        name: "Reading Comprehension",
        description: "Understanding and analyzing written texts",
        gradeRange: [6, 12],
        estimatedMinutes: 30
      },
      {
        id: "grammar_basics",
        name: "Grammar Basics",
        description: "Parts of speech, sentence structure, and punctuation",
        gradeRange: [6, 9],
        estimatedMinutes: 25
      },
      {
        id: "vocabulary",
        name: "Vocabulary Building",
        description: "Word meanings, context clues, and word roots",
        gradeRange: [6, 12],
        estimatedMinutes: 20
      },
      {
        id: "paragraph_structure",
        name: "Paragraph Structure",
        description: "Topic sentences, supporting details, and conclusions",
        gradeRange: [6, 10],
        prerequisites: ["grammar_basics"],
        estimatedMinutes: 30
      },
      {
        id: "essay_writing",
        name: "Essay Writing",
        description: "Introduction, body paragraphs, and conclusion",
        gradeRange: [7, 12],
        prerequisites: ["paragraph_structure"],
        estimatedMinutes: 40
      },
      {
        id: "literary_analysis",
        name: "Literary Analysis",
        description: "Analyzing themes, characters, and literary devices",
        gradeRange: [8, 12],
        prerequisites: ["reading_comprehension"],
        estimatedMinutes: 35
      },
      {
        id: "persuasive_writing",
        name: "Persuasive Writing",
        description: "Arguments, evidence, and rhetorical techniques",
        gradeRange: [8, 12],
        prerequisites: ["essay_writing"],
        estimatedMinutes: 40
      },
      {
        id: "creative_writing",
        name: "Creative Writing",
        description: "Narrative techniques, dialogue, and descriptive writing",
        gradeRange: [6, 12],
        estimatedMinutes: 35
      },
      {
        id: "grammar_advanced",
        name: "Advanced Grammar",
        description: "Complex sentences, clauses, and advanced punctuation",
        gradeRange: [9, 12],
        prerequisites: ["grammar_basics"],
        estimatedMinutes: 30
      },
      {
        id: "research_skills",
        name: "Research Skills",
        description: "Finding sources, citations, and research organization",
        gradeRange: [8, 12],
        estimatedMinutes: 35
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

export function getNextTopic(subject: string, currentTopicId: string, grade: number): TopicConfig | undefined {
  const topics = getTopicsForGrade(subject, grade);
  const currentIndex = topics.findIndex(t => t.id === currentTopicId);
  
  if (currentIndex === -1 || currentIndex >= topics.length - 1) {
    return topics[0]; // Loop back to first topic
  }
  
  return topics[currentIndex + 1];
}

export const SUBJECTS = Object.keys(TOPIC_CATALOG);
