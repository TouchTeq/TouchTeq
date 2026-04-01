-- Migration: Add qty_type column to quote and PO line item tables
-- Date: 2026-03-31
--
-- The invoice_line_items table already has qty_type. This migration adds
-- it to quote_line_items and purchase_order_items for consistency.

alter table public.quote_line_items
  add column if not exists qty_type text not null default 'qty';

alter table public.purchase_order_items
  add column if not exists qty_type text not null default 'qty';
