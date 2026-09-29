/**
 * What holds a control (`F7-15`, `F7-49`): the page — or a sheet, a modal, a menu — or a tile. A
 * control is the opposite of what holds it: the well's grey on the white page, white inside the
 * grey tile. The page is the default; only a tile says otherwise.
 */
export type Ground = 'page' | 'tile';
