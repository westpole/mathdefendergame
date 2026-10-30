import avatar1 from '@assets/avatars/avatar-1.png';
import avatar2 from '@assets/avatars/avatar-2.png';
import avatar3 from '@assets/avatars/avatar-3.png';
import avatar4 from '@assets/avatars/avatar-4.png';
import avatar5 from '@assets/avatars/avatar-5.png';
import avatar6 from '@assets/avatars/avatar-6.png';
import avatar7 from '@assets/avatars/avatar-7.png';
import avatar8 from '@assets/avatars/avatar-8.png';
import avatar9 from '@assets/avatars/avatar-9.png';
import avatar10 from '@assets/avatars/avatar-10.png';

export const avatarImageById = {
  'avatar-1': avatar1,
  'avatar-2': avatar2,
  'avatar-3': avatar3,
  'avatar-4': avatar4,
  'avatar-5': avatar5,
  'avatar-6': avatar6,
  'avatar-7': avatar7,
  'avatar-8': avatar8,
  'avatar-9': avatar9,
  'avatar-10': avatar10,
} as const;

export type AvatarId = keyof typeof avatarImageById;

export const DEFAULT_AVATAR_ID: AvatarId = 'avatar-8';
export const avatarIds = Object.keys(avatarImageById) as AvatarId[];

/**
 * Type guard for avatar identifiers that are known to the application avatar catalog.
 *
 * @param value - Raw identifier candidate.
 * @returns True when value maps to an avatar image in the catalog.
 */
export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && value in avatarImageById;
}

/**
 * Resolves an avatar id with a safe fallback to the default avatar.
 *
 * @param value - Raw avatar id value.
 * @returns Valid avatar id from the catalog.
 */
export function resolveAvatarId(value: unknown): AvatarId {
  return isAvatarId(value) ? value : DEFAULT_AVATAR_ID;
}

/**
 * Resolves an avatar image source by id with default fallback.
 *
 * @param value - Raw avatar id value.
 * @returns Avatar image URL handled by Vite.
 */
export function resolveAvatarSrc(value: unknown): string {
  return avatarImageById[resolveAvatarId(value)];
}
