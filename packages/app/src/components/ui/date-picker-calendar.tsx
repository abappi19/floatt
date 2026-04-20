import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export function DatePickerCalendar({
  weekStartsOn = 0,
  ...props
}: React.ComponentProps<typeof Calendar>) {
  return <Calendar weekStartsOn={weekStartsOn} {...props} />;
}
