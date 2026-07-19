export type Consultant = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  tags?: string[];
  languages?: string[];
  feeRange?: string;
};

// Demo-mode roster (signed out) — mirrors the app's sample consultants.
export const DEMO_CONSULTANTS: Consultant[] = [
  {
    id: "c1",
    name: "Dr. Sarah Chen",
    role: "Clinical Psychologist",
    rating: 4.9,
    reviewCount: 128,
    tags: ["Anxiety", "Chronic Illness"],
    feeRange: "$80–120/session",
    bio: "Specializes in chronic-illness adjustment and anxiety.",
    languages: ["English", "Mandarin"],
  },
  {
    id: "c2",
    name: "Dr. Priya Patel",
    role: "Pain Psychologist",
    rating: 4.8,
    reviewCount: 96,
    tags: ["Chronic Pain", "CBT"],
    feeRange: "$90–130/session",
    bio: "CBT for persistent pain and pacing.",
    languages: ["English", "Hindi"],
  },
];
