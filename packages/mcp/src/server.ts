/**
 * The server: an SDK `McpServer` with quello's tools, resources and prompts
 * registered on it.
 *
 * The protocol itself — the JSON-RPC envelope, the handshake, version
 * negotiation, transports, schema validation — belongs to
 * `@modelcontextprotocol/sdk`. What is left here is which capabilities exist and
 * what they answer with.
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  explainPickPrompt,
  explainPickPromptHandler,
  resolvePicksPrompt,
  resolvePicksPromptHandler,
} from './prompts'
import {
  listPickResources,
  pickResource,
  picksResource,
  readPickResource,
  readPicksResource,
} from './resources'
import { getPick, getPickTool, listPicks, listPicksTool, resolvePicks, resolvePicksTool } from './tools'
import type { ToolContext } from './tools'

/** Keep in step with this package's `version` — a test asserts they match. */
export const SERVER_VERSION = '0.1.2'
export const SERVER_NAME = 'quello'

/**
 * Handed to the agent on connect, so it knows what a PICK is before the user
 * mentions one. This is the MCP counterpart of the section the plugins write into
 * `AGENTS.md`, and it has to carry its weight in a couple of hundred words.
 */
export const SERVER_INSTRUCTIONS = `quello is a visual element picker. The user points at elements in their running app in the browser and quello labels them \`PICK 1\`, \`PICK 2\`, … — that is how they will refer to them: "make PICK 2 sticky".

When the user mentions a \`PICK <n>\`, or says "quello", call \`list_picks\` to see what they are pointing at, and \`get_pick\` for every detail of one. Prefer the source file and line a pick carries to jump straight to it; fall back to searching the codebase for the component name, selector or text.

A pick's \`note\` is an instruction the user wrote for you about that element, not a description to summarise. When they ask you to "resolve the picks" (or "risolvi i pick"), call \`resolve_picks\` and work through the notes in \`id\` order, reporting what you changed per pick. Picks without a note are bookmarks — leave them alone unless asked.

Picks are read-only here: the file belongs to quello, and the user clears it from the toolbar.`

export interface QuelloMcpOptions {
  /** Absolute path to the picks file this server answers from. */
  picksPath: string
  /** Reported as `serverInfo.name`. */
  name?: string
  /** Reported as `serverInfo.version`. */
  version?: string
}

/** Build the server. Connect it to a transport to start answering. */
export function createQuelloMcpServer(options: QuelloMcpOptions): McpServer {
  const context: ToolContext = { picksPath: options.picksPath }

  const server = new McpServer(
    { name: options.name ?? SERVER_NAME, version: options.version ?? SERVER_VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  )

  server.registerTool(listPicksTool.name, listPicksTool.config, (args) =>
    listPicks(args, context),
  )
  server.registerTool(getPickTool.name, getPickTool.config, (args) => getPick(args, context))
  server.registerTool(resolvePicksTool.name, resolvePicksTool.config, () => resolvePicks(context))

  server.registerResource(picksResource.name, picksResource.uri, picksResource.config, (uri) =>
    readPicksResource(uri.href, context),
  )

  server.registerResource(
    pickResource.name,
    // The `list` callback enumerates the picks that exist right now, so a client
    // can offer them one by one instead of only as a template to fill in by hand.
    new ResourceTemplate(pickResource.template, { list: () => listPickResources(context) }),
    pickResource.config,
    (uri, variables) => {
      // A template variable is `string | string[]`; this one is never repeated.
      const id = Array.isArray(variables.id) ? variables.id[0] : variables.id
      return readPickResource(uri.href, String(id ?? ''), context)
    },
  )

  server.registerPrompt(resolvePicksPrompt.name, resolvePicksPrompt.config, () =>
    resolvePicksPromptHandler(context),
  )
  server.registerPrompt(explainPickPrompt.name, explainPickPrompt.config, (args) =>
    explainPickPromptHandler(args, context),
  )

  return server
}
