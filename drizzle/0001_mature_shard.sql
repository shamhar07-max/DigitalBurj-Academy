CREATE TABLE `auth_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`auth_subject` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`goal` text NOT NULL,
	`hours` integer NOT NULL,
	`timezone` text NOT NULL,
	`consent_at` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_auth_subject_unique` ON `profiles` (`auth_subject`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject` text NOT NULL,
	`tokens` text NOT NULL,
	`provider_expiry` integer NOT NULL,
	`expires` integer NOT NULL,
	`created` text NOT NULL,
	`last_seen` text NOT NULL,
	`purpose` text DEFAULT 'normal' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`domains` text NOT NULL,
	`qualification` text NOT NULL,
	`expires` text NOT NULL,
	`status` text NOT NULL,
	`approved_by` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_invites_email_unique` ON `staff_invites` (`email`);