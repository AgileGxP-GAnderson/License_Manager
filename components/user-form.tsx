"use client"

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // <-- Import Checkbox
import { useStore } from "@/lib/store";
import { toast } from "@/components/ui/use-toast";
import type { User, AddUserInput } from "@/lib/types"; // Assuming types exist
import { Loader2 } from "lucide-react";

// --- Define or update the Zod schema ---
const userFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  login: z.string().min(1, "Username/Login is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  // Add password only for creation, make it optional for editing schema if needed
  password: z.string().min(6, "Password must be at least 6 characters").optional(), // Optional for schema, required conditionally in UI/logic
  // --- Add isActive field ---
  isActive: z.boolean().default(true), // Default to true
});

// Adjust FormValues type if needed, especially if editing schema differs
type FormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: User | null;
  customerId: string | null; // Need customerId to associate the user
  onCancel: () => void;
  onSuccess: (newUser: User | null) => void;
}

export default function UserForm({ initialData, customerId, onCancel, onSuccess }: UserFormProps) {
  const { addUser, updateUser } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  // --- Explicitly define defaultValues with the FormValues type ---
  const defaultFormValues: FormValues = {
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    login: initialData?.login ?? "",
    email: initialData?.email ?? "",
    password: "", // Always clear password field on load
    isActive: initialData?.isActive ?? true, // Default to true if adding new
  };
  // --- End explicit definition ---

  const form = useForm<FormValues>({
    resolver: zodResolver(userFormSchema),
    // --- Use the explicitly typed default values object ---
    defaultValues: defaultFormValues,
    // --- End change ---
  });

  // Reset form effect (similar to CustomerForm)
  useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName ?? "",
        lastName: initialData.lastName ?? "",
        login: initialData.login ?? "",
        email: initialData.email ?? "",
        password: "", // Don't repopulate password
        isActive: initialData.isActive ?? true,
      });
    } else {
      form.reset({ // Reset to defaults for adding new
        firstName: "",
        lastName: "",
        login: "",
        email: "",
        password: "",
        isActive: true, // Explicitly true for new user
      });
    }
  }, [initialData, form]);


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    let resultUser: User | null = null;

    if (!customerId && !isEditing) {
       toast({ variant: "destructive", title: "Error", description: "Cannot add user: No customer selected." });
       setIsSubmitting(false);
       return;
    }

    // --- Prepare data for store action ---
    // The store action now handles getting customerId for adding
    const userData: AddUserInput & { password?: string } = {
        firstName: data.firstName,
        lastName: data.lastName,
        login: data.login,
        email: data.email,
        isActive: data.isActive, // Include isActive from form
        // Conditionally add password only when creating
        ...( !isEditing && data.password && { password: data.password } ),
        // customerId is now handled within the store's addUser action
    };

    try {
      if (isEditing && initialData) {
        // Ensure password isn't accidentally sent during update unless intended
        const updateData = { ...userData };
        delete updateData.password; // Remove password field for standard updates
        resultUser = await updateUser(initialData.id, updateData);
        toast({ title: "Success", description: "User updated successfully." });
      } else {
        // Validate password presence for new user
        if (!data.password) {
            form.setError("password", { type: "manual", message: "Password is required for new users." });
            setIsSubmitting(false);
            return;
        }
        resultUser = await addUser(userData); // Pass prepared data
        toast({ title: "Success", description: "User added successfully." });
      }
      onSuccess(resultUser);
    } catch (error: any) {
      console.error("Failed to save user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'add'} user.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit User" : "Add New User"}</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md border-brand-purple/10 bg-gradient-to-br from-white to-brand-purple/5 shadow-sm">
        {/* Existing Fields: firstName, lastName, login, email */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl><Input placeholder="John" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl><Input placeholder="Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username (Login) *</FormLabel>
              <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field (only required for new user) */}
        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* --- Add isActive Checkbox Field --- */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  User is Active
                </FormLabel>
                <FormDescription>
                  Inactive users cannot log in or use licenses.
                </FormDescription>
              </div>
               <FormMessage /> {/* Display validation errors if any */}
            </FormItem>
          )}
        />
        {/* --- End isActive Checkbox Field --- */}


        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-purple hover:bg-brand-purple/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? "Update User" : "Add User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
