DROP INDEX `payment_providers_reference_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `provider_reference_unique` ON `payment_providers` (`provider`,`reference`);