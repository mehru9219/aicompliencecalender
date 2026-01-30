# Feature Specification: Industry Compliance Templates

**Feature Branch**: `005-industry-templates`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a library of pre-configured compliance templates that give new users an instant starting point with all standard deadlines for their industry already set up."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Industry During Onboarding (Priority: P1)

A new user creating their account selects their industry (e.g., "Healthcare - Medical Practice") and the system shows them the relevant compliance template with pre-configured deadlines.

**Why this priority**: Industry selection gates access to templates - this is the entry point for the entire feature.

**Independent Test**: Can be tested by selecting an industry and verifying the correct template is displayed.

**Acceptance Scenarios**:

1. **Given** a new user in onboarding, **When** they select "Healthcare - Medical Practice", **Then** they see the healthcare template with items like HIPAA training, DEA renewal, etc.
2. **Given** the industry selection screen, **When** displayed, **Then** it shows all supported industries with brief descriptions.
3. **Given** a user unsure of their category, **When** they select "Generic (Custom Setup)", **Then** they skip templates and start with an empty system.

---

### User Story 2 - Import Template Deadlines (Priority: P1)

A healthcare practice owner reviews the template deadlines and imports selected items to their account, customizing the actual due dates based on their renewal schedule.

**Why this priority**: Import is the core value delivery - turning templates into actionable deadlines.

**Independent Test**: Can be tested by selecting template items, entering due dates, and verifying deadlines are created.

**Acceptance Scenarios**:

1. **Given** a template with 15 deadlines, **When** user selects 10 to import, **Then** only those 10 are created in their account.
2. **Given** a selected template item "Medical License Renewal", **When** user enters their renewal date of June 15, **Then** the deadline is created with that date and annual recurrence.
3. **Given** imported deadlines, **When** created, **Then** they include template-provided descriptions and recommended alert schedules.

---

### User Story 3 - View Template Documentation (Priority: P2)

A compliance manager reading the template wants to understand why "CLIA Certificate Renewal" is included and what happens if they miss it.

**Why this priority**: Documentation builds trust and educates users, but requires templates to exist first.

**Independent Test**: Can be tested by viewing template item details and verifying documentation is displayed.

**Acceptance Scenarios**:

1. **Given** a template deadline, **When** user clicks "Learn More", **Then** they see: what it is, why it matters, consequences of missing, and regulatory source link.
2. **Given** template documentation, **When** displayed, **Then** it cites the specific regulation (e.g., "42 CFR Part 493 - CLIA regulations").
3. **Given** a complex requirement, **When** documented, **Then** it includes plain-language explanation accessible to non-compliance-experts.

---

### User Story 4 - Receive Template Update Notifications (Priority: P2)

A dental practice that imported templates 6 months ago receives a notification that OSHA requirements have changed and should review their deadlines.

**Why this priority**: Updates keep users current with regulatory changes - critical for ongoing value.

**Independent Test**: Can be tested by updating a template and verifying users who imported it receive notifications.

**Acceptance Scenarios**:

1. **Given** a template the user imported from, **When** that template is updated, **Then** the user receives a notification explaining the change.
2. **Given** an update notification, **When** user views it, **Then** they see: what changed, why, and options to add/update deadlines.
3. **Given** a user who dismisses an update, **When** they later want to review, **Then** they can find past update notifications in a history view.

---

### User Story 5 - Share Custom Templates (Priority: P3)

A multi-location dental group creates a customized template combining standard dental requirements with their specific corporate policies and shares it with their other locations.

**Why this priority**: Sharing enables community value but requires templates to be used first.

**Independent Test**: Can be tested by creating a custom template, sharing it, and verifying another user can import it.

**Acceptance Scenarios**:

1. **Given** an organization's customized deadline set, **When** user clicks "Save as Template", **Then** they can name it and mark it shareable.
2. **Given** a shared template, **When** another organization searches community templates, **Then** they can find and preview it.
3. **Given** shared templates, **When** browsed, **Then** they show ratings, import count, and creator organization (if public).

---

### Edge Cases

