"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import DatePicker, { registerLocale } from "react-datepicker"
import { enUS } from "date-fns/locale"
import "react-datepicker/dist/react-datepicker.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Register the locale
registerLocale("en-US", enUS)

// Define your own type based on DatePicker component props
type DatePickerPropsType = React.ComponentProps<typeof DatePicker>

export type CalendarProps = DatePickerPropsType & {
  value?: Date | null
  onChange?: (date: Date | null) => void
  className?: string
}

function Calendar({
  value,
  onChange,
  className,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3", className)}>
      <DatePicker
        selected={value}
        onChange={(date, event) => {
          if (Array.isArray(date)) {
            const [start, end] = date;
            onChange?.(start); 
          } else {
            onChange?.(date);
          }
        }}
        locale="en-US"
        inline
        calendarClassName="border-none shadow-none"
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                prevMonthButtonDisabled && "cursor-not-allowed opacity-30"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </button>
            
            <div className="text-sm font-medium">
              {date.toLocaleString("default", { month: "long", year: "numeric" })}
            </div>
            
            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nextMonthButtonDisabled && "cursor-not-allowed opacity-30"
              )}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </button>
          </div>
        )}
        dayClassName={() => 
          cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal"
          )
        }
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
