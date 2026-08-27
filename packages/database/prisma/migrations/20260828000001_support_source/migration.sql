-- Live Chat: same support_tickets system, presented as one continuous
-- conversation instead of a subject+category ticket form. The source column
-- tells the two apart so Live Chat always resumes its own thread (and never
-- hijacks a real ticket about, say, a payment).
ALTER TABLE "support_tickets" ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'ticket';
CREATE INDEX "idx_support_tickets_source" ON "support_tickets"("source");
