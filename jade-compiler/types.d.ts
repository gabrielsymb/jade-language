/**
 * types.d.ts — Declarações de módulos de terceiros sem tipos oficiais
 */

// wabt — WebAssembly Binary Toolkit (devDependency, opcional em runtime)
declare module 'wabt' {
  interface WabtModule {
    parseWat(filename: string, source: string): WabtWatModule;
  }
  interface WabtWatModule {
    validate(): void;
    toBinary(options: { log: boolean }): { buffer: Uint8Array; log: string };
    destroy(): void;
  }
  function wabt(): Promise<WabtModule>;
  export default wabt;
}
