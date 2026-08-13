# Chronolog MVP Product Requirements Document

> Reference document for product scope, requirements, and build decisions.

| Field | Value |
| --- | --- |
| Product | Chronolog |
| Product type | Private, collaborative family-history and storytelling platform |
| Initial platform | Responsive web application |
| Primary users | Individuals and families preserving stories, memories, relationships, and historical records for future generations |

## 1. Product Summary

### Product vision

Chronolog gives families a permanent digital place to preserve not only who their relatives were, but what their lives were actually like. Users build a connected family history by adding people, relationships, events, stories, places, photographs, recordings, videos, and documents. The same information can then be explored through a family tree, a chronological timeline, and individual person profiles.

**Core value proposition:** Chronolog turns scattered family memories and media into a connected, private, explorable family story.

## 2. Problem Statement

Family history is usually fragmented across physical photo albums, phones and computers, video recordings, voice memos, paper documents, genealogy websites, social media accounts, and individual relatives' memories.

Traditional genealogy products often focus on names, dates, records, and biological relationships. They are useful for discovering ancestry, but they do not always make it easy to preserve the context behind a family's history.

A family may know that someone immigrated to the United States in 1930, but the most meaningful details may exist only in an older relative's memory:

- Why they left
- What the journey was like
- Who traveled with them
- Where they first lived
- What work they found
- What sacrifices they made
- What stories were passed down afterward

When older relatives die, this context can disappear permanently. Chronolog solves this by connecting factual family-history information with stories and media in one shared archive.

## 3. Target Users

### Primary user

An adult who wants to preserve the life stories of parents, grandparents, or other relatives.

Example: Alex wants to interview his grandparents, upload old photographs, document important family events, and create something future generations can explore.

### Secondary users

- Older relatives sharing their memories
- Family historians
- Parents preserving stories for their children
- Relatives collaborating on the same family archive
- Younger relatives learning about their ancestry
- Families organizing inherited photographs and documents

### Initial target market

The MVP should initially focus on families who already feel urgency around preserving stories, particularly those with aging parents or grandparents.

## 4. Product Principles

- **Story-first:** Preserve human experiences, not just dates and records.
- **Private by default:** Family information and uploaded media are available only to invited members.
- **Simple enough for all generations:** A relative should not need technical knowledge to add a story, upload a photograph, or listen to an interview.
- **Connected, not fragmented:** People, relationships, events, stories, places, and media connect to one another.
- **Flexible about uncertainty:** Users can record approximate dates, incomplete information, disputed accounts, and unknown details.
- **Collaborative without losing control:** Families can invite contributors while maintaining clear ownership and permissions.
- **Built for preservation:** Information should remain accessible and exportable over time.

## 5. Product Experience

Chronolog is a collaborative family-history archive built around four primary experiences:

- **Family tree:** Shows who is related to whom.
- **Timeline:** Shows what happened and when.
- **Person profiles:** Show an individual's life, relationships, stories, events, places, and media.
- **Family archive:** Stores and organizes photographs, recordings, videos, documents, and written stories.

These are different views of the same connected information, not separate databases. For example, a 1930 immigration event may appear on the family timeline, on each involved person's profile and timeline, inside a written story, and beside related interviews, documents, and photographs.

## 6. How Users Use Chronolog

1. Create a private family space.
2. Add people with basic identity and life information.
3. Connect people through family relationships.
4. Add important life events.
5. Write stories about people, events, places, or periods.
6. Upload photographs, audio, video, letters, certificates, and documents.
7. Link stories and media to the relevant people, events, and places.
8. Explore the family through the tree, timeline, profiles, archive, search, and filters.
9. Invite relatives as viewers or collaborators.

## 7. Core Product Systems

### 7.1 Family spaces

A family space is the top-level private workspace containing all people, relationships, stories, events, places, and media. A user may belong to multiple family spaces, each with its own members and permissions.

### 7.2 People

A person represents someone documented in family history. A person does not need a Chronolog account. A user may optionally connect their account to their own person profile.

- Required: display name and family space
- Optional: first, middle, last, maiden, and nickname; profile photo; birth/death dates and places; living/deceased status; short biography; notes

### 7.3 Relationships

MVP relationship types are parent, child, and spouse or partner. Sibling relationships should normally be inferred from shared parents rather than stored separately.

