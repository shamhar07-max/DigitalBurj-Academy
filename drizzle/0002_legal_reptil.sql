CREATE TABLE `academy_awards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`body` text NOT NULL,
	`evidence_hash` text NOT NULL,
	`status` text NOT NULL,
	`reason` text,
	`verify_token` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_awards_verify_token_unique` ON `academy_awards` (`verify_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `award_user_course` ON `academy_awards` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `academy_notes` (
	`user_id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`source_id` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`expires` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlement_unique_source` ON `entitlements` (`user_id`,`course_id`,`source_id`);--> statement-breakpoint
CREATE TABLE `order_access` (
	`order_id` text PRIMARY KEY NOT NULL,
	`scopes` text NOT NULL,
	`duration_days` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_links` (
	`payment_intent` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_links_order_id_unique` ON `payment_links` (`order_id`);--> statement-breakpoint
CREATE TABLE `recipe_work` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`reviewer` text,
	`verifier` text,
	`feedback` text,
	`scores` text,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_user_mission` ON `recipe_work` (`user_id`,`mission_id`);