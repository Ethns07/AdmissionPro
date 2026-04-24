# Firestore Security Specification - AdmissionPro

## Data Invariants
1. **Identity Integrity**: Users can only create their own profiles.
2. **Role Hierarchy**: Only Super Admins can promote users to Super Admin. Admins can manage Staff but not Super Admins.
3. **Application Ownership**: Students can only view and manage their own applications.
4. **Relational Sync**: Applications must refer to valid programs.
5. **Fee Integrity**: Fee structure must be map-based with numeric values.
6. **Temporal Consistency**: `createdAt` is immutable; `updatedAt` must be current server time.

## The "Dirty Dozen" Payloads (Targets for Rejection)
1. **Self-Promotion**: Student attempting to update their own `role` to `admin`.
2. **Identity Spoofing**: User A attempting to create an application with `studentUid` of User B.
3. **Shadow Field Injection**: Adding an `isVerified: true` field to a program document.
4. **Orphaned Application**: Creating an application for a `programId` that doesn't exist.
5. **Admin Lockdown**: Admin attempting to delete a Super Admin user document.
6. **Value Poisoning**: Updating `meritScore` with a 1MB string instead of a number.
7. **Temporal Fraud**: Setting `createdAt` to a future date instead of `request.time`.
8. **PII Leak**: Guest user attempting to list the `users` collection.
9. **Relational Break**: Deleting a category that still has active programs (logic-level, but rules should protect).
10. **State Skipping**: Student trying to move application status from `pending` to `enrolled`.
11. **Resource Exhaustion**: Document ID injection with 1.5KB string.
12. **Blanket Read Scam**: Authenticated user calling `collection('users').get()` without filters.

## The Test Runner
Tests are defined in `firestore.rules.test.ts` to verify these invariants.
