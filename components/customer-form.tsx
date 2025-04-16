"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"

const formSchema = z.object({
  name: z.string().min(2, { message: "Customer name is required" }),
  addressLine1: z.string().min(5, { message: "Address Line 1 is required" }),
  addressLine2: z.string().optional(),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  zipCode: z.string().min(5, { message: "ZIP code is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  contactPerson: z.string().min(2, { message: "Contact person is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
})

type FormValues = z.infer<typeof formSchema>

interface CustomerFormProps {
  onCancel: () => void
  onSuccess: () => void
}

export default function CustomerForm({ onCancel, onSuccess }: CustomerFormProps) {
  const { addCustomer } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      contactPerson: "",
      email: "",
      phone: "",
    },
  })

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // Add the customer - this also sets it as the current customer in the store
      const newCustomerId = addCustomer(data)

      // Notify parent component that we're done
      onSuccess()
    } catch (error) {
      console.error("Error adding customer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-brand-purple">Add New Customer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Customer Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Corporation"
                    {...field}
                    className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Contact Person</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="contact@example.com"
                    {...field}
                    className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(123) 456-7890"
                    {...field}
                    className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address Fields */}
          <div className="md:col-span-2 p-3 bg-brand-purple/5 rounded-md space-y-4">
            <h3 className="font-medium text-brand-purple">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-brand-purple/90">Address Line 1</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Business St"
                        {...field}
                        className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-brand-purple/90">Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Suite 100"
                        {...field}
                        className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-brand-purple/90">City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="New York"
                        {...field}
                        className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-brand-purple/90">State/Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="NY"
                        {...field}
                        className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-brand-purple/90">ZIP/Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10001"
                        {...field}
                        className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-brand-purple/90">Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="United States"
                        {...field}
                        className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction"
          >
            Save customer
          </Button>
        </div>
      </form>
    </Form>
  )
}
