import { create } from 'zustand';
import type { Server } from '@/lib/types'; // Adjust import path if needed

// 1. Define the interface for Server state and actions
interface ServerState {
  servers: Server[];
  loading: boolean;
  error: string | null;
  fetchServersByCustomerId: (customerId: string) => Promise<void>;
  createServer: (customerId: string, serverData: Omit<Server, 'id' | 'customerId'>) => Promise<Server | null>; // Return created server or null on error
  // Optional: Add actions for update, delete if needed
  // updateServer: (id: string, serverData: Partial<Server>) => Promise<Server | null>; // Return updated server
  // deleteServer: (id: string) => Promise<void>;
  getServerById: (id: string) => Server | undefined; // Helper to get server from state
  clearServers: () => void; // To clear state when customer changes
}

// 2. Create the store using the defined type
export const useServerStore = create<ServerState>((set, get) => ({
  // Initial state
  servers: [],
  loading: false,
  error: null,

  // Action: Fetch Servers
  fetchServersByCustomerId: async (customerId: string) => {
    // ... existing implementation ...
    if (!customerId) {
      set({ servers: [], loading: false, error: null }); // Clear if no customerId
      return;
    }
    set({ loading: true, error: null });
    try {
      // Adjust API endpoint as needed
      const response = await fetch(`/api/servers?customerId=${customerId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch servers');
      }
      const data: Server[] = await response.json();
      set({ servers: data, loading: false });
    } catch (error) {
      let errorMessage = 'An unknown error occurred while fetching servers.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error fetching servers for customer ${customerId}:`, errorMessage, error);
      set({ error: errorMessage, loading: false, servers: [] }); // Clear servers on error
    }
  },

    // Action: Create Server
  createServer: async (customerId: string, serverData: Omit<Server, 'id' | 'customerId'>): Promise<Server | null> => {
    if (!customerId) {
        const errorMsg = "Cannot create server: Customer ID is missing.";
        console.error(errorMsg);
        set({ error: errorMsg, loading: false }); // Set error state
        return null;
    }
    set({ loading: true, error: null }); // Indicate loading started
    try {
      const payload = {
        ...serverData,
        customerId: customerId, // Add customerId to the payload
      };

      const response = await fetch('/api/servers', { // Adjust API endpoint if needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create server via API');
      }

      const newServer: Server = await response.json();

      // Add the new server to the state
      set((state) => ({
        servers: [...state.servers, newServer],
        loading: false, // Reset loading state
      }));

      return newServer; // Return the newly created server

    } catch (error) {
      let errorMessage = 'An unknown error occurred while creating the server.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Error creating server:", errorMessage, error);
      set({ error: errorMessage, loading: false }); // Set error and reset loading
      return null; // Return null on error
    }
  },

  // Helper function to get a server from the current state
  getServerById: (id: string) => {
    return get().servers.find(server => server.id === id);
  },

  // Optional: Implement updateServer, deleteServer similarly...

  clearServers: () => {
    set({ servers: [], loading: false, error: null });
  },
}));