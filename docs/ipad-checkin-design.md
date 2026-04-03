# iPad Check-In Design

Date: 2026-04-02

## Goal

Add a touch-first training check-in flow for iPad use during class.

The experience should be:

- fast
- simple
- hard to use incorrectly
- clearly separate from the normal admin training view

## Product Decisions

- Coach must open the check-in mode first.
- Check-in is one-way during student use.
- The page always works against today's training session.
- If today's session does not exist, it is created when coach opens check-in.
- After a student checks in, the UI shows a clear success confirmation.

## Recommended Approach

Create a dedicated `check-in` route rather than extending the current admin-oriented training page.

This keeps the admin workflow and student workflow separate:

- admin training view stays flexible and information-dense
- check-in view becomes touch-first and highly focused

## Route and Access

Recommended route:

- `/dashboard/check-in`

Access model:

- coach must already be authenticated
- coach opens the check-in page and starts the session
- once opened, the iPad can remain on that screen for students to use

## Flow

1. Coach opens the check-in page.
2. Page shows today's date and a clear action such as `Öppna incheckning för idag`.
3. When opened, the app ensures today's training session exists.
4. The screen switches into student-facing check-in mode.
5. Student searches for their name.
6. Student taps their name card.
7. Attendance is saved immediately.
8. A clear confirmation appears for a short moment.
9. The student is shown as already checked in and cannot be checked in again by mistake.

## UI Direction

The check-in view should feel more like a kiosk than a dashboard.

Key traits:

- large type
- large tap targets
- strong spacing
- very few controls
- strong visual feedback

Suggested layout:

- top area with date and current training status
- one primary coach control before check-in mode starts
- large centered search field
- results displayed as large cards or large list rows
- checked-in students shown with a strong completed state
- temporary confirmation overlay or banner after successful check-in

## Data Behavior

The view uses the existing `training_sessions` and `session_attendance` model.

Rules:

- today's session is identified by current date
- create session if missing when coach opens check-in
- checking in adds the student to today's session attendance
- repeated taps on an already checked-in student do not remove them
- the standard training admin page still allows later manual adjustments

## Error Handling

The view should stay calm and obvious under failure.

Recommended states:

- if creating today's session fails, show a coach-facing error and keep the page locked
- if check-in fails, show a large short error message and do not mark the student as checked in
- if no search results match, show a simple empty state
- if the network is slow, show a visible saving state on the tapped card

## Responsive Focus

Primary target:

- iPad portrait

Secondary target:

- iPad landscape
- smaller tablet widths

The page should not rely on hover and should remain fully usable with touch only.

## Success Criteria

- coach can open check-in for the day with one clear action
- students can find and check in with minimal effort
- already checked-in students are clearly indicated
- accidental double-check-in does not break the flow
- admin can still manage attendance in the existing training page
- implementation preserves current test and build health
