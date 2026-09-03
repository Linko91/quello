/**
 * Two prompts, for the slash-command menu a client builds out of `prompts/list`.
 *
 * Both come back with the picks already in them rather than with instructions to
 * go and fetch them: a prompt the user invoked is a prompt they want acted on,
 * and a round trip through `tools/call` to say the same thing buys nothing.
 */
import { readPicks } from '@quello/server'
import { describePick, formatResolvePlan, pickName } from './format'
import { findPick } from './picks'
import { INVALID_PARAMS, RpcError } from './protocol'
import type { ToolContext } from './tools'

export interface PromptArgument {
  name: string
  description: string
  required?: boolean
}

export interface PromptDefinition {
  name: string
  title: string
  description: string
  arguments?: PromptArgument[]
}

export interface PromptResult {
  description: string
  messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>
}

export const PROMPTS: readonly PromptDefinition[] = [
  {
    name: 'resolve-picks',
    title: 'Resolve the picks',
    description:
      'Work through every pick that carries a note, in order, carrying out each note against ' +
      'the element it is attached to.',
    arguments: [],
  },
  {
    name: 'explain-pick',
    title: 'Explain a pick',
    description: 'Locate one pick in the codebase and explain what it is.',
    arguments: [
      { name: 'id', description: 'The pick number, i.e. 2 for PICK 2.', required: true },
    ],
  },
]

const message = (text: string): PromptResult['messages'] => [
  { role: 'user', content: { type: 'text', text } },
]

export async function getPrompt(
  name: string,
  args: Record<string, unknown> | undefined,
  context: ToolContext,
): Promise<PromptResult> {
  if (name === 'resolve-picks') {
    const file = await readPicks(context.picksPath)
    return {
      description: 'Carry out the note on every pick that has one.',
      messages: message(
        [
          'These are the elements I picked in the browser with quello, and the notes I wrote on them.',
          formatResolvePlan(file.picks, context.picksPath),
        ].join('\n\n'),
      ),
    }
  }

  if (name === 'explain-pick') {
    const raw = args?.id
    const id = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw new RpcError(INVALID_PARAMS, 'id must be an integer, e.g. 2 for PICK 2')
    }
    const file = await readPicks(context.picksPath)
    const pick = findPick(file.picks, id)
    if (!pick) throw new RpcError(INVALID_PARAMS, `There is no PICK ${id} on file`)
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

  throw new RpcError(
    INVALID_PARAMS,
    `Unknown prompt "${name}". Available: ${PROMPTS.map((prompt) => prompt.name).join(', ')}.`,
  )
}