Relationship attributes may include biological, adoptive, step, foster, guardian, or unspecified. Spouse or partner relationships may include marriage, separation, divorce, and end dates plus notes.

Rules:

- No self-relationships
- Prevent duplicates
- Parent-child relationships work in both directions
- Support multiple marriages
- Support biological and adoptive parents
- Warn on obvious circular relationships
- Never assume every spouse is the parent of every child

### 7.4 Events

An event represents something that happened at a point in time or during a period. Types include birth, death, marriage, immigration, move, education, employment, military service, business, family milestone, historical event, and custom event.

Fields include title, description, type, date or range, date certainty, place, people involved, related stories, related media, and creator. An event can involve several people.

### 7.5 Stories

A story is a written narrative providing context around a person, event, location, or period. Fields include title, written content, author, people involved, related events, related places, approximate story date, cover media, creation date, and last edited date. A story may involve multiple people and events.

### 7.6 Media

Supported MVP formats are images, audio, video, and PDF documents. Fields include title, description, file, media type, date captured or created, people shown or involved, related events, related stories, uploader, and upload date. One media item can connect to multiple people, stories, and events.

### 7.7 Places

Places are meaningful locations connected to people and events. Fields include display name, city, state or region, country, optional coordinates, and notes. For the MVP, places can be basic text records; maps can come later.

## 8. Date and Uncertainty System

Chronolog must not force users to invent exact dates. Supported forms include:

- Exact date
- Month and year
- Year only
- Approximate date
- Date range
- Before a date
- After a date
- Unknown

Each record should store a sortable date value where possible plus its certainty or precision. Approximate dates must appear as approximate. Unknown dates appear in an **Undated stories and events** section.

## 9. Disputed Information

- Display each story's author.
- Record who created and last edited information.
- Allow information to be marked uncertain.
- Allow notes on records.
- Allow multiple stories about the same event.
- Do not automatically merge conflicting stories.
- Allow Editors and Admins to revise structured facts such as dates.
- Keep dispute handling simple instead of building a formal approval system.

Suggested corrections, sources and citations, version history, conflicting claims, and approval workflows may be added later.

## 10. Tree, Timeline, and Profile Views

### Family tree

The tree answers: **Who is connected to whom?** It opens centered on a selected person. Each person card shows a photo, name, and life dates. Selecting a card opens a quick preview with an option to open the full profile.

### Timeline

The timeline answers: **What happened, and when?** It defaults to one selected person and includes stories, events, and media. Users navigate through a vertical scroll with year and decade shortcuts. Items show relevant dates, people, places, descriptions, and thumbnails.

### Person profile

The profile answers: **Who was this person, and what happened throughout their life?** It leads with basic information, a biography or life summary, and chronological life events. Separate **Story**, **Timeline**, and **Media** tabs organize content. One **Add** button opens a menu for adding content.

## 11. User Roles and Permissions

Each family archive has exactly one Owner and may have multiple Admins.

### Owner

- All Admin capabilities
- Transfer ownership
- Delete the family archive
- Remove or demote the current Owner through the ownership-transfer process

### Admin

- View, add, edit, and delete family content
- Manage people and relationships
- Invite and remove members
- Change member roles, except the Owner role
- Manage family settings
- Cannot transfer ownership, delete the archive, or remove/demote the Owner

### Editor

- View, add, edit, organize, and delete family content
- Manage people, relationships, events, stories, and media
- Cannot manage the archive, members, roles, or family settings

### Contributor

- Add stories, media, and basic information
- Edit their own contributions
- Suggest corrections
- Cannot delete other members' work, restructure the entire tree, or manage settings

### Viewer

- View people and media
- Explore the tree and timeline
- Read stories
- Cannot add, edit, or delete content

If Contributor permissions materially delay the MVP, the initial release may launch with Owner, Admin, Editor, and Viewer.

## 12. Essential MVP Features

### 12.1 Authentication

- Register, log in, log out, and reset password
- Remain logged in across sessions
- Prevent logged-out users from accessing private family content

### 12.2 Family creation

- Create and name a family space
- Add a short description and cover image
- View families the user belongs to
- Make the creator the Owner

### 12.3 Family dashboard

- Show family name and cover image
- Emphasize recent family stories and media
- Show number of people, recent events, and recent uploads
- Include timeline and tree previews
- Provide add-person, add-story, and invite-family actions

