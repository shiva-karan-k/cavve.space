import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  vmUrl?: string;
  screenId?: number;
  createdAt: string;
}

export interface ProjectBlock {
  id: string;
  name: string;
  items: Project[];
}

export interface ProjectSection {
  id: string;
  name: string;
  blocks: ProjectBlock[];
}

interface ProjectStore {
  projects: Project[];
  sections: ProjectSection[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  initializeProjects: () => void;
}

const initialSections: ProjectSection[] = [
  {
    id: 'visions',
    name: 'Visions',
    blocks: [
      {
        id: 'inhouse-visions',
        name: 'Inhouse visions',
        items: [
          { id: 'sted-space', name: 'sted space', createdAt: new Date().toISOString() },
          { id: 'sted-studio', name: 'sted studio', createdAt: new Date().toISOString() },
          { id: 'add-on-prop', name: 'add on prop', createdAt: new Date().toISOString() },
          { id: 'basics', name: 'basics', createdAt: new Date().toISOString() },
          { id: 'vizag-startups', name: 'vizag startups', createdAt: new Date().toISOString() },
          { id: 'vizag-dao', name: 'vizag DAO', createdAt: new Date().toISOString() },
          { id: 'yomm', name: 'Yomm', createdAt: new Date().toISOString() },
          { id: 'cavve', name: 'cavve', createdAt: new Date().toISOString() },
        ],
      },
    ],
  },
  {
    id: 'missions',
    name: 'Missions',
    blocks: [
      {
        id: 'cooking',
        name: 'Cooking',
        items: [
          { id: 'bvm-dao', name: 'BVM DAO', createdAt: new Date().toISOString() },
          { id: 'natufoodco', name: 'NatuFoodCo', createdAt: new Date().toISOString() },
          { id: 'rythumowa', name: 'RythuMowa', createdAt: new Date().toISOString() },
          { id: 'ogbg', name: 'OgBg', createdAt: new Date().toISOString() },
          { id: 'nisa', name: 'Nisa', createdAt: new Date().toISOString() },
          { id: 'arth-bhumi', name: 'Arth.bhumi', createdAt: new Date().toISOString() },
          { id: 'mrec', name: 'MRec', createdAt: new Date().toISOString() },
        ],
      },
      {
        id: 'sted-dishes',
        name: 'sted dishes',
        items: [
          { id: 'gitmatch', name: 'gitmatch', createdAt: new Date().toISOString() },
          { id: 'vibecheck', name: 'vibecheck', createdAt: new Date().toISOString() },
          { id: 'ideamowa', name: 'ideamowa', createdAt: new Date().toISOString() },
          { id: 'startupmowa', name: 'startupmowa', createdAt: new Date().toISOString() },
          { id: 'ship-mowa', name: 'ship mowa', createdAt: new Date().toISOString() },
          { id: 'marchu-mowa', name: 'marchu mowa', createdAt: new Date().toISOString() },
          { id: 'ammey-mowa', name: 'ammey mowa', createdAt: new Date().toISOString() },
          { id: 'thoughtbender', name: 'thoughtbender', createdAt: new Date().toISOString() },
          { id: 'linkbender', name: 'linkbender', createdAt: new Date().toISOString() },
        ],
      },
      {
        id: '0-1s',
        name: "0-1's",
        items: [
          { id: 'vortan', name: 'Vortan', createdAt: new Date().toISOString() },
          { id: 'dpslec', name: 'dpslec', createdAt: new Date().toISOString() },
          { id: 'enhance42', name: 'enhance42', createdAt: new Date().toISOString() },
          { id: 'studentchakra', name: 'studentchakra', createdAt: new Date().toISOString() },
          { id: 'ratefinder', name: 'ratefinder', createdAt: new Date().toISOString() },
          { id: 'arthlings', name: 'arthlings', createdAt: new Date().toISOString() },
          { id: 'vizagventurestudio', name: 'vizagventurestudio', createdAt: new Date().toISOString() },
          { id: 'innovatorsguild', name: 'innovatorsguild', createdAt: new Date().toISOString() },
          { id: 'barbarika-foundation', name: 'barbarika foundation', createdAt: new Date().toISOString() },
          { id: 'vasudhan', name: 'vasudhan', createdAt: new Date().toISOString() },
        ],
      },
      {
        id: 'gigs',
        name: 'gigs',
        items: [
          { id: 'voh-cambridge-lp', name: 'VoH Cambridge LP', createdAt: new Date().toISOString() },
        ],
      },
    ],
  },
  {
    id: 'life',
    name: 'Life',
    blocks: [
      {
        id: 'mind',
        name: 'Mind',
        items: [],
      },
      {
        id: 'body',
        name: 'Body',
        items: [],
      },
      {
        id: 'soul',
        name: 'Soul',
        items: [],
      },
      {
        id: 'banking',
        name: 'Banking',
        items: [],
      },
      {
        id: 'identity',
        name: 'Identity',
        items: [],
      },
      {
        id: 'socials',
        name: 'Socials',
        items: [],
      },
      {
        id: 'portfolios',
        name: 'Portfolios',
        items: [],
      },
    ],
  },
];

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      sections: [],
      initializeProjects: () => {
        const state = get();
        // Always refresh sections to ensure Life section is included
        set({ sections: initialSections });
        // Flatten all items into projects array for backward compatibility
        const allProjects = initialSections.flatMap((section) =>
          section.blocks.flatMap((block) => block.items)
        );
        set({ projects: allProjects });
        console.log('Projects initialized:', {
          sections: initialSections.length,
          lifeSection: initialSections.find(s => s.id === 'life'),
          totalProjects: allProjects.length
        });
      },
      addProject: (project) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              ...project,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'batman-cave-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

