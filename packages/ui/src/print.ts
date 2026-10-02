/* The print surfaces — `@heliogrid/ui/print`, never the main entry.

   These parts have no native half (their types files carry the PRINT SURFACE waiver) and use the
   DOM. The main entry is what the phone app typechecks with `.native` first, so a print part
   exported from it fails the phone's typecheck, and one the phone imported would crash at run time.
   Only the web imports this entry.

   `DocumentSection` here is PagedDocument's; the main entry's is DocumentPreview's. */
export * from './components/DrawingSheet';
export * from './components/PagedDocument';
export * from './utils/page-size';
export * from './utils/print-scope';
