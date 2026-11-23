-- International co-productions where Nigeria is one of five or more countries aren't Nollywood films:
-- ABCs of Death 2 (11-country anthology), Ezra, Who Will Start Another Fire, MUSCLE.
-- Hidden ('rejected'), not deleted, so ratings and reviews are kept and the change can be undone.
UPDATE `films` SET `status` = 'rejected' WHERE `tmdb_id` IN (193726, 22366, 835525, 1573395) AND `status` = 'published';
