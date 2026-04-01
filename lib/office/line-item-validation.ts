export interface LineItemValidationError {
  field: string;
  index: number;
  message: string;
}

export interface ValidatedLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  qty_type: 'qty' | 'hrs';
  vat_rate?: number;
  sort_order?: number;
}

export function validateLineItems(
  items: unknown[],
  options?: { requireVatRate?: boolean; maxItems?: number }
): { valid: true; items: ValidatedLineItem[] } | { valid: false; errors: LineItemValidationError[] } {
  const errors: LineItemValidationError[] = [];
  const maxItems = options?.maxItems ?? 100;
  const requireVatRate = options?.requireVatRate ?? false;

  if (!Array.isArray(items)) {
    return { valid: false, errors: [{ field: 'line_items', index: -1, message: 'Line items must be an array' }] };
  }

  if (items.length === 0) {
    return { valid: false, errors: [{ field: 'line_items', index: -1, message: 'At least one line item is required' }] };
  }

  if (items.length > maxItems) {
    return { valid: false, errors: [{ field: 'line_items', index: -1, message: `Maximum ${maxItems} line items allowed` }] };
  }

  const validated: ValidatedLineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const itemErrors: LineItemValidationError[] = [];

    // Description validation
    const description = typeof item.description === 'string' ? item.description.trim() : '';
    if (!description) {
      itemErrors.push({ field: 'description', index: i, message: 'Description is required' });
    } else if (description.length > 500) {
      itemErrors.push({ field: 'description', index: i, message: 'Description must be 500 characters or less' });
    }

    // Quantity validation
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      itemErrors.push({ field: 'quantity', index: i, message: 'Quantity must be a positive number' });
    } else if (quantity > 999999) {
      itemErrors.push({ field: 'quantity', index: i, message: 'Quantity must not exceed 999,999' });
    }

    // Unit price validation
    const unitPrice = Number(item.unit_price ?? item.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      itemErrors.push({ field: 'unit_price', index: i, message: 'Unit price must be a non-negative number' });
    } else if (unitPrice > 999999999) {
      itemErrors.push({ field: 'unit_price', index: i, message: 'Unit price must not exceed 999,999,999' });
    }

    // VAT rate validation (if required)
    if (requireVatRate) {
      const vatRate = Number(item.vat_rate);
      if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
        itemErrors.push({ field: 'vat_rate', index: i, message: 'VAT rate must be between 0 and 100' });
      }
    }

    // qty_type validation
    const qtyType = item.qty_type === 'hrs' ? 'hrs' as const : 'qty' as const;

    if (itemErrors.length > 0) {
      errors.push(...itemErrors);
    } else {
      validated.push({
        description,
        quantity,
        unit_price: unitPrice,
        qty_type: qtyType,
        vat_rate: requireVatRate ? Number(item.vat_rate) : undefined,
        sort_order: i,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, items: validated };
}

export function formatValidationErrors(errors: LineItemValidationError[]): string {
  return errors
    .map((e) => `Line ${e.index + 1}: ${e.message}`)
    .join('; ');
}
