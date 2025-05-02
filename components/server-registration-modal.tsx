"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Import Textarea

const formSchema = z.object({
  name: z.string().min(1, { message: "Server name is required" }),
  fingerprint: z.string().min(1, { message: "Server fingerprint is required" }),
  description: z.string().optional(), // Add optional description
})

type FormValues = z.infer<typeof formSchema>

interface ServerRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, fingerprint: string, description?: string) => void // Update onSubmit signature
}

export default function ServerRegistrationModal({ isOpen, onClose, onSubmit }: ServerRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      fingerprint: "",
      description: "", // Add default value
    },
  })

  const handleSubmit = (data: FormValues) => {
    setIsSubmitting(true)
    try {
      onSubmit(data.name, data.fingerprint, data.description) // Pass description to onSubmit
      form.reset()
      onClose()
    } catch (error) {
      console.error("Error registering server:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Register a server hosting Agile engine instances</DialogTitle>
          <DialogDescription>Please provide the server details to register it with your account.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1 overflow-auto p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Production Server" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description for this server"
                      className="resize-none" // Prevent manual resizing if desired
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fingerprint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Fingerprint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste server fingerprint here"
                      className="resize-none font-mono text-sm" // Style for code/fingerprint
                      rows={4} // Adjust rows as needed
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
