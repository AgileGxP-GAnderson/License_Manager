"use client"

import { useState, useEffect } from "react"; // Ensure useEffect is imported
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { toast } from "@/components/ui/use-toast";
import type { Customer } from "@/lib/types"; // Import Customer type

// Define the Zod schema based on the Customer type from lib/types.ts
const formSchema = z.object({
  businessName: z.string().min(1, { message: "Business Name is required" }),
  contactName: z.string().min(1, { message: "Contact Name is required" }),
  contactEmail: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")).nullable(),
  contactPhone: z.string().optional().nullable(),
  businessAddress1: z.string().optional().nullable(),
  businessAddress2: z.string().optional().nullable(),
  businessAddressCity: z.string().optional().nullable(),
  businessAddressState: z.string().optional().nullable(),
  businessAddressZip: z.string().optional().nullable(),
  businessAddressCountry: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  initialData?: Customer | null; // <-- Add initialData prop
  onCancel: () => void;
  // --- UPDATE onSuccess signature to accept the updated customer ---
  onSuccess: (updatedCustomer: Customer | null) => void; // Pass updated data back, null if adding/no data
}

export default function CustomerForm({ initialData, onCancel, onSuccess }: CustomerFormProps) {
  const { addCustomer, updateCustomer } = useStore(); // Add updateCustomer from store
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData; // Determine if we are in edit mode

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Set default values based on initialData or provide defaults for new customer
    defaultValues: {
      businessName: initialData?.businessName ?? "",
      contactName: initialData?.contactName ?? "",
      contactEmail: initialData?.contactEmail ?? "",
      contactPhone: initialData?.contactPhone ?? "",
      businessAddress1: initialData?.businessAddress1 ?? "",
      businessAddress2: initialData?.businessAddress2 ?? "",
      businessAddressCity: initialData?.businessAddressCity ?? "",
      businessAddressState: initialData?.businessAddressState ?? "",
      businessAddressZip: initialData?.businessAddressZip ?? "",
      businessAddressCountry: initialData?.businessAddressCountry ?? "",
    },
  });

  // Reset form if initialData changes (e.g., switching between add/edit)
  useEffect(() => {
    if (initialData) {
      form.reset({
        businessName: initialData.businessName ?? "",
        contactName: initialData.contactName ?? "",
        contactEmail: initialData.contactEmail ?? "",
        contactPhone: initialData.contactPhone ?? "",
        businessAddress1: initialData.businessAddress1 ?? "",
        businessAddress2: initialData.businessAddress2 ?? "",
        businessAddressCity: initialData.businessAddressCity ?? "",
        businessAddressState: initialData.businessAddressState ?? "",
        businessAddressZip: initialData.businessAddressZip ?? "",
        businessAddressCountry: initialData.businessAddressCountry ?? "",
      });
    } else {
      form.reset({ // Reset to defaults for adding new
        businessName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        businessAddress1: "",
        businessAddress2: "",
        businessAddressCity: "",
        businessAddressState: "",
        businessAddressZip: "",
        businessAddressCountry: "",
      });
    }
  }, [initialData, form]);


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    let resultCustomer: Customer | null = null; // Variable to hold the result
    try {
      if (isEditing && initialData) {
        // --- CAPTURE the returned customer from updateCustomer ---
        resultCustomer = await updateCustomer(initialData.id, data);
        toast({ title: "Success", description: "Customer updated successfully." });
      } else {
        // Assuming addCustomer might return the new customer object or ID in the future
        await addCustomer(data); // Modify addCustomer if it should return data
        toast({ title: "Success", description: "Customer added successfully." });
        // If addCustomer returns the new customer: resultCustomer = await addCustomer(data);
      }
      // --- PASS the result (updated customer or null) to the onSuccess callback ---
      onSuccess(resultCustomer);
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'add'} customer.`,
      });
      // Optionally call onSuccess(null) on error if needed, but usually not required
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      {/* Change title based on mode */}
      <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Customer" : "Add New Customer"}</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Business Name */}
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corporation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Name */}
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name *</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Email */}
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane.doe@example.com" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Phone */}
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Fields */}
        <FormField
          control={form.control}
          name="businessAddress1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessAddress2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2</FormLabel>
              <FormControl>
                <Input placeholder="Suite 100" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="businessAddressCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Anytown" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessAddressState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State / Province</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessAddressZip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip / Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="90210" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
         <FormField
          control={form.control}
          name="businessAddressCountry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="USA" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {/* Change button text based on mode */}
            {isSubmitting ? "Saving..." : (isEditing ? "Update Customer" : "Add Customer")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
