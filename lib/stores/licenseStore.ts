import { create } from 'zustand';
import { License, LicenseInput } from '@/lib/types'; // Adjust path if needed

interface LicenseStoreState {
  licenses: License[];
  isLoadingLicenses: boolean;
  licenseError: string | null;
  setLicenses: (licenses: License[]) => void;
  clearLicenses: () => void;
}

const initialState = {
  licenses: [],
  isLoadingLicenses: false,
  licenseError: null,
};

export const useLicenseStore = create<LicenseStoreState>()(
  (set, get) => ({
    ...initialState,

    setLicenses: (licenses) => set({
        licenses: licenses.map(lic => ({
            ...lic,
            activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
            expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
        })),
        isLoadingLicenses: false,
        licenseError: null
    }),
    clearLicenses: () => set({ ...initialState }),

  })
);