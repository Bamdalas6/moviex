CREATE TABLE `film_genres` (
	`film_id` text NOT NULL,
	`genre` text NOT NULL,
	PRIMARY KEY(`film_id`, `genre`),
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `film_genres_genre_idx` ON `film_genres` (`genre`);--> statement-breakpoint
CREATE TABLE `films` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`year` integer NOT NULL,
	`runtime_minutes` integer,
	`synopsis` text DEFAULT '' NOT NULL,
	`director` text,
	`cast` text DEFAULT '[]' NOT NULL,
	`industry` text DEFAULT 'Nollywood' NOT NULL,
	`language` text DEFAULT 'English' NOT NULL,
	`platform` text,
	`badge` text,
	`box_office_rank` integer,
	`poster_key` text,
	`poster_gradient` text NOT NULL,
	`poster_spoiler` integer DEFAULT false NOT NULL,
	`allow_reviews` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`uploaded_by_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `films_slug_idx` ON `films` (`slug`);--> statement-breakpoint
CREATE INDEX `films_status_idx` ON `films` (`status`);--> statement-breakpoint
CREATE INDEX `films_uploader_idx` ON `films` (`uploaded_by_id`);--> statement-breakpoint
CREATE TABLE `follows` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`follower_id`, `following_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follows_following_idx` ON `follows` (`following_id`);--> statement-breakpoint
CREATE TABLE `helpful_votes` (
	`user_id` text NOT NULL,
	`rating_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `rating_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rating_id`) REFERENCES `ratings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `helpful_rating_idx` ON `helpful_votes` (`rating_id`);--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`film_id` text NOT NULL,
	`score` integer NOT NULL,
	`headline` text,
	`body` text,
	`spoiler` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ratings_user_film_idx` ON `ratings` (`user_id`,`film_id`);--> statement-breakpoint
CREATE INDEX `ratings_film_idx` ON `ratings` (`film_id`);--> statement-breakpoint
CREATE INDEX `ratings_created_idx` ON `ratings` (`created_at`);--> statement-breakpoint
CREATE TABLE `review_reports` (
	`user_id` text NOT NULL,
	`rating_id` text NOT NULL,
	`reason` text DEFAULT 'inappropriate' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `rating_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rating_id`) REFERENCES `ratings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`bio` text,
	`location` text,
	`avatar_color` text DEFAULT '#FFB020' NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`favorite_genres` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `watchlist` (
	`user_id` text NOT NULL,
	`film_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `film_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON UPDATE no action ON DELETE cascade
);
