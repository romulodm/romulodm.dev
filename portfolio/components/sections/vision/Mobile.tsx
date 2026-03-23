'use client';

import { useEffect, useState } from 'react';

export default function useMobileMode(): boolean {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 740);
    }, []);
    return isMobile;
}