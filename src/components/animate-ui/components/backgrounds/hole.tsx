'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

type HoleVariant = 'default' | 'muted';

type HoleBackgroundProps = React.ComponentProps<'div'> & {
  variant?: HoleVariant;
  strokeColor?: string;
  numberOfLines?: number;
  numberOfDiscs?: number;
  particleRGBColor?: [number, number, number];
};

function HoleBackground({
  variant = 'default',
  strokeColor = '#737373',
  numberOfLines = 50,
  numberOfDiscs = 50,
  particleRGBColor = [255, 255, 255],
  className,
  children,
  ...props
}: HoleBackgroundProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [resolvedStroke, setResolvedStroke] = React.useState(strokeColor);
  const [resolvedParticleColor, setResolvedParticleColor] = React.useState(
    `rgb(${particleRGBColor.join(', ')})`,
  );

  const activeStroke =
    variant === 'muted' ? resolvedStroke : strokeColor;
  const activeParticleColor =
    variant === 'muted' ? resolvedParticleColor : `rgb(${particleRGBColor.join(', ')})`;

  const resolveThemeColors = React.useCallback(() => {
    if (variant !== 'muted') return;
    const el = containerRef.current;
    if (!el) return;
    const prev = el.style.color;
    el.style.color = 'var(--muted-foreground)';
    setResolvedStroke(getComputedStyle(el).color);
    el.style.color = 'color-mix(in oklch, var(--foreground) 55%, var(--primary) 45%)';
    setResolvedParticleColor(getComputedStyle(el).color);
    el.style.color = prev;
  }, [variant]);

  React.useEffect(() => {
    resolveThemeColors();
    const observer = new MutationObserver(resolveThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    window.addEventListener('resize', resolveThemeColors);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resolveThemeColors);
    };
  }, [resolveThemeColors]);
  const animationFrameIdRef = React.useRef<number>(0);
  const stateRef = React.useRef<any>({
    discs: [] as any[],
    lines: [] as any[],
    particles: [] as any[],
    clip: {},
    startDisc: {},
    endDisc: {},
    rect: { width: 0, height: 0 },
    render: { width: 0, height: 0, dpi: 1 },
    particleArea: {},
    linesCanvas: null,
  });

  const linear = (p: number) => p;
  const easeInExpo = (p: number) => (p === 0 ? 0 : Math.pow(2, 10 * (p - 1)));

  const tweenValue = React.useCallback(
    (start: number, end: number, p: number, ease: 'inExpo' | null = null) => {
      const delta = end - start;
      const easeFn = ease === 'inExpo' ? easeInExpo : linear;
      return start + delta * easeFn(p);
    },
    [],
  );

  const tweenDisc = React.useCallback(
    (disc: any) => {
      const { startDisc, endDisc } = stateRef.current;
      disc.x = tweenValue(startDisc.x, endDisc.x, disc.p);
      disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, 'inExpo');
      disc.w = tweenValue(startDisc.w, endDisc.w, disc.p);
      disc.h = tweenValue(startDisc.h, endDisc.h, disc.p);
    },
    [tweenValue],
  );

  const setSize = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.rect = { width: rect.width, height: rect.height };
    stateRef.current.render = {
      width: rect.width,
      height: rect.height,
      dpi: window.devicePixelRatio || 1,
    };
    canvas.width = stateRef.current.render.width * stateRef.current.render.dpi;
    canvas.height =
      stateRef.current.render.height * stateRef.current.render.dpi;
  }, []);

  const setDiscs = React.useCallback(() => {
    const { width, height } = stateRef.current.rect;
    stateRef.current.discs = [];
    stateRef.current.startDisc = {
      x: width * 0.5,
      y: height * 0.45,
      w: width * 0.75,
      h: height * 0.7,
    };
    stateRef.current.endDisc = {
      x: width * 0.5,
      y: height * 0.95,
      w: 0,
      h: 0,
    };
    let prevBottom = height;
    stateRef.current.clip = {};
    for (let i = 0; i < numberOfDiscs; i++) {
      const p = i / numberOfDiscs;
      const disc = { p, x: 0, y: 0, w: 0, h: 0 };
      tweenDisc(disc);
      const bottom = disc.y + disc.h;
      if (bottom <= prevBottom) {
        stateRef.current.clip = { disc: { ...disc }, i };
      }
      prevBottom = bottom;
      stateRef.current.discs.push(disc);
    }
    const clipPath = new Path2D();
    const disc = stateRef.current.clip.disc;
    clipPath.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
    clipPath.rect(disc.x - disc.w, 0, disc.w * 2, disc.y);
    stateRef.current.clip.path = clipPath;
  }, [numberOfDiscs, tweenDisc]);

  const setLines = React.useCallback(() => {
    const { width, height } = stateRef.current.rect;
    stateRef.current.lines = [];
    const linesAngle = (Math.PI * 2) / numberOfLines;
    for (let i = 0; i < numberOfLines; i++) {
      stateRef.current.lines.push([]);
    }
    stateRef.current.discs.forEach((disc: any) => {
      for (let i = 0; i < numberOfLines; i++) {
        const angle = i * linesAngle;
        const p = {
          x: disc.x + Math.cos(angle) * disc.w,
          y: disc.y + Math.sin(angle) * disc.h,
        };
        stateRef.current.lines[i].push(p);
      }
    });
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;
    stateRef.current.lines.forEach((line: any) => {
      ctx.save();
      let lineIsIn = false;
      line.forEach((p1: any, j: number) => {
        if (j === 0) return;
        const p0 = line[j - 1];
        if (
          !lineIsIn &&
          (ctx.isPointInPath(stateRef.current.clip.path, p1.x, p1.y) ||
            ctx.isPointInStroke(stateRef.current.clip.path, p1.x, p1.y))
        ) {
          lineIsIn = true;
        } else if (lineIsIn) {
          ctx.clip(stateRef.current.clip.path);
        }
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = activeStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      });
      ctx.restore();
    });
    stateRef.current.linesCanvas = offCanvas;
  }, [numberOfLines, activeStroke]);

  const initParticle = React.useCallback(
    (start: boolean = false) => {
      const sx =
        stateRef.current.particleArea.sx +
        stateRef.current.particleArea.sw * Math.random();
      const ex =
        stateRef.current.particleArea.ex +
        stateRef.current.particleArea.ew * Math.random();
      const dx = ex - sx;
      const y = start
        ? stateRef.current.particleArea.h * Math.random()
        : stateRef.current.particleArea.h;
      const r = 0.5 + Math.random() * 4;
      const vy = 0.5 + Math.random();
      return {
        x: sx,
        sx,
        dx,
        y,
        vy,
        p: 0,
        r,
        color: activeParticleColor,
        alpha: 0.12 + Math.random() * 0.38,
      };
    },
    [activeParticleColor],
  );

  const setParticles = React.useCallback(() => {
    const { width, height } = stateRef.current.rect;
    stateRef.current.particles = [];
    const disc = stateRef.current.clip.disc;
    stateRef.current.particleArea = {
      sw: disc.w * 0.5,
      ew: disc.w * 2,
      h: height * 0.85,
    };
    stateRef.current.particleArea.sx =
      (width - stateRef.current.particleArea.sw) / 2;
    stateRef.current.particleArea.ex =
      (width - stateRef.current.particleArea.ew) / 2;
    const totalParticles = 100;
    for (let i = 0; i < totalParticles; i++) {
      stateRef.current.particles.push(initParticle(true));
    }
  }, [initParticle]);

  const drawDiscs = React.useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = activeStroke;
      ctx.lineWidth = 2;
      const outerDisc = stateRef.current.startDisc;
      ctx.beginPath();
      ctx.ellipse(
        outerDisc.x,
        outerDisc.y,
        outerDisc.w,
        outerDisc.h,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.closePath();
      stateRef.current.discs.forEach((disc: any, i: number) => {
        if (i % 5 !== 0) return;
        if (disc.w < stateRef.current.clip.disc.w - 5) {
          ctx.save();
          ctx.clip(stateRef.current.clip.path);
        }
        ctx.beginPath();
        ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
        if (disc.w < stateRef.current.clip.disc.w - 5) {
          ctx.restore();
        }
      });
    },
    [activeStroke],
  );

  const drawLines = React.useCallback((ctx: CanvasRenderingContext2D) => {
    if (stateRef.current.linesCanvas) {
      ctx.drawImage(stateRef.current.linesCanvas, 0, 0);
    }
  }, []);

  const drawParticles = React.useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.clip(stateRef.current.clip.path);
    stateRef.current.particles.forEach((particle: any) => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.rect(particle.x, particle.y, particle.r, particle.r);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }, []);

  const moveDiscs = React.useCallback(() => {
    stateRef.current.discs.forEach((disc: any) => {
      disc.p = (disc.p + 0.001) % 1;
      tweenDisc(disc);
    });
  }, [tweenDisc]);

  const moveParticles = React.useCallback(() => {
    stateRef.current.particles.forEach((particle: any, idx: number) => {
      particle.p = 1 - particle.y / stateRef.current.particleArea.h;
      particle.x = particle.sx + particle.dx * particle.p;
      particle.y -= particle.vy;
      if (particle.y < 0) {
        stateRef.current.particles[idx] = initParticle();
      }
    });
  }, [initParticle]);

  const tick = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(stateRef.current.render.dpi, stateRef.current.render.dpi);
    moveDiscs();
    moveParticles();
    drawDiscs(ctx);
    drawLines(ctx);
    drawParticles(ctx);
    ctx.restore();
    animationFrameIdRef.current = requestAnimationFrame(tick);
  }, [moveDiscs, moveParticles, drawDiscs, drawLines, drawParticles]);

  const init = React.useCallback(() => {
    setSize();
    setDiscs();
    setLines();
    setParticles();
  }, [setSize, setDiscs, setLines, setParticles]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    init();
    tick();
    const handleResize = () => {
      setSize();
      setDiscs();
      setLines();
      setParticles();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [init, tick, setSize, setDiscs, setLines, setParticles]);

  React.useEffect(() => {
    if (variant !== 'muted') return;
    setDiscs();
    setLines();
    setParticles();
  }, [variant, activeStroke, activeParticleColor, setDiscs, setLines, setParticles]);

  return (
    <div
      ref={containerRef}
      data-slot="hole-background"
      data-variant={variant}
      className={cn(
        'relative size-full overflow-hidden',
        variant === 'default' && [
          'before:content-[""] before:absolute before:top-1/2 before:left-1/2 before:block before:size-[140%] dark:before:[background:radial-gradient(ellipse_at_50%_55%,transparent_10%,black_50%)] before:[background:radial-gradient(ellipse_at_50%_55%,transparent_10%,white_50%)] before:[transform:translate3d(-50%,-50%,0)]',
          'after:content-[""] after:absolute after:z-[5] after:top-1/2 after:left-1/2 after:block after:size-full after:[background:radial-gradient(ellipse_at_50%_75%,#a900ff_20%,transparent_75%)] after:[transform:translate3d(-50%,-50%,0)] after:mix-blend-overlay',
        ],
        variant === 'muted' && [
          'before:content-[""] before:absolute before:top-1/2 before:left-1/2 before:block before:size-[140%] before:[background:radial-gradient(ellipse_at_50%_55%,transparent_8%,var(--background)_52%)] before:[transform:translate3d(-50%,-50%,0)]',
          'after:content-[""] after:absolute after:z-[5] after:top-1/2 after:left-1/2 after:block after:size-full after:[background:radial-gradient(ellipse_at_50%_75%,color-mix(in_oklch,var(--primary)_22%,transparent)_18%,transparent_72%)] after:[transform:translate3d(-50%,-50%,0)] after:mix-blend-soft-light',
        ],
        className,
      )}
      {...props}
    >
      {children}
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 block size-full',
          variant === 'default' && 'dark:opacity-20 opacity-10',
          variant === 'muted' && 'dark:opacity-[0.32] opacity-[0.2]',
        )}
      />
      <motion.div
        className={cn(
          'absolute top-[-71.5%] left-1/2 z-[3] w-[30%] h-[140%] rounded-b-full blur-3xl [transform:translate3d(-50%,0,0)] [background-position:0%_100%] [background-size:100%_200%]',
          variant === 'default' && [
            'opacity-75 dark:mix-blend-plus-lighter mix-blend-plus-darker',
            'dark:[background:linear-gradient(20deg,#00f8f1,#ffbd1e20_16.5%,#fe848f_33%,#fe848f20_49.5%,#00f8f1_66%,#00f8f160_85.5%,#ffbd1e_100%)_0_100%_/_100%_200%] [background:linear-gradient(20deg,#00f8f1,#ffbd1e40_16.5%,#fe848f_33%,#fe848f40_49.5%,#00f8f1_66%,#00f8f180_85.5%,#ffbd1e_100%)_0_100%_/_100%_200%]',
          ],
          variant === 'muted' && [
            'opacity-55 dark:opacity-65 dark:mix-blend-plus-lighter mix-blend-multiply',
            '[background:linear-gradient(20deg,color-mix(in_oklch,var(--primary)_38%,transparent),color-mix(in_oklch,var(--muted-foreground)_28%,transparent)_33%,color-mix(in_oklch,var(--primary)_32%,transparent)_66%,color-mix(in_oklch,var(--accent-foreground)_18%,transparent)_100%)_0_100%_/_100%_200%]',
            'dark:[background:linear-gradient(20deg,color-mix(in_oklch,var(--primary)_42%,transparent),color-mix(in_oklch,var(--muted-foreground)_34%,transparent)_33%,color-mix(in_oklch,var(--chart-2)_28%,transparent)_66%,color-mix(in_oklch,var(--primary)_36%,transparent)_100%)_0_100%_/_100%_200%]',
          ],
        )}
        animate={{ backgroundPosition: '0% 300%' }}
        transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
      />
      <div
        className={cn(
          'absolute top-0 left-0 z-[7] size-full mix-blend-overlay',
          variant === 'default' && [
            'opacity-50',
            'dark:[background:repeating-linear-gradient(transparent,transparent_1px,white_1px,white_2px)]',
          ],
          variant === 'muted' && [
            'opacity-35 dark:opacity-40',
            '[background:repeating-linear-gradient(transparent,transparent_1px,color-mix(in_oklch,var(--foreground)_10%,transparent)_1px,color-mix(in_oklch,var(--foreground)_10%,transparent)_2px)]',
            'dark:[background:repeating-linear-gradient(transparent,transparent_1px,color-mix(in_oklch,var(--foreground)_14%,transparent)_1px,color-mix(in_oklch,var(--foreground)_14%,transparent)_2px)]',
          ],
        )}
      />
    </div>
  );
}

export {
  HoleBackground,
  type HoleBackgroundProps,
  type HoleVariant,
};