- What happens when a user imports a template item that conflicts with an existing deadline?
- How does the system handle templates for multi-state organizations with different requirements?
- What happens when a template is updated but the user has significantly customized their imported deadlines?
- How does the system verify the accuracy of community-shared templates?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide industry selection during onboarding with categories: Healthcare, Dental, Mental Health, Legal, Financial Services, Insurance, Real Estate, Pharmacy, Laboratory, Home Health, Generic.
- **FR-002**: System MUST provide pre-built compliance templates for each supported industry.
- **FR-003**: Each template MUST include standard compliance deadlines with: title, description, typical recurrence, recommended alert schedule, and documentation.
- **FR-004**: Template documentation MUST cite regulatory sources for each requirement.
- **FR-005**: System MUST allow users to select which template items to import (not all-or-nothing).
- **FR-006**: System MUST allow users to customize due dates during import based on their actual renewal dates.
- **FR-007**: System MUST calculate recurrence from the entered due date for imported deadlines.
- **FR-008**: System MUST track which template a deadline was imported from.
- **FR-009**: System MUST notify users when templates they imported from are updated due to regulatory changes.
- **FR-010**: Template update notifications MUST explain: what changed, why, and recommended actions.
- **FR-011**: System MUST allow organizations to create custom templates from their deadline configurations.
- **FR-012**: System MUST allow organizations to share custom templates with a community library.
- **FR-013**: Community templates MUST display ratings and import statistics.
- **FR-014**: System MUST review templates quarterly for regulatory updates.
- **FR-015**: System MUST allow users to skip templates and start with empty system (Generic option).

### Key Entities

- **Industry**: Category classification for template matching (Healthcare, Dental, etc.).
- **Compliance Template**: Collection of pre-configured deadline definitions for an industry.
- **Template Item**: Single deadline definition within a template with metadata and documentation.
- **Template Import Record**: Link between a user's deadline and the template item it was imported from.
- **Template Update**: Record of changes to a template with notification to affected users.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80% of new users select an industry template during onboarding.
- **SC-002**: Users can review and import a template in under 5 minutes.
- **SC-003**: Template documentation is readable by non-compliance-experts (8th grade reading level).
- **SC-004**: Template updates reach affected users within 24 hours of regulatory change documentation.
- **SC-005**: Community templates achieve 70%+ usefulness rating from importers.
- **SC-006**: Templates cover 90%+ of standard compliance requirements for each supported industry.
- **SC-007**: Users report 80%+ time savings vs. manually researching requirements.

## Assumptions

- Initial template library focuses on US regulations; international expansion is future scope.
- Templates provide starting points; users must verify applicability to their specific situation.
- "Quarterly regulatory review" is performed by product team, not automated.
- Community templates are user-generated content; system provides ratings but not verification.
- Multi-state organizations may need to import multiple templates and customize.

## Clarifications

### Session 2026-01-28

- Q: When importing a template item that matches an existing deadline (same title)? → A: Prompt user to choose: skip, merge, or create duplicate - user knows their context best
- Q: How should the system handle organizations operating in multiple states? → A: Manual multi-template import with deduplication logic - simplest for MVP
- Q: How are community-shared templates verified for accuracy? → A: No verification, ratings and "use at your own risk" disclaimer - doesn't scale otherwise
- Q: When a template is updated but user has heavily customized imported deadlines? → A: Notify only, user must manually review changes - preserves user control

### Integrated Decisions

**Template Conflict Resolution**:
```typescript
// During import, if title match found:
const action = await promptUser({
  title: 'Deadline Already Exists',
  message: `"${templateDeadline.title}" already exists in your system.`,
  options: ['Skip', 'Update existing', 'Create duplicate'],
});
```

**Multi-State Import**: Allow importing multiple templates with automatic deduplication:
```typescript
// During import, skip if exact match exists
if (existingDeadlines.some(d =>
  d.title === templateDeadline.title &&
  d.category === templateDeadline.category
)) {
  skipped.push(templateDeadline);
  continue;
}
```

**Community Template Disclaimer**:
```tsx
<Badge variant="outline">Community Template</Badge>
<p className="text-xs text-gray-500">
  Not verified by ComplianceCalendar. Review requirements before use.
</p>
```

**Template Update Notification**:
- Notify affected users when template is updated
- Show changelog link
- User decides whether to apply changes to their customized deadlines
- No automatic updates to user deadlines
