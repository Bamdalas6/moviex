-- Marquee is Nollywood only: Kannywood (Hausa-language) films are hidden too.
-- Hidden ('rejected'), not deleted, so ratings and reviews are kept and the change can be undone.
UPDATE `films` SET `status` = 'rejected' WHERE (`industry` = 'Kannywood' OR `language` = 'Hausa') AND `status` = 'published';
