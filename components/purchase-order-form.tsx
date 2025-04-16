"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

const formSchema = z.object({
  poNumber: z.string().min(1, { message: "PO Number is required" }),
  purchaseDate: z.date(),
  licenses: z
    .array(
      z.object({
        licenseType: z.string(),
        status: z.string(),
        duration: z.string(),
        activationDate: z.date().optional(),
        expirationDate: z.date().optional().nullable(),
      }),
    )
    .min(1, { message: "At least one license is required" }),
})

type FormValues = z.infer<typeof formSchema>

interface PurchaseOrderFormProps {
  customerId: string
  onCancel: () => void
  onSuccess: () => void
}

export default function PurchaseOrderForm({ customerId, onCancel, onSuccess }: PurchaseOrderFormProps) {
  const { addPurchaseOrder, isPONumberUnique } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poNumberError, setPoNumberError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poNumber: "",
      purchaseDate: new Date(),
      licenses: [
        {
          licenseType: "1", // Agile Engine
          status: "Available",
          duration: "1 Year",
          activationDate: undefined,
          expirationDate: null,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "licenses",
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    // Validate PO Number uniqueness
    if (!isPONumberUnique(data.poNumber)) {
      setPoNumberError("This PO Number already exists. Please use a unique PO Number.")
      setIsSubmitting(false)
      return
    }

    try {
      addPurchaseOrder(customerId, {
        poNumber: data.poNumber,
        purchaseDate: data.purchaseDate,
        licenses: data.licenses.map((license) => ({
          ...license,
          licenseType: license.licenseType === "1" ? "Agile Engine" : license.licenseType,
          // If duration is Perpetual, ensure expirationDate is null
          expirationDate: license.duration === "Perpetual" ? null : license.expirationDate,
        })),
      })
      onSuccess()
    } catch (error) {
      console.error("Failed to add purchase order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLicense = () => {
    append({
      licenseType: "1", // Agile Engine
      status: "Available",
      duration: "1 Year",
      activationDate: undefined,
      expirationDate: null,
    })
  }

  // Clear PO number error when the field changes
  useEffect(() => {
    if (poNumberError) {
      const subscription = form.watch((value, { name }) => {
        if (name === "poNumber") {
          setPoNumberError(null)
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [form, poNumberError])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-xl font-semibold">Add New Purchase Order</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="poNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Number</FormLabel>
                <FormControl>
                  <Input placeholder="PO-12345" {...field} />
                </FormControl>
                {poNumberError && <p className="text-sm font-medium text-destructive">{poNumberError}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Licenses</h3>
            <Button type="button" onClick={addLicense} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add License
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              At least one license is required. Click "Add License" to add one.
            </p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">License #{index + 1}</h4>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`licenses.${index}.licenseType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select license type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Agile Engine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`licenses.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={true}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Activation Requested">Activation Requested</SelectItem>
                          <SelectItem value="Activated">Activated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`licenses.${index}.duration`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1 Year">1 Year</SelectItem>
                          <SelectItem value="2 Years">2 Years</SelectItem>
                          <SelectItem value="3 Years">3 Years</SelectItem>
                          <SelectItem value="4 Years">4 Years</SelectItem>
                          <SelectItem value="5 Years">5 Years</SelectItem>
                          <SelectItem value="Perpetual">Perpetual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`licenses.${index}.activationDate`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Activation Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                              disabled
                            >
                              {field.value ? format(field.value, "PPP") : <span>Not activated</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch(`licenses.${index}.duration`) !== "Perpetual" && (
                  <FormField
                    control={form.control}
                    name={`licenses.${index}.expirationDate`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiration Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild disabled>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled
                              >
                                {field.value ? format(field.value, "PPP") : <span>Not set</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || fields.length === 0}>
            Save All
          </Button>
        </div>
      </form>
    </Form>
  )
}
