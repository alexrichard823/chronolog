
// Fictional people only. Include half-siblings, remarriage, adoption and guardianship.
export const people = [
  { id: "joseph", display_name: "Joseph Linden", birth_date_display: "About 1928", death_date_display: "2004" },
  { id: "mary", display_name: "Mary Linden", birth_date_display: "1931", death_date_display: null },
  { id: "robert", display_name: "Robert Linden", birth_date_display: "1955", death_date_display: null },
  { id: "elena", display_name: "Elena Rivera", birth_date_display: "1958", death_date_display: null },
  { id: "sam", display_name: "Sam Brooks", birth_date_display: null, death_date_display: null },
  { id: "alex", display_name: "Alex Linden", birth_date_display: "1984", death_date_display: null },
  { id: "olivia", display_name: "Olivia Linden", birth_date_display: "1988", death_date_display: null },
  { id: "jordan", display_name: "Jordan Rivera", birth_date_display: "1995", death_date_display: null },
  { id: "emily", display_name: "Emily Linden", birth_date_display: "2010", death_date_display: null },
  { id: "casey", display_name: "Casey Montgomery-Linden-Worthington", birth_date_display: "Between January 1971 and December 1973", death_date_display: null },
  { id: "unconnected", display_name: "Taylor Outside Branch", birth_date_display: null, death_date_display: null },
];
const parent = (a, b, subtype = "biological") => ({ id: `${a}-${b}`, person_a_id: a, person_b_id: b, relationship_type: "parent_child", parent_child_subtype: subtype, partner_status: null });
const partner = (a, b, status = "married") => ({ id: `${a}-${b}`, person_a_id: a, person_b_id: b, relationship_type: "spouse_partner", parent_child_subtype: null, partner_status: status });
export const relationships = [
  partner("joseph", "mary"), parent("joseph", "robert"), parent("mary", "robert"),
  partner("robert", "elena", "divorced"), parent("robert", "alex"), parent("elena", "alex"),
  parent("robert", "olivia"), parent("elena", "olivia"),
  partner("elena", "sam"), parent("elena", "jordan"), parent("sam", "jordan"),
  parent("alex", "emily", "adoptive"), parent("casey", "emily", "guardian"),
];
