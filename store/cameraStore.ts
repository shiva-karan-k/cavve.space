import { create } from 'zustand';

interface CameraStore {
  cameraMode: 'first' | 'third';
  setCameraMode: (mode: 'first' | 'third') => void;
  toggleCameraMode: () => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  cameraMode: 'first',
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === 'first' ? 'third' : 'first',
    })),
}));





