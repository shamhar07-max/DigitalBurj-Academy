CREATE TABLE `launch_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`email` text,
	`user_id` text,
	`domains` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'Needs details' NOT NULL,
	`qualification` text DEFAULT '' NOT NULL,
	`expires` text,
	`approved_by` text,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `launch_accounts_email_unique` ON `launch_accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `launch_accounts_user_id_unique` ON `launch_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `learning_plans` (
	`user_id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`course_id` text,
	`programme_id` text,
	`hours` integer NOT NULL,
	`days` text NOT NULL,
	`timezone` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
