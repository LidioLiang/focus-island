CREATE TABLE `room_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_skin` integer DEFAULT 0 NOT NULL,
	`room_id` text NOT NULL,
	`current_seat_id` integer,
	`state` text DEFAULT 'present' NOT NULL,
	`activity` text DEFAULT '专注中' NOT NULL,
	`entered_at` integer NOT NULL,
	`focus_started_at` integer,
	`heartbeat_at` integer NOT NULL,
	`lease_expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seat_leases` (
	`room_id` text NOT NULL,
	`seat_id` integer NOT NULL,
	`session_id` text NOT NULL,
	`guest_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_skin` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL,
	`activity` text DEFAULT '专注中' NOT NULL,
	`transition_started_at` integer NOT NULL,
	`focus_started_at` integer,
	`heartbeat_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`from_seat_id` integer,
	PRIMARY KEY(`room_id`, `seat_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seat_leases_session_seat_unique` ON `seat_leases` (`session_id`,`seat_id`);