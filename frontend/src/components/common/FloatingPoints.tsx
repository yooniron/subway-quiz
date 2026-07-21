import React from 'react';

interface FloatingPointsProps {
    points: number | null;
}

export const FloatingPoints: React.FC<FloatingPointsProps> = ({ points }) => {
    if (points === null) return null;

    return (
        <span className="absolute -top-4 right-2 text-xl font-black text-green-400 animate-float-up pointer-events-none">
            +{points}
        </span>
    );
};
