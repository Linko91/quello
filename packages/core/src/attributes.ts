import { collapseText } from './selector'

/** Attribute values are truncated at this length so one long `class` cannot bloat picks.json. */
const VALUE_LIMIT = 160

/**
 * Every attribute on the element, in document order.
 *
 * Nothing is filtered out: `class` and `id` appear here as written in the markup
 * even though `classes` holds the cleaned-up list, because an attribute dump that
 * silently omits attributes is worse than a slightly redundant one. Values are
 * whitespace-collapsed and truncated; a boolean attribute reads as an empty string.
 */
export function collectAttributes(el: Element, limit = VALUE_LIMIT): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const attribute of Array.from(el.attributes)) {
    attributes[attribute.name] = collapseText(attribute.value, limit)
  }
  return attributes
}
