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
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  username: z.string().min(4, { message: "Username must be at least 4 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
})

type FormValues = z.infer<typeof formSchema>

interface UserFormProps {
  customerId: string
  onCancel: () => void
  onSuccess: () => void
}

export default function UserForm({ customerId, onCancel, onSuccess }: UserFormProps) {
  const { addUser, isUsernameUnique } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      email: "",
    },
  })

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true)

    // Check if username is unique
    if (!isUsernameUnique(data.username)) {
      setUsernameError("This username is already taken. Please choose another one.")
      setIsSubmitting(false)
      return
    }

    try {
      addUser({
        customerId,
        ...data,
      })
      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error adding user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-brand-purple">Add New User</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-brand-purple/5 rounded-md">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="johndoe"
                    {...field}
                    className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                    onChange={(e) => {
                      field.onChange(e)
                      setUsernameError(null)
                    }}
                  />
                </FormControl>
                {usernameError && <p className="text-sm font-medium text-destructive">{usernameError}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-purple/90">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
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
              <FormItem className="md:col-span-2">
                <FormLabel className="text-brand-purple/90">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john.doe@example.com"
                    {...field}
                    className="border-brand-purple/20 focus-visible:ring-brand-purple/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            disabled={
              isSubmitting ||
              (form.formState.touchedFields &&
                Object.keys(form.formState.touchedFields).length > 0 &&
                !form.formState.isValid)
            }
            className="bg-brand-purple hover:bg-brand-purple/90 micro-interaction"
          >
            Save User
          </Button>
        </div>
      </form>
    </Form>
  )
}