### 12.4 Person profiles

- Add/edit a person; require only a name
- Add profile photograph and biography
- View relationships and personal timeline
- View connected stories and media

### 12.5 Relationship management

- Add parents, children, and spouses/partners
- Connect an existing person or create a person while adding a relationship
- Remove incorrect relationships
- Prevent obvious duplicates and impossible loops

### 12.6 Event creation

- Use a dedicated event form
- Choose an event type
- Add exact, approximate, or date-range information
- Connect multiple people
- Add place and description
- Attach media and stories
- Show the event on the family timeline and associated profiles

### 12.7 Story creation

- Use a dedicated story form selected after the user chooses to add a Story or Event
- Offer optional writing prompts users can open
- Connect one or more people and an event
- Add exact, approximate, or date-range information and place
- Attach media
- Display author and last updated date

### 12.8 Media upload

- Upload photographs, audio, videos, and PDFs
- Add title and description
- Identify people shown or heard
- Connect files to stories and events
- Preview supported media
- Keep uploaded files private

### 12.9 Timeline

- View stories, events, and media chronologically
- Open item details
- Filter by person, content/event type, and date range
- Distinguish exact and approximate dates
- Show unknown-date entries separately

### 12.10 Family tree

- View parent-child and spouse relationships
- Click a person and open a quick preview
- Zoom and pan
- Center the tree on a selected person
- Show a limited number of nearby generations

### 12.11 Invitations

- Invite a relative by email
- Assign a role
- Revoke a pending invitation
- Remove an existing member
- Allow the invitee to accept and join according to their role

## 13. Main Screens

### Public screens

- Landing page
- Registration
- Login
- Password reset
- Invitation acceptance

### User-level screens

- My families
- Create family
- Account settings

### Family-level screens

- Family dashboard
- Family tree
- Family timeline
- People directory
- Person profile
- Add/edit person
- Event page and add/edit event
- Stories directory
- Story page and add/edit story
- Media library and media detail
- Family members
- Family settings

## 14. Main User Flows

### Create a family archive

Register, create and name a family, optionally add a description and cover image, reach the empty dashboard, and receive a prompt to add the first person.

### Add a grandparent

Add a person, enter a name and birth information, upload a profile photo, write a short biography, and save the profile to the people directory.

### Add relatives

Open a profile, add a parent/child/spouse relationship, connect or create the related person, and update both profiles and the tree.

### Document an immigration story

Create an Immigration event, enter an approximate date such as "Around 1930," select people and a location, add a description and media, and create or attach a longer story. Show the result on the family timeline and relevant profiles.

### Invite a relative

An Owner or Admin enters an email and role. The relative accepts, registers or logs in, joins the family, and receives access according to their role.

## 15. User Value and Onboarding

Encourage users to:

- Start with living relatives
- Record interviews before memories are lost
- Add stories around major life events
- Identify people in old photographs
- Add context to documents
- Invite multiple relatives
- Build one family branch at a time
- Review unknown or incomplete information
- Revisit the archive regularly

Suggested prompts include asking about the oldest living relative, how grandparents met, a family's migration story, and the people shown in an old photograph.

## 16. Excluded From the MVP

- AI transcription, summaries, event extraction, or biographies
- Guided interview recording
- Public genealogy-record searches
- DNA, Ancestry, or FamilySearch integrations
- GEDCOM import/export
- Native iOS or Android apps
- Public profiles or social feeds
- Comments and reactions
- Face recognition or automatic relative matching
- Interactive migration maps
- Printed books or podcast publishing
- Time capsules
- Subscription billing
- Advanced citations or full revision history
- Formal dispute-resolution workflows

The MVP should prove that families want to create and revisit a connected storytelling archive. It should not attempt to become a complete genealogy platform.

## 17. Data Structure

### Core entities

- User
- Family
- Family Membership
- Invitation
- Person
- Relationship
- Event
- Story
- Media Item
- Place

### Suggested database tables

- `users`
- `families`
- `family_memberships`
- `invitations`
- `people`
- `relationships`
- `events`
- `event_people`
- `stories`
- `story_people`
- `story_events`
- `media_items`
- `media_people`
- `media_events`
- `media_stories`
- `places`
- `activity_log`

**Important design rule:** Do not store all information in a person's biography. People, stories, events, and media are separate records connected through relationships.

