# List Design Guidelines

The following guidelines must be applied to **all dropdown lists** (Select components) throughout the project to ensure a consistent, premium UI matching the customer list design:

1. **Searchable Dropdown**
   - Always include `filter` and a meaningful `filterPlaceholder` describing the entity (e.g., "Rechercher un groupe...").
2. **Option Template**
   - Use a `<template #option="{ option }">` with the structure:
   ```html
   <div class="option-row">
     <span class="option-code">{{ option.code }}</span>
     <span class="option-sep">—</span>
     <span class="option-name">{{ option.displayName }}</span>
   </div>
   ```
   - Adjust the property names (`code`, `displayName`, `Name`, `Code`) to match the option object's shape.
3. **Panel Styling**
   - Apply `panelClass="b2b-client-panel"` to obtain the same panel appearance as the customer selector.
4. **Clearable & Loading**
   - Include `showClear` and bind `:loading` to the appropriate loading flag.
5. **Consistent Classes**
   - Use `class="filter-select"` for the base select styling.

6. **Sidebar / Compact Dropdowns overlay**
   - For narrow or sidebar dropdown lists (where overlays are appended to `body`), always specify a custom `panelClass` (e.g. `panelClass="history-status-dropdown-panel"`) and define premium style rules in an unscoped style block:
     - Border: `1px solid #cbd5e1 !important`
     - Border radius: `10px !important`
     - Box shadow: `0 10px 25px -5px rgba(15, 23, 42, 0.08)`
     - Padding: `4px !important` on the container, `6px 10px !important` on list items (with font size `0.8rem`).
     - Selected item background: `#eff6ff !important` (text color `#1e40af` and bold font).
     - Hover item background: `#f0f7ff !important` (text color `#1d4ed8`).

> **Note:** When adding a new list component, copy the above block and adapt the option field names accordingly. This file lives in `src/skills/lists_design.md` and should be referenced by developers when creating new selects.

---

# Confirmation Dialog Guidelines

All confirmation dialogs (`ConfirmDialog`) in the project must be standardized according to the Vristo components styling rules below to maintain a clean, premium visual consistency:

1. **Parameters configuration in code (`confirm.require`)**:
   - Always set `acceptClass: 'p-button-success'` to style the confirmation/positive action as a solid green button.
   - Always set `rejectClass: 'p-button-secondary'` to style the cancel/negative action as a red-outline button.
   - Example:
     ```javascript
     confirm.require({
         message: 'Voulez-vous vraiment valider cette commande ?',
         header: 'Confirmation de validation',
         icon: 'pi pi-exclamation-triangle',
         acceptLabel: 'Oui',
         rejectLabel: 'Non',
         acceptClass: 'p-button-success',
         rejectClass: 'p-button-secondary',
         accept: () => { ... }
     })
     ```

2. **Global Styling Rules (`main.css`)**:
   - **Dimensions**: Standardized width of `480px` (`max-width: 95vw`) and rounded corners of `8px`.
   - **Header**: Light grey background (`#fbfbfb`), dark bold title (`#0e1726`), padding `14px 20px`, and an elegant header close icon (`#888ea8`).
   - **Content**: Normal content padding `24px 24px 16px 24px` with a line-height of `1.6` and soft slate text (`#515365`).
   - **Icon**: The warning/exclamation icon inside the dialog content is hidden (`display: none`) to keep the layout clean and text-focused.
   - **Accept Button (Oui/Valider)**: Solid green background (`#00ab55`), white text, and a soft green shadow (`box-shadow: 0 10px 20px -5px rgba(0, 171, 85, 0.3)`).
   - **Reject Button (Non/Annuler)**: Transparent background, red border (`1px solid #e7515a`), and red text (`#e7515a`).

