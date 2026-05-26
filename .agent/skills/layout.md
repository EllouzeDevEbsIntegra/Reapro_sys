# Layout Guidelines

**This applies to ALL pages created or modified in this project.**

1. **Full-Width Pages**: NEVER use `max-width` on main page containers (`.main-content` or similar). All pages must occupy 100% of the available screen width.
2. **Standard Page Container (`.main-content`)**: 
   ```css
   .main-content {
     width: 100%;
     padding: 0.5rem 2rem 3rem; /* 2rem horizontal padding provides consistent breathing room */
   }
   ```
3. **Standard Header Bar (`.header-bar`)**: The top header of every page MUST be identical in dimensions, padding, and font size to maintain a cohesive UI.
   ```css
   .header-bar {
     background: white;
     border-radius: 8px;
     box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
     margin-bottom: 1.5rem;
     padding: 1rem 1.5rem; /* Strict standard: exactly this padding */
     min-height: 90px; /* Strict standard: ensures identical height across all pages (tall enough to fit KPIs) */
     box-sizing: border-box;
     display: flex;
     align-items: center;
     justify-content: space-between;
     gap: 1.5rem;
   }
   
   .header-bar h1, .header-left h1 {
     font-size: 1.25rem;
     font-weight: 700;
     color: #1e293b;
     margin: 0;
     white-space: nowrap;
   }
   ```
4. If the header requires a separate `header-main-row` inside due to nested collapsible filter panels, the vertical padding must be preserved such that the visual height of the collapsed header bar remains strictly identical across pages.
