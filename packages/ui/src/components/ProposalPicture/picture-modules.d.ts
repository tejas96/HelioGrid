/**
 * A picture file as each bundler hands it over: Vite an address, Next an object holding one, Metro
 * the number of a registered asset. `picture-files` reads all three.
 */
declare module '*.jpg' {
  const file: string | number | { readonly src: string };
  export default file;
}
