export const MOTION_FAST_SECONDS = 0.15;
export const MOTION_BASE_SECONDS = 0.2;
export const MOTION_SLOW_SECONDS = 0.3;
export const EASE_OUT = [0.16, 1, 0.3, 1];

const DIALOG_OFFSET_PX = 24;
const DROPDOWN_OFFSET_PX = -4;

export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION_BASE_SECONDS },
};

export const sheetMotion = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { duration: MOTION_SLOW_SECONDS, ease: EASE_OUT },
};

export const dialogMotion = {
  initial: { opacity: 0, y: DIALOG_OFFSET_PX },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: DIALOG_OFFSET_PX },
  transition: { duration: MOTION_SLOW_SECONDS, ease: EASE_OUT },
};

export const dropdownMotion = {
  initial: { opacity: 0, y: DROPDOWN_OFFSET_PX },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: DROPDOWN_OFFSET_PX },
  transition: { duration: MOTION_FAST_SECONDS, ease: EASE_OUT },
};

export const menuMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: MOTION_BASE_SECONDS, ease: EASE_OUT },
};
