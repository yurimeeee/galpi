// TypeScript 6 checks side-effect imports by default, and `import '../global.css'`
// (NativeWind's entry stylesheet, handled by Metro) has no type declarations.
declare module '*.css';
