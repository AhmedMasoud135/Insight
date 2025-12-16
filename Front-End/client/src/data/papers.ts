export interface Paper {
  id: string;
  title: string;
  abstract: string;
  field: string;
  authors: string[];
  date: string;
  rating: number;
  downloads: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export const papers: Paper[] = [
  {
    id: "1",
    title: "Quantum Entanglement in Macroscopic Systems",
    abstract: "This paper explores the phenomenon of quantum entanglement in systems larger than the microscopic scale, proposing new methods for observing quantum effects in everyday objects. We demonstrate that under specific conditions, entanglement can persist at room temperature.",
    field: "Quantum Physics",
    authors: ["Dr. Elena Rostova", "Prof. James Chen"],
    date: "2023-10-15",
    rating: 4.8,
    downloads: 12450,
    reviews: [
      {
        id: "r1",
        user: "PhysicsFan99",
        rating: 5,
        comment: "Groundbreaking work! The implications for quantum computing are immense.",
        date: "2023-10-20"
      },
      {
        id: "r2",
        user: "AcademicReviewer",
        rating: 4,
        comment: "Solid methodology, though the sample size could be larger.",
        date: "2023-11-05"
      }
    ]
  },
  {
    id: "2",
    title: "CRISPR-Cas9 Applications in Neurodegenerative Diseases",
    abstract: "A comprehensive review of recent advancements in using CRISPR-Cas9 gene editing technology to treat Alzheimer's and Parkinson's diseases. We analyze clinical trial data and propose a new delivery mechanism for crossing the blood-brain barrier.",
    field: "Biotechnology",
    authors: ["Dr. Sarah Jenkins", "Dr. Michael O'Connor"],
    date: "2023-09-22",
    rating: 4.5,
    downloads: 8900,
    reviews: []
  },
  {
    id: "3",
    title: "Sustainable Urban Planning: AI-Driven Models",
    abstract: "Using machine learning algorithms to optimize city layouts for energy efficiency and traffic flow. This study presents a new model trained on data from 50 major metropolitan areas.",
    field: "Urban Studies",
    authors: ["Prof. David Kim"],
    date: "2023-11-10",
    rating: 4.2,
    downloads: 5600,
    reviews: []
  },
  {
    id: "4",
    title: "The Impact of Microplastics on Marine Ecosystems",
    abstract: "An in-depth analysis of how microplastics affect the reproductive cycles of marine life in the Pacific Ocean. The study spans five years of data collection.",
    field: "Environmental Science",
    authors: ["Dr. Emily White", "Dr. Robert Black"],
    date: "2023-08-05",
    rating: 4.9,
    downloads: 15200,
    reviews: []
  },
  {
    id: "5",
    title: "Advances in Solid-State Battery Technology",
    abstract: "Reviewing the latest materials and manufacturing techniques for solid-state batteries, focusing on energy density and safety improvements for electric vehicles.",
    field: "Materials Science",
    authors: ["Dr. Alan Turing", "Dr. Marie Curie"],
    date: "2023-12-01",
    rating: 4.7,
    downloads: 10500,
    reviews: []
  },
  {
    id: "6",
    title: "Ethical Implications of Artificial General Intelligence",
    abstract: "A philosophical and practical framework for ensuring the safe development of AGI. We discuss alignment problems and propose a new governance model.",
    field: "Artificial Intelligence",
    authors: ["Prof. Nick Bostrom", "Dr. Stuart Russell"],
    date: "2023-07-18",
    rating: 4.6,
    downloads: 22000,
    reviews: []
  }
];
