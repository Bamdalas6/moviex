CREATE TABLE `cinemas` (
	`id` text PRIMARY KEY NOT NULL,
	`chain` text NOT NULL,
	`branch` text NOT NULL,
	`city` text NOT NULL,
	`country` text DEFAULT 'Nigeria' NOT NULL,
	`website` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cinemas_chain_branch_idx` ON `cinemas` (`chain`,`branch`);--> statement-breakpoint
CREATE TABLE `film_providers` (
	`film_id` text NOT NULL,
	`provider_id` integer NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`logo_path` text,
	`priority` integer DEFAULT 100 NOT NULL,
	PRIMARY KEY(`film_id`, `provider_id`, `kind`),
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `films` ADD `tmdb_id` integer;--> statement-breakpoint
ALTER TABLE `films` ADD `tmdb_poster_path` text;--> statement-breakpoint
ALTER TABLE `films` ADD `tmdb_backdrop_path` text;--> statement-breakpoint
ALTER TABLE `films` ADD `tmdb_rating` real;--> statement-breakpoint
ALTER TABLE `films` ADD `tmdb_votes` integer;--> statement-breakpoint
ALTER TABLE `films` ADD `release_date` text;--> statement-breakpoint
ALTER TABLE `films` ADD `now_playing` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `films` ADD `watch_link` text;--> statement-breakpoint
CREATE UNIQUE INDEX `films_tmdb_idx` ON `films` (`tmdb_id`);