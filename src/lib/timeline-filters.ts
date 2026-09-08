export type TimelinePerson = { id: string; display_name: string };

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export function searchTimelinePeople(people: TimelinePerson[], query: string) {
  const words = normalizeName(query).split(/\s+/).filter(Boolean);
  return people.filter((person) => {
    const name = normalizeName(person.display_name);
    return words.every((word) => name.includes(word));
  });
}

export function readableEventType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function timelineHref(familyId: string, personId = "", eventType = "", page = 1) {
  const params = new URLSearchParams();
  if (personId) params.set("person", personId);
  if (eventType) params.set("type", eventType);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/families/${familyId}/timeline${query ? `?${query}` : ""}`;
}