## 18. Privacy and Security Requirements

- Every family space is private by default.
- Users can access only families they belong to.
- The backend and database enforce permissions; hiding UI buttons is insufficient.
- Uploaded files use private storage and temporary authorized links.
- Removed members immediately lose access.
- Users cannot change their own roles.
- Important actions are logged.
- Family deletion requires explicit confirmation.
- Service credentials never appear in browser code.
- Files are validated for size and type.
- The product avoids publicly searchable pages.
- Owners should eventually be able to export family content.

## 19. Technical Approach

Build Chronolog as a responsive web application before native mobile apps.

Initial stack:

- TypeScript
- Next.js with React
- PostgreSQL through Supabase
- Supabase Authentication
- Private Supabase Storage
- Vercel hosting
- GitHub source control
- Codex for implementation assistance

A relational database fits Chronolog because its people, relationships, events, stories, places, and media form highly connected structured data.

## 20. Main Technical Challenges

- **Family-tree rendering:** Handle multiple marriages, half-siblings, adoption, step-relatives, unknown parents, and many generations by using an existing tree/graph library and limiting visible depth.
- **Relationship consistency:** Prevent duplicate relationships, self-parenting, circular ancestry, duplicate people, and spouse-parent assumptions.
- **Date uncertainty:** Preserve uncertainty while maintaining useful timeline sorting.
- **Media storage and cost:** Use size and format limits, thumbnails, private storage, upload progress, and reasonable quotas.
- **Permissions:** Protect every family-owned record and test multiple accounts and roles.
- **Performance:** Use pagination, lazy loading, thumbnails, limited tree depth, and filtered queries.
- **Duplicate people:** Warn on likely duplicates; postpone automatic merging.

## 21. MVP Success Criteria

A user can create an account and family, add a grandparent and relatives, record an immigration event dated approximately 1930, write a connected story, upload a photograph and audio interview, and see the information on the profile, timeline, and tree.

A second user can accept an invitation, log in, add another story, and lose access immediately when removed.

## 22. MVP Acceptance Test

1. Create an account and private family space.
2. Add Joseph Richard and Mary Richard.
3. Connect Joseph and Mary as spouses.
4. Add Robert Richard and connect Joseph and Mary as his parents.
5. Create an immigration event dated approximately 1930.
6. Connect Joseph and Mary to the event.
7. Write a story and connect it to the people and event.
8. Upload an immigration photograph and audio interview.
9. Connect both media items to the relevant records.
10. Confirm Joseph's profile displays the event, story, and media.
11. Confirm the family timeline displays the event correctly.
12. Confirm the family tree displays Joseph, Mary, and Robert correctly.
13. Invite a second user as an Editor.
14. Accept the invitation from the second account.
15. Add another story from that account and confirm both users can view it.
16. Remove the second user and confirm access is immediately revoked.

## 23. Recommended Build Order

1. **Foundation:** Repository, application setup, database connection, authentication, protected routes, and initial deployment.
2. **Family spaces:** Family creation, membership, dashboard, and role checks.
3. **People:** Add/edit people, directory, profiles, and photos.
4. **Relationships:** Parent-child and spouse connections plus validation.
5. **Events and stories:** Approximate dates, participants, stories, and connections.
6. **Media:** Private uploads, metadata, connections, and viewing.
7. **Timeline:** Family/person timelines, filters, and details.
8. **Family tree:** Visualization, zoom/pan, focal person, and navigation.
9. **Collaboration:** Invitations, roles, access removal, and recent activity.
10. **Pilot launch:** Mobile, permissions, uploads, errors, policies, and onboarding.

## 24. Definition of Done

- Users can securely register and log in.
- Users can create private family spaces.
- People can be added and edited.
- Parent, child, and spouse relationships work.
- Events support exact and approximate dates.
- Stories connect to several people and events.
- Private media can be uploaded and viewed.
- Timeline and tree views display connected information correctly.
- Owners and Admins can invite and remove users according to policy.
- Roles prevent unauthorized actions.
- Removed users lose access immediately.
- The complete acceptance test passes.
- The app works on desktop and mobile browsers.
- At least one real family successfully uses it.

The central MVP question is not whether Chronolog can contain every genealogy feature. It is whether a family can use it to preserve a meaningful story that would otherwise have been lost.
