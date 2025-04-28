import { create } from 'zustand';
import { User } from '@/lib/types';

type UserState = {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchUsersByCustomerId: (customerId: string) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (user: Omit<User, 'id'> & { customerId: string }) => Promise<void>;
  updateUser: (id: string, user: Partial<User> & { customerId: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  saveUsers: (users: (Omit<User, 'id'> & { id?: string; customerId: string })[], customerId: string) => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
  users: [],
  selectedUser: null,
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch users');
      }
      const data: User[] = await response.json();
      set({ users: data, loading: false });
    } catch (error) {
      let errorMessage = 'An unknown error occurred while fetching users.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Error fetching users:', errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchUsersByCustomerId: async (customerId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users?customerId=${customerId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch users for customer ${customerId}`);
      }
      const data: User[] = await response.json();
      set({ users: data, loading: false });
    } catch (error) {
      let errorMessage = `An unknown error occurred while fetching users for customer ${customerId}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error fetching users for customer ${customerId}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchUserById: async (id: string) => {
    set({ loading: true, error: null, selectedUser: null });
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch user ${id}`);
      }
      const user: User = await response.json();
      set({ selectedUser: user, loading: false });
    } catch (error) {
      let errorMessage = `An unknown error occurred while fetching user ${id}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error fetching user ${id}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  createUser: async (userData: Omit<User, 'id'> & { customerId: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create user');
      }
      const newUser: User = await response.json();
      set((state) => ({
        users: [...state.users, newUser],
        loading: false,
      }));
    } catch (error) {
      let errorMessage = 'An unknown error occurred while creating the user.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Error creating user:', errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  updateUser: async (id: string, userUpdateData: Partial<User> & { customerId: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userUpdateData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update user ${id}`);
      }
      const updatedUser: User = await response.json();
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, ...updatedUser } : u
        ),
        selectedUser:
          state.selectedUser?.id === id ? { ...state.selectedUser, ...updatedUser } : state.selectedUser,
        loading: false,
      }));
    } catch (error) {
      let errorMessage = `An unknown error occurred while updating user ${id}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error updating user ${id}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete user ${id}`);
      }
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
        loading: false,
      }));
    } catch (error) {
      let errorMessage = `An unknown error occurred while deleting user ${id}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error deleting user ${id}:`, errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },

  saveUsers: async (users: (Omit<User, 'id'> & { id?: string; customerId: string })[], customerId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedUsers: User[] = [];
      for (const user of users) {
        // Ensure customerId is set for all users
        const userData = { ...user, customerId };

        if (!user.id) {
          // Create new user
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create user');
          }
          const newUser: User = await response.json();
          updatedUsers.push(newUser);
        } else {
          // Update existing user
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to update user ${user.id}`);
          }
          const updatedUser: User = await response.json();
          updatedUsers.push(updatedUser);
        }
      }

      // Update state with all created/updated users
      set((state) => {
        const newUsersMap = new Map(updatedUsers.map((u) => [u.id, u]));
        const updatedUserList = state.users
          .map((u) => newUsersMap.get(u.id) || u) // Update existing users
          .filter((u) => !newUsersMap.has(u.id)); // Remove duplicates
        return {
          users: [...updatedUserList, ...updatedUsers.filter((u) => !state.users.some((existing) => existing.id === u.id))],
          selectedUser:
            state.selectedUser && newUsersMap.has(state.selectedUser.id)
              ? newUsersMap.get(state.selectedUser.id)!
              : state.selectedUser,
          loading: false,
        };
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred while saving users.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Error saving users:', errorMessage, error);
      set({ error: errorMessage, loading: false });
    }
  },
}));