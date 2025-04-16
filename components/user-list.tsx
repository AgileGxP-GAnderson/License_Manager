"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Plus } from "lucide-react"
import UserForm from "./user-form"

interface UserListProps {
  customerId: string
}

export default function UserList({ customerId }: UserListProps) {
  const { getUsersByCustomerId } = useStore()
  const users = getUsersByCustomerId(customerId)
  const [showAddUser, setShowAddUser] = useState(false)

  return (
    <div className="space-y-4">
      {showAddUser ? (
        <UserForm
          customerId={customerId}
          onCancel={() => setShowAddUser(false)}
          onSuccess={() => setShowAddUser(false)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-brand-purple">Users</h3>
            <Button
              size="sm"
              onClick={() => setShowAddUser(true)}
              className="bg-brand-green hover:bg-brand-green/90 text-brand-purple font-medium micro-interaction"
            >
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No users found for this customer.</p>
          ) : (
            <Table>
              <TableHeader className="bg-brand-purple/5">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-brand-purple/5">
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  )
}
