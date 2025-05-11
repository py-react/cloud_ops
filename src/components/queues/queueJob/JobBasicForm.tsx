import React from "react";
import { DatePicker } from "@/components/ui/date-picker";

export function JobBasicForm() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="queueName"
            className="block text-sm font-medium text-gray-700"
          >
            Queue Name
          </label>
          <input
            type="text"
            id="queueName"
            name="queueName"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Job Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="delay"
            className="block text-sm font-medium text-gray-700"
          >
            Delay (ms)
          </label>
          <input
            type="number"
            id="delay"
            name="delay"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="attempts"
            className="block text-sm font-medium text-gray-700"
          >
            Attempts
          </label>
          <input
            type="number"
            id="attempts"
            name="attempts"
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="tz"
            className="block text-sm font-medium text-gray-700"
          >
            Time Zone
          </label>
          <input
            type="text"
            id="tz"
            name="tz"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
