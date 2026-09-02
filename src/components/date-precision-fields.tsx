"use client";

import { useState } from "react";

type DatePrecision = "unknown" | "exact" | "approximate" | "range";

type Props = {
  legend: string;
  initialPrecision?: string | null;
  initialDateStart?: string | null;
  initialDateEnd?: string | null;
};

const supportedPrecisions: DatePrecision[] = ["unknown", "exact", "approximate", "range"];

export function DatePrecisionFields({
  legend,
  initialPrecision = "unknown",
  initialDateStart = null,
  initialDateEnd = null,
}: Props) {
  const normalizedInitial = supportedPrecisions.includes(initialPrecision as DatePrecision)
    ? (initialPrecision as DatePrecision)
    : "unknown";
  const [precision, setPrecision] = useState<DatePrecision>(normalizedInitial);

  return (
    <fieldset className="rounded border p-4">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <label htmlFor={`${legend.replaceAll(" ", "-").toLowerCase()}-precision`} className="mt-2 block text-sm">
        Precision
      </label>
      <select
        id={`${legend.replaceAll(" ", "-").toLowerCase()}-precision`}
        name="datePrecision"
        value={precision}
        onChange={(event) => setPrecision(event.target.value as DatePrecision)}
        className="mt-2 w-full rounded border px-3 py-2"
      >
        <option value="unknown">Unknown</option>
        <option value="exact">Exact date</option>
        <option value="approximate">Approximate year</option>
        <option value="range">Date range</option>
      </select>

      {precision === "exact" && (
        <div className="mt-4">
          <label htmlFor="exactDate" className="block text-sm">Exact date</label>
          <input id="exactDate" type="date" name="exactDate" required defaultValue={normalizedInitial === "exact" ? initialDateStart ?? "" : ""} className="mt-2 w-full rounded border px-3 py-2" />
        </div>
      )}

      {precision === "approximate" && (
        <div className="mt-4">
          <label htmlFor="approximateYear" className="block text-sm">Approximate year</label>
          <input id="approximateYear" type="number" min="1" max="9999" inputMode="numeric" name="approximateYear" required defaultValue={normalizedInitial === "approximate" ? initialDateStart?.slice(0, 4) ?? "" : ""} className="mt-2 w-full rounded border px-3 py-2" placeholder="1930" />
          <p className="mt-2 text-xs text-gray-500">Chronolog will display this as approximate instead of presenting it as an exact year.</p>
        </div>
      )}

      {precision === "range" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="rangeStart" className="block text-sm">Range start</label><input id="rangeStart" type="date" name="rangeStart" required defaultValue={normalizedInitial === "range" ? initialDateStart ?? "" : ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
          <div><label htmlFor="rangeEnd" className="block text-sm">Range end</label><input id="rangeEnd" type="date" name="rangeEnd" required defaultValue={normalizedInitial === "range" ? initialDateEnd ?? "" : ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
        </div>
      )}

      {precision === "unknown" && <p className="mt-3 text-xs text-gray-500">This item will appear with other undated stories and events.</p>}
    </fieldset>
  );
}
