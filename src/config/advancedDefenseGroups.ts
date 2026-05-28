/** Formation groups hidden when `featureFlags.advancedDefense` is false. */
export const ADVANCED_DEFENSE_GROUP_IDS = [
  'defense-a',
  'free-ball-setter-back',
  'free-ball-setter-front',
] as const

export type AdvancedDefenseGroupId = (typeof ADVANCED_DEFENSE_GROUP_IDS)[number]

export function isAdvancedDefenseGroup(groupId: string): boolean {
  return (ADVANCED_DEFENSE_GROUP_IDS as readonly string[]).includes(groupId)
}
