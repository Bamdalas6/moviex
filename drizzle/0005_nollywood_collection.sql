ALTER TABLE `people` ADD `gender` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `people` ADD `rank` integer;--> statement-breakpoint
CREATE INDEX `people_rank_idx` ON `people` (`rank`);