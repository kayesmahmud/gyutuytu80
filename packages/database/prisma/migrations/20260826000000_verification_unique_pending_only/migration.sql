-- The unique on (user_id, status) blocked a user from ever having two rows with
-- the same status, so re-rejecting a resubmitted individual verification crashed
-- with P2002 (and repeat approvals/renewals would too). The real rule is
-- "one PENDING request per user" — enforce exactly that with a partial unique index.

-- Local dev has this as a table constraint, prod as a plain unique index; drop both forms.
ALTER TABLE "individual_verification_requests" DROP CONSTRAINT IF EXISTS "unique_user_pending_request";
DROP INDEX IF EXISTS "unique_user_pending_request";

CREATE UNIQUE INDEX "unique_user_pending_request"
ON "individual_verification_requests" ("user_id")
WHERE "status" = 'pending';
