import profileIconBackground from '@assets/profile.svg';
import avatarIcon from '@assets/avatar.svg';

interface ProfileIconProps {
  label: string;
  size?: number;
}

/**
 * Renders a profile icon with a background and avatar image.
 *
 * @param param0 The props object containing the label and optional size.
 * @returns A JSX element representing the profile icon.
 */
export function ProfileIcon({ label, size = 96 }: ProfileIconProps) {
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
      <img src={profileIconBackground} alt={label}/>
      <img src={avatarIcon} alt={label}/>
    </div>
  );
}
