import { create } from 'zustand';
import { Server, ServerState } from '@/lib/types'; // Adjust path if needed

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  loading: false,
  error: null,

  fetchServersByCustomerId: async (customerId) => {
    if (!customerId) {
      console.warn("fetchServersByCustomerId called with no customerId.");
      set({ servers: [], loading: false, error: null }); // Clear servers if no ID
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/servers?customerId=${customerId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch servers (${response.status})` }));
        throw new Error(errorData.message || `Failed to fetch servers (${response.status})`);
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

  createServer: async (customerId, serverData) => {
    console.log("Creating server with data:", serverData);
    const customerIdNum = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId;
    if (!customerIdNum) {
        const errorMsg = "Cannot create server: Customer ID is missing.";
        console.error(errorMsg);
        set({ error: errorMsg, loading: false });
        return null;
    }
    set({ loading: true, error: null });
    try {
      const payload = {
        ...serverData,
        customerId: customerIdNum,
      };
      console.log("Payload for server creation:", payload);
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create server via API');
      }

      const newServer: Server = await response.json();
      console.log("API returned new server:", newServer);

      set((state) => {
        const updatedServers = [...state.servers, newServer];
        console.log("Store state updated. New allServers count:", updatedServers.length, updatedServers);
        return {
          servers: updatedServers,
          loading: false,
        };
      });
      return newServer;
    } catch (error: any) { // Use 'any' or a more specific error type
        let errorMessage = 'An unknown error occurred while creating the server.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        console.error("Error creating server:", errorMessage, error);
        set({ error: errorMessage, loading: false }); // Set error and reset loading
        return null; // Return null on error
    }
  },

  getServerById: (id) => {
    const serverIdNum = typeof id === 'string' ? parseInt(id, 10) : id;
    return get().servers.find((server) => server.id === serverIdNum);
  },

  clearServers: () => set({ servers: [], loading: false, error: null }),
}));