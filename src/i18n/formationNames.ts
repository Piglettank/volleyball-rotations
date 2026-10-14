import { featureFlags } from '@/config/featureFlags'
import { locale, type Locale } from '@/i18n'

/**
 * Display names for built-in formation data, keyed by id. The data itself (and English)
 * keeps the names defined in the stores; locales listed here override them on display.
 */
type NameOverrides = Partial<Record<Locale, Record<string, string>>>

const GROUP_NAMES: NameOverrides = {
  sv: {
    'start-position': featureFlags.startPositionServe ? 'Startposition' : 'Startpositioner mottag',
    'defense-a': 'Försvar (A-försvar)',
    'defense-b': 'Försvar (B-försvar)',
    'free-ball': 'Gratisboll',
    'free-play': 'Lek runt',
  },
}

function receiveName(rotation: number): string {
  return featureFlags.startPositionServe ? `P${rotation} mottag` : `P${rotation}`
}

const VARIANT_NAMES: NameOverrides = {
  sv: {
    's1-serve': 'P1 serve',
    's1-receive': receiveName(1),
    's6-serve': 'P6 serve (Vänsterspiker 1 servar)',
    's6-receive': receiveName(6),
    's5-serve': 'P5 serve (Center 1 servar)',
    's5-receive': receiveName(5),
    's4-serve': 'P4 serve (Högerspiker servar)',
    's4-receive': receiveName(4),
    's3-serve': 'P3 serve (Vänsterspiker 2 servar)',
    's3-receive': receiveName(3),
    's2-serve': 'P2 serve (Center 2 servar)',
    's2-receive': receiveName(2),
    'attack-left': 'Anfall från vänster',
    'attack-middle': 'Anfall från mitten',
    'attack-right': 'Anfall från höger',
    'b-attack-left': 'Anfall från vänster',
    'b-attack-middle': 'Anfall från mitten',
    'b-attack-right': 'Anfall från höger',
    'free-ball-setter-back': 'Passare bak',
    'free-ball-setter-front': 'Passare fram',
  },
}

const ROLE_NAMES: NameOverrides = {
  sv: {
    'setter-1': 'Passare',
    'opposite-1': 'Högerspiker',
    'middle-1': 'Center 1',
    'middle-2': 'Center 2',
    'left-1': 'Vänsterspiker 1',
    libero: 'Libero',
    'left-2': 'Vänsterspiker 2',
  },
}

const ROLE_ABBREVIATIONS: NameOverrides = {
  sv: {
    'setter-1': 'P',
    'opposite-1': 'H',
    'middle-1': 'C¹',
    'middle-2': 'C²',
    'left-1': 'V¹',
    libero: 'L',
    'left-2': 'V²',
  },
}

function localized(overrides: NameOverrides, id: string, fallback: string): string {
  return overrides[locale.value]?.[id] ?? fallback
}

export function groupName(group: { id: string; name: string }): string {
  return localized(GROUP_NAMES, group.id, group.name)
}

export function variantName(variant: { id: string; name: string }): string {
  return localized(VARIANT_NAMES, variant.id, variant.name)
}

export function roleName(roleId: string, fallback: string): string {
  return localized(ROLE_NAMES, roleId, fallback)
}

export function roleAbbreviation(roleId: string, fallback: string): string {
  return localized(ROLE_ABBREVIATIONS, roleId, fallback)
}

/** Rotation number label, e.g. "S1" in English and "P1" in Swedish. */
export function rotationPrefix(): string {
  return locale.value === 'sv' ? 'P' : 'S'
}
