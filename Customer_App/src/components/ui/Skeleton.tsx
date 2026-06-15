import React from 'react';

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                backgroundColor: 'var(--accent)',
                backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '4px',
                ...style,
            }}
        />
    );
}
