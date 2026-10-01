CREATE TABLE `class_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`package_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'Booked' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `class_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`course_id` text NOT NULL,
	`starts_at` text NOT NULL,
	`minutes` integer DEFAULT 120 NOT NULL,
	`status` text DEFAULT 'Available' NOT NULL,
	`meeting_url` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_unique_slot` ON `class_slots` (`teacher_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `payment_providers` (
	`order_id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`reference` text,
	`body` text DEFAULT '{}' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_providers_reference_unique` ON `payment_providers` (`reference`);--> statement-breakpoint
CREATE TABLE `teaching_enrolments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`teacher_id` text,
	`status` text DEFAULT 'Awaiting teacher' NOT NULL,
	`preferences` text DEFAULT '' NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teaching_enrolments_order_id_unique` ON `teaching_enrolments` (`order_id`);--> statement-breakpoint
ALTER TABLE `order_access` ADD `teaching_plan` text DEFAULT '{}' NOT NULL;