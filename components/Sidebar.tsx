'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const projects = useStore(s => s.projects);
  const activeProjectId = useStore(s => s.activeProjectId);
  const createProject = useStore(s => s.createProject);
  const deleteProject = useStore(s => s.deleteProject);
  const setActiveProject = useStore(s => s.setActiveProject);

  const suites = useStore(s => s.suites);
  const activeSuiteId = useStore(s => s.activeSuiteId);
  const createSuite = useStore(s => s.createSuite);
  const deleteSuite = useStore(s => s.deleteSuite);
  const setActiveSuite = useStore(s => s.setActiveSuite);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateSuite, setShowCreateSuite] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [suiteName, setSuiteName] = useState('');
  const [suiteDesc, setSuiteDesc] = useState('');

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createProject(projectName.trim(), projectDesc.trim());
    setProjectName(''); setProjectDesc('');
    setShowCreateProject(false);
  };

  const handleCreateSuite = () => {
    if (!suiteName.trim() || !activeProjectId) return;
    createSuite(suiteName.trim(), suiteDesc.trim(), activeProjectId);
    setSuiteName(''); setSuiteDesc('');
    setShowCreateSuite(false);
  };

  return (
    <>
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="p-3 border-b border-slate-200">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Projects</p>
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => setShowCreateProject(true)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New project
          </Button>
        </div>

        {/* Projects + Suites tree */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projects.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6 px-2">No projects yet.</p>
          )}
          {projects.map(project => (
            <div key={project.id}>
              {/* Project row */}
              <div
                className={cn(
                  'group flex items-center gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                  project.id === activeProjectId
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-white text-slate-600 hover:text-slate-800'
                )}
                onClick={() => setActiveProject(project.id)}
              >
                <span className="text-sm">📁</span>
                <span className="flex-1 text-xs font-semibold truncate">{project.name}</span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setActiveProject(project.id)
                    setShowCreateSuite(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-indigo-100 text-indigo-400"
                  title="Add suite"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); if (confirm(`Delete "${project.name}"?`)) deleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M9 2L2 9M2 2l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Suites inside project */}
              {project.id === activeProjectId && (
                <div className="ml-4 space-y-0.5 mt-0.5">
                  {suites.filter(s => s.projectId === project.id).map(suite => (
                    <div
                      key={suite.id}
                      className={cn(
                        'group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors',
                        suite.id === activeSuiteId
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-white text-slate-600 hover:text-slate-800'
                      )}
                      onClick={() => setActiveSuite(suite.id)}
                    >
                      <span className="text-xs">🧪</span>
                      <span className="flex-1 text-xs font-medium truncate">{suite.name}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full shrink-0',
                        suite.id === activeSuiteId
                          ? 'bg-indigo-500 text-indigo-100'
                          : 'bg-slate-200 text-slate-500'
                      )}>
                        {suite.testCases.length}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm(`Delete "${suite.name}"?`)) deleteSuite(suite.id); }}
                        className={cn(
                          'opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all',
                          suite.id === activeSuiteId
                            ? 'hover:bg-indigo-500 text-indigo-200'
                            : 'hover:bg-red-100 text-slate-400 hover:text-red-500'
                        )}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M9 2L2 9M2 2l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  {suites.filter(s => s.projectId === project.id).length === 0 && (
                    <p className="text-[10px] text-slate-400 px-2 py-1">No suites yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Create Project Modal */}
      <Modal open={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Project name *</label>
            <input
              autoFocus
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              placeholder="e.g. Banking App"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              value={projectDesc}
              onChange={e => setProjectDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateProject(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateProject} disabled={!projectName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Create Suite Modal */}
      <Modal open={showCreateSuite} onClose={() => setShowCreateSuite(false)} title="New Test Suite">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Suite name *</label>
            <input
              autoFocus
              value={suiteName}
              onChange={e => setSuiteName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateSuite()}
              placeholder="e.g. Login Tests"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              value={suiteDesc}
              onChange={e => setSuiteDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateSuite(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateSuite} disabled={!suiteName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}