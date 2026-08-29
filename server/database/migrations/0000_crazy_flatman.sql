CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employee_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`date` text NOT NULL,
	`sales_value` real NOT NULL,
	`units` integer NOT NULL,
	`clients_served` integer NOT NULL,
	`target` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_sales_employee_date_idx` ON `employee_sales` (`employee_id`,`date`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`color` text NOT NULL,
	`company_id` text NOT NULL,
	`weekly_hours` integer NOT NULL,
	`vacation_days_per_year` integer NOT NULL,
	`store_id` text,
	`managed_store_ids` text,
	`photo_url` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `monthly_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`month` text NOT NULL,
	`target` real NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_targets_store_month_idx` ON `monthly_targets` (`store_id`,`month`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	`read` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shift_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`date` text NOT NULL,
	`changed_by_employee_id` text NOT NULL,
	`changed_at` text NOT NULL,
	`previous_label` text NOT NULL,
	`new_label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text,
	`end_time` text,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shifts_employee_date_idx` ON `shifts` (`employee_id`,`date`);--> statement-breakpoint
CREATE TABLE `store_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`date` text NOT NULL,
	`target` real NOT NULL,
	`achieved` real NOT NULL,
	`total_clients` integer NOT NULL,
	`total_receipts` integer NOT NULL,
	`returns` integer NOT NULL,
	`units` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_sales_store_date_idx` ON `store_sales` (`store_id`,`date`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vacation_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`action` text NOT NULL,
	`changed_by_employee_id` text NOT NULL,
	`changed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vacations` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weekly_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`week_start` text NOT NULL,
	`target` real NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_targets_store_week_idx` ON `weekly_targets` (`store_id`,`week_start`);