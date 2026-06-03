# ELK Layout Vendor

One artifact is vendored here:

- `drawio-elk.min.js` — the IIFE bundle from drawio-elk's
  `dist/elk.bundled.js`. Defines `var ELK` (engine class) plus
  `ElkLayout` / `ElkAdapter` / `ElkApplier` (the mxGraph ↔ ELK bridge),
  all exposed as bare globals so the inlined viewer scripts can call
  `new ELK()`, `new ElkLayout(...)`, etc. `processElkBundle` in
  `shared.js` passes the IIFE through unchanged (it only strips exports
  when handed the ESM build).

`ElkLayout` is the single source of truth for the layout pipeline,
the per-algorithm `DEFAULTS`, the `MENU_PRESETS` (name → algorithm +
direction) and the `CANONICAL_EDGE` treatment (`edgeStyleMode` +
`corners`). The MCP's postLayout pass (`applyPostLayout` in
`shared.js`) drives it directly via `new ElkLayout(...).prepare(...)`
— there is no separate `mxElkLayout` shim anymore (removed when the
postLayout flow was migrated onto the facade, matching drawio-dev's
editor routes).

Vendored to keep this repo self-contained — see issue #29.

## Versioning

`drawio-elk.min.js`'s first line is a banner of the form:

```
/*! @drawio/elk <semver>+commit.<sha> (built <yyyy-mm-dd>) */
```

To inspect the version of the vendored copy:

```sh
head -1 drawio-elk.min.js
```

## Refreshing

Build the bundle in the drawio-elk repo and copy the IIFE artifact:

```sh
cd ../../drawio-elk
npm run build
cp dist/elk.bundled.js ../drawio-mcp/mcp-app-server/vendor/elk/drawio-elk.min.js
```

Copy the same `dist/elk.bundled.js` into drawio-dev
(`src/main/webapp/js/elk/drawio-elk.min.js`) so the editor and the MCP
run a byte-identical engine + bridge. After refreshing, rebuild the
Worker bundle (`npm run build:worker`) so `generated-html.js` picks up
the new inlined copy.
