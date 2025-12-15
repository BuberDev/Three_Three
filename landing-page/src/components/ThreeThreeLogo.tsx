'use client'

import Image from "next/image";
import Logo from "../../public/logo.png";

interface ThreeThreeLogoProps {
    className?: string;
    size?: number;
    animate?: boolean;
}

export default function ThreeThreeLogo({
    className = "",
    size = 48,
    animate = false
}: ThreeThreeLogoProps) {
    return (
        <Image
            src={Logo}
            alt="Three Three Logo"
            className={`rounded-full ${animate ? 'animate-pulse' : ''} ${className}`}
            width={size}
            height={size}
        />
    )
}