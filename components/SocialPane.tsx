'use client';

import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useProjectStore } from '@/store/projectStore';

interface Person {
  id: string;
  name: string;
  avatar?: string;
  summary: string;
  githubUsername?: string;
  githubActivity?: number[]; // Array of 365 days (0-4 commits per day)
  caveUrl?: string;
  projectIds?: string[]; // IDs of projects they're engaging with
}

interface SocialPaneProps {
  people: Person[];
}

// Fibonacci sequence helper for grouping
function fibonacciGroups<T>(items: T[]): T[][] {
  const groups: T[][] = [];
  let fib1 = 1, fib2 = 1;
  let index = 0;
  
  while (index < items.length) {
    const groupSize = fib1;
    groups.push(items.slice(index, index + groupSize));
    index += groupSize;
    
    // Next Fibonacci number
    const nextFib = fib1 + fib2;
    fib1 = fib2;
    fib2 = nextFib;
  }
  
  return groups;
}

export default function SocialPane({ people }: SocialPaneProps) {
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sections = useProjectStore((state) => state.sections);
  const projects = useProjectStore((state) => state.projects);
  
  // Sort people into Fibonacci sets
  const groups = fibonacciGroups(people);
  
  // Get all projects from all blocks
  const allProjects = sections?.flatMap((section) => 
    section?.blocks?.flatMap((block) => block.items || []) || []
  ) || [];
  
  const handleMouseEnter = (personId: string, event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Position popup to the left of the icon, centered vertically
    setPopupPosition({
      x: rect.left - 300, // 300px to the left (popup width + margin)
      y: rect.top + rect.height / 2, // Center vertically
    });
    setHoveredPerson(personId);
  };
  
  const handleMouseLeave = () => {
    setHoveredPerson(null);
    setPopupPosition(null);
  };
  
  const hoveredPersonData = people.find(p => p.id === hoveredPerson);
  
  // Get projects this person is engaging with
  const personProjects = hoveredPersonData?.projectIds 
    ? allProjects.filter(p => hoveredPersonData.projectIds?.includes(p.id))
    : [];
  
  return (
    <>
      <div className={`absolute top-0 bottom-0 pointer-events-auto z-50 flex items-center transition-all duration-300 ${
        isHovered ? 'right-0 w-80' : '-right-12 w-20'
      }`}>
        <div 
          className={`bg-black/90 backdrop-blur-sm flex flex-col overflow-y-auto overflow-x-visible relative transition-all duration-300 ${
            isHovered ? 'w-full p-6' : 'w-full p-4'
          }`}
          onMouseEnter={() => {
            setIsHovered(true);
            setShowHelp(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setShowHelp(false);
          }}
        >
          {/* Green gradient accent effect - left edge - spans full container height */}
          <div className="absolute top-0 left-0 bottom-0 w-1 opacity-90" style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 15%, rgba(34, 197, 94, 0.4) 35%, rgba(34, 197, 94, 0.9) 50%, rgba(34, 197, 94, 0.4) 65%, transparent 85%, transparent 100%)'
          }}></div>
          <div className="absolute top-0 left-0 bottom-0 w-0.5 blur-sm opacity-60" style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(74, 222, 128, 0.3) 40%, rgba(74, 222, 128, 0.7) 50%, rgba(74, 222, 128, 0.3) 60%, transparent 80%, transparent 100%)'
          }}></div>
          <div className="absolute top-0 left-0 bottom-0 w-0.5 blur-md opacity-40" style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(22, 163, 74, 0.2) 40%, rgba(22, 163, 74, 0.5) 50%, rgba(22, 163, 74, 0.2) 60%, transparent 75%, transparent 100%)'
          }}></div>
          
          <div className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">
            Loukyam
          </div>
          
          {/* People in Fibonacci sets - vertical layout - only show when hovered */}
          {isHovered && (
            <>
              {groups.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {groups.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex gap-2 justify-start flex-wrap">
                      {group.map((person) => (
                        <div
                          key={person.id}
                          className="relative"
                          onMouseEnter={(e) => handleMouseEnter(person.id, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {/* Person Icon */}
                          <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 hover:border-white transition-all cursor-pointer flex items-center justify-center overflow-hidden">
                            {person.avatar ? (
                              <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-semibold text-gray-400">
                                {person.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-4">
                  No people yet. Add supporters in the config panel.
                </div>
              )}
            </>
          )}
          
        </div>
      </div>
      
      {/* Help text - appears on hover */}
      {showHelp && (
        <div className="absolute right-[340px] top-1/2 -translate-y-1/2 pointer-events-auto z-[60] animate-fadeIn">
          <div className="w-64 rounded-lg p-[1px]"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(255, 255, 255, 0.6), rgba(74, 222, 128, 0.8))',
            }}
          >
            <div className="bg-black/95 backdrop-blur-sm rounded-lg p-4 shadow-xl text-xs text-gray-300">
              33 core supporters working together with you and are assisting you with your dreams n vice versa. feel free to add more. This is the social plane.
            </div>
          </div>
        </div>
      )}
      
      {/* Popup - positioned outside pane, fixed to viewport */}
      {hoveredPerson && hoveredPersonData && popupPosition && (
        <div
          className="fixed w-72 bg-black/95 backdrop-blur-sm rounded-lg p-4 shadow-xl z-[60] animate-fadeIn pointer-events-auto relative"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateY(-50%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
          onMouseEnter={() => setHoveredPerson(hoveredPerson)}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-lg" style={{
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(255, 255, 255, 0.4), rgba(74, 222, 128, 0.6))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}></div>
          <div className="relative z-10">
          <div className="flex items-start gap-3 mb-3">
            {hoveredPersonData.avatar ? (
              <img src={hoveredPersonData.avatar} alt={hoveredPersonData.name} className="w-16 h-16 rounded-full border-2 border-white" />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-white bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-400">
                  {hoveredPersonData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{hoveredPersonData.name}</h3>
              <p className="text-xs text-gray-400 mb-2">{hoveredPersonData.summary}</p>
            </div>
          </div>
          
          {/* Projects they're engaging with */}
          {personProjects.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2">Engaging with:</div>
              <div className="flex flex-wrap gap-1">
                {personProjects.map((project) => {
                  const projectData = projects?.find(p => p.id === project.id);
                  const hasConfig = projectData?.vmUrl || projectData?.screenId;
                  return (
                    <div
                      key={project.id}
                      className={`px-2 py-1 rounded text-xs ${
                        hasConfig
                          ? 'bg-white/20 border border-white text-white'
                          : 'bg-gray-800 border border-gray-700 text-gray-400'
                      }`}
                    >
                      {project.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* GitHub Activity */}
          {hoveredPersonData.githubUsername && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2">GitHub Activity</div>
              <div className="flex gap-1 flex-wrap">
                {hoveredPersonData.githubActivity?.slice(-365).map((commits, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-2 h-2 rounded ${
                      commits === 0 ? 'bg-gray-800' :
                      commits === 1 ? 'bg-green-600' :
                      commits === 2 ? 'bg-green-500' :
                      commits === 3 ? 'bg-green-400' :
                      'bg-green-300'
                    }`}
                    title={`${commits} commits`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            {hoveredPersonData.caveUrl && (
              <a
                href={hoveredPersonData.caveUrl}
                className="flex-1 px-3 py-2 bg-white hover:bg-gray-200 text-black rounded text-sm font-medium text-center transition-colors"
              >
                Go to Cave
              </a>
            )}
            {hoveredPersonData.githubUsername && (
              <a
                href={`https://github.com/${hoveredPersonData.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-white text-center transition-colors"
              >
                GitHub
              </a>
            )}
          </div>
          </div>
        </div>
      )}
    </>
  );
}

