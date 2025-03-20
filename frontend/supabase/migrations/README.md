# Monitor SaaS Database Migrations

This directory contains the database migrations for the Monitor SaaS application. The migrations are designed to be run in order, with each migration building on the previous one.

## Migration Overview

### 20250319130000_enhance_monitors_and_notifications.sql
- Enhances the `monitor_types` table with additional fields
- Updates existing monitor types with more detailed configuration
- Adds new columns to the `monitors` table for type-specific configuration
- Creates a `notification_methods` table with default methods (email, SMS, voice, mobile)
- Creates a `monitor_notifications` table to link monitors with notification methods
- Adds RLS policies for the new tables
- Adds functions to get and manage notifications

### 20250319130100_monitor_events_and_history.sql
- Creates a `monitor_event_type` enum for different event types
- Creates a `monitor_events` table to track all events related to monitors
- Creates a `monitor_history` table to store historical status data
- Adds RLS policies for the new tables
- Adds functions to get and record monitor events and history
- Adds triggers to automatically record events for monitor changes

### 20250319130200_ssl_and_domain_monitoring.sql
- Creates tables for SSL certificate monitoring
- Creates tables for domain expiration monitoring
- Adds RLS policies for the new tables
- Adds functions to get and update SSL certificate and domain information
- Updates the `get_monitor` function to include SSL and domain information

### 20250319130300_backward_compatibility.sql
- Sets default `monitor_type_id` for existing monitors
- Makes `monitor_type_id` NOT NULL with default value
- Creates helper functions to work with the enhanced monitor form:
  - `process_monitor_notifications`: Handles notification methods from the form
  - `create_enhanced_monitor`: Wrapper function for creating monitors with the enhanced form
  - `update_enhanced_monitor`: Wrapper function for updating monitors with the enhanced form

## Database Schema

### Main Tables
- `monitors`: Stores the main monitor configuration
- `monitor_types`: Defines different types of monitors (HTTP, ping, port, etc.)
- `monitor_notifications`: Links monitors with notification methods
- `notification_methods`: Defines different notification methods (email, SMS, voice, mobile)
- `monitor_events`: Tracks all events related to monitors
- `monitor_history`: Stores historical status data for monitors
- `ssl_certificates`: Stores SSL certificate information for monitors
- `domain_registrations`: Stores domain registration information for monitors

### Key Functions
- `get_monitor`: Gets a monitor with all related information
- `create_monitor`: Creates a new monitor
- `update_monitor`: Updates an existing monitor
- `get_monitor_events`: Gets recent events for a monitor
- `get_monitor_history`: Gets recent history for a monitor
- `record_monitor_event`: Records a monitor event
- `record_monitor_history`: Records monitor history
- `get_ssl_certificate`: Gets SSL certificate information for a monitor
- `get_domain_registration`: Gets domain registration information for a monitor
- `create_enhanced_monitor`: Creates a monitor with the enhanced form
- `update_enhanced_monitor`: Updates a monitor with the enhanced form

## Row Level Security (RLS)

All tables have RLS policies that ensure users can only access data for monitors that belong to accounts they are members of. This is enforced using the `basejump.get_accounts_with_role()` function.
