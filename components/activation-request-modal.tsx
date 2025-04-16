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
  fingerprint: z.string().min(1, { message: "Fingerprint is required" }),
})

type FormValues = z.infer<typeof formSchema>

interface ActivationRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (fingerprint: string) => void
}

export default function ActivationRequestModal({ isOpen, onClose, onSubmit }: ActivationRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fingerprint: "",
    },
  })

  const handleSubmit = (data: FormValues) => {
    setIsSubmitting(true)
    try {
      onSubmit(data.fingerprint)
      form.reset()
      onClose()
    } catch (error) {
      console.error("Error submitting activation request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request License Activation</DialogTitle>
          <DialogDescription>
            Please provide the server fingerprint to request activation for this license.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fingerprint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Fingerprint</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter server fingerprint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
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
