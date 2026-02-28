'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Unlink } from '@unlink-xyz/core';

interface UnlinkContextType {
    mnemonic: string | null;
    setMnemonic: (mnemonic: string) => void;
    clearMnemonic: () => void;
    isInitialized: boolean;
    burnerAddress: string | null;
    unlinkInstance: Unlink | null;
}

const UnlinkContext = createContext<UnlinkContextType | undefined>(undefined);

export function UnlinkProvider({ children }: { children: ReactNode }) {
    const [mnemonic, setMnemonicState] = useState<string | null>(null);
    const [burnerAddress, setBurnerAddress] = useState<string | null>(null);
    const [unlinkInstance, setUnlinkInstance] = useState<Unlink | null>(null);

    const setMnemonic = (newMnemonic: string) => {
        setMnemonicState(newMnemonic);
        // Note: in a real app, you'd initialize the Unlink SDK with this mnemonic
        // For @unlink-xyz/core we usually don't set a global mnemonic if it's strictly in memory,
        // but we will use it to derive burners.
    };

    const clearMnemonic = () => {
        setMnemonicState(null);
        setBurnerAddress(null);
    };

    useEffect(() => {
        async function loadBurner() {
            if (mnemonic) {
                try {
                    const instance = await Unlink.create({
                        chain: "monad-testnet"
                    });
                    setUnlinkInstance(instance);

                    const { address } = await instance.burner.addressOf(0);
                    setBurnerAddress(address);
                } catch (e) {
                    console.error("Failed to derive burner address:", e);
                    // Fallback mock
                    setBurnerAddress("0xBurner1234567890abcdef1234567890abcdef");
                }
            }
        }
        loadBurner();
    }, [mnemonic]);

    return (
        <UnlinkContext.Provider value={{
            mnemonic,
            setMnemonic,
            clearMnemonic,
            isInitialized: !!mnemonic,
            burnerAddress,
            unlinkInstance,
        }}>
            {children}
        </UnlinkContext.Provider>
    );
}

export function useUnlink() {
    const context = useContext(UnlinkContext);
    if (context === undefined) {
        throw new Error('useUnlink must be used within an UnlinkProvider');
    }
    return context;
}
