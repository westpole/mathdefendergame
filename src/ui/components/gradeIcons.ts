import type { Grade } from '@shared/types';

import traineeIcon from '@assets/trainee-icon.png';
import cadetIcon from '@assets/cadet-icon.png';
import commanderIcon from '@assets/commander-icon.png';
import majorGeneralIcon from '@assets/major-general-icon.png';

export const gradeIcons: Record<Grade, string> = {
  trainee: traineeIcon,
  cadet: cadetIcon,
  commander: commanderIcon,
  'major-general': majorGeneralIcon,
};
