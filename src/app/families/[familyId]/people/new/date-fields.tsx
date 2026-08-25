"use client";

import { useState } from "react";

type Precision = "unknown" | "exact" | "year" | "approximate";

type DateFieldsProps = {
  prefix: "birth" | "death";
  label: string;
};

export default function DateFields({ prefix, label }: DateFieldsProps) {
  const [precision, setPrecision] = useState<Precision>("unknown");

  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">{label}</legend>

      <label htmlFor={`${prefix}Precision`} className="block text-sm text-gray-600">
        How precise is the date?
      </label>
      <select
        id={`${prefix}Precision`}
        name={`${prefix}Precision`}
        value={precision}
        onChange={(event) => setPrecision(event.target.value as Precision)}
        className="mt-2 w-full rounded border px-3 py-2"
      >
        <option value="unknown">Unknown</option>
        <option value="exact">Exact date</option>
        <option value="year">Year only</option>
        <option value="approximate">Approximate year</option>
      </select>

      {precision === "exact" && (
        <div className="mt-4">
          <label htmlFor={`${prefix}ExactDate`} className="block text-sm font-medium">
            Exact date
          </label>
          <input
            id={`${prefix}ExactDate`}
            name={`${prefix}ExactDate`}
            type="date"
            required
            className="mt-2 w-full rounded border px-3 py-2"
          />
        </div>
      )}

      {(precision === "year" || precision === "approximate") && (
        <div className="mt-4">
          <label htmlFor={`${prefix}Year`} className="block text-sm font-medium">
            {precision === "approximate" ? "Approximate year" : "Year"}
          </label>
          <input
            id={`${prefix}Year`}
            name={`${prefix}Year`}
            type="number"
            min="1"
            max="9999"
            inputMode="numeric"
            required
            className="mt-2 w-full rounded border px-3 py-2"
            placeholder="1930"
          />
          {precision === "approximate" && (
            <p className="mt-2 text-sm text-gray-500">
              Chronolog will display this as approximate instead of pretending the year is exact.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
