import { create } from 'zustand'
export const useFilter = create((set)=> ({
  type:'all',
  setType:(t)=> set({ type:t }),
  menuOpen: false,
  setMenuOpen:(v)=> set({ menuOpen:v })
}))
