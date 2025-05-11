import React, { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";

export function JobRepeatForm() {
  const [enableRepeat, setEnableRepeat] = useState(false);
  const [repeatType, setRepeatType] = useState<"interval" | "cron">("interval");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Repeat Configuration
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="enableRepeat"
            value="true"
            className="sr-only peer"
            checked={enableRepeat}
            onChange={(e) => setEnableRepeat(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enableRepeat && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="repeatType"
                value="interval"
                checked={repeatType === "interval"}
                onChange={() => setRepeatType("interval")}
                className="text-blue-600"
              />
              <span className="ml-2">Interval</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="repeatType"
                value="cron"
                checked={repeatType === "cron"}
                onChange={() => setRepeatType("cron")}
                className="text-blue-600"
              />
              <span className="ml-2">Cron</span>
            </label>
          </div>

          {repeatType === "interval" ? (
            <div key="interval" className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="every"
                  className="block text-sm font-medium text-gray-700"
                >
                  Interval (ms)
                </label>
                <input
                  type="number"
                  id="every"
                  name="every"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div key="cron" className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cron"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cron Expression
                </label>
                <input
                  type="text"
                  id="cron"
                  name="cron"
                  placeholder="* * * * *"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>
                <DatePicker
                  initialDate={new Date().toISOString()}
                  name="startDate"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <DatePicker
                initialDate={new Date().toISOString()}
                name="endDate"
              />
            </div>
            <div>
              <label
                htmlFor="limit"
                className="block text-sm font-medium text-gray-700"
              >
                Limit
              </label>
              <input
                type="number"
                id="limit"
                name="limit"
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
