"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PurchaseOrderInput } from '@/lib/types'; // Adjust import path
import { usePurchaseOrderStore } from '@/lib/stores/purchaseOrderStore'; // Import the store hook

// --- Zod Schema for Validation ---
const formSchema = z.object({
  poName: z.string().min(1, { message: "Purchase order name is required." }),
  purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), { // Basic date validation
    message: "Invalid date format.",
  }),
  // Add other fields as needed based on PurchaseOrderInput
  // isClosed: z.boolean().optional(),
});

// --- Component Props ---
interface PurchaseOrderFormProps {
  customerId: string; // Required to associate the PO
  initialData?: Partial<PurchaseOrderInput>; // For editing (optional)
  onCancel: () => void;
  onSuccess: () => void; // Callback after successful store action
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  customerId,
  initialData,
  onCancel,
  onSuccess,
}) => {
  const isEditing = !!initialData;
  const [isLoading, setIsLoading] = useState(false); // Local loading state for form submission
  const [formError, setFormError] = useState<string | null>(null); // Local error state for form submission

  // --- Get Store Actions ---
  const { addPurchaseOrder, updatePurchaseOrder } = usePurchaseOrderStore();

  // --- React Hook Form Setup ---
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poName: initialData?.poName || '',
      purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Format for date input
      // ... other default values
    },
  });

  // --- Submit Handler ---
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setFormError(null);

    const poData: PurchaseOrderInput = {
      ...values,
      customerId: customerId, // Ensure customerId is included
      purchaseDate: new Date(values.purchaseDate).toISOString(), // Convert back to ISO string
      isClosed: values.isClosed ?? false, // Ensure isClosed is provided, defaulting to false for new POs
    };

    try {
      let result = null;
      if (isEditing && initialData?.id) {
        // --- Call Update Action from Store ---
        // result = await updatePurchaseOrder(initialData.id, poData);
        console.warn("Update functionality not fully implemented in this example."); // Placeholder
      } else {
        // --- Call Add Action from Store ---
        result = await addPurchaseOrder(poData);
      }

      if (result) {
        console.log("Store action successful:", result);
        onSuccess(); // Call the success callback passed from the parent
      } else {
        // The store action itself should set the global error state if it fails
        // We might set a local form error if the store action returns null without throwing
        setFormError("Failed to save purchase order. Check console or store state for details.");
        console.error("Store action returned null or failed.");
      }
    } catch (error: any) {
      // This catch block might not be reached if the store handles errors internally
      console.error("Error submitting purchase order form:", error);
      setFormError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md bg-gray-50">
        {formError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{formError}</p>}

        <FormField
          control={form.control}
          name="poName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Order Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Q3 Software Order" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purchaseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Date</FormLabel>
              <FormControl>
                {/* Use type="date" for better UX */}
                <Input type="date" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add other form fields for PurchaseOrderInput here */}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-brand-purple hover:bg-brand-purple/90">
            {isLoading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Purchase Order')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PurchaseOrderForm;