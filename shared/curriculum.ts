export type YearLevel = 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Subject = "mathematics" | "english";
export type Term = 1 | 2 | 3 | 4;

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  objectives: string[];
  keyConcepts: string[];
}

export interface PracticeSet {
  id: string;
  lessonId: string;
  title: string;
  difficulty: "foundation" | "standard" | "advanced";
  questionCount: number;
  estimatedTime: number; // minutes
  topics: string[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  term: Term;
  order: number;
  lessons: Lesson[];
  practiceSets: PracticeSet[];
  assessmentCriteria: string[];
}

export interface YearCurriculum {
  year: YearLevel;
  subject: Subject;
  description: string;
  units: Unit[];
  totalHours: number;
  australianCurriculumCodes: string[];
}

// ============================================
// MATHEMATICS CURRICULUM - YEARS 6-12
// ============================================

export const MATH_YEAR_6: YearCurriculum = {
  year: 6,
  subject: "mathematics",
  description: "Building strong foundations in number, algebra, measurement, geometry, and statistics",
  totalHours: 160,
  australianCurriculumCodes: ["ACMNA123", "ACMNA124", "ACMNA125", "ACMMG135", "ACMSP144"],
  units: [
    {
      id: "math-6-unit-1",
      title: "Number and Place Value",
      description: "Understanding large numbers, integers, and operations",
      term: 1,
      order: 1,
      assessmentCriteria: ["Identify and order integers", "Apply operations to solve problems"],
      lessons: [
        {
          id: "math-6-1-1",
          title: "Understanding Large Numbers",
          description: "Read, write and order numbers up to millions",
          duration: 45,
          objectives: ["Read and write numbers to millions", "Order large numbers on a number line"],
          keyConcepts: ["Place value", "Number ordering", "Comparing numbers"]
        },
        {
          id: "math-6-1-2",
          title: "Introduction to Integers",
          description: "Understanding positive and negative numbers",
          duration: 45,
          objectives: ["Understand negative numbers", "Compare and order integers"],
          keyConcepts: ["Integers", "Number line", "Positive and negative"]
        },
        {
          id: "math-6-1-3",
          title: "Addition and Subtraction Strategies",
          description: "Mental and written strategies for operations",
          duration: 45,
          objectives: ["Use mental strategies", "Apply written methods accurately"],
          keyConcepts: ["Mental math", "Column addition", "Column subtraction"]
        },
        {
          id: "math-6-1-4",
          title: "Multiplication and Division",
          description: "Multiplying and dividing by multi-digit numbers",
          duration: 45,
          objectives: ["Multiply by 2-digit numbers", "Divide with remainders"],
          keyConcepts: ["Long multiplication", "Short division", "Remainders"]
        }
      ],
      practiceSets: [
        { id: "ps-6-1-1", lessonId: "math-6-1-1", title: "Large Numbers Practice", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["place value", "ordering"] },
        { id: "ps-6-1-2", lessonId: "math-6-1-2", title: "Integer Basics", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["integers", "number line"] },
        { id: "ps-6-1-3", lessonId: "math-6-1-3", title: "Operations Challenge", difficulty: "advanced", questionCount: 20, estimatedTime: 25, topics: ["addition", "subtraction"] }
      ]
    },
    {
      id: "math-6-unit-2",
      title: "Fractions, Decimals and Percentages",
      description: "Connecting fractions, decimals and percentages",
      term: 1,
      order: 2,
      assessmentCriteria: ["Convert between forms", "Order fractions and decimals"],
      lessons: [
        {
          id: "math-6-2-1",
          title: "Equivalent Fractions",
          description: "Finding and creating equivalent fractions",
          duration: 45,
          objectives: ["Identify equivalent fractions", "Simplify fractions"],
          keyConcepts: ["Equivalent fractions", "Simplest form", "Common factors"]
        },
        {
          id: "math-6-2-2",
          title: "Adding and Subtracting Fractions",
          description: "Operations with fractions including mixed numbers",
          duration: 45,
          objectives: ["Add fractions with different denominators", "Subtract mixed numbers"],
          keyConcepts: ["Common denominators", "Mixed numbers", "Improper fractions"]
        },
        {
          id: "math-6-2-3",
          title: "Decimals and Place Value",
          description: "Understanding decimal place value to thousandths",
          duration: 45,
          objectives: ["Read and write decimals", "Order decimals"],
          keyConcepts: ["Decimal places", "Tenths", "Hundredths", "Thousandths"]
        },
        {
          id: "math-6-2-4",
          title: "Percentages",
          description: "Understanding percentages and their relationship to fractions",
          duration: 45,
          objectives: ["Convert fractions to percentages", "Find percentages of quantities"],
          keyConcepts: ["Percentage", "Conversion", "Percentage of amount"]
        }
      ],
      practiceSets: [
        { id: "ps-6-2-1", lessonId: "math-6-2-1", title: "Fraction Fundamentals", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["fractions", "equivalence"] },
        { id: "ps-6-2-2", lessonId: "math-6-2-4", title: "Percentage Problems", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["percentages", "conversion"] }
      ]
    },
    {
      id: "math-6-unit-3",
      title: "Patterns and Algebra",
      description: "Exploring patterns and introducing algebraic thinking",
      term: 2,
      order: 3,
      assessmentCriteria: ["Describe rules for patterns", "Use variables in simple expressions"],
      lessons: [
        {
          id: "math-6-3-1",
          title: "Number Patterns",
          description: "Identifying and extending number patterns",
          duration: 45,
          objectives: ["Identify pattern rules", "Extend sequences"],
          keyConcepts: ["Sequences", "Pattern rules", "Prediction"]
        },
        {
          id: "math-6-3-2",
          title: "Introduction to Variables",
          description: "Using letters to represent unknown values",
          duration: 45,
          objectives: ["Understand variables", "Write simple expressions"],
          keyConcepts: ["Variables", "Expressions", "Unknown values"]
        },
        {
          id: "math-6-3-3",
          title: "Order of Operations",
          description: "BODMAS/BIDMAS rules for calculations",
          duration: 45,
          objectives: ["Apply order of operations", "Solve multi-step problems"],
          keyConcepts: ["BODMAS", "Brackets", "Order of operations"]
        }
      ],
      practiceSets: [
        { id: "ps-6-3-1", lessonId: "math-6-3-1", title: "Pattern Detective", difficulty: "standard", questionCount: 12, estimatedTime: 15, topics: ["patterns", "sequences"] },
        { id: "ps-6-3-2", lessonId: "math-6-3-3", title: "Order of Operations", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["BODMAS", "operations"] }
      ]
    },
    {
      id: "math-6-unit-4",
      title: "Measurement",
      description: "Measuring length, area, volume and time",
      term: 2,
      order: 4,
      assessmentCriteria: ["Convert between units", "Calculate perimeter and area"],
      lessons: [
        {
          id: "math-6-4-1",
          title: "Length and Perimeter",
          description: "Measuring length and calculating perimeter",
          duration: 45,
          objectives: ["Convert length units", "Calculate perimeter of shapes"],
          keyConcepts: ["Perimeter", "Unit conversion", "Metric units"]
        },
        {
          id: "math-6-4-2",
          title: "Area of Rectangles",
          description: "Calculating area using formulas",
          duration: 45,
          objectives: ["Calculate area of rectangles", "Apply area formulas"],
          keyConcepts: ["Area", "Square units", "Length × Width"]
        },
        {
          id: "math-6-4-3",
          title: "Volume and Capacity",
          description: "Understanding 3D measurement",
          duration: 45,
          objectives: ["Calculate volume of rectangular prisms", "Convert capacity units"],
          keyConcepts: ["Volume", "Cubic units", "Capacity", "Litres"]
        }
      ],
      practiceSets: [
        { id: "ps-6-4-1", lessonId: "math-6-4-1", title: "Perimeter Practice", difficulty: "standard", questionCount: 12, estimatedTime: 15, topics: ["perimeter", "length"] },
        { id: "ps-6-4-2", lessonId: "math-6-4-2", title: "Area Calculations", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["area", "rectangles"] }
      ]
    },
    {
      id: "math-6-unit-5",
      title: "Geometry",
      description: "2D shapes, angles and transformations",
      term: 3,
      order: 5,
      assessmentCriteria: ["Classify shapes by properties", "Measure and construct angles"],
      lessons: [
        {
          id: "math-6-5-1",
          title: "2D Shape Properties",
          description: "Classifying triangles and quadrilaterals",
          duration: 45,
          objectives: ["Classify triangles by sides and angles", "Identify quadrilateral properties"],
          keyConcepts: ["Triangles", "Quadrilaterals", "Properties"]
        },
        {
          id: "math-6-5-2",
          title: "Angles",
          description: "Measuring and classifying angles",
          duration: 45,
          objectives: ["Measure angles with a protractor", "Classify angles by size"],
          keyConcepts: ["Acute", "Obtuse", "Right angle", "Protractor"]
        },
        {
          id: "math-6-5-3",
          title: "Transformations",
          description: "Reflection, rotation and translation",
          duration: 45,
          objectives: ["Perform transformations on shapes", "Describe transformations"],
          keyConcepts: ["Reflection", "Rotation", "Translation"]
        }
      ],
      practiceSets: [
        { id: "ps-6-5-1", lessonId: "math-6-5-1", title: "Shape Properties", difficulty: "standard", questionCount: 12, estimatedTime: 15, topics: ["shapes", "properties"] },
        { id: "ps-6-5-2", lessonId: "math-6-5-2", title: "Angle Measurement", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["angles", "measurement"] }
      ]
    },
    {
      id: "math-6-unit-6",
      title: "Statistics and Probability",
      description: "Collecting, representing and interpreting data",
      term: 4,
      order: 6,
      assessmentCriteria: ["Create and interpret graphs", "Calculate mean, median, mode"],
      lessons: [
        {
          id: "math-6-6-1",
          title: "Data Collection and Display",
          description: "Collecting data and creating graphs",
          duration: 45,
          objectives: ["Collect and organize data", "Create column graphs and line graphs"],
          keyConcepts: ["Data collection", "Column graphs", "Line graphs"]
        },
        {
          id: "math-6-6-2",
          title: "Interpreting Data",
          description: "Reading and analyzing graphs",
          duration: 45,
          objectives: ["Interpret graphs accurately", "Draw conclusions from data"],
          keyConcepts: ["Data interpretation", "Trends", "Comparisons"]
        },
        {
          id: "math-6-6-3",
          title: "Probability Basics",
          description: "Understanding chance and probability",
          duration: 45,
          objectives: ["Describe probability using words and fractions", "Conduct simple experiments"],
          keyConcepts: ["Probability", "Chance", "Likely", "Unlikely"]
        }
      ],
      practiceSets: [
        { id: "ps-6-6-1", lessonId: "math-6-6-1", title: "Graphing Data", difficulty: "standard", questionCount: 10, estimatedTime: 20, topics: ["graphs", "data"] },
        { id: "ps-6-6-2", lessonId: "math-6-6-3", title: "Probability Problems", difficulty: "standard", questionCount: 12, estimatedTime: 15, topics: ["probability", "chance"] }
      ]
    }
  ]
};

export const MATH_YEAR_7: YearCurriculum = {
  year: 7,
  subject: "mathematics",
  description: "Developing skills in number operations, algebra, geometry, and data analysis",
  totalHours: 160,
  australianCurriculumCodes: ["ACMNA150", "ACMNA151", "ACMNA152", "ACMMG159", "ACMSP167"],
  units: [
    {
      id: "math-7-unit-1",
      title: "Integers and Operations",
      description: "Working with positive and negative numbers",
      term: 1,
      order: 1,
      assessmentCriteria: ["Perform operations with integers", "Apply integer rules to problems"],
      lessons: [
        {
          id: "math-7-1-1",
          title: "Adding and Subtracting Integers",
          description: "Operations with positive and negative numbers",
          duration: 45,
          objectives: ["Add integers using number lines", "Subtract integers using rules"],
          keyConcepts: ["Integer addition", "Integer subtraction", "Number line"]
        },
        {
          id: "math-7-1-2",
          title: "Multiplying and Dividing Integers",
          description: "Multiplication and division with negative numbers",
          duration: 45,
          objectives: ["Apply sign rules for multiplication", "Divide integers correctly"],
          keyConcepts: ["Sign rules", "Positive × Negative", "Division of integers"]
        },
        {
          id: "math-7-1-3",
          title: "Order of Operations with Integers",
          description: "Applying BODMAS with negative numbers",
          duration: 45,
          objectives: ["Solve multi-step problems with integers", "Apply order of operations"],
          keyConcepts: ["BODMAS", "Mixed operations", "Problem solving"]
        }
      ],
      practiceSets: [
        { id: "ps-7-1-1", lessonId: "math-7-1-1", title: "Integer Operations", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["integers", "operations"] }
      ]
    },
    {
      id: "math-7-unit-2",
      title: "Fractions and Ratios",
      description: "Operations with fractions and understanding ratios",
      term: 1,
      order: 2,
      assessmentCriteria: ["Perform all operations with fractions", "Solve ratio problems"],
      lessons: [
        {
          id: "math-7-2-1",
          title: "Multiplying Fractions",
          description: "Multiplying fractions and mixed numbers",
          duration: 45,
          objectives: ["Multiply fractions", "Multiply mixed numbers"],
          keyConcepts: ["Fraction multiplication", "Cancelling", "Mixed numbers"]
        },
        {
          id: "math-7-2-2",
          title: "Dividing Fractions",
          description: "Division with fractions using reciprocals",
          duration: 45,
          objectives: ["Find reciprocals", "Divide fractions"],
          keyConcepts: ["Reciprocal", "Keep-Change-Flip", "Division"]
        },
        {
          id: "math-7-2-3",
          title: "Understanding Ratios",
          description: "Writing and simplifying ratios",
          duration: 45,
          objectives: ["Write ratios", "Simplify ratios to lowest terms"],
          keyConcepts: ["Ratio", "Simplification", "Comparison"]
        },
        {
          id: "math-7-2-4",
          title: "Ratio Problems",
          description: "Solving problems involving ratios",
          duration: 45,
          objectives: ["Divide quantities in given ratios", "Solve ratio word problems"],
          keyConcepts: ["Ratio division", "Proportional reasoning"]
        }
      ],
      practiceSets: [
        { id: "ps-7-2-1", lessonId: "math-7-2-1", title: "Fraction Operations", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["fractions", "multiplication", "division"] },
        { id: "ps-7-2-2", lessonId: "math-7-2-4", title: "Ratio Reasoning", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["ratios", "proportions"] }
      ]
    },
    {
      id: "math-7-unit-3",
      title: "Algebraic Expressions",
      description: "Writing and simplifying algebraic expressions",
      term: 2,
      order: 3,
      assessmentCriteria: ["Write algebraic expressions", "Simplify expressions"],
      lessons: [
        {
          id: "math-7-3-1",
          title: "Algebraic Language",
          description: "Writing expressions using variables",
          duration: 45,
          objectives: ["Translate words to algebra", "Use correct notation"],
          keyConcepts: ["Variables", "Coefficients", "Terms"]
        },
        {
          id: "math-7-3-2",
          title: "Collecting Like Terms",
          description: "Simplifying expressions by grouping",
          duration: 45,
          objectives: ["Identify like terms", "Combine like terms"],
          keyConcepts: ["Like terms", "Simplification", "Coefficients"]
        },
        {
          id: "math-7-3-3",
          title: "Expanding Brackets",
          description: "Using distributive law",
          duration: 45,
          objectives: ["Expand single brackets", "Apply distributive property"],
          keyConcepts: ["Distributive law", "Expansion", "Brackets"]
        },
        {
          id: "math-7-3-4",
          title: "Substitution",
          description: "Evaluating expressions for given values",
          duration: 45,
          objectives: ["Substitute values into expressions", "Evaluate expressions"],
          keyConcepts: ["Substitution", "Evaluation", "Order of operations"]
        }
      ],
      practiceSets: [
        { id: "ps-7-3-1", lessonId: "math-7-3-2", title: "Simplifying Expressions", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["algebra", "simplification"] },
        { id: "ps-7-3-2", lessonId: "math-7-3-3", title: "Expanding Brackets", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["expansion", "distributive"] }
      ]
    },
    {
      id: "math-7-unit-4",
      title: "Linear Equations",
      description: "Solving simple linear equations",
      term: 2,
      order: 4,
      assessmentCriteria: ["Solve one and two-step equations", "Check solutions"],
      lessons: [
        {
          id: "math-7-4-1",
          title: "One-Step Equations",
          description: "Solving equations with one operation",
          duration: 45,
          objectives: ["Solve equations using inverse operations", "Check solutions"],
          keyConcepts: ["Inverse operations", "Balance method", "Solutions"]
        },
        {
          id: "math-7-4-2",
          title: "Two-Step Equations",
          description: "Solving equations with two operations",
          duration: 45,
          objectives: ["Solve two-step equations", "Order operations correctly"],
          keyConcepts: ["Two-step equations", "Order of solving"]
        },
        {
          id: "math-7-4-3",
          title: "Equations with Brackets",
          description: "Solving equations that require expansion",
          duration: 45,
          objectives: ["Expand then solve", "Check solutions by substitution"],
          keyConcepts: ["Expansion", "Multi-step solving"]
        }
      ],
      practiceSets: [
        { id: "ps-7-4-1", lessonId: "math-7-4-2", title: "Equation Solving", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["equations", "solving"] }
      ]
    },
    {
      id: "math-7-unit-5",
      title: "Angles and Geometry",
      description: "Properties of angles and geometric reasoning",
      term: 3,
      order: 5,
      assessmentCriteria: ["Calculate unknown angles", "Apply angle properties"],
      lessons: [
        {
          id: "math-7-5-1",
          title: "Angle Relationships",
          description: "Complementary, supplementary and vertically opposite angles",
          duration: 45,
          objectives: ["Identify angle relationships", "Calculate unknown angles"],
          keyConcepts: ["Complementary", "Supplementary", "Vertically opposite"]
        },
        {
          id: "math-7-5-2",
          title: "Angles in Triangles",
          description: "Angle sum of triangles",
          duration: 45,
          objectives: ["Apply angle sum of 180°", "Solve triangle angle problems"],
          keyConcepts: ["Angle sum", "Interior angles", "Exterior angles"]
        },
        {
          id: "math-7-5-3",
          title: "Angles in Quadrilaterals",
          description: "Angle properties of quadrilaterals",
          duration: 45,
          objectives: ["Apply angle sum of 360°", "Solve quadrilateral problems"],
          keyConcepts: ["Quadrilateral angles", "Properties", "360° sum"]
        }
      ],
      practiceSets: [
        { id: "ps-7-5-1", lessonId: "math-7-5-1", title: "Angle Calculations", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["angles", "geometry"] }
      ]
    },
    {
      id: "math-7-unit-6",
      title: "Statistics",
      description: "Mean, median, mode and data representation",
      term: 4,
      order: 6,
      assessmentCriteria: ["Calculate measures of centre", "Create and interpret displays"],
      lessons: [
        {
          id: "math-7-6-1",
          title: "Mean, Median and Mode",
          description: "Calculating measures of central tendency",
          duration: 45,
          objectives: ["Calculate mean", "Find median and mode"],
          keyConcepts: ["Mean", "Median", "Mode", "Central tendency"]
        },
        {
          id: "math-7-6-2",
          title: "Stem-and-Leaf Plots",
          description: "Organizing data in stem-and-leaf displays",
          duration: 45,
          objectives: ["Create stem-and-leaf plots", "Interpret data from plots"],
          keyConcepts: ["Stem", "Leaf", "Data organization"]
        },
        {
          id: "math-7-6-3",
          title: "Probability Experiments",
          description: "Conducting experiments and calculating probability",
          duration: 45,
          objectives: ["Calculate theoretical probability", "Compare experimental results"],
          keyConcepts: ["Theoretical probability", "Experimental probability", "Sample space"]
        }
      ],
      practiceSets: [
        { id: "ps-7-6-1", lessonId: "math-7-6-1", title: "Statistics Calculations", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["mean", "median", "mode"] }
      ]
    }
  ]
};

export const MATH_YEAR_8: YearCurriculum = {
  year: 8,
  subject: "mathematics",
  description: "Extending algebraic skills, introducing Pythagoras and advancing statistical analysis",
  totalHours: 160,
  australianCurriculumCodes: ["ACMNA183", "ACMNA184", "ACMMG190", "ACMMG222", "ACMSP206"],
  units: [
    {
      id: "math-8-unit-1",
      title: "Index Laws",
      description: "Working with powers and indices",
      term: 1,
      order: 1,
      assessmentCriteria: ["Apply index laws", "Simplify expressions with indices"],
      lessons: [
        {
          id: "math-8-1-1",
          title: "Index Notation",
          description: "Understanding powers and base numbers",
          duration: 45,
          objectives: ["Write numbers in index form", "Evaluate powers"],
          keyConcepts: ["Base", "Index", "Power", "Exponent"]
        },
        {
          id: "math-8-1-2",
          title: "Multiplying and Dividing Powers",
          description: "Index laws for multiplication and division",
          duration: 45,
          objectives: ["Apply multiplication law", "Apply division law"],
          keyConcepts: ["Add indices", "Subtract indices", "Same base"]
        },
        {
          id: "math-8-1-3",
          title: "Power of a Power",
          description: "Raising powers to powers",
          duration: 45,
          objectives: ["Apply power of power rule", "Simplify complex expressions"],
          keyConcepts: ["Multiply indices", "Brackets", "Simplification"]
        },
        {
          id: "math-8-1-4",
          title: "Zero and Negative Indices",
          description: "Understanding special index values",
          duration: 45,
          objectives: ["Apply zero index rule", "Work with negative indices"],
          keyConcepts: ["Zero power", "Negative indices", "Reciprocals"]
        }
      ],
      practiceSets: [
        { id: "ps-8-1-1", lessonId: "math-8-1-2", title: "Index Laws Practice", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["indices", "powers"] }
      ]
    },
    {
      id: "math-8-unit-2",
      title: "Linear Equations and Inequalities",
      description: "Solving more complex equations and introducing inequalities",
      term: 1,
      order: 2,
      assessmentCriteria: ["Solve multi-step equations", "Solve and graph inequalities"],
      lessons: [
        {
          id: "math-8-2-1",
          title: "Equations with Variables on Both Sides",
          description: "Solving equations with variables on both sides",
          duration: 45,
          objectives: ["Collect variables on one side", "Solve systematically"],
          keyConcepts: ["Balance method", "Collecting terms", "Solution checking"]
        },
        {
          id: "math-8-2-2",
          title: "Equations with Fractions",
          description: "Solving equations involving fractions",
          duration: 45,
          objectives: ["Eliminate fractions", "Solve complex equations"],
          keyConcepts: ["Common denominator", "Multiplying through", "Simplification"]
        },
        {
          id: "math-8-2-3",
          title: "Linear Inequalities",
          description: "Solving and graphing inequalities",
          duration: 45,
          objectives: ["Solve linear inequalities", "Graph solutions on number lines"],
          keyConcepts: ["Inequality symbols", "Reversing signs", "Number line graphs"]
        }
      ],
      practiceSets: [
        { id: "ps-8-2-1", lessonId: "math-8-2-1", title: "Complex Equations", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["equations", "variables"] },
        { id: "ps-8-2-2", lessonId: "math-8-2-3", title: "Inequalities", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["inequalities", "graphing"] }
      ]
    },
    {
      id: "math-8-unit-3",
      title: "Linear Graphs",
      description: "Plotting and interpreting linear relationships",
      term: 2,
      order: 3,
      assessmentCriteria: ["Plot linear graphs", "Find gradient and y-intercept"],
      lessons: [
        {
          id: "math-8-3-1",
          title: "Plotting Linear Graphs",
          description: "Drawing graphs from equations",
          duration: 45,
          objectives: ["Create tables of values", "Plot points and draw lines"],
          keyConcepts: ["Coordinates", "Table of values", "Linear graph"]
        },
        {
          id: "math-8-3-2",
          title: "Gradient",
          description: "Understanding and calculating gradient",
          duration: 45,
          objectives: ["Calculate gradient from graph", "Understand rise over run"],
          keyConcepts: ["Gradient", "Rise", "Run", "Slope"]
        },
        {
          id: "math-8-3-3",
          title: "y-intercept and Equation",
          description: "Writing equations in y = mx + c form",
          duration: 45,
          objectives: ["Identify y-intercept", "Write equations from graphs"],
          keyConcepts: ["y-intercept", "y = mx + c", "Gradient-intercept form"]
        }
      ],
      practiceSets: [
        { id: "ps-8-3-1", lessonId: "math-8-3-2", title: "Gradient and Graphs", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["gradient", "linear graphs"] }
      ]
    },
    {
      id: "math-8-unit-4",
      title: "Pythagoras' Theorem",
      description: "Applying Pythagoras to find unknown sides",
      term: 3,
      order: 4,
      assessmentCriteria: ["Calculate unknown sides", "Apply to real-world problems"],
      lessons: [
        {
          id: "math-8-4-1",
          title: "Introduction to Pythagoras",
          description: "Understanding the relationship between sides",
          duration: 45,
          objectives: ["State Pythagoras' theorem", "Identify hypotenuse"],
          keyConcepts: ["Pythagoras", "Hypotenuse", "Right-angled triangle"]
        },
        {
          id: "math-8-4-2",
          title: "Finding the Hypotenuse",
          description: "Calculating the longest side",
          duration: 45,
          objectives: ["Apply a² + b² = c²", "Calculate hypotenuse length"],
          keyConcepts: ["Hypotenuse calculation", "Square root", "Exact answers"]
        },
        {
          id: "math-8-4-3",
          title: "Finding a Shorter Side",
          description: "Calculating unknown shorter sides",
          duration: 45,
          objectives: ["Rearrange Pythagoras' formula", "Calculate shorter sides"],
          keyConcepts: ["Rearrangement", "Shorter side calculation"]
        },
        {
          id: "math-8-4-4",
          title: "Pythagoras Applications",
          description: "Real-world applications",
          duration: 45,
          objectives: ["Solve practical problems", "Draw diagrams from descriptions"],
          keyConcepts: ["Problem solving", "Real-world applications", "Diagrams"]
        }
      ],
      practiceSets: [
        { id: "ps-8-4-1", lessonId: "math-8-4-2", title: "Pythagoras Problems", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["pythagoras", "triangles"] }
      ]
    },
    {
      id: "math-8-unit-5",
      title: "Area and Volume",
      description: "Calculating area of complex shapes and volume of prisms",
      term: 3,
      order: 5,
      assessmentCriteria: ["Calculate composite areas", "Find volume of prisms"],
      lessons: [
        {
          id: "math-8-5-1",
          title: "Area of Triangles and Parallelograms",
          description: "Using formulas for different shapes",
          duration: 45,
          objectives: ["Apply triangle area formula", "Apply parallelogram formula"],
          keyConcepts: ["Base × Height ÷ 2", "Parallelogram area"]
        },
        {
          id: "math-8-5-2",
          title: "Area of Circles",
          description: "Calculating circular area",
          duration: 45,
          objectives: ["Apply πr² formula", "Calculate areas involving circles"],
          keyConcepts: ["Pi", "Radius", "Diameter", "πr²"]
        },
        {
          id: "math-8-5-3",
          title: "Volume of Prisms",
          description: "Finding volume using cross-sections",
          duration: 45,
          objectives: ["Apply Area × Height formula", "Calculate prism volumes"],
          keyConcepts: ["Cross-section", "Prism", "Volume formula"]
        }
      ],
      practiceSets: [
        { id: "ps-8-5-1", lessonId: "math-8-5-2", title: "Area Calculations", difficulty: "standard", questionCount: 15, estimatedTime: 20, topics: ["area", "circles"] },
        { id: "ps-8-5-2", lessonId: "math-8-5-3", title: "Volume Practice", difficulty: "standard", questionCount: 12, estimatedTime: 20, topics: ["volume", "prisms"] }
      ]
    },
    {
      id: "math-8-unit-6",
      title: "Data Analysis",
      description: "Statistical analysis and probability",
      term: 4,
      order: 6,
      assessmentCriteria: ["Analyze data sets", "Calculate and interpret range"],
      lessons: [
        {
          id: "math-8-6-1",
          title: "Range and Spread",
          description: "Measuring the spread of data",
          duration: 45,
          objectives: ["Calculate range", "Understand spread"],
          keyConcepts: ["Range", "Spread", "Variation"]
        },
        {
          id: "math-8-6-2",
          title: "Box Plots",
          description: "Creating and interpreting box-and-whisker plots",
          duration: 45,
          objectives: ["Draw box plots", "Interpret quartiles"],
          keyConcepts: ["Quartiles", "Median", "Box plot", "Five-number summary"]
        },
        {
          id: "math-8-6-3",
          title: "Two-Way Tables",
          description: "Organizing and analyzing categorical data",
          duration: 45,
          objectives: ["Create two-way tables", "Calculate relative frequencies"],
          keyConcepts: ["Two-way tables", "Relative frequency", "Categories"]
        }
      ],
      practiceSets: [
        { id: "ps-8-6-1", lessonId: "math-8-6-2", title: "Statistical Analysis", difficulty: "standard", questionCount: 12, estimatedTime: 20, topics: ["statistics", "box plots"] }
      ]
    }
  ]
};

export const MATH_YEAR_9: YearCurriculum = {
  year: 9,
  subject: "mathematics",
  description: "Introducing trigonometry, extending algebra, and developing statistical reasoning",
  totalHours: 160,
  australianCurriculumCodes: ["ACMNA208", "ACMNA209", "ACMMG222", "ACMMG223", "ACMSP226"],
  units: [
    {
      id: "math-9-unit-1",
      title: "Indices and Surds",
      description: "Extending index laws and introducing surds",
      term: 1,
      order: 1,
      assessmentCriteria: ["Apply all index laws", "Simplify surds"],
      lessons: [
        {
          id: "math-9-1-1",
          title: "Fractional Indices",
          description: "Understanding roots as fractional powers",
          duration: 45,
          objectives: ["Convert between roots and indices", "Evaluate fractional indices"],
          keyConcepts: ["Fractional indices", "Square roots", "Cube roots"]
        },
        {
          id: "math-9-1-2",
          title: "Introduction to Surds",
          description: "Understanding irrational numbers",
          duration: 45,
          objectives: ["Identify surds", "Understand irrational numbers"],
          keyConcepts: ["Surds", "Irrational numbers", "Exact values"]
        },
        {
          id: "math-9-1-3",
          title: "Simplifying Surds",
          description: "Simplifying square root expressions",
          duration: 45,
          objectives: ["Simplify surds using factors", "Express in simplest form"],
          keyConcepts: ["Perfect squares", "Simplest form", "Factor extraction"]
        },
        {
          id: "math-9-1-4",
          title: "Operations with Surds",
          description: "Adding, subtracting and multiplying surds",
          duration: 45,
          objectives: ["Add and subtract like surds", "Multiply surd expressions"],
          keyConcepts: ["Like surds", "Multiplication", "Expansion"]
        }
      ],
      practiceSets: [
        { id: "ps-9-1-1", lessonId: "math-9-1-3", title: "Surd Simplification", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["surds", "simplification"] }
      ]
    },
    {
      id: "math-9-unit-2",
      title: "Expanding and Factorising",
      description: "Algebraic manipulation with quadratic expressions",
      term: 1,
      order: 2,
      assessmentCriteria: ["Expand binomial products", "Factorise quadratic expressions"],
      lessons: [
        {
          id: "math-9-2-1",
          title: "Expanding Binomial Products",
          description: "Using FOIL and distribution",
          duration: 45,
          objectives: ["Expand (a + b)(c + d)", "Apply FOIL method"],
          keyConcepts: ["FOIL", "Binomial expansion", "Distribution"]
        },
        {
          id: "math-9-2-2",
          title: "Perfect Squares and Difference of Squares",
          description: "Special binomial products",
          duration: 45,
          objectives: ["Expand perfect squares", "Recognize difference of squares"],
          keyConcepts: ["(a + b)²", "(a - b)²", "a² - b²"]
        },
        {
          id: "math-9-2-3",
          title: "Factorising Common Factors",
          description: "Factorising using highest common factor",
          duration: 45,
          objectives: ["Identify HCF", "Factorise expressions"],
          keyConcepts: ["HCF", "Factorisation", "Taking out factors"]
        },
        {
          id: "math-9-2-4",
          title: "Factorising Quadratics",
          description: "Factorising trinomials of form x² + bx + c",
          duration: 45,
          objectives: ["Factorise monic quadratics", "Find factor pairs"],
          keyConcepts: ["Monic quadratic", "Factor pairs", "Sum and product"]
        }
      ],
      practiceSets: [
        { id: "ps-9-2-1", lessonId: "math-9-2-1", title: "Expanding Practice", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["expansion", "FOIL"] },
        { id: "ps-9-2-2", lessonId: "math-9-2-4", title: "Factorising Quadratics", difficulty: "standard", questionCount: 20, estimatedTime: 25, topics: ["factorising", "quadratics"] }
      ]
    },
    {
      id: "math-9-unit-3",
      title: "Linear Graphs and Equations",
      description: "Advanced linear relationships and simultaneous equations",
      term: 2,
      order: 3,
      assessmentCriteria: ["Find equations of lines", "Solve simultaneous equations graphically"],
      lessons: [
        {
          id: "math-9-3-1",
          title: "Gradient and Parallel Lines",
          description: "Understanding gradient relationships",
          duration: 45,
          objectives: ["Identify parallel lines", "Calculate gradients"],
          keyConcepts: ["Parallel lines", "Equal gradients", "Gradient formula"]
        },
        {
          id: "math-9-3-2",
          title: "Finding Equations of Lines",
          description: "Writing equations from points and gradients",
          duration: 45,
          objectives: ["Find equation from point and gradient", "Find equation from two points"],
          keyConcepts: ["Point-gradient form", "Gradient formula", "Equation writing"]
        },
        {
          id: "math-9-3-3",
          title: "Simultaneous Equations - Graphical",
          description: "Solving systems by graphing",
          duration: 45,
          objectives: ["Graph two lines", "Find point of intersection"],
          keyConcepts: ["Simultaneous equations", "Intersection", "Solution"]
        },
        {
          id: "math-9-3-4",
          title: "Simultaneous Equations - Substitution",
          description: "Algebraic method for solving systems",
          duration: 45,
          objectives: ["Use substitution method", "Solve for both variables"],
          keyConcepts: ["Substitution", "Rearrangement", "Checking solutions"]
        }
      ],
      practiceSets: [
        { id: "ps-9-3-1", lessonId: "math-9-3-2", title: "Line Equations", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["linear equations", "gradients"] },
        { id: "ps-9-3-2", lessonId: "math-9-3-4", title: "Simultaneous Equations", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["simultaneous", "substitution"] }
      ]
    },
    {
      id: "math-9-unit-4",
      title: "Trigonometry",
      description: "Introduction to trigonometric ratios",
      term: 2,
      order: 4,
      assessmentCriteria: ["Calculate unknown sides using trigonometry", "Find unknown angles"],
      lessons: [
        {
          id: "math-9-4-1",
          title: "Trigonometric Ratios",
          description: "Understanding sine, cosine and tangent",
          duration: 45,
          objectives: ["Define sin, cos, tan", "Identify sides in right triangles"],
          keyConcepts: ["Opposite", "Adjacent", "Hypotenuse", "SOHCAHTOA"]
        },
        {
          id: "math-9-4-2",
          title: "Finding Unknown Sides",
          description: "Using trigonometry to calculate sides",
          duration: 45,
          objectives: ["Select correct ratio", "Calculate unknown sides"],
          keyConcepts: ["Ratio selection", "Calculator use", "Rearrangement"]
        },
        {
          id: "math-9-4-3",
          title: "Finding Unknown Angles",
          description: "Using inverse trigonometric functions",
          duration: 45,
          objectives: ["Use inverse functions", "Calculate angles"],
          keyConcepts: ["Inverse sin", "Inverse cos", "Inverse tan"]
        },
        {
          id: "math-9-4-4",
          title: "Trigonometry Applications",
          description: "Solving real-world trigonometry problems",
          duration: 45,
          objectives: ["Solve application problems", "Draw diagrams from descriptions"],
          keyConcepts: ["Angles of elevation", "Angles of depression", "Applications"]
        }
      ],
      practiceSets: [
        { id: "ps-9-4-1", lessonId: "math-9-4-2", title: "Trigonometry Calculations", difficulty: "standard", questionCount: 20, estimatedTime: 30, topics: ["trigonometry", "SOHCAHTOA"] }
      ]
    },
    {
      id: "math-9-unit-5",
      title: "Surface Area and Volume",
      description: "Calculating surface area and volume of solids",
      term: 3,
      order: 5,
      assessmentCriteria: ["Calculate surface areas", "Calculate volumes of cylinders and prisms"],
      lessons: [
        {
          id: "math-9-5-1",
          title: "Surface Area of Prisms",
          description: "Finding total surface area",
          duration: 45,
          objectives: ["Calculate surface area of prisms", "Use nets"],
          keyConcepts: ["Surface area", "Nets", "Total area"]
        },
        {
          id: "math-9-5-2",
          title: "Surface Area of Cylinders",
          description: "Circular surface areas",
          duration: 45,
          objectives: ["Apply cylinder surface area formula", "Calculate curved and flat surfaces"],
          keyConcepts: ["Curved surface", "2πrh", "Cylinder formula"]
        },
        {
          id: "math-9-5-3",
          title: "Volume of Cylinders",
          description: "Calculating cylindrical volume",
          duration: 45,
          objectives: ["Apply πr²h formula", "Solve practical problems"],
          keyConcepts: ["Cylinder volume", "πr²h", "Capacity"]
        }
      ],
      practiceSets: [
        { id: "ps-9-5-1", lessonId: "math-9-5-2", title: "Surface Area and Volume", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["surface area", "volume"] }
      ]
    },
    {
      id: "math-9-unit-6",
      title: "Probability and Statistics",
      description: "Advanced probability and data analysis",
      term: 4,
      order: 6,
      assessmentCriteria: ["Calculate combined probabilities", "Analyze bivariate data"],
      lessons: [
        {
          id: "math-9-6-1",
          title: "Combined Events",
          description: "Probability of combined events",
          duration: 45,
          objectives: ["Use addition rule", "Use multiplication rule"],
          keyConcepts: ["Combined events", "Independent events", "Dependent events"]
        },
        {
          id: "math-9-6-2",
          title: "Tree Diagrams",
          description: "Representing probability with trees",
          duration: 45,
          objectives: ["Draw tree diagrams", "Calculate probabilities from trees"],
          keyConcepts: ["Tree diagrams", "Branches", "Probability paths"]
        },
        {
          id: "math-9-6-3",
          title: "Scatter Plots",
          description: "Representing bivariate data",
          duration: 45,
          objectives: ["Create scatter plots", "Describe correlation"],
          keyConcepts: ["Scatter plot", "Correlation", "Positive/Negative"]
        }
      ],
      practiceSets: [
        { id: "ps-9-6-1", lessonId: "math-9-6-2", title: "Probability Trees", difficulty: "standard", questionCount: 12, estimatedTime: 25, topics: ["probability", "tree diagrams"] }
      ]
    }
  ]
};

export const MATH_YEAR_10: YearCurriculum = {
  year: 10,
  subject: "mathematics",
  description: "Consolidating algebraic skills, extending trigonometry, and preparing for senior mathematics",
  totalHours: 160,
  australianCurriculumCodes: ["ACMNA231", "ACMNA232", "ACMMG243", "ACMMG245", "ACMSP247"],
  units: [
    {
      id: "math-10-unit-1",
      title: "Quadratic Equations",
      description: "Solving quadratic equations by various methods",
      term: 1,
      order: 1,
      assessmentCriteria: ["Solve by factorising", "Apply quadratic formula"],
      lessons: [
        {
          id: "math-10-1-1",
          title: "Solving by Factorising",
          description: "Using the null factor law",
          duration: 45,
          objectives: ["Factorise quadratics", "Apply null factor law"],
          keyConcepts: ["Null factor law", "Factorising", "Solutions"]
        },
        {
          id: "math-10-1-2",
          title: "Completing the Square",
          description: "Alternative solving method",
          duration: 45,
          objectives: ["Complete the square", "Solve equations"],
          keyConcepts: ["Perfect square", "Completing square", "Turning point"]
        },
        {
          id: "math-10-1-3",
          title: "The Quadratic Formula",
          description: "Universal solving method",
          duration: 45,
          objectives: ["Apply quadratic formula", "Determine nature of solutions"],
          keyConcepts: ["Quadratic formula", "Discriminant", "Types of solutions"]
        },
        {
          id: "math-10-1-4",
          title: "Quadratic Applications",
          description: "Solving real-world quadratic problems",
          duration: 45,
          objectives: ["Form quadratic equations from problems", "Interpret solutions"],
          keyConcepts: ["Modelling", "Applications", "Interpretation"]
        }
      ],
      practiceSets: [
        { id: "ps-10-1-1", lessonId: "math-10-1-3", title: "Quadratic Equations", difficulty: "standard", questionCount: 20, estimatedTime: 30, topics: ["quadratics", "formula"] }
      ]
    },
    {
      id: "math-10-unit-2",
      title: "Parabolas and Quadratic Functions",
      description: "Graphing and analyzing quadratic functions",
      term: 1,
      order: 2,
      assessmentCriteria: ["Sketch parabolas", "Find key features"],
      lessons: [
        {
          id: "math-10-2-1",
          title: "Sketching Parabolas",
          description: "Graphing y = ax² + bx + c",
          duration: 45,
          objectives: ["Find intercepts", "Find turning point"],
          keyConcepts: ["Parabola", "Intercepts", "Turning point"]
        },
        {
          id: "math-10-2-2",
          title: "Transformations of Parabolas",
          description: "Understanding shifts and stretches",
          duration: 45,
          objectives: ["Apply transformations", "Sketch transformed parabolas"],
          keyConcepts: ["Translations", "Dilations", "Reflections"]
        },
        {
          id: "math-10-2-3",
          title: "Applications of Parabolas",
          description: "Modelling with quadratic functions",
          duration: 45,
          objectives: ["Model with parabolas", "Solve optimization problems"],
          keyConcepts: ["Maximum/Minimum", "Modelling", "Optimization"]
        }
      ],
      practiceSets: [
        { id: "ps-10-2-1", lessonId: "math-10-2-1", title: "Parabola Sketching", difficulty: "standard", questionCount: 15, estimatedTime: 30, topics: ["parabolas", "graphing"] }
      ]
    },
    {
      id: "math-10-unit-3",
      title: "Simultaneous Equations",
      description: "Solving linear and non-linear systems",
      term: 2,
      order: 3,
      assessmentCriteria: ["Solve linear systems algebraically", "Solve linear-quadratic systems"],
      lessons: [
        {
          id: "math-10-3-1",
          title: "Elimination Method",
          description: "Solving by elimination",
          duration: 45,
          objectives: ["Apply elimination method", "Choose efficient strategy"],
          keyConcepts: ["Elimination", "Adding/Subtracting equations"]
        },
        {
          id: "math-10-3-2",
          title: "Linear-Quadratic Systems",
          description: "Solving mixed systems",
          duration: 45,
          objectives: ["Solve line-parabola systems", "Interpret solutions"],
          keyConcepts: ["Substitution", "Two solutions", "Intersection"]
        },
        {
          id: "math-10-3-3",
          title: "Problem Solving with Systems",
          description: "Applications of simultaneous equations",
          duration: 45,
          objectives: ["Form equations from problems", "Solve and interpret"],
          keyConcepts: ["Word problems", "Equation formation", "Solution interpretation"]
        }
      ],
      practiceSets: [
        { id: "ps-10-3-1", lessonId: "math-10-3-1", title: "Simultaneous Equations", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["simultaneous", "elimination"] }
      ]
    },
    {
      id: "math-10-unit-4",
      title: "Advanced Trigonometry",
      description: "Non-right triangle trigonometry",
      term: 2,
      order: 4,
      assessmentCriteria: ["Apply sine rule", "Apply cosine rule"],
      lessons: [
        {
          id: "math-10-4-1",
          title: "The Sine Rule",
          description: "Finding sides and angles in any triangle",
          duration: 45,
          objectives: ["Apply sine rule for sides", "Apply sine rule for angles"],
          keyConcepts: ["Sine rule", "Ambiguous case", "Triangle problems"]
        },
        {
          id: "math-10-4-2",
          title: "The Cosine Rule",
          description: "Alternative method for any triangle",
          duration: 45,
          objectives: ["Apply cosine rule for sides", "Apply cosine rule for angles"],
          keyConcepts: ["Cosine rule", "When to use", "SAS and SSS"]
        },
        {
          id: "math-10-4-3",
          title: "Area of a Triangle",
          description: "Using trigonometry for area",
          duration: 45,
          objectives: ["Apply area formula", "Solve practical problems"],
          keyConcepts: ["½absinC", "Area formula", "Applications"]
        },
        {
          id: "math-10-4-4",
          title: "Bearings and Navigation",
          description: "Trigonometry in navigation",
          duration: 45,
          objectives: ["Work with bearings", "Solve navigation problems"],
          keyConcepts: ["Bearings", "True bearings", "Navigation"]
        }
      ],
      practiceSets: [
        { id: "ps-10-4-1", lessonId: "math-10-4-2", title: "Sine and Cosine Rules", difficulty: "standard", questionCount: 15, estimatedTime: 30, topics: ["sine rule", "cosine rule"] }
      ]
    },
    {
      id: "math-10-unit-5",
      title: "Probability",
      description: "Advanced probability concepts",
      term: 3,
      order: 5,
      assessmentCriteria: ["Apply probability rules", "Solve conditional probability problems"],
      lessons: [
        {
          id: "math-10-5-1",
          title: "Conditional Probability",
          description: "Probability given conditions",
          duration: 45,
          objectives: ["Calculate conditional probability", "Use P(A|B) notation"],
          keyConcepts: ["Conditional probability", "Given that", "P(A|B)"]
        },
        {
          id: "math-10-5-2",
          title: "Independent and Dependent Events",
          description: "Understanding event relationships",
          duration: 45,
          objectives: ["Identify independent events", "Calculate probabilities"],
          keyConcepts: ["Independence", "Dependence", "With/without replacement"]
        },
        {
          id: "math-10-5-3",
          title: "Probability Trees - Advanced",
          description: "Complex probability calculations",
          duration: 45,
          objectives: ["Create probability trees", "Calculate complex probabilities"],
          keyConcepts: ["Tree diagrams", "Multiple stages", "Conditional branches"]
        }
      ],
      practiceSets: [
        { id: "ps-10-5-1", lessonId: "math-10-5-1", title: "Conditional Probability", difficulty: "standard", questionCount: 15, estimatedTime: 25, topics: ["probability", "conditional"] }
      ]
    },
    {
      id: "math-10-unit-6",
      title: "Statistics",
      description: "Statistical analysis and interpretation",
      term: 4,
      order: 6,
      assessmentCriteria: ["Calculate standard deviation", "Analyze bivariate data"],
      lessons: [
        {
          id: "math-10-6-1",
          title: "Standard Deviation",
          description: "Measuring spread of data",
          duration: 45,
          objectives: ["Calculate standard deviation", "Interpret spread"],
          keyConcepts: ["Standard deviation", "Variance", "Spread"]
        },
        {
          id: "math-10-6-2",
          title: "Line of Best Fit",
          description: "Fitting lines to scatter plots",
          duration: 45,
          objectives: ["Draw line of best fit", "Make predictions"],
          keyConcepts: ["Line of best fit", "Correlation", "Prediction"]
        },
        {
          id: "math-10-6-3",
          title: "Comparing Data Sets",
          description: "Statistical comparison methods",
          duration: 45,
          objectives: ["Compare using statistics", "Draw conclusions"],
          keyConcepts: ["Comparison", "Back-to-back", "Analysis"]
        }
      ],
      practiceSets: [
        { id: "ps-10-6-1", lessonId: "math-10-6-1", title: "Statistics Analysis", difficulty: "standard", questionCount: 12, estimatedTime: 25, topics: ["statistics", "standard deviation"] }
      ]
    }
  ]
};

export const MATH_YEAR_11: YearCurriculum = {
  year: 11,
  subject: "mathematics",
  description: "Senior mathematics covering functions, calculus introduction, and advanced algebra",
  totalHours: 200,
  australianCurriculumCodes: ["ACMMM001", "ACMMM010", "ACMMM020", "ACMMM030"],
  units: [
    {
      id: "math-11-unit-1",
      title: "Functions and Relations",
      description: "Understanding and working with functions",
      term: 1,
      order: 1,
      assessmentCriteria: ["Identify and classify functions", "Determine domain and range"],
      lessons: [
        {
          id: "math-11-1-1",
          title: "Functions and Relations",
          description: "Understanding the function concept",
          duration: 60,
          objectives: ["Define functions", "Use function notation"],
          keyConcepts: ["Function", "Relation", "f(x) notation"]
        },
        {
          id: "math-11-1-2",
          title: "Domain and Range",
          description: "Finding domain and range of functions",
          duration: 60,
          objectives: ["Determine domain", "Determine range"],
          keyConcepts: ["Domain", "Range", "Restrictions"]
        },
        {
          id: "math-11-1-3",
          title: "Composite Functions",
          description: "Combining functions",
          duration: 60,
          objectives: ["Find composite functions", "Evaluate compositions"],
          keyConcepts: ["Composition", "f(g(x))", "Function combination"]
        },
        {
          id: "math-11-1-4",
          title: "Inverse Functions",
          description: "Finding and using inverse functions",
          duration: 60,
          objectives: ["Find inverse functions", "Verify inverses"],
          keyConcepts: ["Inverse", "f⁻¹(x)", "Reflection in y=x"]
        }
      ],
      practiceSets: [
        { id: "ps-11-1-1", lessonId: "math-11-1-2", title: "Functions Practice", difficulty: "standard", questionCount: 20, estimatedTime: 35, topics: ["functions", "domain", "range"] }
      ]
    },
    {
      id: "math-11-unit-2",
      title: "Polynomials",
      description: "Working with polynomial expressions and equations",
      term: 1,
      order: 2,
      assessmentCriteria: ["Divide polynomials", "Apply factor and remainder theorems"],
      lessons: [
        {
          id: "math-11-2-1",
          title: "Polynomial Division",
          description: "Long division and synthetic division",
          duration: 60,
          objectives: ["Perform polynomial division", "Use synthetic division"],
          keyConcepts: ["Long division", "Synthetic division", "Quotient and remainder"]
        },
        {
          id: "math-11-2-2",
          title: "Factor Theorem",
          description: "Finding factors of polynomials",
          duration: 60,
          objectives: ["Apply factor theorem", "Factor polynomials"],
          keyConcepts: ["Factor theorem", "Zeros", "Factorisation"]
        },
        {
          id: "math-11-2-3",
          title: "Remainder Theorem",
          description: "Finding remainders without division",
          duration: 60,
          objectives: ["Apply remainder theorem", "Solve problems efficiently"],
          keyConcepts: ["Remainder theorem", "P(a)", "Evaluation"]
        },
        {
          id: "math-11-2-4",
          title: "Polynomial Graphs",
          description: "Sketching polynomial functions",
          duration: 60,
          objectives: ["Sketch polynomial graphs", "Identify key features"],
          keyConcepts: ["Zeros", "Turning points", "End behavior"]
        }
      ],
      practiceSets: [
        { id: "ps-11-2-1", lessonId: "math-11-2-2", title: "Polynomials", difficulty: "standard", questionCount: 18, estimatedTime: 35, topics: ["polynomials", "factoring"] }
      ]
    },
    {
      id: "math-11-unit-3",
      title: "Exponential and Logarithmic Functions",
      description: "Understanding exponential and logarithmic relationships",
      term: 2,
      order: 3,
      assessmentCriteria: ["Solve exponential equations", "Apply logarithm laws"],
      lessons: [
        {
          id: "math-11-3-1",
          title: "Exponential Functions",
          description: "Graphing and properties of exponentials",
          duration: 60,
          objectives: ["Graph exponential functions", "Identify transformations"],
          keyConcepts: ["Exponential growth", "Decay", "Asymptotes"]
        },
        {
          id: "math-11-3-2",
          title: "Introduction to Logarithms",
          description: "Understanding logarithms as inverses",
          duration: 60,
          objectives: ["Convert between forms", "Evaluate logarithms"],
          keyConcepts: ["Logarithm", "Base", "Inverse of exponential"]
        },
        {
          id: "math-11-3-3",
          title: "Logarithm Laws",
          description: "Rules for working with logarithms",
          duration: 60,
          objectives: ["Apply log laws", "Simplify expressions"],
          keyConcepts: ["Product rule", "Quotient rule", "Power rule"]
        },
        {
          id: "math-11-3-4",
          title: "Solving Exponential Equations",
          description: "Using logarithms to solve equations",
          duration: 60,
          objectives: ["Solve exponential equations", "Apply logarithms"],
          keyConcepts: ["Taking logs", "Change of base", "Solving"]
        }
      ],
      practiceSets: [
        { id: "ps-11-3-1", lessonId: "math-11-3-3", title: "Exponentials and Logs", difficulty: "standard", questionCount: 20, estimatedTime: 35, topics: ["exponentials", "logarithms"] }
      ]
    },
    {
      id: "math-11-unit-4",
      title: "Introduction to Calculus",
      description: "Understanding rates of change and differentiation",
      term: 2,
      order: 4,
      assessmentCriteria: ["Find derivatives from first principles", "Apply differentiation rules"],
      lessons: [
        {
          id: "math-11-4-1",
          title: "Rates of Change",
          description: "Average and instantaneous rates",
          duration: 60,
          objectives: ["Calculate average rate of change", "Understand instantaneous rate"],
          keyConcepts: ["Rate of change", "Gradient of secant", "Gradient of tangent"]
        },
        {
          id: "math-11-4-2",
          title: "First Principles Differentiation",
          description: "Deriving the derivative",
          duration: 60,
          objectives: ["Apply first principles", "Understand limit process"],
          keyConcepts: ["Limit", "First principles", "Derivative"]
        },
        {
          id: "math-11-4-3",
          title: "Differentiation Rules",
          description: "Power rule and basic rules",
          duration: 60,
          objectives: ["Apply power rule", "Differentiate polynomials"],
          keyConcepts: ["Power rule", "Constant rule", "Sum rule"]
        },
        {
          id: "math-11-4-4",
          title: "Tangent Lines",
          description: "Finding equations of tangents",
          duration: 60,
          objectives: ["Find gradient at a point", "Write tangent equations"],
          keyConcepts: ["Tangent", "Point of tangency", "Gradient"]
        }
      ],
      practiceSets: [
        { id: "ps-11-4-1", lessonId: "math-11-4-3", title: "Differentiation Basics", difficulty: "standard", questionCount: 20, estimatedTime: 35, topics: ["differentiation", "derivatives"] }
      ]
    },
    {
      id: "math-11-unit-5",
      title: "Trigonometric Functions",
      description: "Extending trigonometry to functions and graphs",
      term: 3,
      order: 5,
      assessmentCriteria: ["Graph trigonometric functions", "Solve trigonometric equations"],
      lessons: [
        {
          id: "math-11-5-1",
          title: "Radian Measure",
          description: "Working with radians",
          duration: 60,
          objectives: ["Convert between degrees and radians", "Use radian measure"],
          keyConcepts: ["Radians", "π", "Conversion"]
        },
        {
          id: "math-11-5-2",
          title: "Trigonometric Graphs",
          description: "Graphing sin, cos and tan",
          duration: 60,
          objectives: ["Sketch trigonometric graphs", "Identify transformations"],
          keyConcepts: ["Amplitude", "Period", "Phase shift"]
        },
        {
          id: "math-11-5-3",
          title: "Trigonometric Identities",
          description: "Fundamental identities",
          duration: 60,
          objectives: ["Apply Pythagorean identity", "Simplify expressions"],
          keyConcepts: ["sin²θ + cos²θ = 1", "Identities", "Simplification"]
        },
        {
          id: "math-11-5-4",
          title: "Solving Trigonometric Equations",
          description: "Finding all solutions",
          duration: 60,
          objectives: ["Solve trig equations", "Find general solutions"],
          keyConcepts: ["Principal solution", "General solution", "Quadrant rules"]
        }
      ],
      practiceSets: [
        { id: "ps-11-5-1", lessonId: "math-11-5-2", title: "Trigonometric Functions", difficulty: "standard", questionCount: 18, estimatedTime: 35, topics: ["trigonometry", "graphs"] }
      ]
    },
    {
      id: "math-11-unit-6",
      title: "Probability Distributions",
      description: "Introduction to discrete probability distributions",
      term: 4,
      order: 6,
      assessmentCriteria: ["Calculate expected value", "Apply binomial distribution"],
      lessons: [
        {
          id: "math-11-6-1",
          title: "Discrete Random Variables",
          description: "Probability distributions",
          duration: 60,
          objectives: ["Define random variables", "Create probability distributions"],
          keyConcepts: ["Random variable", "Probability distribution", "Discrete"]
        },
        {
          id: "math-11-6-2",
          title: "Expected Value and Variance",
          description: "Measures for distributions",
          duration: 60,
          objectives: ["Calculate expected value", "Calculate variance"],
          keyConcepts: ["Expected value", "Mean", "Variance"]
        },
        {
          id: "math-11-6-3",
          title: "Binomial Distribution",
          description: "Modelling success/failure experiments",
          duration: 60,
          objectives: ["Identify binomial situations", "Calculate binomial probabilities"],
          keyConcepts: ["Binomial", "n trials", "Probability of success"]
        }
      ],
      practiceSets: [
        { id: "ps-11-6-1", lessonId: "math-11-6-3", title: "Probability Distributions", difficulty: "standard", questionCount: 15, estimatedTime: 30, topics: ["probability", "binomial"] }
      ]
    }
  ]
};

export const MATH_YEAR_12: YearCurriculum = {
  year: 12,
  subject: "mathematics",
  description: "Advanced calculus, statistical inference, and preparation for tertiary mathematics",
  totalHours: 200,
  australianCurriculumCodes: ["ACMMM040", "ACMMM050", "ACMMM060", "ACMMM070"],
  units: [
    {
      id: "math-12-unit-1",
      title: "Advanced Differentiation",
      description: "Chain rule, product rule, and quotient rule",
      term: 1,
      order: 1,
      assessmentCriteria: ["Apply chain rule", "Apply product and quotient rules"],
      lessons: [
        {
          id: "math-12-1-1",
          title: "The Chain Rule",
          description: "Differentiating composite functions",
          duration: 60,
          objectives: ["Apply chain rule", "Differentiate composite functions"],
          keyConcepts: ["Chain rule", "Composite functions", "dy/dx = dy/du × du/dx"]
        },
        {
          id: "math-12-1-2",
          title: "The Product Rule",
          description: "Differentiating products of functions",
          duration: 60,
          objectives: ["Apply product rule", "Differentiate products"],
          keyConcepts: ["Product rule", "uv", "u'v + uv'"]
        },
        {
          id: "math-12-1-3",
          title: "The Quotient Rule",
          description: "Differentiating quotients of functions",
          duration: 60,
          objectives: ["Apply quotient rule", "Differentiate quotients"],
          keyConcepts: ["Quotient rule", "u/v", "(u'v - uv')/v²"]
        },
        {
          id: "math-12-1-4",
          title: "Derivatives of Exponential and Logarithmic Functions",
          description: "Calculus of exponentials and logs",
          duration: 60,
          objectives: ["Differentiate e^x and ln x", "Apply chain rule to these functions"],
          keyConcepts: ["d/dx(e^x)", "d/dx(ln x)", "Exponential derivatives"]
        }
      ],
      practiceSets: [
        { id: "ps-12-1-1", lessonId: "math-12-1-1", title: "Differentiation Rules", difficulty: "advanced", questionCount: 25, estimatedTime: 40, topics: ["chain rule", "product rule", "quotient rule"] }
      ]
    },
    {
      id: "math-12-unit-2",
      title: "Applications of Differentiation",
      description: "Using calculus to analyze functions and solve problems",
      term: 1,
      order: 2,
      assessmentCriteria: ["Find and classify stationary points", "Solve optimization problems"],
      lessons: [
        {
          id: "math-12-2-1",
          title: "Stationary Points",
          description: "Finding and classifying turning points",
          duration: 60,
          objectives: ["Find stationary points", "Classify as max/min/inflection"],
          keyConcepts: ["Stationary points", "f'(x) = 0", "Classification"]
        },
        {
          id: "math-12-2-2",
          title: "Second Derivative Test",
          description: "Using f''(x) to classify points",
          duration: 60,
          objectives: ["Apply second derivative test", "Determine concavity"],
          keyConcepts: ["Second derivative", "Concave up/down", "Inflection points"]
        },
        {
          id: "math-12-2-3",
          title: "Curve Sketching",
          description: "Complete curve analysis",
          duration: 60,
          objectives: ["Sketch curves using calculus", "Identify all features"],
          keyConcepts: ["Curve sketching", "Intercepts", "Asymptotes", "Turning points"]
        },
        {
          id: "math-12-2-4",
          title: "Optimization Problems",
          description: "Finding maximum and minimum values",
          duration: 60,
          objectives: ["Set up optimization problems", "Find optimal solutions"],
          keyConcepts: ["Optimization", "Maximum/Minimum", "Real-world problems"]
        }
      ],
      practiceSets: [
        { id: "ps-12-2-1", lessonId: "math-12-2-4", title: "Applications of Calculus", difficulty: "advanced", questionCount: 18, estimatedTime: 40, topics: ["optimization", "curve sketching"] }
      ]
    },
    {
      id: "math-12-unit-3",
      title: "Integration",
      description: "Anti-differentiation and definite integrals",
      term: 2,
      order: 3,
      assessmentCriteria: ["Find indefinite integrals", "Calculate definite integrals and areas"],
      lessons: [
        {
          id: "math-12-3-1",
          title: "Anti-differentiation",
          description: "Finding primitive functions",
          duration: 60,
          objectives: ["Find anti-derivatives", "Apply power rule for integration"],
          keyConcepts: ["Anti-derivative", "Primitive function", "Integration constant"]
        },
        {
          id: "math-12-3-2",
          title: "Definite Integrals",
          description: "Calculating definite integrals",
          duration: 60,
          objectives: ["Evaluate definite integrals", "Apply fundamental theorem"],
          keyConcepts: ["Definite integral", "Limits", "Fundamental theorem"]
        },
        {
          id: "math-12-3-3",
          title: "Area Under Curves",
          description: "Using integration for area",
          duration: 60,
          objectives: ["Calculate areas", "Handle negative areas"],
          keyConcepts: ["Area under curve", "Signed area", "Absolute area"]
        },
        {
          id: "math-12-3-4",
          title: "Area Between Curves",
          description: "Finding area between two functions",
          duration: 60,
          objectives: ["Set up area between curves", "Calculate enclosed areas"],
          keyConcepts: ["Area between curves", "Intersection points", "Integration"]
        }
      ],
      practiceSets: [
        { id: "ps-12-3-1", lessonId: "math-12-3-3", title: "Integration and Area", difficulty: "advanced", questionCount: 20, estimatedTime: 40, topics: ["integration", "area"] }
      ]
    },
    {
      id: "math-12-unit-4",
      title: "Trigonometric Calculus",
      description: "Differentiation and integration of trigonometric functions",
      term: 2,
      order: 4,
      assessmentCriteria: ["Differentiate trig functions", "Integrate trig functions"],
      lessons: [
        {
          id: "math-12-4-1",
          title: "Derivatives of Trigonometric Functions",
          description: "Differentiating sin, cos and tan",
          duration: 60,
          objectives: ["Differentiate trig functions", "Apply chain rule to trig"],
          keyConcepts: ["d/dx(sin x)", "d/dx(cos x)", "d/dx(tan x)"]
        },
        {
          id: "math-12-4-2",
          title: "Integration of Trigonometric Functions",
          description: "Finding anti-derivatives of trig functions",
          duration: 60,
          objectives: ["Integrate trig functions", "Apply to area problems"],
          keyConcepts: ["∫sin x dx", "∫cos x dx", "Trig integration"]
        },
        {
          id: "math-12-4-3",
          title: "Trigonometric Applications",
          description: "Applying trig calculus to problems",
          duration: 60,
          objectives: ["Solve trig calculus problems", "Model with trig functions"],
          keyConcepts: ["Modelling", "Periodic functions", "Applications"]
        }
      ],
      practiceSets: [
        { id: "ps-12-4-1", lessonId: "math-12-4-1", title: "Trigonometric Calculus", difficulty: "advanced", questionCount: 20, estimatedTime: 35, topics: ["trig derivatives", "trig integration"] }
      ]
    },
    {
      id: "math-12-unit-5",
      title: "Continuous Random Variables",
      description: "Normal distribution and statistical inference",
      term: 3,
      order: 5,
      assessmentCriteria: ["Apply normal distribution", "Calculate confidence intervals"],
      lessons: [
        {
          id: "math-12-5-1",
          title: "Continuous Distributions",
          description: "Introduction to continuous random variables",
          duration: 60,
          objectives: ["Understand continuous distributions", "Use probability density functions"],
          keyConcepts: ["Continuous", "PDF", "Area as probability"]
        },
        {
          id: "math-12-5-2",
          title: "The Normal Distribution",
          description: "Properties and calculations",
          duration: 60,
          objectives: ["Use standard normal", "Calculate normal probabilities"],
          keyConcepts: ["Normal distribution", "Z-score", "Standard normal"]
        },
        {
          id: "math-12-5-3",
          title: "Sampling Distributions",
          description: "Distribution of sample means",
          duration: 60,
          objectives: ["Understand sampling distribution", "Apply central limit theorem"],
          keyConcepts: ["Sampling distribution", "Sample mean", "CLT"]
        },
        {
          id: "math-12-5-4",
          title: "Confidence Intervals",
          description: "Estimating population parameters",
          duration: 60,
          objectives: ["Calculate confidence intervals", "Interpret intervals"],
          keyConcepts: ["Confidence interval", "Margin of error", "Level of confidence"]
        }
      ],
      practiceSets: [
        { id: "ps-12-5-1", lessonId: "math-12-5-2", title: "Normal Distribution", difficulty: "advanced", questionCount: 18, estimatedTime: 35, topics: ["normal distribution", "z-scores"] }
      ]
    },
    {
      id: "math-12-unit-6",
      title: "Exam Preparation",
      description: "Consolidation and exam-style practice",
      term: 4,
      order: 6,
      assessmentCriteria: ["Demonstrate mastery across all topics", "Apply skills to exam-style problems"],
      lessons: [
        {
          id: "math-12-6-1",
          title: "Calculus Consolidation",
          description: "Review of all calculus topics",
          duration: 60,
          objectives: ["Review differentiation", "Review integration"],
          keyConcepts: ["Consolidation", "Exam techniques", "Common errors"]
        },
        {
          id: "math-12-6-2",
          title: "Statistics Consolidation",
          description: "Review of probability and statistics",
          duration: 60,
          objectives: ["Review probability", "Review distributions"],
          keyConcepts: ["Consolidation", "Exam techniques", "Common errors"]
        },
        {
          id: "math-12-6-3",
          title: "Exam Strategies",
          description: "Techniques for exam success",
          duration: 60,
          objectives: ["Develop exam strategies", "Practice time management"],
          keyConcepts: ["Time management", "Checking work", "Mark allocation"]
        }
      ],
      practiceSets: [
        { id: "ps-12-6-1", lessonId: "math-12-6-1", title: "Full Exam Practice", difficulty: "advanced", questionCount: 30, estimatedTime: 60, topics: ["all topics", "exam practice"] }
      ]
    }
  ]
};

// ============================================
// ENGLISH CURRICULUM - YEARS 6-12
// ============================================

export const ENGLISH_YEAR_6: YearCurriculum = {
  year: 6,
  subject: "english",
  description: "Developing reading comprehension, writing skills, and grammar foundations",
  totalHours: 160,
  australianCurriculumCodes: ["ACELA1517", "ACELT1613", "ACELY1709"],
  units: [
    {
      id: "eng-6-unit-1",
      title: "Reading and Comprehension",
      description: "Developing critical reading skills",
      term: 1,
      order: 1,
      assessmentCriteria: ["Identify main ideas", "Make inferences from text"],
      lessons: [
        {
          id: "eng-6-1-1",
          title: "Finding Main Ideas",
          description: "Identifying the central message in texts",
          duration: 45,
          objectives: ["Identify main ideas", "Distinguish main ideas from details"],
          keyConcepts: ["Main idea", "Supporting details", "Central message"]
        },
        {
          id: "eng-6-1-2",
          title: "Making Inferences",
          description: "Reading between the lines",
          duration: 45,
          objectives: ["Make logical inferences", "Use evidence from text"],
          keyConcepts: ["Inference", "Evidence", "Reading beyond literal meaning"]
        },
        {
          id: "eng-6-1-3",
          title: "Understanding Author's Purpose",
          description: "Why writers write what they write",
          duration: 45,
          objectives: ["Identify author's purpose", "Recognize persuasion, information, entertainment"],
          keyConcepts: ["Author's purpose", "Persuade", "Inform", "Entertain"]
        },
        {
          id: "eng-6-1-4",
          title: "Summarizing Texts",
          description: "Condensing information accurately",
          duration: 45,
          objectives: ["Write accurate summaries", "Include key points only"],
          keyConcepts: ["Summary", "Key points", "Paraphrasing"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-6-1-1", lessonId: "eng-6-1-1", title: "Comprehension Practice", difficulty: "standard", questionCount: 12, estimatedTime: 25, topics: ["reading", "comprehension"] }
      ]
    },
    {
      id: "eng-6-unit-2",
      title: "Narrative Writing",
      description: "Crafting engaging stories",
      term: 1,
      order: 2,
      assessmentCriteria: ["Write engaging narratives", "Use narrative structure"],
      lessons: [
        {
          id: "eng-6-2-1",
          title: "Narrative Structure",
          description: "Understanding story elements",
          duration: 45,
          objectives: ["Identify narrative elements", "Plan story structure"],
          keyConcepts: ["Orientation", "Complication", "Resolution", "Climax"]
        },
        {
          id: "eng-6-2-2",
          title: "Character Development",
          description: "Creating believable characters",
          duration: 45,
          objectives: ["Develop characters through action", "Show character traits"],
          keyConcepts: ["Characterization", "Show don't tell", "Character traits"]
        },
        {
          id: "eng-6-2-3",
          title: "Setting and Atmosphere",
          description: "Creating vivid settings",
          duration: 45,
          objectives: ["Describe settings effectively", "Create atmosphere"],
          keyConcepts: ["Setting", "Atmosphere", "Sensory details"]
        },
        {
          id: "eng-6-2-4",
          title: "Dialogue Writing",
          description: "Writing realistic conversations",
          duration: 45,
          objectives: ["Write natural dialogue", "Use correct punctuation"],
          keyConcepts: ["Dialogue", "Speech marks", "Dialogue tags"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-6-2-1", lessonId: "eng-6-2-1", title: "Narrative Writing", difficulty: "standard", questionCount: 5, estimatedTime: 30, topics: ["writing", "narrative"] }
      ]
    },
    {
      id: "eng-6-unit-3",
      title: "Grammar Foundations",
      description: "Building strong grammar skills",
      term: 2,
      order: 3,
      assessmentCriteria: ["Use correct punctuation", "Apply grammar rules"],
      lessons: [
        {
          id: "eng-6-3-1",
          title: "Sentence Types",
          description: "Understanding different sentence structures",
          duration: 45,
          objectives: ["Identify sentence types", "Write varied sentences"],
          keyConcepts: ["Simple", "Compound", "Complex sentences"]
        },
        {
          id: "eng-6-3-2",
          title: "Punctuation",
          description: "Using punctuation correctly",
          duration: 45,
          objectives: ["Use commas correctly", "Apply apostrophe rules"],
          keyConcepts: ["Commas", "Apostrophes", "Semicolons"]
        },
        {
          id: "eng-6-3-3",
          title: "Parts of Speech",
          description: "Understanding word functions",
          duration: 45,
          objectives: ["Identify parts of speech", "Use words correctly"],
          keyConcepts: ["Nouns", "Verbs", "Adjectives", "Adverbs"]
        },
        {
          id: "eng-6-3-4",
          title: "Subject-Verb Agreement",
          description: "Making subjects and verbs match",
          duration: 45,
          objectives: ["Apply agreement rules", "Identify errors"],
          keyConcepts: ["Subject", "Verb", "Agreement", "Singular/Plural"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-6-3-1", lessonId: "eng-6-3-2", title: "Grammar Practice", difficulty: "standard", questionCount: 20, estimatedTime: 20, topics: ["grammar", "punctuation"] }
      ]
    },
    {
      id: "eng-6-unit-4",
      title: "Persuasive Writing",
      description: "Writing to convince",
      term: 2,
      order: 4,
      assessmentCriteria: ["Construct arguments", "Use persuasive techniques"],
      lessons: [
        {
          id: "eng-6-4-1",
          title: "Introduction to Persuasion",
          description: "Understanding persuasive writing",
          duration: 45,
          objectives: ["Identify persuasive texts", "Recognize techniques"],
          keyConcepts: ["Persuasion", "Opinion", "Argument"]
        },
        {
          id: "eng-6-4-2",
          title: "Building Arguments",
          description: "Structuring persuasive content",
          duration: 45,
          objectives: ["State clear opinions", "Support with reasons"],
          keyConcepts: ["Thesis", "Reasons", "Evidence"]
        },
        {
          id: "eng-6-4-3",
          title: "Persuasive Techniques",
          description: "Tools for persuading readers",
          duration: 45,
          objectives: ["Use rhetorical questions", "Apply emotive language"],
          keyConcepts: ["Rhetorical questions", "Emotive language", "Repetition"]
        },
        {
          id: "eng-6-4-4",
          title: "Writing Persuasive Texts",
          description: "Creating complete persuasive pieces",
          duration: 45,
          objectives: ["Write persuasive essays", "Use PEEL structure"],
          keyConcepts: ["PEEL", "Conclusion", "Call to action"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-6-4-1", lessonId: "eng-6-4-2", title: "Persuasive Writing", difficulty: "standard", questionCount: 4, estimatedTime: 30, topics: ["writing", "persuasion"] }
      ]
    },
    {
      id: "eng-6-unit-5",
      title: "Poetry and Language",
      description: "Exploring poetic forms and techniques",
      term: 3,
      order: 5,
      assessmentCriteria: ["Analyze poetic techniques", "Write poetry"],
      lessons: [
        {
          id: "eng-6-5-1",
          title: "Introduction to Poetry",
          description: "Understanding poetic forms",
          duration: 45,
          objectives: ["Identify different poetry types", "Recognize rhyme and rhythm"],
          keyConcepts: ["Rhyme", "Rhythm", "Stanza", "Verse"]
        },
        {
          id: "eng-6-5-2",
          title: "Figurative Language",
          description: "Similes, metaphors and more",
          duration: 45,
          objectives: ["Identify figurative language", "Explain effects"],
          keyConcepts: ["Simile", "Metaphor", "Personification"]
        },
        {
          id: "eng-6-5-3",
          title: "Sound Devices",
          description: "Creating effects with sound",
          duration: 45,
          objectives: ["Identify alliteration and onomatopoeia", "Use in writing"],
          keyConcepts: ["Alliteration", "Onomatopoeia", "Assonance"]
        },
        {
          id: "eng-6-5-4",
          title: "Writing Poetry",
          description: "Creating original poems",
          duration: 45,
          objectives: ["Write different poem types", "Use poetic techniques"],
          keyConcepts: ["Free verse", "Haiku", "Rhyming poetry"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-6-5-1", lessonId: "eng-6-5-2", title: "Poetry Analysis", difficulty: "standard", questionCount: 10, estimatedTime: 20, topics: ["poetry", "figurative language"] }
      ]
    },
    {
      id: "eng-6-unit-6",
      title: "Speaking and Presenting",
      description: "Developing oral communication skills",
      term: 4,
      order: 6,
      assessmentCriteria: ["Deliver effective presentations", "Use appropriate language"],
      lessons: [
        {
          id: "eng-6-6-1",
          title: "Planning Presentations",
          description: "Organizing ideas for speaking",
          duration: 45,
          objectives: ["Plan clear presentations", "Organize ideas logically"],
          keyConcepts: ["Planning", "Structure", "Key points"]
        },
        {
          id: "eng-6-6-2",
          title: "Delivery Skills",
          description: "Speaking with confidence",
          duration: 45,
          objectives: ["Use appropriate pace and volume", "Make eye contact"],
          keyConcepts: ["Pace", "Volume", "Eye contact", "Body language"]
        },
        {
          id: "eng-6-6-3",
          title: "Visual Aids",
          description: "Using visuals effectively",
          duration: 45,
          objectives: ["Create effective visual aids", "Integrate visuals into presentation"],
          keyConcepts: ["Visual aids", "Slides", "Props"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-6-6-1", lessonId: "eng-6-6-1", title: "Presentation Skills", difficulty: "standard", questionCount: 6, estimatedTime: 20, topics: ["speaking", "presentation"] }
      ]
    }
  ]
};

// Continue with Years 7-12 English curriculum...
export const ENGLISH_YEAR_7: YearCurriculum = {
  year: 7,
  subject: "english",
  description: "Expanding vocabulary, developing analytical skills, and refining writing techniques",
  totalHours: 160,
  australianCurriculumCodes: ["ACELA1531", "ACELT1619", "ACELY1721"],
  units: [
    {
      id: "eng-7-unit-1",
      title: "Text Analysis",
      description: "Analyzing fiction and non-fiction texts",
      term: 1,
      order: 1,
      assessmentCriteria: ["Analyze text structure", "Identify author's techniques"],
      lessons: [
        {
          id: "eng-7-1-1",
          title: "Analyzing Fiction",
          description: "Understanding how fiction works",
          duration: 45,
          objectives: ["Analyze plot development", "Examine characterization"],
          keyConcepts: ["Plot", "Character", "Setting", "Theme"]
        },
        {
          id: "eng-7-1-2",
          title: "Analyzing Non-Fiction",
          description: "Understanding informational texts",
          duration: 45,
          objectives: ["Identify text features", "Evaluate information"],
          keyConcepts: ["Text features", "Headings", "Captions", "Diagrams"]
        },
        {
          id: "eng-7-1-3",
          title: "Comparing Texts",
          description: "Finding similarities and differences",
          duration: 45,
          objectives: ["Compare text features", "Contrast approaches"],
          keyConcepts: ["Comparison", "Contrast", "Text types"]
        },
        {
          id: "eng-7-1-4",
          title: "Critical Reading",
          description: "Questioning and evaluating texts",
          duration: 45,
          objectives: ["Question author's viewpoint", "Evaluate reliability"],
          keyConcepts: ["Critical reading", "Bias", "Reliability"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-7-1-1", lessonId: "eng-7-1-1", title: "Text Analysis", difficulty: "standard", questionCount: 12, estimatedTime: 25, topics: ["analysis", "reading"] }
      ]
    },
    {
      id: "eng-7-unit-2",
      title: "Essay Writing",
      description: "Developing structured essays",
      term: 1,
      order: 2,
      assessmentCriteria: ["Write structured essays", "Support arguments with evidence"],
      lessons: [
        {
          id: "eng-7-2-1",
          title: "Essay Structure",
          description: "Understanding essay organization",
          duration: 45,
          objectives: ["Organize essays effectively", "Write clear paragraphs"],
          keyConcepts: ["Introduction", "Body paragraphs", "Conclusion"]
        },
        {
          id: "eng-7-2-2",
          title: "Thesis Statements",
          description: "Writing strong thesis statements",
          duration: 45,
          objectives: ["Write clear thesis statements", "Focus arguments"],
          keyConcepts: ["Thesis", "Argument", "Focus"]
        },
        {
          id: "eng-7-2-3",
          title: "PEEL Paragraphs",
          description: "Structuring body paragraphs",
          duration: 45,
          objectives: ["Apply PEEL structure", "Develop ideas fully"],
          keyConcepts: ["Point", "Evidence", "Explanation", "Link"]
        },
        {
          id: "eng-7-2-4",
          title: "Conclusions",
          description: "Writing effective conclusions",
          duration: 45,
          objectives: ["Summarize arguments", "End with impact"],
          keyConcepts: ["Summary", "Final statement", "Impact"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-7-2-1", lessonId: "eng-7-2-3", title: "Essay Writing", difficulty: "standard", questionCount: 4, estimatedTime: 35, topics: ["essay", "writing"] }
      ]
    },
    {
      id: "eng-7-unit-3",
      title: "Vocabulary Development",
      description: "Expanding and using vocabulary",
      term: 2,
      order: 3,
      assessmentCriteria: ["Use sophisticated vocabulary", "Apply words in context"],
      lessons: [
        {
          id: "eng-7-3-1",
          title: "Word Roots and Origins",
          description: "Understanding word etymology",
          duration: 45,
          objectives: ["Identify word roots", "Use etymology to understand meaning"],
          keyConcepts: ["Root words", "Prefixes", "Suffixes", "Etymology"]
        },
        {
          id: "eng-7-3-2",
          title: "Context Clues",
          description: "Working out meaning from context",
          duration: 45,
          objectives: ["Use context to determine meaning", "Apply vocabulary strategies"],
          keyConcepts: ["Context clues", "Synonyms", "Definitions in text"]
        },
        {
          id: "eng-7-3-3",
          title: "Connotation and Denotation",
          description: "Understanding word meanings and associations",
          duration: 45,
          objectives: ["Distinguish connotation from denotation", "Choose words carefully"],
          keyConcepts: ["Connotation", "Denotation", "Word choice"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-7-3-1", lessonId: "eng-7-3-1", title: "Vocabulary Building", difficulty: "standard", questionCount: 20, estimatedTime: 20, topics: ["vocabulary", "word study"] }
      ]
    },
    {
      id: "eng-7-unit-4",
      title: "Novel Study",
      description: "In-depth study of a novel",
      term: 2,
      order: 4,
      assessmentCriteria: ["Analyze literary elements", "Respond to text"],
      lessons: [
        {
          id: "eng-7-4-1",
          title: "Themes in Literature",
          description: "Identifying and exploring themes",
          duration: 45,
          objectives: ["Identify major themes", "Support with evidence"],
          keyConcepts: ["Theme", "Evidence", "Universal ideas"]
        },
        {
          id: "eng-7-4-2",
          title: "Character Analysis",
          description: "Deep dive into characters",
          duration: 45,
          objectives: ["Analyze character development", "Examine motivations"],
          keyConcepts: ["Character arc", "Motivation", "Relationships"]
        },
        {
          id: "eng-7-4-3",
          title: "Literary Response",
          description: "Responding to literature",
          duration: 45,
          objectives: ["Write analytical responses", "Support interpretations"],
          keyConcepts: ["Response", "Interpretation", "Evidence"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-7-4-1", lessonId: "eng-7-4-1", title: "Novel Analysis", difficulty: "standard", questionCount: 8, estimatedTime: 30, topics: ["novel", "analysis"] }
      ]
    },
    {
      id: "eng-7-unit-5",
      title: "Media Literacy",
      description: "Understanding media texts",
      term: 3,
      order: 5,
      assessmentCriteria: ["Analyze media texts", "Recognize persuasive techniques"],
      lessons: [
        {
          id: "eng-7-5-1",
          title: "Advertising Techniques",
          description: "How ads persuade",
          duration: 45,
          objectives: ["Identify advertising techniques", "Analyze effectiveness"],
          keyConcepts: ["Target audience", "Persuasion", "Visual techniques"]
        },
        {
          id: "eng-7-5-2",
          title: "News Media",
          description: "Understanding news reporting",
          duration: 45,
          objectives: ["Analyze news articles", "Identify bias"],
          keyConcepts: ["Headlines", "Lead", "Bias", "Objectivity"]
        },
        {
          id: "eng-7-5-3",
          title: "Digital Media",
          description: "Evaluating online content",
          duration: 45,
          objectives: ["Evaluate online sources", "Identify misinformation"],
          keyConcepts: ["Reliability", "Credibility", "Fact-checking"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-7-5-1", lessonId: "eng-7-5-1", title: "Media Analysis", difficulty: "standard", questionCount: 10, estimatedTime: 25, topics: ["media", "advertising"] }
      ]
    },
    {
      id: "eng-7-unit-6",
      title: "Creative Writing",
      description: "Developing creative writing skills",
      term: 4,
      order: 6,
      assessmentCriteria: ["Write creative texts", "Use literary techniques"],
      lessons: [
        {
          id: "eng-7-6-1",
          title: "Voice and Style",
          description: "Developing a writing voice",
          duration: 45,
          objectives: ["Develop personal voice", "Adapt style to purpose"],
          keyConcepts: ["Voice", "Style", "Tone"]
        },
        {
          id: "eng-7-6-2",
          title: "Show Don't Tell",
          description: "Writing with impact",
          duration: 45,
          objectives: ["Use show don't tell", "Create vivid scenes"],
          keyConcepts: ["Show don't tell", "Sensory details", "Action"]
        },
        {
          id: "eng-7-6-3",
          title: "Editing and Revising",
          description: "Improving your writing",
          duration: 45,
          objectives: ["Edit for clarity", "Revise for impact"],
          keyConcepts: ["Editing", "Revising", "Proofreading"]
        }
      ],
      practiceSets: [
        { id: "ps-eng-7-6-1", lessonId: "eng-7-6-1", title: "Creative Writing", difficulty: "standard", questionCount: 3, estimatedTime: 35, topics: ["creative writing", "voice"] }
      ]
    }
  ]
};

// Simplified versions for Years 8-12 English (keeping structure, condensing content)
export const ENGLISH_YEAR_8: YearCurriculum = {
  year: 8,
  subject: "english",
  description: "Developing analytical essays, understanding genre conventions, and exploring diverse texts",
  totalHours: 160,
  australianCurriculumCodes: ["ACELA1544", "ACELT1626", "ACELY1732"],
  units: [
    {
      id: "eng-8-unit-1", title: "Analytical Writing", description: "Writing sophisticated analytical responses", term: 1, order: 1,
      assessmentCriteria: ["Write analytical essays", "Use evidence effectively"],
      lessons: [
        { id: "eng-8-1-1", title: "Analytical Essay Structure", description: "Organizing analytical writing", duration: 45, objectives: ["Structure analytical essays", "Develop arguments"], keyConcepts: ["Analysis", "Argument", "Structure"] },
        { id: "eng-8-1-2", title: "Using Evidence", description: "Integrating quotes and examples", duration: 45, objectives: ["Integrate quotes smoothly", "Analyze evidence"], keyConcepts: ["Quotes", "Integration", "Analysis"] },
        { id: "eng-8-1-3", title: "Developing Analysis", description: "Moving beyond summary", duration: 45, objectives: ["Analyze not summarize", "Develop insights"], keyConcepts: ["Analysis", "Insight", "Depth"] }
      ],
      practiceSets: [{ id: "ps-eng-8-1-1", lessonId: "eng-8-1-1", title: "Analytical Writing", difficulty: "standard", questionCount: 4, estimatedTime: 35, topics: ["analysis", "essay"] }]
    },
    {
      id: "eng-8-unit-2", title: "Genre Study", description: "Understanding literary genres", term: 1, order: 2,
      assessmentCriteria: ["Identify genre conventions", "Analyze genre texts"],
      lessons: [
        { id: "eng-8-2-1", title: "Genre Conventions", description: "Features of different genres", duration: 45, objectives: ["Identify genre features", "Compare genres"], keyConcepts: ["Genre", "Conventions", "Features"] },
        { id: "eng-8-2-2", title: "Gothic Literature", description: "Exploring the gothic genre", duration: 45, objectives: ["Analyze gothic elements", "Understand atmosphere"], keyConcepts: ["Gothic", "Atmosphere", "Suspense"] },
        { id: "eng-8-2-3", title: "Science Fiction", description: "Exploring speculative fiction", duration: 45, objectives: ["Analyze sci-fi themes", "Consider social commentary"], keyConcepts: ["Speculation", "Technology", "Society"] }
      ],
      practiceSets: [{ id: "ps-eng-8-2-1", lessonId: "eng-8-2-1", title: "Genre Analysis", difficulty: "standard", questionCount: 10, estimatedTime: 25, topics: ["genre", "conventions"] }]
    },
    {
      id: "eng-8-unit-3", title: "Shakespeare Introduction", description: "First encounter with Shakespeare", term: 2, order: 3,
      assessmentCriteria: ["Understand Shakespearean language", "Analyze scenes"],
      lessons: [
        { id: "eng-8-3-1", title: "Elizabethan Language", description: "Understanding Shakespeare's words", duration: 45, objectives: ["Translate key phrases", "Appreciate language"], keyConcepts: ["Elizabethan", "Vocabulary", "Iambic pentameter"] },
        { id: "eng-8-3-2", title: "Drama Techniques", description: "How plays work on stage", duration: 45, objectives: ["Analyze staging", "Understand dramatic techniques"], keyConcepts: ["Staging", "Soliloquy", "Aside"] }
      ],
      practiceSets: [{ id: "ps-eng-8-3-1", lessonId: "eng-8-3-1", title: "Shakespeare Basics", difficulty: "standard", questionCount: 12, estimatedTime: 25, topics: ["Shakespeare", "drama"] }]
    },
    {
      id: "eng-8-unit-4", title: "Persuasive Techniques", description: "Advanced persuasion", term: 2, order: 4,
      assessmentCriteria: ["Analyze persuasive texts", "Apply advanced techniques"],
      lessons: [
        { id: "eng-8-4-1", title: "Rhetorical Devices", description: "Advanced persuasive techniques", duration: 45, objectives: ["Use ethos, pathos, logos", "Analyze rhetoric"], keyConcepts: ["Ethos", "Pathos", "Logos"] },
        { id: "eng-8-4-2", title: "Argument and Counter-Argument", description: "Addressing opposing views", duration: 45, objectives: ["Acknowledge opposition", "Refute effectively"], keyConcepts: ["Rebuttal", "Counter-argument", "Concession"] }
      ],
      practiceSets: [{ id: "ps-eng-8-4-1", lessonId: "eng-8-4-1", title: "Rhetoric Analysis", difficulty: "standard", questionCount: 10, estimatedTime: 25, topics: ["persuasion", "rhetoric"] }]
    },
    {
      id: "eng-8-unit-5", title: "Poetry Analysis", description: "Analyzing poetry in depth", term: 3, order: 5,
      assessmentCriteria: ["Analyze poetic techniques", "Interpret meaning"],
      lessons: [
        { id: "eng-8-5-1", title: "Structure and Form", description: "Understanding poetic forms", duration: 45, objectives: ["Analyze form", "Connect form to meaning"], keyConcepts: ["Sonnet", "Free verse", "Ballad"] },
        { id: "eng-8-5-2", title: "Imagery and Symbolism", description: "Deeper meanings in poetry", duration: 45, objectives: ["Identify imagery", "Interpret symbols"], keyConcepts: ["Imagery", "Symbolism", "Extended metaphor"] }
      ],
      practiceSets: [{ id: "ps-eng-8-5-1", lessonId: "eng-8-5-2", title: "Poetry Analysis", difficulty: "standard", questionCount: 10, estimatedTime: 25, topics: ["poetry", "analysis"] }]
    },
    {
      id: "eng-8-unit-6", title: "Report and Information Writing", description: "Writing for information", term: 4, order: 6,
      assessmentCriteria: ["Write clear reports", "Present information effectively"],
      lessons: [
        { id: "eng-8-6-1", title: "Report Writing", description: "Structuring information", duration: 45, objectives: ["Write formal reports", "Organize information"], keyConcepts: ["Report structure", "Formal language", "Headings"] },
        { id: "eng-8-6-2", title: "Research Skills", description: "Finding and using information", duration: 45, objectives: ["Research effectively", "Cite sources"], keyConcepts: ["Research", "Sources", "Citation"] }
      ],
      practiceSets: [{ id: "ps-eng-8-6-1", lessonId: "eng-8-6-1", title: "Report Writing", difficulty: "standard", questionCount: 4, estimatedTime: 30, topics: ["report", "writing"] }]
    }
  ]
};

export const ENGLISH_YEAR_9: YearCurriculum = {
  year: 9,
  subject: "english",
  description: "Critical analysis, argument construction, and exploring diverse perspectives",
  totalHours: 160,
  australianCurriculumCodes: ["ACELA1557", "ACELT1633", "ACELY1742"],
  units: [
    {
      id: "eng-9-unit-1", title: "Critical Analysis", description: "Developing critical perspectives", term: 1, order: 1,
      assessmentCriteria: ["Analyze texts critically", "Consider multiple perspectives"],
      lessons: [
        { id: "eng-9-1-1", title: "Critical Perspectives", description: "Different ways of reading", duration: 45, objectives: ["Apply critical lenses", "Consider perspectives"], keyConcepts: ["Critical perspective", "Reader response", "Context"] },
        { id: "eng-9-1-2", title: "Author's Context", description: "How context shapes texts", duration: 45, objectives: ["Research author context", "Connect to text"], keyConcepts: ["Historical context", "Social context", "Author biography"] }
      ],
      practiceSets: [{ id: "ps-eng-9-1-1", lessonId: "eng-9-1-1", title: "Critical Reading", difficulty: "standard", questionCount: 10, estimatedTime: 30, topics: ["critical", "analysis"] }]
    },
    {
      id: "eng-9-unit-2", title: "Argument Construction", description: "Building sophisticated arguments", term: 1, order: 2,
      assessmentCriteria: ["Construct complex arguments", "Use evidence strategically"],
      lessons: [
        { id: "eng-9-2-1", title: "Complex Arguments", description: "Multi-faceted argumentation", duration: 45, objectives: ["Build complex arguments", "Address nuance"], keyConcepts: ["Complexity", "Nuance", "Qualification"] },
        { id: "eng-9-2-2", title: "Synthesizing Sources", description: "Combining multiple sources", duration: 45, objectives: ["Synthesize information", "Compare viewpoints"], keyConcepts: ["Synthesis", "Multiple sources", "Comparison"] }
      ],
      practiceSets: [{ id: "ps-eng-9-2-1", lessonId: "eng-9-2-1", title: "Argument Writing", difficulty: "standard", questionCount: 3, estimatedTime: 40, topics: ["argument", "writing"] }]
    },
    {
      id: "eng-9-unit-3", title: "Drama Study", description: "Shakespeare and modern drama", term: 2, order: 3,
      assessmentCriteria: ["Analyze dramatic texts", "Understand theatrical elements"],
      lessons: [
        { id: "eng-9-3-1", title: "Shakespeare In-Depth", description: "Detailed study of a play", duration: 45, objectives: ["Analyze themes", "Examine language"], keyConcepts: ["Themes", "Characterization", "Language"] },
        { id: "eng-9-3-2", title: "Modern Drama", description: "Contemporary theatrical texts", duration: 45, objectives: ["Compare with Shakespeare", "Analyze modern techniques"], keyConcepts: ["Staging", "Social comment", "Realism"] }
      ],
      practiceSets: [{ id: "ps-eng-9-3-1", lessonId: "eng-9-3-1", title: "Drama Analysis", difficulty: "standard", questionCount: 8, estimatedTime: 30, topics: ["drama", "Shakespeare"] }]
    },
    {
      id: "eng-9-unit-4", title: "Comparative Analysis", description: "Comparing texts", term: 2, order: 4,
      assessmentCriteria: ["Compare texts effectively", "Identify connections"],
      lessons: [
        { id: "eng-9-4-1", title: "Comparative Essays", description: "Writing about multiple texts", duration: 45, objectives: ["Structure comparisons", "Find connections"], keyConcepts: ["Comparison", "Contrast", "Synthesis"] },
        { id: "eng-9-4-2", title: "Intertextuality", description: "How texts relate to each other", duration: 45, objectives: ["Identify intertextual references", "Analyze connections"], keyConcepts: ["Intertextuality", "Allusion", "Reference"] }
      ],
      practiceSets: [{ id: "ps-eng-9-4-1", lessonId: "eng-9-4-1", title: "Comparative Writing", difficulty: "standard", questionCount: 3, estimatedTime: 40, topics: ["comparison", "essay"] }]
    },
    {
      id: "eng-9-unit-5", title: "Australian Voices", description: "Australian literature and perspectives", term: 3, order: 5,
      assessmentCriteria: ["Analyze Australian texts", "Understand cultural perspectives"],
      lessons: [
        { id: "eng-9-5-1", title: "Indigenous Perspectives", description: "First Nations voices", duration: 45, objectives: ["Engage with Indigenous texts", "Understand perspectives"], keyConcepts: ["Country", "Dreaming", "Cultural sensitivity"] },
        { id: "eng-9-5-2", title: "Multicultural Voices", description: "Diverse Australian experiences", duration: 45, objectives: ["Explore diverse voices", "Consider identity"], keyConcepts: ["Identity", "Belonging", "Diversity"] }
      ],
      practiceSets: [{ id: "ps-eng-9-5-1", lessonId: "eng-9-5-1", title: "Australian Literature", difficulty: "standard", questionCount: 8, estimatedTime: 30, topics: ["Australian", "literature"] }]
    },
    {
      id: "eng-9-unit-6", title: "Feature Article Writing", description: "Writing engaging non-fiction", term: 4, order: 6,
      assessmentCriteria: ["Write engaging articles", "Use journalistic techniques"],
      lessons: [
        { id: "eng-9-6-1", title: "Feature Articles", description: "Writing for magazines", duration: 45, objectives: ["Write feature articles", "Engage readers"], keyConcepts: ["Hook", "Angle", "Voice"] },
        { id: "eng-9-6-2", title: "Research Journalism", description: "Investigative writing", duration: 45, objectives: ["Research topics", "Present findings engagingly"], keyConcepts: ["Investigation", "Interviews", "Facts"] }
      ],
      practiceSets: [{ id: "ps-eng-9-6-1", lessonId: "eng-9-6-1", title: "Feature Writing", difficulty: "standard", questionCount: 2, estimatedTime: 40, topics: ["journalism", "writing"] }]
    }
  ]
};

export const ENGLISH_YEAR_10: YearCurriculum = {
  year: 10,
  subject: "english",
  description: "Sophisticated literary analysis, extended writing, and preparing for senior study",
  totalHours: 160,
  australianCurriculumCodes: ["ACELA1567", "ACELT1641", "ACELY1752"],
  units: [
    {
      id: "eng-10-unit-1", title: "Literary Theory", description: "Introduction to literary criticism", term: 1, order: 1,
      assessmentCriteria: ["Apply literary theories", "Analyze from multiple perspectives"],
      lessons: [
        { id: "eng-10-1-1", title: "Feminist Criticism", description: "Gender in literature", duration: 45, objectives: ["Apply feminist lens", "Analyze gender representation"], keyConcepts: ["Gender", "Patriarchy", "Representation"] },
        { id: "eng-10-1-2", title: "Marxist Criticism", description: "Class and power", duration: 45, objectives: ["Apply Marxist lens", "Analyze power structures"], keyConcepts: ["Class", "Power", "Ideology"] },
        { id: "eng-10-1-3", title: "Post-Colonial Criticism", description: "Empire and identity", duration: 45, objectives: ["Apply post-colonial lens", "Analyze cultural identity"], keyConcepts: ["Colonialism", "Identity", "Othering"] }
      ],
      practiceSets: [{ id: "ps-eng-10-1-1", lessonId: "eng-10-1-1", title: "Literary Theory", difficulty: "advanced", questionCount: 8, estimatedTime: 35, topics: ["theory", "criticism"] }]
    },
    {
      id: "eng-10-unit-2", title: "Extended Text Study", description: "In-depth novel study", term: 1, order: 2,
      assessmentCriteria: ["Analyze extended texts", "Write sophisticated responses"],
      lessons: [
        { id: "eng-10-2-1", title: "Close Reading", description: "Detailed textual analysis", duration: 45, objectives: ["Analyze language closely", "Connect to themes"], keyConcepts: ["Close reading", "Language analysis", "Detail"] },
        { id: "eng-10-2-2", title: "Extended Response", description: "Writing longer essays", duration: 45, objectives: ["Structure extended essays", "Develop sustained argument"], keyConcepts: ["Extended response", "Sustained argument", "Depth"] }
      ],
      practiceSets: [{ id: "ps-eng-10-2-1", lessonId: "eng-10-2-2", title: "Extended Essay", difficulty: "advanced", questionCount: 2, estimatedTime: 50, topics: ["essay", "analysis"] }]
    },
    {
      id: "eng-10-unit-3", title: "Shakespeare Mastery", description: "Advanced Shakespeare study", term: 2, order: 3,
      assessmentCriteria: ["Analyze Shakespeare deeply", "Connect to context and themes"],
      lessons: [
        { id: "eng-10-3-1", title: "Language and Imagery", description: "Shakespeare's craft", duration: 45, objectives: ["Analyze imagery patterns", "Examine language effects"], keyConcepts: ["Imagery", "Motifs", "Verse and prose"] },
        { id: "eng-10-3-2", title: "Context and Reception", description: "Then and now", duration: 45, objectives: ["Consider historical context", "Analyze modern relevance"], keyConcepts: ["Context", "Reception", "Relevance"] }
      ],
      practiceSets: [{ id: "ps-eng-10-3-1", lessonId: "eng-10-3-1", title: "Shakespeare Analysis", difficulty: "advanced", questionCount: 6, estimatedTime: 35, topics: ["Shakespeare", "analysis"] }]
    },
    {
      id: "eng-10-unit-4", title: "Comparative Text Study", description: "Comparing texts in depth", term: 2, order: 4,
      assessmentCriteria: ["Compare texts sophisticatedly", "Synthesize analysis"],
      lessons: [
        { id: "eng-10-4-1", title: "Thematic Comparison", description: "Comparing by theme", duration: 45, objectives: ["Compare thematic treatment", "Analyze differences"], keyConcepts: ["Theme", "Treatment", "Perspective"] },
        { id: "eng-10-4-2", title: "Stylistic Comparison", description: "Comparing technique", duration: 45, objectives: ["Compare style and technique", "Analyze effects"], keyConcepts: ["Style", "Technique", "Effect"] }
      ],
      practiceSets: [{ id: "ps-eng-10-4-1", lessonId: "eng-10-4-1", title: "Comparative Essay", difficulty: "advanced", questionCount: 2, estimatedTime: 50, topics: ["comparison", "essay"] }]
    },
    {
      id: "eng-10-unit-5", title: "Persuasive Writing", description: "Advanced persuasion and argumentation", term: 3, order: 5,
      assessmentCriteria: ["Write persuasive pieces", "Analyze language of persuasion"],
      lessons: [
        { id: "eng-10-5-1", title: "Language of Persuasion", description: "Analyzing persuasive language", duration: 45, objectives: ["Analyze persuasive techniques", "Evaluate effectiveness"], keyConcepts: ["Rhetoric", "Manipulation", "Appeal"] },
        { id: "eng-10-5-2", title: "Speech Writing", description: "Writing to be spoken", duration: 45, objectives: ["Write effective speeches", "Consider delivery"], keyConcepts: ["Speech", "Delivery", "Audience"] }
      ],
      practiceSets: [{ id: "ps-eng-10-5-1", lessonId: "eng-10-5-2", title: "Speech Writing", difficulty: "advanced", questionCount: 2, estimatedTime: 40, topics: ["speech", "persuasion"] }]
    },
    {
      id: "eng-10-unit-6", title: "Exam Preparation", description: "Skills for senior English", term: 4, order: 6,
      assessmentCriteria: ["Apply exam techniques", "Write under time pressure"],
      lessons: [
        { id: "eng-10-6-1", title: "Exam Essay Techniques", description: "Writing in exam conditions", duration: 45, objectives: ["Plan quickly", "Write efficiently"], keyConcepts: ["Time management", "Planning", "Efficiency"] },
        { id: "eng-10-6-2", title: "Text Response Skills", description: "Responding to unseen texts", duration: 45, objectives: ["Analyze unseen texts", "Apply skills under pressure"], keyConcepts: ["Unseen", "Analysis", "Application"] }
      ],
      practiceSets: [{ id: "ps-eng-10-6-1", lessonId: "eng-10-6-1", title: "Exam Practice", difficulty: "advanced", questionCount: 3, estimatedTime: 45, topics: ["exam", "practice"] }]
    }
  ]
};

export const ENGLISH_YEAR_11: YearCurriculum = {
  year: 11,
  subject: "english",
  description: "Senior English with focus on textual analysis, comparative study, and extended writing",
  totalHours: 200,
  australianCurriculumCodes: ["ACEEN001", "ACEEN010", "ACEEN020"],
  units: [
    {
      id: "eng-11-unit-1", title: "Reading and Creating", description: "Analytical and creative responses", term: 1, order: 1,
      assessmentCriteria: ["Analyze texts deeply", "Create imaginative pieces"],
      lessons: [
        { id: "eng-11-1-1", title: "Text and Context", description: "How context shapes meaning", duration: 60, objectives: ["Analyze contextual influences", "Connect to interpretation"], keyConcepts: ["Context", "Meaning", "Interpretation"] },
        { id: "eng-11-1-2", title: "Analytical Writing", description: "Senior essay skills", duration: 60, objectives: ["Write sophisticated analysis", "Develop critical argument"], keyConcepts: ["Analysis", "Argument", "Evidence"] },
        { id: "eng-11-1-3", title: "Creative Response", description: "Writing in response to texts", duration: 60, objectives: ["Create imaginative responses", "Demonstrate understanding"], keyConcepts: ["Creative response", "Voice", "Interpretation"] }
      ],
      practiceSets: [{ id: "ps-eng-11-1-1", lessonId: "eng-11-1-2", title: "Analytical Essay", difficulty: "advanced", questionCount: 2, estimatedTime: 55, topics: ["analysis", "essay"] }]
    },
    {
      id: "eng-11-unit-2", title: "Comparative Study", description: "Comparing texts and contexts", term: 1, order: 2,
      assessmentCriteria: ["Compare texts effectively", "Analyze connections and differences"],
      lessons: [
        { id: "eng-11-2-1", title: "Comparative Frameworks", description: "Approaches to comparison", duration: 60, objectives: ["Apply comparative frameworks", "Structure comparison"], keyConcepts: ["Framework", "Connection", "Synthesis"] },
        { id: "eng-11-2-2", title: "Writing Comparatively", description: "The comparative essay", duration: 60, objectives: ["Write comparative essays", "Integrate both texts"], keyConcepts: ["Integration", "Balance", "Sophistication"] }
      ],
      practiceSets: [{ id: "ps-eng-11-2-1", lessonId: "eng-11-2-2", title: "Comparative Essay", difficulty: "advanced", questionCount: 2, estimatedTime: 55, topics: ["comparison", "essay"] }]
    },
    {
      id: "eng-11-unit-3", title: "Argument and Persuasion", description: "Analyzing and using persuasion", term: 2, order: 3,
      assessmentCriteria: ["Analyze persuasive texts", "Write persuasively"],
      lessons: [
        { id: "eng-11-3-1", title: "Analyzing Argument", description: "Deconstructing persuasion", duration: 60, objectives: ["Analyze arguments", "Identify techniques and effects"], keyConcepts: ["Contention", "Reasoning", "Technique"] },
        { id: "eng-11-3-2", title: "Constructing Arguments", description: "Building effective arguments", duration: 60, objectives: ["Construct persuasive arguments", "Use evidence strategically"], keyConcepts: ["Construction", "Strategy", "Effectiveness"] }
      ],
      practiceSets: [{ id: "ps-eng-11-3-1", lessonId: "eng-11-3-1", title: "Argument Analysis", difficulty: "advanced", questionCount: 4, estimatedTime: 40, topics: ["argument", "persuasion"] }]
    },
    {
      id: "eng-11-unit-4", title: "Language Analysis", description: "Analyzing language in texts", term: 2, order: 4,
      assessmentCriteria: ["Analyze language techniques", "Evaluate effects"],
      lessons: [
        { id: "eng-11-4-1", title: "Language Techniques", description: "Identifying and analyzing techniques", duration: 60, objectives: ["Identify techniques", "Analyze effects on audience"], keyConcepts: ["Technique", "Effect", "Audience"] },
        { id: "eng-11-4-2", title: "Writing Language Analysis", description: "The language analysis essay", duration: 60, objectives: ["Write language analysis", "Structure effectively"], keyConcepts: ["Analysis", "Structure", "Metalanguage"] }
      ],
      practiceSets: [{ id: "ps-eng-11-4-1", lessonId: "eng-11-4-2", title: "Language Analysis", difficulty: "advanced", questionCount: 2, estimatedTime: 45, topics: ["language", "analysis"] }]
    },
    {
      id: "eng-11-unit-5", title: "Media and Ethics", description: "Media representations and ethics", term: 3, order: 5,
      assessmentCriteria: ["Analyze media representations", "Consider ethical dimensions"],
      lessons: [
        { id: "eng-11-5-1", title: "Media Representations", description: "How media shapes perceptions", duration: 60, objectives: ["Analyze representations", "Consider impact"], keyConcepts: ["Representation", "Stereotype", "Influence"] },
        { id: "eng-11-5-2", title: "Ethical Considerations", description: "Ethics in texts and media", duration: 60, objectives: ["Consider ethical dimensions", "Evaluate positions"], keyConcepts: ["Ethics", "Responsibility", "Values"] }
      ],
      practiceSets: [{ id: "ps-eng-11-5-1", lessonId: "eng-11-5-1", title: "Media Analysis", difficulty: "advanced", questionCount: 4, estimatedTime: 35, topics: ["media", "ethics"] }]
    },
    {
      id: "eng-11-unit-6", title: "Independent Study", description: "Preparing for Year 12", term: 4, order: 6,
      assessmentCriteria: ["Develop independent skills", "Refine analytical and creative abilities"],
      lessons: [
        { id: "eng-11-6-1", title: "Independent Reading", description: "Developing reading habits", duration: 60, objectives: ["Read independently", "Reflect on reading"], keyConcepts: ["Reading", "Reflection", "Growth"] },
        { id: "eng-11-6-2", title: "Portfolio Development", description: "Building a writing portfolio", duration: 60, objectives: ["Collect best work", "Reflect on progress"], keyConcepts: ["Portfolio", "Reflection", "Development"] }
      ],
      practiceSets: [{ id: "ps-eng-11-6-1", lessonId: "eng-11-6-2", title: "Portfolio Piece", difficulty: "advanced", questionCount: 1, estimatedTime: 50, topics: ["portfolio", "writing"] }]
    }
  ]
};

export const ENGLISH_YEAR_12: YearCurriculum = {
  year: 12,
  subject: "english",
  description: "Final year English with focus on textual analysis, comparative study, and exam preparation",
  totalHours: 200,
  australianCurriculumCodes: ["ACEEN030", "ACEEN040", "ACEEN050"],
  units: [
    {
      id: "eng-12-unit-1", title: "Text Study", description: "Deep analysis of set texts", term: 1, order: 1,
      assessmentCriteria: ["Analyze texts at advanced level", "Demonstrate sophisticated understanding"],
      lessons: [
        { id: "eng-12-1-1", title: "Advanced Textual Analysis", description: "Sophisticated reading", duration: 60, objectives: ["Analyze at advanced level", "Develop nuanced interpretations"], keyConcepts: ["Nuance", "Sophistication", "Depth"] },
        { id: "eng-12-1-2", title: "Essay Excellence", description: "Writing high-scoring essays", duration: 60, objectives: ["Write excellent essays", "Demonstrate mastery"], keyConcepts: ["Excellence", "Mastery", "Precision"] }
      ],
      practiceSets: [{ id: "ps-eng-12-1-1", lessonId: "eng-12-1-2", title: "Text Response Essay", difficulty: "advanced", questionCount: 2, estimatedTime: 60, topics: ["essay", "analysis"] }]
    },
    {
      id: "eng-12-unit-2", title: "Comparative Study", description: "Advanced comparative analysis", term: 1, order: 2,
      assessmentCriteria: ["Compare texts at advanced level", "Demonstrate sophisticated synthesis"],
      lessons: [
        { id: "eng-12-2-1", title: "Comparative Excellence", description: "High-level comparison", duration: 60, objectives: ["Compare sophisticatedly", "Synthesize effectively"], keyConcepts: ["Synthesis", "Integration", "Balance"] },
        { id: "eng-12-2-2", title: "Exam Comparative", description: "Comparative under pressure", duration: 60, objectives: ["Write comparatives in exams", "Manage time effectively"], keyConcepts: ["Exam", "Time", "Efficiency"] }
      ],
      practiceSets: [{ id: "ps-eng-12-2-1", lessonId: "eng-12-2-1", title: "Comparative Essay", difficulty: "advanced", questionCount: 2, estimatedTime: 60, topics: ["comparison", "exam"] }]
    },
    {
      id: "eng-12-unit-3", title: "Argument and Language", description: "Analyzing argument and language", term: 2, order: 3,
      assessmentCriteria: ["Analyze argument at advanced level", "Write sophisticated analysis"],
      lessons: [
        { id: "eng-12-3-1", title: "Analyzing Complex Arguments", description: "Nuanced argument analysis", duration: 60, objectives: ["Analyze complex arguments", "Evaluate effectiveness"], keyConcepts: ["Complexity", "Evaluation", "Nuance"] },
        { id: "eng-12-3-2", title: "Language Analysis Mastery", description: "Expert language analysis", duration: 60, objectives: ["Master language analysis", "Write with precision"], keyConcepts: ["Mastery", "Precision", "Insight"] }
      ],
      practiceSets: [{ id: "ps-eng-12-3-1", lessonId: "eng-12-3-2", title: "Argument Analysis", difficulty: "advanced", questionCount: 2, estimatedTime: 50, topics: ["argument", "language"] }]
    },
    {
      id: "eng-12-unit-4", title: "Presenting Argument", description: "Creating persuasive texts", term: 2, order: 4,
      assessmentCriteria: ["Create persuasive texts", "Demonstrate rhetorical skill"],
      lessons: [
        { id: "eng-12-4-1", title: "Point of View Writing", description: "Writing persuasive pieces", duration: 60, objectives: ["Write persuasively", "Demonstrate skill"], keyConcepts: ["Persuasion", "Voice", "Impact"] },
        { id: "eng-12-4-2", title: "Oral Presentation", description: "Presenting arguments", duration: 60, objectives: ["Present effectively", "Engage audience"], keyConcepts: ["Presentation", "Delivery", "Engagement"] }
      ],
      practiceSets: [{ id: "ps-eng-12-4-1", lessonId: "eng-12-4-1", title: "Point of View", difficulty: "advanced", questionCount: 1, estimatedTime: 45, topics: ["persuasion", "writing"] }]
    },
    {
      id: "eng-12-unit-5", title: "Exam Preparation", description: "Preparing for final exams", term: 3, order: 5,
      assessmentCriteria: ["Apply exam techniques", "Demonstrate mastery under pressure"],
      lessons: [
        { id: "eng-12-5-1", title: "Exam Strategy", description: "Approaches to success", duration: 60, objectives: ["Develop strategies", "Manage exam conditions"], keyConcepts: ["Strategy", "Management", "Success"] },
        { id: "eng-12-5-2", title: "Practice Exams", description: "Simulated exam conditions", duration: 60, objectives: ["Practice under conditions", "Identify areas for improvement"], keyConcepts: ["Practice", "Simulation", "Improvement"] }
      ],
      practiceSets: [{ id: "ps-eng-12-5-1", lessonId: "eng-12-5-2", title: "Practice Exam", difficulty: "advanced", questionCount: 4, estimatedTime: 120, topics: ["exam", "practice"] }]
    },
    {
      id: "eng-12-unit-6", title: "Final Review", description: "Consolidation and revision", term: 4, order: 6,
      assessmentCriteria: ["Demonstrate mastery", "Apply all skills effectively"],
      lessons: [
        { id: "eng-12-6-1", title: "Text Review", description: "Revising set texts", duration: 60, objectives: ["Revise effectively", "Consolidate understanding"], keyConcepts: ["Revision", "Consolidation", "Mastery"] },
        { id: "eng-12-6-2", title: "Skills Review", description: "Revising all skills", duration: 60, objectives: ["Review all skills", "Identify final improvements"], keyConcepts: ["Review", "Skills", "Excellence"] }
      ],
      practiceSets: [{ id: "ps-eng-12-6-1", lessonId: "eng-12-6-1", title: "Final Review", difficulty: "advanced", questionCount: 5, estimatedTime: 90, topics: ["revision", "all"] }]
    }
  ]
};

// ============================================
// CURRICULUM COLLECTIONS
// ============================================

export const MATH_CURRICULA: Record<YearLevel, YearCurriculum> = {
  6: MATH_YEAR_6,
  7: MATH_YEAR_7,
  8: MATH_YEAR_8,
  9: MATH_YEAR_9,
  10: MATH_YEAR_10,
  11: MATH_YEAR_11,
  12: MATH_YEAR_12,
};

export const ENGLISH_CURRICULA: Record<YearLevel, YearCurriculum> = {
  6: ENGLISH_YEAR_6,
  7: ENGLISH_YEAR_7,
  8: ENGLISH_YEAR_8,
  9: ENGLISH_YEAR_9,
  10: ENGLISH_YEAR_10,
  11: ENGLISH_YEAR_11,
  12: ENGLISH_YEAR_12,
};

export const ALL_CURRICULA: Record<Subject, Record<YearLevel, YearCurriculum>> = {
  mathematics: MATH_CURRICULA,
  english: ENGLISH_CURRICULA,
};

// Helper functions
export function getCurriculum(subject: Subject, year: YearLevel): YearCurriculum {
  return ALL_CURRICULA[subject][year];
}

export function getUnit(subject: Subject, year: YearLevel, unitId: string): Unit | undefined {
  const curriculum = getCurriculum(subject, year);
  return curriculum.units.find(u => u.id === unitId);
}

export function getLesson(subject: Subject, year: YearLevel, lessonId: string): Lesson | undefined {
  const curriculum = getCurriculum(subject, year);
  for (const unit of curriculum.units) {
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

export function getLessonsForYear(subject: Subject, year: YearLevel): Lesson[] {
  const curriculum = getCurriculum(subject, year);
  return curriculum.units.flatMap(unit => unit.lessons);
}

export function getPracticeSetsForYear(subject: Subject, year: YearLevel): PracticeSet[] {
  const curriculum = getCurriculum(subject, year);
  return curriculum.units.flatMap(unit => unit.practiceSets);
}
