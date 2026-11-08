# Project rules

- PDF export captures each rendered Word page separately, excluding preview-container spacing and shadows, so original page dimensions and document content remain intact.
- The visual template builder edits only the selected Word text nodes in place and rejects any XML part with DOCTYPE/ENTITY declarations, so original formatting is kept and XXE is impossible.
- The active Word template (with fields already marked) is mirrored to sessionStorage so a refresh or tab return restores the same document instead of forcing the user to re-mark fields.
- Excel workbook generation and header detection share a tested helper; distinguish header-first tables from legacy title-prefixed files so re-upload preserves all records.
