-- Marquee is Nollywood only: Nigerian films, including Hausa-language Kannywood.
-- Films from other industries are hidden (status 'rejected'), not deleted, so ratings and reviews
-- on them are kept and the change can be undone. The importer no longer brings them in.
UPDATE `films` SET `status` = 'rejected' WHERE `industry` NOT IN ('Nollywood', 'Kannywood') AND `status` = 'published';--> statement-breakpoint
-- The cinema directory is Nigerian cinemas only.
DELETE FROM `cinemas` WHERE `country` <> 'Nigeria';
