CREATE TABLE `youtube_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`language` text,
	`kind` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channels_slug_idx` ON `youtube_channels` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `channels_url_idx` ON `youtube_channels` (`url`);--> statement-breakpoint
CREATE TABLE `film_people` (
	`film_id` text NOT NULL,
	`person_id` text NOT NULL,
	`role` text NOT NULL,
	`character` text,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`film_id`, `person_id`, `role`),
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `film_people_person_idx` ON `film_people` (`person_id`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`tmdb_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`known_for` text,
	`headline` text,
	`biography` text,
	`bio_source` text,
	`wikipedia_url` text,
	`tmdb_profile_path` text,
	`photo_url` text,
	`birthday` text,
	`place_of_birth` text,
	`instagram` text,
	`x` text,
	`facebook` text,
	`tiktok` text,
	`youtube` text,
	`website` text,
	`imdb_id` text,
	`popularity` real DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_tmdb_idx` ON `people` (`tmdb_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `people_slug_idx` ON `people` (`slug`);--> statement-breakpoint
CREATE INDEX `people_name_idx` ON `people` (`name`);--> statement-breakpoint
ALTER TABLE `films` ADD `trailer_channel` text;--> statement-breakpoint
ALTER TABLE `films` ADD `trailer_channel_url` text;