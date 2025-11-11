import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  summary: string;
  githubUsername?: string;
  githubActivity?: number[]; // Array of 365 days (0-4 commits per day)
  caveUrl?: string;
  projectIds?: string[]; // IDs of projects they're engaging with
}

interface SocialStore {
  people: Person[];
  initializePeople: () => void;
}

// Generate mock GitHub activity (365 days)
function generateMockActivity(): number[] {
  return Array.from({ length: 365 }, () => {
    const rand = Math.random();
    if (rand < 0.3) return 0;
    if (rand < 0.6) return 1;
    if (rand < 0.8) return 2;
    if (rand < 0.95) return 3;
    return 4;
  });
}

// 33 core supporters - placeholder data with project engagement
const initialPeople: Person[] = Array.from({ length: 33 }, (_, i) => {
  // Assign some random project IDs for engagement (using existing project IDs)
  const allProjectIds = [
    'sted-space', 'sted-studio', 'bvm-dao', 'natufoodco', 'gitmatch', 'vibecheck',
    'vortan', 'dpslec', 'enhance42', 'studentchakra', 'ratefinder'
  ];
  const numProjects = Math.floor(Math.random() * 3) + 1; // 1-3 projects per person
  const shuffled = [...allProjectIds].sort(() => Math.random() - 0.5);
  
  return {
    id: `person-${i + 1}`,
    name: `Supporter ${i + 1}`,
    summary: `Core supporter working on shared vision. Active contributor to the community.`,
    githubUsername: `supporter${i + 1}`,
    githubActivity: generateMockActivity(),
    caveUrl: `/cave/${i + 1}`,
    projectIds: shuffled.slice(0, numProjects), // Random projects they're engaging with
  };
});

export const useSocialStore = create<SocialStore>()(
  persist(
    (set) => ({
      people: [],
      initializePeople: () => {
        set({ people: initialPeople });
      },
    }),
    {
      name: 'social-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
);

