import { resolveAvatarSrc } from '@shared/avatarCatalog';

interface ProfileIconProps {
  label: string;
  size?: number;
  avatarId?: string | null;
}

/**
 * Renders a profile icon with a background and avatar image.
 *
 * @param param0 The props object containing the label and optional size.
 * @returns A JSX element representing the profile icon.
 */
export function ProfileIcon({ label, size = 96, avatarId = null }: ProfileIconProps) {
  return (
    <div
      aria-label={label}
      className="profile-icon"
      role="img"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <img
        src={resolveAvatarSrc(avatarId)}
        alt={label}
        style={{
          display: 'block',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}
