'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    full_name: string | null;
    gcp_config: any;
    ai_config: any;
    credits: number;
}

interface UserMission {
    user_id: string;
    mission_id: string;
    kickoff_at: string | null;
    unlocked_datasets: string[];
    synced_datasets: string[];
    credits: number;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    userMissions: UserMission[];
    loading: boolean;
    signOut: () => Promise<void>;
    syncMissionProgress: (missionId: string, kickoff?: boolean) => Promise<UserMission | null>;
    unlockDataset: (missionId: string, datasetId: string, cost: number) => Promise<boolean>;
    markDatasetSynced: (missionId: string, datasetId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userMissions, setUserMissions] = useState<UserMission[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                console.log('AuthProvider: Initial session:', initialSession ? 'YES' : 'NO');

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    await Promise.all([
                        fetchProfile(initialSession.user.id, initialSession.user.user_metadata?.full_name),
                        fetchUserMissions(initialSession.user.id)
                    ]);
                }
            } catch (err) {
                console.error('AuthProvider: Error during initialization:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('AuthProvider: Auth state changed:', _event);

            // Only update states if they've actually changed or if it's an event that requires it
            if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'USER_UPDATED' || _event === 'TOKEN_REFRESHED') {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await Promise.all([
                        fetchProfile(session.user.id, session.user.user_metadata?.full_name),
                        fetchUserMissions(session.user.id)
                    ]);
                } else {
                    setProfile(null);
                    setUserMissions([]);
                }
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, fullName?: string) => {
        try {
            console.log('Fetching profile for:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // PGRST116 means no rows found
                if (error.code === 'PGRST116') {
                    console.log('Profile not found, creating default profile...');
                    const { data: newData, error: insertError } = await supabase
                        .from('profiles')
                        .insert([{ id: userId, full_name: fullName || 'New User' }])
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Error creating default profile:', insertError);
                    } else {
                        setProfile(newData);
                    }
                } else {
                    console.error('Error fetching profile:', {
                        message: error.message,
                        details: error.details,
                        code: error.code
                    });
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error in fetchProfile:', err);
        }
    };

    const fetchUserMissions = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_missions')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user missions:', error);
        } else {
            setUserMissions(data || []);
        }
    };

    const syncMissionProgress = async (missionId: string, kickoff: boolean = false) => {
        if (!user) return null;

        // CRITICAL: Fetch the latest state from the database directly instead of relying on local state
        // to avoid race conditions where local state hasn't loaded yet.
        const { data: dbData, error: fetchError } = await supabase
            .from('user_missions')
            .select('*')
            .eq('user_id', user.id)
            .eq('mission_id', missionId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error checking mission progress in DB:', fetchError);
        }

        const existing = dbData;

        // If kicking off and already has a timestamp, don't overwrite
        if (kickoff && existing?.kickoff_at) return existing;

        const updateData: any = {
            user_id: user.id,
            mission_id: missionId,
            unlocked_datasets: existing?.unlocked_datasets || [],
            synced_datasets: existing?.synced_datasets || [],
            credits: existing?.credits ?? 100
        };

        if (kickoff) {
            updateData.kickoff_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('user_missions')
            .upsert(updateData)
            .select()
            .single();

        if (error) {
            console.error('Error syncing mission progress:', error);
            return null;
        }

        // Update local state
        setUserMissions(prev => {
            const index = prev.findIndex(m => m.mission_id === missionId);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = data;
                return updated;
            }
            return [...prev, data];
        });

        return data;
    };

    const unlockDataset = async (missionId: string, datasetId: string, cost: number) => {
        const missionProgress = userMissions.find(m => m.mission_id === missionId);
        if (!user || !missionProgress || missionProgress.credits < cost) return false;

        const currentUnlocked = missionProgress.unlocked_datasets || [];
        if (currentUnlocked.includes(datasetId)) return true;

        const newUnlocked = [...currentUnlocked, datasetId];
        const newCredits = missionProgress.credits - cost;

        try {
            // Update user_missions with both the new dataset and the deducted credits
            const { error: mError } = await supabase
                .from('user_missions')
                .update({
                    unlocked_datasets: newUnlocked,
                    credits: newCredits
                })
                .eq('user_id', user.id)
                .eq('mission_id', missionId);

            if (mError) throw mError;

            // Update local state
            setUserMissions(prev => prev.map(m =>
                m.mission_id === missionId
                    ? { ...m, unlocked_datasets: newUnlocked, credits: newCredits }
                    : m
            ));

            return true;
        } catch (err) {
            console.error('Error unlocking dataset:', err);
            return false;
        }
    };

    const markDatasetSynced = async (missionId: string, datasetId: string) => {
        const missionProgress = userMissions.find(m => m.mission_id === missionId);
        if (!user || !missionProgress) return false;

        const currentSynced = missionProgress.synced_datasets || [];
        if (currentSynced.includes(datasetId)) return true;

        const newSynced = [...currentSynced, datasetId];

        try {
            const { error: mError } = await supabase
                .from('user_missions')
                .update({ synced_datasets: newSynced })
                .eq('user_id', user.id)
                .eq('mission_id', missionId);

            if (mError) throw mError;

            // Update local state
            setUserMissions(prev => prev.map(m =>
                m.mission_id === missionId
                    ? { ...m, synced_datasets: newSynced }
                    : m
            ));

            return true;
        } catch (err: any) {
            console.error('CRITICAL: markDatasetSynced failed!');
            if (err.message?.includes('synced_datasets') || err.code === '42703') {
                console.error('--- DATABASE MIGRATION REQUIRED ---');
                console.error('The "synced_datasets" column is missing from the "user_missions" table.');
                console.error('Please run the SQL in frontend/supabase/user_missions_table.sql');
            }
            console.error('Full Error Object:', err);
            return false;
        }
    };

    const signOut = async () => {
        try {
            console.log('AuthProvider: Signing out...');
            await supabase.auth.signOut();
        } catch (error: any) {
            if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.code === '20') {
                console.log('AuthProvider: Sign out request aborted (normal during navigation).');
            } else {
                console.error('AuthProvider: Error signing out from Supabase:', error);
            }
        } finally {
            // Force full navigation to ensure cookies sync with middleware
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            userMissions,
            loading,
            signOut,
            syncMissionProgress,
            unlockDataset,
            markDatasetSynced
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
