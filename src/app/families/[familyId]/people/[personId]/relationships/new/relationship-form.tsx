"use client";

import { useState } from "react";
import { createRelationshipAction } from "../actions";

type PersonOption = {
  id: string;
  display_name: string;
};

type RelationshipFormProps = {
  familyId: string;
  focalPersonId: string;
  focalPersonName: string;
  people: PersonOption[];
};

export default function RelationshipForm({
  familyId,
  focalPersonId,
  focalPersonName,
  people,
}: RelationshipFormProps) {
  const [relationshipToFocal, setRelationshipToFocal] = useState("parent");
  const [relativeMode, setRelativeMode] = useState(people.length > 0 ? "existing" : "new");

  return (
    <form action={createRelationshipAction} className="mt-8 space-y-6">
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="focalPersonId" value={focalPersonId} />
      <input type="hidden" name="relativeMode" value={relativeMode} />

      <div>
        <label htmlFor="relationshipToFocal" className="block text-sm font-medium">
          Relationship to {focalPersonName}
        </label>
        <select
          id="relationshipToFocal"
          name="relationshipToFocal"
          value={relationshipToFocal}
          onChange={(event) => setRelationshipToFocal(event.target.value)}
          className="mt-2 w-full rounded border px-3 py-2"
        >
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="spouse_partner">Spouse or partner</option>
        </select>
      </div>

      <fieldset className="rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Choose the relative</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={relativeMode === "existing"}
              onChange={() => setRelativeMode("existing")}
              disabled={people.length === 0}
            />
            Existing person
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={relativeMode === "new"}
              onChange={() => setRelativeMode("new")}
            />
            Create new person
          </label>
        </div>

        {relativeMode === "existing" ? (
          <div className="mt-4">
            <label htmlFor="existingRelativeId" className="block text-sm font-medium">
              Person
            </label>
            <select
              id="existingRelativeId"
              name="existingRelativeId"
              required
              className="mt-2 w-full rounded border px-3 py-2"
            >
              <option value="">Select a person</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.display_name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-4">
            <label htmlFor="newRelativeName" className="block text-sm font-medium">
              New person name
            </label>
            <input
              id="newRelativeName"
              name="newRelativeName"
              type="text"
              required
              maxLength={200}
              className="mt-2 w-full rounded border px-3 py-2"
              placeholder="Enter their name"
            />
            <p className="mt-2 text-sm text-gray-500">
              Chronolog will create this person and relationship together.
            </p>
          </div>
        )}
      </fieldset>

      {(relationshipToFocal === "parent" || relationshipToFocal === "child") && (
        <div>
          <label htmlFor="parentChildSubtype" className="block text-sm font-medium">
            Parent-child type
          </label>
          <select
            id="parentChildSubtype"
            name="parentChildSubtype"
            defaultValue="unspecified"
            className="mt-2 w-full rounded border px-3 py-2"
          >
            <option value="unspecified">Unspecified</option>
            <option value="biological">Biological</option>
            <option value="adoptive">Adoptive</option>
            <option value="step">Step</option>
            <option value="foster">Foster</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
      )}

      {relationshipToFocal === "spouse_partner" && (
        <div>
          <label htmlFor="partnerStatus" className="block text-sm font-medium">
            Partner status
          </label>
          <select
            id="partnerStatus"
            name="partnerStatus"
            defaultValue="partner"
            className="mt-2 w-full rounded border px-3 py-2"
          >
            <option value="partner">Partner</option>
            <option value="married">Married</option>
            <option value="separated">Separated</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="ended">Relationship ended</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-2 w-full rounded border px-3 py-2"
          placeholder="e.g. Married in 1959"
        />
      </div>

      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Add relationship
      </button>
    </form>
  );
}
