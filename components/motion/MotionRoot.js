'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';

export default function MotionRoot({ children = null }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
