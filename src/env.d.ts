/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.svelte' {
  const component: any;
  export default component;
}
