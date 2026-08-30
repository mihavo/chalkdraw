; extends
;
; Go's bundled query tags an import path as a plain (interpreted_string_literal)
; @string, so there is no way to colour module paths separately. This adds a
; more specific capture on top; editors that do not know @string.import fall
; back through the hierarchy to @string, which is the previous behaviour.
(import_spec
  path: (interpreted_string_literal) @string.import)

(import_spec_list
  (import_spec
    path: (interpreted_string_literal) @string.import))
