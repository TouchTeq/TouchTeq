'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 700 };
  const circleX = useSpring(cursorX, springConfig);
  const circleY = useSpring(cursorY, springConfig);

  const [isOnOrange, setIsOnOrange] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      if (!isVisible) {
        setIsVisible(true);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      let isOrange = false;
      
      while (target && target !== document.body) {
        // Check class name
        if (typeof target.className === 'string') {
          const className = target.className;
          if (
            className.includes('bg-[#ff6900]') || 
            className.includes('bg-orange-500') ||
            className.includes('text-[#ff6900]') ||
            className.includes('text-orange-500')
          ) {
            isOrange = true;
            break;
          }
        }
        
        // Check computed styles
        try {
          const style = window.getComputedStyle(target);
          const bgColor = style.backgroundColor;
          const color = style.color;
          if (
            bgColor === 'rgb(255, 105, 0)' || 
            bgColor.includes('255, 105, 0') ||
            color === 'rgb(255, 105, 0)' ||
            color.includes('255, 105, 0')
          ) {
            isOrange = true;
            break;
          }
        } catch (e) {
          // ignore error if getComputedStyle fails for any reason
        }

        target = target.parentElement;
      }
      setIsOnOrange(isOrange);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  // Don't show on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <>
      {/* Dot in the middle */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          translateX: cursorX,
          translateY: cursorY,
          x: '-50%',
          y: '-50%',
        }}
      >
        <div 
          className="w-2 h-2 rounded-full transition-colors duration-300" 
          style={{ backgroundColor: isOnOrange ? '#1A2B4C' : '#ff6900' }}
        />
      </motion.div>

      {/* Larger circle with trail */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          translateX: circleX,
          translateY: circleY,
          x: '-50%',
          y: '-50%',
        }}
      >
        <div 
          className="w-8 h-8 border-2 rounded-full transition-colors duration-300"
          style={{ borderColor: isOnOrange ? '#1A2B4C80' : '#ff690080' }}
        />
      </motion.div>
    </>
  );
}
