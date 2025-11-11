'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';

interface ConfigPanelProps {
  onClose: () => void;
}

export default function ConfigPanel({ onClose }: ConfigPanelProps) {
  const { projects, sections, updateProject, initializeProjects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vmUrl: '',
    screenId: 1,
  });

  useEffect(() => {
    initializeProjects();
    console.log('ConfigPanel: Initialized projects', { sectionsCount: sections.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project) {
        setFormData({
          vmUrl: project.vmUrl || '',
          screenId: project.screenId || 1,
        });
      }
    }
  }, [selectedProjectId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedProjectId) {
      updateProject(selectedProjectId, formData);
      setSelectedProjectId(null);
      setFormData({ vmUrl: '', screenId: 1 });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId === selectedProjectId ? null : projectId);
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  // Debug: Log sections when they change
  useEffect(() => {
    console.log('ConfigPanel sections:', sections);
    console.log('Life section:', sections.find(s => s.id === 'life'));
  }, [sections]);

  return (
    <div 
      className="bg-black/95 backdrop-blur-sm border-t-2 border-green-500 max-h-[50vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="max-w-7xl mx-auto p-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-green-400">Float Panel - Configure VM Screens</h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Project Selection - Compact */}
          <div className="col-span-2">
            <h3 className="text-xs font-semibold text-green-400 mb-2">Select Project</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto scrollbar-hide">
              {sections && sections.length > 0 ? (
                sections.map((section) => (
                  <div key={section.id} className="mb-3">
                    <div className="text-sm font-bold text-purple-400 mb-2 border-b border-purple-500 pb-1">
                      {section.name}
                    </div>
                    {section.blocks && section.blocks.length > 0 ? (
                      section.blocks.map((block) => (
                        <div key={block.id} className="mb-2 ml-2">
                          <div className="text-xs font-semibold text-blue-300 mb-1">{block.name}</div>
                          <div className="flex flex-wrap gap-1">
                            {block.items && block.items.length > 0 ? (
                              block.items.map((item) => {
                                const project = getProject(item.id);
                                const isSelected = selectedProjectId === item.id;
                                const hasConfig = project?.vmUrl || project?.screenId;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProjectSelect(item.id);
                                    }}
                                    className={`px-2 py-1 rounded text-xs transition-colors ${
                                      isSelected
                                        ? 'bg-green-600 text-white'
                                        : hasConfig
                                        ? 'bg-gray-700 text-green-400 border border-green-500'
                                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
                                    }`}
                                  >
                                    {item.name}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="text-xs text-gray-500 italic px-2 py-1 border border-gray-700 rounded">
                                No projects yet
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 italic ml-2">No blocks</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-400 text-sm py-4">
                  No sections available. Click Configure to initialize.
                </div>
              )}
            </div>
          </div>

          {/* Configuration Form */}
          <div>
            <h3 className="text-xs font-semibold text-green-400 mb-2">Assign VM & Screen</h3>
            {selectedProjectId ? (
              <form onSubmit={handleSubmit} className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Project
                  </label>
                  <div className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs">
                    {getProject(selectedProjectId)?.name || 'Unknown'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    VM Desktop URL
                  </label>
                  <input
                    type="url"
                    value={formData.vmUrl}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, vmUrl: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:border-green-500 focus:outline-none"
                    placeholder="https://your-vm-url.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Screen (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.screenId}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, screenId: parseInt(e.target.value) || 1 });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-semibold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(null);
                      setFormData({ vmUrl: '', screenId: 1 });
                    }}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-gray-400 text-xs text-center py-6">
                Select a project
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

