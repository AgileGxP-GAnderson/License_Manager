"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(1, { message: "Server name is required" }),
  fingerprint: z.string().min(1, { message: "Server fingerprint is required" }),
})

type FormValues = z.infer<typeof formSchema>

interface ServerRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, fingerprint: string) => void
}

export default function ServerRegistrationModal({ isOpen, onClose, onSubmit }: ServerRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      fingerprint: "",
    },
  })

  const handleSubmit = (data: FormValues) => {
    setIsSubmitting(true)
    try {
      onSubmit(data.name, data.fingerprint)
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1 overflow-auto">
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
              name="fingerprint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agile server fingerprint</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter server fingerprint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t mt-6 pt-4 flex justify-end gap-2 bg-background sticky bottom-0 z-10">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
