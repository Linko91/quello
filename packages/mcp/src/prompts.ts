/**
 * Two prompts, for the slash-command menu a client builds out of `prompts/list`.
 *
 * Both come back with the picks already in them rather than with instructions to
 * go and fetch them: a prompt the user invoked is a prompt they want acted on,
 * and a round trip through `tools/call` to say the same thing buys nothing.
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js'
import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js'
import { readPicks } from '@quello/server'
import { z } from 'zod'
import { describePick, formatResolvePlan, pickName } from './format'
import { findPick } from './picks'
import type { ToolContext } from './tools'

/**
 * No `argsSchema` at all, deliberately: an empty one is still an object schema,
 * and the SDK would then validate `params.arguments` against it — which a client
 * invoking a zero-argument prompt has every right to omit, and would be told its
 * arguments were invalid.
 */
export const resolvePicksPrompt = {
  name: 'resolve-picks',
  config: {
    title: 'Resolve the picks',
    description:
      'Work through every pick that carries a note, in order, carrying out each note against ' +
      'the element it is attached to.',
  },
} as const

export const explainPickPrompt = {
  name: 'explain-pick',
  config: {
    title: 'Explain a pick',
    description: 'Locate one pick in the codebase and explain what it is.',
    // Prompt arguments travel as strings, so this is a string that has to look
    // like a number rather than a number.
    argsSchema: {
      id: z
        .string()
        .regex(/^\d+$/, 'must be a pick number, e.g. 2 for PICK 2')
        .describe('The pick number, i.e. 2 for PICK 2.'),
    },
  },
} as const

const message = (text: string): GetPromptResult['messages'] => [
  { role: 'user', content: { type: 'text', text } },
]

export async function resolvePicksPromptHandler({
  picksPath,
}: ToolContext): Promise<GetPromptResult> {
  const file = await readPicks(picksPath)
  return {
    description: 'Carry out the note on every pick that has one.',
    messages: message(
      [
        'These are the elements I picked in the browser with quello, and the notes I wrote on them.',
        formatResolvePlan(file.picks, picksPath),
      ].join('\n\n'),
    ),
  }
}

export async function explainPickPromptHandler(
  { id }: { id: string },
  { picksPath }: ToolContext,
): Promise<GetPromptResult> {
  const file = await readPicks(picksPath)
  const pick = findPick(file.picks, Number(id))
  if (!pick) throw new McpError(ErrorCode.InvalidParams, `There is no PICK ${id} on file`)
  return {
    description: `Explain ${pickName(pick)}.`,
    messages: message(
      [
        `Find ${pickName(pick)} in the codebase and explain what it is and what it does. This is what quello recorded when I picked it:`,
        describePick(pick),
      ].join('\n\n'),
    ),
  }
}
