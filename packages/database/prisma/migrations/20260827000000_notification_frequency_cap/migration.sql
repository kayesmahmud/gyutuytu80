-- Records whether this notification actually resulted in an FCM push being
-- delivered, as opposed to only landing in the in-app notification centre.
--
-- The shared engagement frequency cap (see notificationPolicy.ts) counts ONLY
-- pushed rows. Without this column a silenced notification would still write a
-- log row, that row would then block the next notification, and the cap would
-- cascade into a permanent mute instead of a 48-hour spacing rule.
--
-- Existing rows default to true: every historical notification predates the cap
-- and was pushed unless its call site passed sendPush:false, which is a small
-- enough set that back-filling it precisely is not worth a table rewrite.
ALTER TABLE notification_log
  ADD COLUMN pushed BOOLEAN NOT NULL DEFAULT true;
