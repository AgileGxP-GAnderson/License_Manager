import { create } from 'zustand';
import { Server, ServerState } from '@/lib/types'; // Adjust path if needed

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  loading: false,
  error: null,

  // Action: Fetch Servers by Customer ID
  fetchServersByCustomerId: async (customerId) => {
    if (!customerId) {
      console.warn("fetchServersByCustomerId called with no customerId.");
      set({ servers: [], loading: false, error: null }); // Clear servers if no ID
      return;
    }
    set({ loading: true, error: null });
    try {
      // Assuming the API endpoint supports filtering by customerId via query param
      const response = await fetch(`/api/servers?customerId=${customerId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch servers (${response.status})` }));
        throw new Error(errorData.message || `Failed to fetch servers (${response.status})`);
      }
      const data: Server[] = await response.json();
      // Assuming the API returns servers without the fingerprint
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
        // Handle fingerprint conversion if needed (e.g., to base64 string)
        // fingerprint: typeof serverData.fingerprint === 'string' ? serverData.fingerprint : serverData.fingerprint.toString('base64'),
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
      // +++ Add logging here +++
      console.log("API returned new server:", newServer);

      set((state) => {
        const updatedServers = [...state.servers, newServer];
        // +++ Add logging here +++
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

  // Selector: Get Server by ID
  getServerById: (id) => {
    const serverIdNum = typeof id === 'string' ? parseInt(id, 10) : id;
    return get().servers.find((server) => server.id === serverIdNum);
  },

  // Action: Clear Servers
  clearServers: () => set({ servers: [], loading: false, error: null }),
}));