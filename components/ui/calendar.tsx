"use client"

// --- Import SyntheticEvent ---
import * as React from "react"
import { SyntheticEvent } from "react" // Import SyntheticEvent
// --- End Import ---
import { ChevronLeft, ChevronRight } from "lucide-react"
// --- Remove Locale from this import ---
import DatePicker, { registerLocale } from "react-datepicker"
// --- Import Locale from date-fns ---
import { Locale } from "date-fns"
// --- Import the specific locale object ---
import { enUS } from "date-fns/locale"
import "react-datepicker/dist/react-datepicker.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Register the locale
registerLocale("en-US", enUS)

// --- Define simpler props specific to this Calendar component ---
export type CalendarProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'value'> & {
  value?: Date | null;
  onChange?: (date: Date | null) => void; // Expect single date or null
  locale?: Locale; // Allow passing locale (Type comes from date-fns)
  // Add other specific DatePicker props you might need to pass through
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  // Include other props from DatePickerPropsType if explicitly needed
}
// --- End simpler props definition ---

function Calendar({
  value,
  onChange, // This is the function passed from the parent
  className,
  locale = enUS, // Default locale (Object comes from date-fns/locale)
  ...props // Capture remaining props
}: CalendarProps) {

  // --- Destructure potentially conflicting props ---
  // Cast props to any to safely access selectsRange if it exists
  const { selectsRange, ...restProps } = props as any;
  // --- End destructuring ---

  return (
    <div className={cn("p-3", className)}>
      <DatePicker
        selected={value}
        // --- Add type annotation for event ---
        onChange={(date: Date | null, event: SyntheticEvent<any> | undefined) => {
        // --- End type annotation ---
          // Call the onChange passed from the parent with the received date
          onChange?.(date);
        }}
        locale={locale} // Use the passed or default locale
        inline
        calendarClassName="border-none shadow-none"
        // --- Explicitly set selectsRange to false ---
        selectsRange={false}
        // --- End explicit set ---
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          // ... custom header JSX (remains the same) ...
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
        // --- Spread only the REST of the props ---
        {...restProps}
        // --- End spread ---
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
