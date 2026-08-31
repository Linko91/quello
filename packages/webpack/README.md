# webpack-plugin-quello

webpack plugin for [quello](https://github.com/Linko91/quello), the visual element picker for AI
coding agents. Point at an element in the browser, and your agent knows which component you meant.

```bash
pnpm add -D webpack-plugin-quello
```

```js
// webpack.config.js
import HtmlWebpackPlugin from 'html-webpack-plugin'
import QuelloWebpackPlugin from 'webpack-plugin-quello'

export default {
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new QuelloWebpackPlugin(),
  ],
  devServer: { port: 3000 },
}
```

Start `webpack serve`. The script tag is injected for you, `AGENTS.md` gets the quello section, and
`.quello/` is added to your `.gitignore`.

Press `Alt+Q`, click something, and `.quello/picks.json` appears in your project. Tell your agent
`PICK 1` and it resolves back to the source.

## Requirements

- **webpack 5** — declared as a peer dependency.
- **`webpack-dev-server`** — the plugin serves the picks endpoint through its middleware.
- **`html-webpack-plugin`** — the tag is injected through its `alterAssetTagGroups` hook. The plugin
  reaches that hook without depending on the package, so nothing extra is installed.

## Dev-only, by construction

The plugin attaches to the dev server's middleware and does nothing in a production compilation.

## Options

| Option | Default | |
| --- | --- | --- |
| `enabled` | `true` | Turn the plugin off without removing it from the config. |
| `picksFile` | `.quello/picks.json` | Where picks are persisted, relative to the compiler context. |
| `shortcut` | `alt+q` | Full combination — `ctrl+shift+p`, `f2`. |
| `textLimit` | `120` | Characters of element text kept per pick. |
| `writeAgentFile` | `true` | Write the quello instructions on first run. |
| `agentFile` | `AGENTS.md` | Relative to the compiler context. |
| `gitignorePicks` | `true` | Add the picks directory to `.gitignore` on first run. |
| `htmlMode` | `truncated` | Initial HTML capture mode; the settings panel wins after that. |
| `htmlLimit` | `1000` | Initial character budget for `truncated`. |
| `theme` | `{}` | Look of the outlines quello draws. Code-level only. |

[Full guide](https://quello.vercel.app/guides/webpack) ·
[Options reference](https://quello.vercel.app/reference/plugin-options) · [MIT](./LICENSE)
