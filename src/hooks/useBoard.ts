import { useState, useEffect, useCallback } from 'react';
import { BoardState, BoardPage, BackgroundMode } from '../types';

const STORAGE_KEY = 'inkwell_board_state';

const INITIAL_PAGE_ID = 'page-1';

export function useBoard() {
  const [state, setState] = useState<BoardState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure migration if needed
        if (parsed.pages && parsed.pages.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved board state', e);
      }
    }
    return {
      pages: [{ 
        id: INITIAL_PAGE_ID, 
        name: 'Page 1', 
        data: null, 
        backgroundMode: BackgroundMode.Plain 
      }],
      currentPageId: INITIAL_PAGE_ID,
      lastUpdated: Date.now(),
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPage = useCallback(() => {
    const newId = `page-${Date.now()}`;
    setState(prev => ({
      ...prev,
      pages: [...prev.pages, { 
        id: newId, 
        name: `Page ${prev.pages.length + 1}`, 
        data: null, 
        backgroundMode: BackgroundMode.Plain 
      }],
      currentPageId: newId,
      lastUpdated: Date.now(),
    }));
  }, []);

  const deletePage = useCallback((id: string) => {
    setState(prev => {
      if (prev.pages.length === 1) return prev;
      const newPages = prev.pages.filter(p => p.id !== id);
      const newCurrentId = prev.currentPageId === id ? newPages[0].id : prev.currentPageId;
      return {
        ...prev,
        pages: newPages,
        currentPageId: newCurrentId,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const duplicatePage = useCallback((id: string) => {
    setState(prev => {
      const pageToDup = prev.pages.find(p => p.id === id);
      if (!pageToDup) return prev;
      const newId = `page-dup-${Date.now()}`;
      const index = prev.pages.findIndex(p => p.id === id);
      const newPages = [...prev.pages];
      newPages.splice(index + 1, 0, {
        ...pageToDup,
        id: newId,
        data: pageToDup.data ? JSON.parse(JSON.stringify(pageToDup.data)) : null,
        name: `${pageToDup.name} (Copy)`,
      });
      return {
        ...prev,
        pages: newPages,
        currentPageId: newId,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const setPageData = useCallback((id: string, data: any, thumbnail?: string) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === id ? { ...p, data, thumbnail } : p),
      lastUpdated: Date.now(),
    }));
  }, []);

  const setPageBackground = useCallback((id: string, mode: BackgroundMode) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === id ? { ...p, backgroundMode: mode } : p),
      lastUpdated: Date.now(),
    }));
  }, []);

  const setCurrentPageId = useCallback((id: string) => {
    setState(prev => ({ ...prev, currentPageId: id }));
  }, []);

  return {
    state,
    addPage,
    deletePage,
    duplicatePage,
    setPageData,
    setPageBackground,
    setCurrentPageId,
  };
}
