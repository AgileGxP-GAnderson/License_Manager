import { create } from 'zustand';
import { License } from '@/lib/types';

interface PendingLicenseLedgerEntry {
  licenseId: number;
  licenseUniqueId: string;
  serverId?: number | null;
  activityDate: Date;
  expirationDate?: Date | null;
  licenseActionId: number;
  comment?: string;
}

interface PendingChange {
  id: string;
  licenseId: number;
  poId: string;
  originalState: Partial<License>;
  newState: Partial<License>;
  ledgerEntry: PendingLicenseLedgerEntry;
  timestamp: Date;
}

interface LicenseStoreState {
  licenses: License[];
  pendingChanges: PendingChange[];
  isLoadingLicenses: boolean;
  licenseError: string | null;

  // Core operations
  setLicenses: (licenses: License[]) => void;
  clearLicenses: () => void;
  
  // License operations with change tracking
  updateLicense: (licenseId: number, poId: string, changes: Partial<License>, actionTypeId: number, comment?: string) => void;
  activateLicense: (licenseId: number, poId: string, serverId: number, expirationDate?: Date | null) => void;
  deactivateLicense: (licenseId: number, poId: string) => void;
  
  // Change management
  hasUnsavedChanges: () => boolean;
  discardChanges: () => void;
  saveChanges: () => Promise<boolean>;
  
  // Helpers
  getLicenseById: (id: number) => License | undefined;
  getLicenseByPoId: (poId: string) => License[];
}

const initialState = {
  licenses: [],
  pendingChanges: [],
  isLoadingLicenses: false,
  licenseError: null,
};

export const useLicenseStore = create<LicenseStoreState>()((set, get) => ({
  ...initialState,

  setLicenses: (licenses) => set({
    licenses: licenses.map(lic => ({
      ...lic,
      activationDate: lic.activationDate ? new Date(lic.activationDate) : undefined,
      expirationDate: lic.expirationDate ? new Date(lic.expirationDate) : null,
    })),
    pendingChanges: [], // Reset pending changes when setting new licenses
    isLoadingLicenses: false,
    licenseError: null
  }),

  clearLicenses: () => set(initialState),

  updateLicense: (licenseId, poId, changes, actionTypeId, comment) => {
    const license = get().getLicenseById(licenseId);
    if (!license) {
      set({ licenseError: `License ${licenseId} not found` });
      return;
    }

    const now = new Date();
    // Capture original state for changed fields
    const originalState: Partial<License> = {};
    Object.keys(changes).forEach(key => {
      originalState[key] = license[key];
    });

    // Create ledger entry
    const ledgerEntry: PendingLicenseLedgerEntry = {
      licenseId,
      licenseUniqueId: license.uniqueId,
      activityDate: now,
      licenseActionId: actionTypeId,
      comment,
      // Only include these if they're changing
      serverId: changes.serverId ?? undefined,
      expirationDate: changes.expirationDate ?? undefined,
    };

    // Update local state
    set(state => ({
      licenses: state.licenses.map(lic => 
        lic.id === licenseId ? { ...lic, ...changes } : lic
      ),
      pendingChanges: [
        ...state.pendingChanges,
        {
          id: `${Date.now()}-${licenseId}`,
          licenseId,
          poId,
          originalState,
          newState: changes,
          ledgerEntry,
          timestamp: now
        }
      ]
    }));
  },

  activateLicense: (licenseId, poId, serverId, expirationDate) => {
    const license = get().getLicenseById(licenseId);
    if (!license) {
      set({ licenseError: `License ${licenseId} not found` });
      return;
    }

    const now = new Date();
    const changes = {
      status: 'Activated',
      activationDate: now,
      expirationDate: expirationDate || null,
      serverId
    };

    get().updateLicense(licenseId, poId, changes, 1, 'License activated'); // Assuming 1 is activation action ID
  },

  deactivateLicense: (licenseId, poId) => {
    const license = get().getLicenseById(licenseId);
    if (!license) {
      set({ licenseError: `License ${licenseId} not found` });
      return;
    }

    const changes = {
      status: 'Available',
      activationDate: null,
      expirationDate: null,
      serverId: null
    };

    get().updateLicense(licenseId, poId, changes, 2, 'License deactivated'); // Assuming 2 is deactivation action ID
  },

  hasUnsavedChanges: () => get().pendingChanges.length > 0,

  discardChanges: () => {
    const { pendingChanges, licenses } = get();
    if (pendingChanges.length === 0) return;

    // Create a map of original states, taking the earliest state for each license
    const originalStateMap = new Map();
    [...pendingChanges].reverse().forEach(change => {
      if (!originalStateMap.has(change.licenseId)) {
        originalStateMap.set(change.licenseId, change.originalState);
      }
    });

    // Restore original states
    set({
      licenses: licenses.map(license => 
        originalStateMap.has(license.id) 
          ? { ...license, ...originalStateMap.get(license.id) } 
          : license
      ),
      pendingChanges: []
    });
  },

  saveChanges: async () => {
    const { pendingChanges } = get();
    if (pendingChanges.length === 0) return true;

    try {
      set({ isLoadingLicenses: true });

      // Group changes by license
      const changesByLicense = pendingChanges.reduce((acc, change) => {
        if (!acc[change.licenseId]) {
          acc[change.licenseId] = [];
        }
        acc[change.licenseId].push(change);
        return acc;
      }, {} as Record<number, PendingChange[]>);

      // Process each license's changes
      for (const [licenseId, changes] of Object.entries(changesByLicense)) {
        const latestChange = changes[changes.length - 1];
        
        // Update license
        const licenseResponse = await fetch(`/api/licenses/${licenseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestChange.newState)
        });

        if (!licenseResponse.ok) {
          throw new Error(`Failed to update license ${licenseId}`);
        }

        // Create ledger entries for each change
        for (const change of changes) {
          const ledgerResponse = await fetch('/api/licenseLedgers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.ledgerEntry)
          });

          if (!ledgerResponse.ok) {
            throw new Error(`Failed to create ledger entry for license ${licenseId}`);
          }
        }
      }

      // Clear pending changes after successful save
      set({ pendingChanges: [], isLoadingLicenses: false });
      return true;

    } catch (error) {
      set({ 
        licenseError: error instanceof Error ? error.message : 'Failed to save changes',
        isLoadingLicenses: false 
      });
      return false;
    }
  },

  getLicenseById: (id) => get().licenses.find(license => license.id === id),

  getLicenseByPoId: (poId) => get().licenses.filter(license => 
    license.purchaseOrders?.some(po => po.id === poId)
  )
}));