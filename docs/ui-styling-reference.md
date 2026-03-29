# UI Styling Reference — touch-teq Dashboard

## Dropdown (Custom Select)

### Trigger Button

**Filter bar context** (fixed width, standalone filters like Travel / Fuel pages):
```tsx
className={`flex items-center justify-between px-4 py-2.5 border rounded-lg transition-all font-bold text-sm bg-[#151B28] w-[200px] ${
  open ? 'border-orange-500 bg-[#0B0F19]' : 'border-slate-700 hover:border-slate-600'
}`}
```

**Form field context** (full-width inside a form, e.g. Status, Category, Bank, Font):
```tsx
className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
  open ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
}`}
```

### Trigger Button — Inner Structure

Icon + label grouped left, chevron pinned right:
```tsx
<button type="button" onClick={() => setOpen(!open)} className={...}>
  <div className="flex items-center gap-2">
    <SomeIcon size={14} className="text-slate-500" />
    <span className="text-white">{selectedLabel}</span>
  </div>
  <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
</button>
```

For dropdowns **without** a leading icon (just text + chevron):
```tsx
<button type="button" onClick={() => setOpen(!open)} className={...}>
  <span className="text-white">{selectedLabel}</span>
  <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
</button>
```

### Dropdown Panel
```tsx
className="absolute top-full left-0 mt-2 w-64 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1"
```
- Add `max-h-60 overflow-y-auto` for long lists
- Use `w-full` instead of `w-64` for form-field dropdowns

### Option Items
```tsx
className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
  isSelected ? 'text-orange-500 bg-[#0B0F19]' : 'text-slate-300'
}`}
```

### Click-Outside Backdrop

Place as the **first child** inside the component's root element. Covers all open states in that component:
```tsx
{(dropOneOpen || dropTwoOpen) && (
  <div
    className="fixed inset-0 z-[99]"
    onClick={() => { setDropOneOpen(false); setDropTwoOpen(false); }}
  />
)}
```
> Panel is `z-[100]`, backdrop is `z-[99]` — panel stays clickable above the backdrop.

---

## DatePicker

**Component:** `<DatePicker />` from `@/components/ui/DatePicker`
**Source:** `components/ui/date-picker.tsx` (wraps Ark UI `DatePicker`)

### Usage
```tsx
<DatePicker
  label="Issue Date"            // optional — renders label above input
  value={formData.issue_date}   // "yyyy-MM-dd" string
  onChange={(val) => handleChange('issue_date', val)}
  placeholder="Select date"
/>
```

### Props
| Prop | Type | Default |
|------|------|---------|
| `value` | `string` (`"yyyy-MM-dd"`) | — |
| `onChange` | `(value: string) => void` | — |
| `label` | `string` | — |
| `placeholder` | `string` | `"Select date"` |
| `className` | `string` | `""` |

### Behaviour
- Click the calendar icon or the input to open the picker
- **Day view** → click the month/year header text to go up to **Month view** → click again to go up to **Year view**
- Navigate years/months with `‹` `›` arrows
- **Today** button at the bottom of the day view sets the value to the current date instantly
- Selected date is highlighted in orange; today's date has a faint orange ring
- `X` button appears when a value is set — clears the field
- Renders via `<Portal>` so it never clips inside overflow-hidden containers

### Styling tokens (internal, do not override)
| Element | Classes |
|---------|---------|
| Control (input row) | `rounded-lg border border-slate-800 bg-[#0B0F19] px-3 py-2.5` |
| Panel | `w-[280px] rounded-xl border border-slate-800 bg-[#151B28] shadow-2xl p-3 z-[100]` |
| Selected cell | `data-[selected]:bg-orange-500 data-[selected]:text-white` |
| Today cell | `data-[today]:ring-1 data-[today]:ring-orange-500/50` |
| Today button | `text-orange-500 hover:bg-orange-500/10` |

---

## MonthPicker

**Component:** `<MonthPicker />` from `@/components/ui/MonthPicker`

### Usage
```tsx
<MonthPicker
  value={monthFilter}           // "yyyy-MM" string
  onChange={(val) => setMonthFilter(val)}
  placeholder="Select month"
/>
```

The MonthPicker is a self-contained component that already matches the dashboard dark theme. Use it as-is — do not wrap in a `relative group` div or add extra icons.

---

## Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-[#0B0F19]` | Dark navy | Selected state bg, input backgrounds |
| `bg-[#151B28]` | Mid navy | Cards, dropdown panels, filter bars |
| `border-slate-700` | — | Default input border |
| `border-slate-800` | — | Panel / card border |
| `border-orange-500` | — | Active / focused border |
| `text-orange-500` | — | Selected option, accent values |
| `text-slate-300` | — | Unselected option text |
| `text-slate-500` | — | Icons, muted labels |
| `text-slate-600` | — | Faint labels |

---

## Checklist — Adding a New Dropdown

- [ ] Use `useState(false)` for open/close state
- [ ] Wrap trigger + panel in `<div className="relative">`
- [ ] Trigger uses `justify-between` with icon+label grouped in inner `<div>`
- [ ] ChevronDown rotates with `rotate-180` when open
- [ ] Panel has `z-[100]`
- [ ] Backdrop added at root of component with `z-[99]`
- [ ] Border color: `border-orange-500` when open, `border-slate-700` when closed
- [ ] Option items: `text-orange-500 bg-[#0B0F19]` when selected
