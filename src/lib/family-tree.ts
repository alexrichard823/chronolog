import type {
  FamilyGraph,
  FamilyParentChildLink,
  FamilyPartnershipGroup,
  FamilyGuardianshipLink,
  FamilyRelationshipStatus,
  ParentageRelation,
  PartnershipRelation,
} from "@memoir/tree";

export type TreePersonRecord = {
  id: string;
  display_name: string;
  birth_date_display: string | null;
  death_date_display: string | null;
};

export type TreeRelationshipRecord = {
  id: string;
  relationship_type: "parent_child" | "spouse_partner";
  person_a_id: string;
  person_b_id: string;
  parent_child_subtype: string | null;
  partner_status: string | null;
};

export type ChronologTreePerson = TreePersonRecord & {
  lifeDates: string;
};

function pairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

function lifeDates(person: TreePersonRecord) {
  if (person.birth_date_display && person.death_date_display) {
    return `${person.birth_date_display} – ${person.death_date_display}`;
  }
  if (person.birth_date_display) return `Born ${person.birth_date_display}`;
  if (person.death_date_display) return `Died ${person.death_date_display}`;
  return "Life dates unknown";
}

function parentageRelation(subtype: string | null): ParentageRelation {
  if (subtype === "biological" || subtype === "adoptive" || subtype === "step" || subtype === "foster") {
    return subtype;
  }
  return "unknown";
}

function partnershipRelation(status: string | null): PartnershipRelation {
  return status === "married" || status === "separated" || status === "divorced" || status === "widowed"
    ? "spouse"
    : "partner";
}

function partnershipStatus(status: string | null): FamilyRelationshipStatus {
  if (status === "separated") return "separated";
  if (status === "divorced") return "divorced";
  if (status === "widowed" || status === "ended") return "former";
  return "current";
}

export function buildChronologFamilyGraph({
  people,
  relationships,
  subjectId,
}: {
  people: TreePersonRecord[];
  relationships: TreeRelationshipRecord[];
  subjectId: string;
}): FamilyGraph<ChronologTreePerson> {
  const graphPeople = Object.fromEntries(
    people.map((person) => [
      person.id,
      {
        ...person,
        lifeDates: lifeDates(person),
      },
    ]),
  );

  const explicitPartnerRelationships = relationships.filter(
    (relationship) => relationship.relationship_type === "spouse_partner",
  );

  const partnershipGroups: FamilyPartnershipGroup[] = explicitPartnerRelationships.map((relationship) => ({
    id: `partner:${relationship.id}`,
    partners: [relationship.person_a_id, relationship.person_b_id],
    relation: partnershipRelation(relationship.partner_status),
    status: partnershipStatus(relationship.partner_status),
  }));

  const explicitGroupByPair = new Map(
    explicitPartnerRelationships.map((relationship) => [
      pairKey(relationship.person_a_id, relationship.person_b_id),
      `partner:${relationship.id}`,
    ]),
  );

  const parentChildRelationships = relationships.filter(
    (relationship) => relationship.relationship_type === "parent_child",
  );
  const lineageRelationships = parentChildRelationships.filter(
    (relationship) => relationship.parent_child_subtype !== "guardian",
  );

  const parentsByChild = new Map<string, TreeRelationshipRecord[]>();
  for (const relationship of lineageRelationships) {
    const existing = parentsByChild.get(relationship.person_b_id) ?? [];
    existing.push(relationship);
    parentsByChild.set(relationship.person_b_id, existing);
  }

  const inferredCoparentGroups = new Map<string, string>();
  for (const parentLinks of parentsByChild.values()) {
    if (parentLinks.length !== 2) continue;
    const firstParent = parentLinks[0].person_a_id;
    const secondParent = parentLinks[1].person_a_id;
    const key = pairKey(firstParent, secondParent);
    if (explicitGroupByPair.has(key) || inferredCoparentGroups.has(key)) continue;
    const groupId = `coparent:${key}`;
    inferredCoparentGroups.set(key, groupId);
    partnershipGroups.push({
      id: groupId,
      partners: [firstParent, secondParent],
      relation: "coparent",
      status: "current",
    });
  }

  const guardianshipLinks: FamilyGuardianshipLink[] = [];
  const parentChildLinks: FamilyParentChildLink[] = [];

  for (const relationship of parentChildRelationships) {
    if (relationship.parent_child_subtype === "guardian") {
      guardianshipLinks.push({
        id: relationship.id,
        guardianId: relationship.person_a_id,
        childId: relationship.person_b_id,
        relation: "guardian",
        status: "current",
      });
      continue;
    }

    const parentLinksForChild = parentsByChild.get(relationship.person_b_id) ?? [];
    let groupId: string | undefined;

    for (const other of parentLinksForChild) {
      if (other.id === relationship.id) continue;
      const key = pairKey(relationship.person_a_id, other.person_a_id);
      groupId = explicitGroupByPair.get(key) ?? inferredCoparentGroups.get(key);
      if (groupId) break;
    }

    parentChildLinks.push({
      id: relationship.id,
      groupId,
      parentId: relationship.person_a_id,
      childId: relationship.person_b_id,
      relation: parentageRelation(relationship.parent_child_subtype),
      status: "current",
    });
  }

  return {
    people: graphPeople,
    subject: subjectId,
    partnershipGroups,
    parentChildLinks,
    guardianshipLinks,
  };
}
