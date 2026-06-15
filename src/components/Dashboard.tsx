import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, setDoc, deleteDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, BoardPage, BackgroundMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, LogOut, Loader2, AlertCircle, GitFork, Star, MoreVertical, List, Grid2x2, LayoutGrid, ChevronDown, Edit2, Check, X, FileText, Folder, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: any;
  onSelectProject: (project: Project) => void;
  onLogout: () => void;
}

export function Dashboard({ user, onSelectProject, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Interactive OS tabs & layout modes state
  const [activeTab, setActiveTab] = useState<'docs' | 'collections' | 'tags'>('docs');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detailed_grid'>('detailed_grid');
  const [isDisplaySortMenuOpen, setIsDisplaySortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'name'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterFavorites, setFilterFavorites] = useState(false);

  // States for interactive UI custom actions
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectCollection, setEditProjectCollection] = useState('');
  const [editProjectTagsString, setEditProjectTagsString] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const list: Project[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const autoTags = data.tags || (data.name?.toLowerCase().includes('sat') ? ['sat', 'math'] : ['inkwell', 'sketch']);
        const autoCollection = data.collection || (data.name?.toLowerCase().includes('sat') ? 'Syllabus Plan' : 'General Workspace');

        list.push({
          id: docSnap.id,
          name: data.name,
          userId: data.userId,
          pages: data.pages || [],
          currentPageId: data.currentPageId || 'page-1',
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
          tags: autoTags,
          collection: autoCollection,
        });
      });
      setProjects(list);
    } catch (err: any) {
      console.error("Error reading projects:", err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'projects');
      } catch (mappedError: any) {
        setError("Could not retrieve boards. Please check your storage rules or network.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user.uid]);

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const initialPages: BoardPage[] = [
        {
          id: 'page-1',
          name: 'Page 1',
          data: null,
          backgroundMode: BackgroundMode.Plain,
        }
      ];

      const newDocRef = doc(collection(db, 'projects'));
      await setDoc(newDocRef, {
        id: newDocRef.id,
        name: newProjectName.trim(),
        userId: user.uid,
        pages: initialPages,
        currentPageId: 'page-1',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newProj: Project = {
        id: newDocRef.id,
        name: newProjectName.trim(),
        userId: user.uid,
        pages: initialPages,
        currentPageId: 'page-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setNewProjectName('');
      setShowCreateInput(false);
      onSelectProject(newProj);
    } catch (err: any) {
      console.error("Error creating project:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'projects');
      } catch (mappedErr: any) {
        setError("Error creating new blackboard document. Try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;

    setError(null);
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setActiveMenuId(null);
    } catch (err: any) {
      console.error("Error deleting project:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
      } catch (mappedErr: any) {
        setError("Unable to delete blackboard project.");
      }
    }
  };

  const handleUpdateProjectMetadata = async (projectId: string) => {
    if (!editProjectName.trim()) return;
    setSavingEdit(true);
    setError(null);
    try {
      const parsedTags = editProjectTagsString
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const collName = editProjectCollection.trim() || 'General Workspace';

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        name: editProjectName.trim(),
        collection: collName,
        tags: parsedTags,
        updatedAt: serverTimestamp(),
      });
      setProjects(prev => prev.map(p => p.id === projectId ? { 
        ...p, 
        name: editProjectName.trim(),
        collection: collName,
        tags: parsedTags,
        updatedAt: Date.now() 
      } : p));
      setEditingProjectId(null);
      setEditProjectName('');
      setEditProjectCollection('');
      setEditProjectTagsString('');
      setActiveMenuId(null);
    } catch (err: any) {
      console.error("Error updating project details:", err);
      setError("Failed to update project details.");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleFavorite = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Derived state: collections count
  const collectionsCount = projects.reduce((acc, p) => {
    const col = p.collection || 'General Workspace';
    acc[col] = (acc[col] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Derived state: tags count
  const tagsCount = projects.reduce((acc, p) => {
    const projectTags = p.tags || [];
    projectTags.forEach(t => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Derived filtered & sorted projects
  const filteredAndSortedProjects = projects
    .filter(p => !filterFavorites || favorites[p.id])
    .filter(p => {
      if (activeTab === 'collections' && selectedCollection) {
        return (p.collection || 'General Workspace').toLowerCase() === selectedCollection.toLowerCase();
      }
      if (activeTab === 'tags' && selectedTag) {
        return p.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase()) || false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt - b.createdAt;
      } else {
        comparison = a.updatedAt - b.updatedAt;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  return (
    <div className="min-h-screen bg-[#070708] text-[#D1D1D3] font-sans flex flex-col overflow-y-auto no-scrollbar pb-16 relative">
      
      {/* Precision Header Layout (Referenced to image top bar) */}
      <header className="border-b border-[#18181B] bg-[#070708] h-14 flex items-center justify-between px-8 z-20 shrink-0">
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 font-medium text-xs">
            <button 
              onClick={() => { setActiveTab('docs'); setSelectedCollection(null); setSelectedTag(null); }}
              className={cn("transition-all font-semibold uppercase tracking-wider", activeTab === 'docs' ? "text-white" : "text-gray-500 hover:text-gray-300")}
            >
              Docs
            </button>
            <button 
              onClick={() => { setActiveTab('collections'); setSelectedCollection(null); setSelectedTag(null); }}
              className={cn("transition-all font-semibold uppercase tracking-wider", activeTab === 'collections' ? "text-white" : "text-gray-500 hover:text-gray-300")}
            >
              Collections
            </button>
            <button 
              onClick={() => { setActiveTab('tags'); setSelectedCollection(null); setSelectedTag(null); }}
              className={cn("transition-all font-semibold uppercase tracking-wider", activeTab === 'tags' ? "text-white" : "text-gray-500 hover:text-gray-300")}
            >
              Tags
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Controls bar layout switch buttons */}
          <div className="flex items-center gap-2 text-gray-400">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1 transition-colors", viewMode === 'grid' ? "text-white" : "text-gray-500 hover:text-white")} 
              title="Grid Layout"
            >
              <Grid2x2 size={13} />
            </button>
            <button 
              onClick={() => setViewMode('detailed_grid')}
              className={cn("p-1 transition-colors", viewMode === 'detailed_grid' ? "text-white" : "text-gray-500 hover:text-white")} 
              title="Detailed Grid"
            >
              <LayoutGrid size={13} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1 transition-colors", viewMode === 'list' ? "text-white" : "text-gray-500 hover:text-white")} 
              title="List Layout"
            >
              <List size={13} />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-gray-805 bg-zinc-800" />

          {/* Display Controller Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsDisplaySortMenuOpen(!isDisplaySortMenuOpen)}
              className={cn(
                "px-3 py-1 bg-[#121214] border border-[#27272A] hover:border-gray-700 hover:bg-[#18181C] text-gray-300 text-[11px] font-medium rounded-none flex items-center gap-1.5 transition-all select-none",
                isDisplaySortMenuOpen && "border-white text-white bg-[#18181C]"
              )}
            >
              <span>Display</span>
              <ChevronDown size={11} className={cn("transition-transform duration-200 mt-0.5", isDisplaySortMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isDisplaySortMenuOpen && (
                <motion.div
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 5, opacity: 0 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-zinc-950 border border-zinc-805 border-white/15 shadow-2xl p-2.5 z-50 flex flex-col gap-2 rounded"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase px-1">Sort by</span>
                    <div className="flex flex-col gap-0.5">
                      {[
                        { value: 'updatedAt', label: 'Last updated' },
                        { value: 'createdAt', label: 'Date created' },
                        { value: 'name', label: 'Alphabetical' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value as any)}
                          className={cn(
                            "flex items-center justify-between px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wider transition-colors rounded-sm",
                            sortBy === opt.value ? "bg-white text-black font-extrabold" : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.value && <Check size={10} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/10 my-0.5" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase px-1">Ordering</span>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={cn(
                          "py-0.5 text-[8px] font-bold uppercase rounded-sm text-center transition-colors border",
                          sortOrder === 'desc' ? "bg-white text-black border-white" : "border-white/5 text-gray-500 hover:text-white"
                        )}
                      >
                        Recent
                      </button>
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={cn(
                          "py-0.5 text-[8px] font-bold uppercase rounded-sm text-center transition-colors border",
                          sortOrder === 'asc' ? "bg-white text-black border-white" : "border-white/5 text-gray-500 hover:text-white"
                        )}
                      >
                        Oldest
                      </button>
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/10 my-0.5" />

                  <button
                    onClick={() => setFilterFavorites(!filterFavorites)}
                    className={cn(
                      "flex items-center justify-between px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wider transition-colors rounded-sm border",
                      filterFavorites ? "border-blue-500/35 bg-blue-500/10 text-blue-400" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>Starred Only</span>
                    <Star size={10} className={cn("transition-colors", filterFavorites ? "fill-blue-500 text-blue-500" : "")} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Create Button styled precisely as 'New doc v' */}
          <button
            onClick={() => setShowCreateInput(!showCreateInput)}
            className="px-3 py-1 bg-white hover:bg-white/90 text-black text-[11px] font-semibold rounded-none flex items-center gap-1 transition-all active:scale-95"
          >
            <span>New board</span>
            <ChevronDown size={11} className="pt-0.5" />
          </button>

          <div className="h-4 w-[1px] bg-gray-800" />

          {/* Rounded Google Photo User Integration & Logout */}
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                referrerPolicy="no-referrer" 
                className="w-6 h-6 rounded-full border border-[#27272A]" 
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            
            <button
              onClick={onLogout}
              className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-none transition-all active:scale-95"
              title="Sign Out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Container View */}
      <main className="max-w-6xl w-full mx-auto px-8 py-8 flex-1 flex flex-col">
        
        {/* Secondary Filter Navigation Row */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-0.5 bg-[#1C1C1F] text-white text-[10px] font-semibold uppercase tracking-wider rounded-none select-none">
              {activeTab === 'docs' ? 'All boards' : activeTab === 'collections' ? (selectedCollection ? `Collection: ${selectedCollection}` : 'Collections') : (selectedTag ? `Tag: #${selectedTag}` : 'Tags')}
            </button>
            
            {(selectedCollection || selectedTag) && (
              <button 
                onClick={() => { setSelectedCollection(null); setSelectedTag(null); }}
                className="px-2.5 py-0.5 hover:bg-[#1C1C1F] text-gray-400 hover:text-white text-[10px] font-semibold transition-colors border border-[#27272A]"
              >
                &larr; Back
              </button>
            )}

            {activeTab === 'docs' && (
              <button 
                onClick={() => setShowCreateInput(!showCreateInput)}
                className="p-1 bg-transparent hover:bg-[#121214] text-gray-500 hover:text-white transition-colors rounded-none"
                title="Create New Board"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          <div className="text-[10px] text-gray-500 font-mono">
            {filteredAndSortedProjects.length} Board{filteredAndSortedProjects.length !== 1 ? 's' : ''} Syncing
          </div>
        </div>

        {/* Global Firestore Error notification */}
        {error && (
          <div className="p-3 mb-6 bg-red-500/5 border border-red-500/20 text-red-500 font-mono text-xs rounded-none flex items-center gap-3">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Inline Board Title creation input block (Inserts at the top) */}
        <AnimatePresence>
          {showCreateInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border border-dashed border-[#27272A] bg-[#0E0E10] px-4 py-3 mb-6 relative group"
            >
              <form onSubmit={handleCreateProjectSubmit} className="flex items-center gap-4">
                <GitFork size={14} className="text-gray-500 animate-pulse shrink-0" />
                <input
                  type="text"
                  placeholder="Board Name (e.g., Physics Notes)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  maxLength={40}
                  required
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs font-semibold text-white placeholder-gray-600 uppercase tracking-wide"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    disabled={creating || !newProjectName.trim()}
                    className="p-1 bg-white hover:bg-white/90 disabled:opacity-50 text-black rounded-none flex items-center justify-center transition-all"
                    title="Confirm Board Creation"
                  >
                    {creating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProjectName('');
                      setShowCreateInput(false);
                    }}
                    className="p-1 bg-[#1E1E22] hover:bg-red-500/20 text-gray-400 hover:text-white rounded-none transition-all"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Project/Board List Rows */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-32 gap-3 text-gray-500">
              <Loader2 size={20} className="animate-spin text-white" />
              <p className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Retrieving system database...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-32 gap-3 border border-dashed border-[#18181B] rounded-none">
              <FileText size={24} className="text-gray-700" />
              <p className="text-[11px] font-semibold text-gray-500 tracking-wide text-center">
                No boards found. Click "New board" to customize your space.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              
              {/* Category Tab Specific Sub-renders */}
              {activeTab === 'collections' && !selectedCollection && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {Object.entries(collectionsCount).map(([colName, count]) => (
                    <div
                      key={colName}
                      onClick={() => setSelectedCollection(colName)}
                      className="bg-zinc-950/40 hover:bg-zinc-900/40 border border-white/5 hover:border-white/10 p-5 rounded-none flex items-center justify-between cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                          <Folder size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-wider uppercase">{colName}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 font-mono">{count} board{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <ChevronDown size={14} className="text-gray-650 -rotate-90 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tags' && !selectedTag && (
                <div className="flex flex-wrap gap-2.5 mb-8">
                  {Object.entries(tagsCount).map(([tagName, count]) => (
                    <button
                      key={tagName}
                      onClick={() => setSelectedTag(tagName)}
                      className="px-4 py-2 bg-zinc-950/50 hover:bg-zinc-900 border border-white/5 hover:border-white/15 transition-all text-gray-300 hover:text-white flex items-center gap-2 rounded-full relative group shadow-sm text-xs font-semibold"
                    >
                      <Tag size={10} className="text-gray-500 group-hover:text-white transition-colors" />
                      <span className="uppercase tracking-wider">#{tagName}</span>
                      <span className="px-1.5 py-0.5 bg-white/5 text-gray-505 text-zinc-500 text-[9px] rounded-full group-hover:bg-white/10 group-hover:text-zinc-300 transition-colors font-mono">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Header category name */}
              {(!selectedCollection && activeTab === 'collections') || (!selectedTag && activeTab === 'tags') ? null : (
                <>
                  {/* Group Category Header representing 'Boards List' */}
                  <div className="text-[11px] font-semibold text-gray-400 gap-2 mb-4 hover:text-white flex items-center select-none uppercase tracking-widest">
                    <span>{selectedCollection || (selectedTag ? `#${selectedTag}` : 'Recent Projects')}</span>
                    <span className="text-gray-600">&#183;</span>
                    <span className="text-gray-550 font-semibold">{filteredAndSortedProjects.length}</span>
                  </div>

                  {/* Layout Option 1: Detailed Blueprint Grid */}
                  {viewMode === 'detailed_grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {filteredAndSortedProjects.map((project) => {
                        const defaultBG = project.pages?.[0]?.backgroundMode || 'plain';
                        return (
                          <div
                            key={project.id}
                            onClick={() => {
                              if (editingProjectId !== project.id) {
                                onSelectProject(project);
                              }
                            }}
                            className="group bg-[#0C0C0E]/65 hover:bg-[#101013]/90 border border-white/5 hover:border-white/10 flex flex-col justify-between transition-all duration-300 relative rounded-sm cursor-pointer overflow-hidden transform hover:-translate-y-1"
                          >
                            {/* Decorative Canvas representation */}
                            <div className="w-full aspect-[16/10] bg-black border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                              {defaultBG === 'grid' && (
                                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                              )}
                              {defaultBG === 'lines' && (
                                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:1px_12px]" />
                              )}

                              {/* Minimalist Vector Sketch representation */}
                              <svg className="w-32 h-20 opacity-40 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500 text-gray-400" viewBox="0 0 100 60" fill="none">
                                <circle cx="50" cy="30" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray={defaultBG === 'grid' ? "2 2" : ""} />
                                <rect x="25" y="15" width="20" height="15" stroke="currentColor" strokeWidth="1" />
                                <path d="M40,40 L65,45 M65,45 L62,38 M65,45 L58,45" stroke="currentColor" strokeWidth="1" />
                              </svg>

                              <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/80 border border-white/10 text-[8px] font-mono tracking-widest uppercase text-white/50 rounded-sm">
                                {defaultBG} paper
                              </div>
                            </div>

                            <div className="p-4 flex flex-col justify-between flex-1">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] tracking-wider text-neutral-500 uppercase font-semibold">
                                    {project.collection || 'General Workspace'}
                                  </span>
                                  
                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => toggleFavorite(project.id, e)}
                                      className={`p-1 hover:scale-115 transition-all ${favorites[project.id] ? 'text-blue-500 fill-blue-500' : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                      <Star size={12} className={favorites[project.id] ? 'fill-blue-500 text-blue-500' : ''} />
                                    </button>
                                    <button
                                      onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                                      className="p-1 hover:text-white text-gray-600 transition-colors"
                                    >
                                      <MoreVertical size={12} />
                                    </button>
                                  </div>
                                </div>

                                {editingProjectId === project.id ? (
                                  <div className="flex flex-col gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={editProjectName}
                                      onChange={e => setEditProjectName(e.target.value)}
                                      className="bg-[#121214] border border-[#27272A] w-full px-2 py-1 text-xs text-white uppercase focus:outline-none"
                                      placeholder="Title"
                                    />
                                    <input
                                      type="text"
                                      value={editProjectCollection}
                                      onChange={e => setEditProjectCollection(e.target.value)}
                                      className="bg-[#121214] border border-[#27272A] w-full px-2 py-1 text-xs text-white uppercase focus:outline-none"
                                      placeholder="Collection"
                                    />
                                    <input
                                      type="text"
                                      value={editProjectTagsString}
                                      onChange={e => setEditProjectTagsString(e.target.value)}
                                      className="bg-[#121214] border border-[#27272A] w-full px-2 py-1 text-xs text-white uppercase focus:outline-none"
                                      placeholder="Tags (comma-separated)"
                                    />
                                    <div className="flex gap-1.5 mt-1 justify-end">
                                      <button
                                        onClick={() => handleUpdateProjectMetadata(project.id)}
                                        className="text-[9px] bg-white text-black px-2.5 py-1 font-bold uppercase transition-colors"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingProjectId(null)}
                                        className="text-[9px] bg-zinc-800 text-gray-300 px-2.5 py-1 font-bold uppercase transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <h3 className="text-xs font-bold text-white tracking-wide uppercase leading-tight group-hover:text-white transition-colors truncate">
                                    {project.name}
                                  </h3>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-mono">
                                <span>Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: false })} ago</span>
                                <span className="text-[9.5px] text-zinc-400">{project.pages?.length || 1} pages</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Layout Option 2: Clean Bento Square Grid */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {filteredAndSortedProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => {
                            if (editingProjectId !== project.id) {
                              onSelectProject(project);
                            }
                          }}
                          className="group bg-zinc-950/30 hover:bg-[#0C0C0E]/90 border border-white/5 hover:border-white/15 p-5 flex flex-col justify-between transition-all duration-300 relative rounded-sm cursor-pointer hover:-translate-y-1"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-gray-550 group-hover:text-white transition-colors shrink-0">
                                <GitFork size={14} className="rotate-90" />
                              </div>
                              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={(e) => toggleFavorite(project.id, e)}
                                  className={`p-1 hover:scale-115 transition-all ${favorites[project.id] ? 'text-blue-500 fill-blue-500' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                  <Star size={13} className={favorites[project.id] ? 'fill-blue-500 text-blue-500' : ''} />
                                </button>
                                
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                                  className="p-1 hover:text-white text-gray-600 transition-colors"
                                >
                                  <MoreVertical size={13} />
                                </button>
                                {/* popover dropdown */}
                                {activeMenuId === project.id && (
                                  <div className="absolute right-3 top-10 w-28 bg-[#121214] border border-[#27272A] shadow-2xl z-35 rounded-none flex flex-col py-1 overflow-hidden" ref={menuRef}>
                                    <button
                                      onClick={() => {
                                        setEditingProjectId(project.id);
                                        setEditProjectName(project.name);
                                        setEditProjectCollection(project.collection || 'General Workspace');
                                        setEditProjectTagsString(project.tags?.join(', ') || '');
                                        setActiveMenuId(null);
                                      }}
                                      className="px-3 py-1.5 hover:bg-white/10 hover:text-white text-[10px] font-semibold text-left transition-colors uppercase flex items-center gap-1.5"
                                    >
                                      <Edit2 size={10} />
                                      Edit Details
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProject(project.id)}
                                      className="px-3 py-1.5 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-semibold text-left transition-colors uppercase flex items-center gap-1.5"
                                    >
                                      <Trash2 size={10} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {editingProjectId === project.id ? (
                              <div className="flex flex-col gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editProjectName}
                                  onChange={e => setEditProjectName(e.target.value)}
                                  className="bg-[#121214] border border-[#27272A] w-full px-2 py-1 text-xs text-white uppercase focus:outline-none"
                                  placeholder="Title"
                                />
                                <input
                                  type="text"
                                  value={editProjectCollection}
                                  onChange={e => setEditProjectCollection(e.target.value)}
                                  className="bg-[#121214] border border-[#27272A] w-full px-2 py-1 text-xs text-white uppercase focus:outline-none"
                                  placeholder="Collection"
                                />
                                <input
                                  type="text"
                                  value={editProjectTagsString}
                                  onChange={e => setEditProjectTagsString(e.target.value)}
                                  className="bg-[#121214] border border-[#27272A] w-full px-2 py-1 text-xs text-white uppercase focus:outline-none"
                                  placeholder="Tags (comma-separated)"
                                />
                                <div className="flex gap-1.5 mt-1 justify-end">
                                  <button
                                    onClick={() => handleUpdateProjectMetadata(project.id)}
                                    className="text-[9px] bg-white text-black px-2.5 py-1 font-bold uppercase transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingProjectId(null)}
                                    className="text-[9px] bg-zinc-800 text-gray-350 px-2.5 py-1 font-bold uppercase transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-xs font-bold text-white tracking-wide uppercase leading-tight group-hover:text-white transition-colors truncate">
                                  {project.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[8px] tracking-widest text-zinc-500 bg-white/5 uppercase px-2 py-0.5 rounded-full inline-block font-sans select-none">
                                    {project.collection || 'General Workspace'}
                                  </span>
                                </div>
                              </div>
                            )}

                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-3 leading-relaxed font-normal">
                              Active board with {project.pages?.length || 1} paper pages. Syncing live in your sandbox.
                            </p>
                          </div>

                          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                            <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: false })} ago</span>
                            <div className="flex gap-1">
                              {project.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] text-[#A855F7] lowercase">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Layout Option 3: Standard Directory List Rows */}
                  {viewMode === 'list' && (
                    <div className="flex flex-col border-t border-[#121214] divide-y divide-[#121214]">
                      {filteredAndSortedProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => {
                            if (editingProjectId !== project.id) {
                              onSelectProject(project);
                            }
                          }}
                          className="group bg-transparent hover:bg-[#0C0C0E] py-3.5 px-2 flex items-center justify-between transition-all cursor-pointer relative"
                        >
                          
                          {/* Left Column Section: Icon & Full details */}
                          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            {/* Drawing Structural Icon */}
                            <div className="text-gray-500 group-hover:text-white transition-colors shrink-0">
                              <GitFork size={14} className="rotate-90" />
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                {editingProjectId === project.id ? (
                                  <div className="flex flex-col gap-2 p-3 bg-[#0E0E10] border border-white/10 rounded w-full max-w-md my-2" onClick={e => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] text-gray-500 font-mono">Board Name:</span>
                                      <input
                                        type="text"
                                        value={editProjectName}
                                        onChange={e => setEditProjectName(e.target.value)}
                                        className="bg-[#121214] border border-[#27272A] px-2.5 py-1 text-xs text-white focus:outline-none uppercase tracking-wide rounded-none"
                                        maxLength={40}
                                        required
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] text-gray-500 font-mono">Collection Name:</span>
                                      <input
                                        type="text"
                                        value={editProjectCollection}
                                        onChange={e => setEditProjectCollection(e.target.value)}
                                        className="bg-[#121214] border border-[#27272A] px-2.5 py-1 text-xs text-white focus:outline-none uppercase tracking-wide rounded-none"
                                        placeholder="Collection"
                                        maxLength={25}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] text-gray-500 font-mono">Tags (comma-separated):</span>
                                      <input
                                        type="text"
                                        value={editProjectTagsString}
                                        onChange={e => setEditProjectTagsString(e.target.value)}
                                        className="bg-[#121214] border border-[#27272A] px-2.5 py-1 text-xs text-white focus:outline-none uppercase tracking-wide rounded-none"
                                        placeholder="Tags (comma-separated)"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-1.5 mt-1">
                                      <button
                                        onClick={() => handleUpdateProjectMetadata(project.id)}
                                        className="flex items-center gap-1 px-3 py-1 bg-white text-black text-[10px] uppercase font-bold hover:bg-neutral-200 transition-colors"
                                      >
                                        <Check size={10} />
                                        <span>Save</span>
                                      </button>
                                      <button
                                        onClick={() => setEditingProjectId(null)}
                                        className="flex items-center gap-1 px-3 py-1 bg-zinc-850 bg-zinc-800 text-gray-400 text-[10px] uppercase font-mono hover:bg-zinc-700 transition-colors"
                                      >
                                        <X size={10} />
                                        <span>Cancel</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-bold text-white tracking-wide truncate group-hover:text-white transition-colors uppercase leading-none">
                                      {project.name}
                                    </h3>
                                    <span className="text-[8px] tracking-wider text-zinc-500 bg-white/5 uppercase px-2 py-0.5 rounded-full inline-block font-mono select-none">
                                      {project.collection || 'General Workspace'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <p className="text-[11px] text-gray-500 group-hover:text-gray-400 transition-colors mt-1 truncate font-medium">
                                Active board with {project.pages?.length || 1} paper pages. Syncing live in cloud.
                              </p>
                            </div>
                          </div>

                          {/* Right Columns Section */}
                          <div className="flex items-center gap-6 shrink-0 text-[11px] text-gray-500" onClick={e => e.stopPropagation()}>
                            <span className="hidden sm:inline font-sans min-w-[50px] text-right">
                              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: false })}
                            </span>
                            <span className="hidden md:inline font-sans text-right min-w-[60px] text-gray-400 text-[10.5px]">
                              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: false })} ago
                            </span>

                            {/* Small circular avatar */}
                            {user.photoURL ? (
                              <img 
                                src={user.photoURL} 
                                alt="user-avatar" 
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full border border-white/5 object-cover" 
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[9px] uppercase text-white">
                                {user.displayName?.[0] || 'U'}
                              </div>
                            )}

                            {/* Toggle Star */}
                            <button
                              onClick={(e) => toggleFavorite(project.id, e)}
                              className={`transition-all hover:scale-110 p-0.5 ${favorites[project.id] ? 'text-blue-500' : 'text-gray-650 hover:text-gray-450'}`}
                            >
                              <Star size={13} className={favorites[project.id] ? 'fill-blue-500 text-blue-500' : 'text-gray-600'} />
                            </button>

                            {/* Ellipsis Popover Trigger */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                                className="p-1 hover:text-white text-gray-600 transition-colors rounded-none"
                              >
                                <MoreVertical size={13} />
                              </button>

                              {activeMenuId === project.id && (
                                <div 
                                  ref={menuRef}
                                  className="absolute right-0 mt-1 w-28 bg-[#121214] border border-[#27272A] shadow-2xl z-30 rounded-none flex flex-col py-1 overflow-hidden"
                                >
                                  <button
                                    onClick={() => {
                                      setEditingProjectId(project.id);
                                      setEditProjectName(project.name);
                                      setEditProjectCollection(project.collection || 'General Workspace');
                                      setEditProjectTagsString(project.tags?.join(', ') || '');
                                      setActiveMenuId(null);
                                    }}
                                    className="px-3 py-1.5 hover:bg-white/10 hover:text-white text-[10px] font-semibold text-left transition-colors uppercase flex items-center gap-1.5"
                                  >
                                    <Edit2 size={10} />
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="px-3 py-1.5 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-semibold text-left transition-colors uppercase flex items-center gap-1.5"
                                  >
                                    <Trash2 size={10} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
