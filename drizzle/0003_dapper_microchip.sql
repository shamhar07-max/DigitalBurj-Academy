CREATE TABLE `payment_receipts` (
	`order_id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`refunded_amount` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `order_access` ADD `product_title` text DEFAULT '' NOT NULL;