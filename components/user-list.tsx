"use client"

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// Remove useStore import if it's no longer needed here
// import { useStore } from "@/lib/store";
import { Plus, Edit, Trash2 } from "lucide-react";
import UserForm from "./user-form";
import type { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface UserListProps {
  users: User[]; // <-- Accept the filtered user list directly
  customerId: string | null; // Keep customerId for the UserForm and add button logic
  // Add handlers if needed for edit/delete actions triggered from here
  // onEditUser?: (user: User) => void;
  // onDeleteUser?: (userId: string) => void;
}

// Destructure users from props, remove internal store fetching/selecting
export default function UserList({ users, customerId /*, onEditUser, onDeleteUser */ }: UserListProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddClick = () => {
    setEditingUser(null);
    setShowAddUser(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setShowAddUser(true);
  };

  const handleFormCancel = () => {
    setShowAddUser(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    // Parent component (admin-manage-customer) handles data refresh via store actions
    setShowAddUser(false);
    setEditingUser(null);
    // Optionally call a prop function if parent needs direct notification
  };

  return (
    <div className="space-y-4">
      {showAddUser ? (
        <UserForm
          initialData={editingUser}
          customerId={customerId} // Pass customerId for association
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess} // Parent handles data refresh
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-brand-purple">Users</h3>
            <Button
              size="sm"
              onClick={handleAddClick}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
              disabled={!customerId} // Disable if no customer selected
            >
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>

          {/* Use the users prop directly */}
          {users.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No users found for this customer.</p>
          ) : (
            <Table>
              <TableHeader className="bg-brand-purple/5">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Map over the users prop */}
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-brand-purple/5">
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.login}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                       {/* Use "default" for active, "destructive" for inactive */}
                       <Badge variant={user.isActive ? "default" : "destructive"}>
                         {user.isActive ? 'Active' : 'Inactive'}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                       <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} title="Edit User">
                          <Edit className="h-4 w-4" />
                       </Button>
                       {/* Example Delete Button */}
                       {/* <Button variant="ghost" size="icon" onClick={() => onDeleteUser?.(user.id)} className="text-red-600 hover:text-red-700" title="Delete User">
                          <Trash2 className="h-4 w-4" />
                       </Button> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
