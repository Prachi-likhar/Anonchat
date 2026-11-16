import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'md',
  className,
  style,
  ...props
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <Animated.View
      className={cn(
        'bg-border-light dark:bg-border-dark',
        roundedClasses,
        className
      )}
      style={[
        { opacity },
        width !== undefined ? { width: width as any } : undefined,
        height !== undefined ? { height: height as any } : undefined,
        style,
      ]}
      {...props}
    />
  );
};
