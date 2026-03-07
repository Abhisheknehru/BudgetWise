import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import {
    findOrCreateSheet,
    getStoredSheetId,
    clearSheetId,
    getSheetUrl,
    fetchUserInfo,
} from '../utils/googleSheetsApi';

// ── Persistence helpers ──────────────────────────────────────────────────────

const AUTH_KEY = 'bw_google_auth';

const loadStoredAuth = () => {
    try {
        const d = localStorage.getItem(AUTH_KEY);
        return d ? JSON.parse(d) : null;
    } catch {
        return null;
    }
};

const saveStoredAuth = (payload) =>
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));

const clearStoredAuth = () => localStorage.removeItem(AUTH_KEY);

// Token is valid if it expires more than 60 s from now
const isTokenValid = (stored) =>
    stored?.expiresAt && stored.expiresAt > Date.now() + 60_000;

// ── Context definition ───────────────────────────────────────────────────────

const GoogleAuthContext = createContext(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function GoogleAuthProvider({ children }) {
    const [user, setUser] = useState(null);          // { email, name, picture }
    const [accessToken, setAccessToken] = useState(null);
    const [sheetId, setSheetId] = useState(null);
    const [sheetReady, setSheetReady] = useState(false);
    const [initializing, setInitializing] = useState(true);  // true while restoring session
    const [sheetLoading, setSheetLoading] = useState(false);  // true while creating/finding sheet
    const [error, setError] = useState(null);

    // ── Restore session on mount ─────────────────────────────────────────────

    useEffect(() => {
        const stored = loadStoredAuth();

        if (stored && isTokenValid(stored)) {
            setUser(stored.user);
            setAccessToken(stored.accessToken);

            // If sheet ID was already resolved in a previous session, use it
            const storedSheetId = getStoredSheetId();
            if (storedSheetId) {
                setSheetId(storedSheetId);
                setSheetReady(true);
                setInitializing(false);
            } else {
                // Find/create sheet in background
                setInitializing(false);
                setSheetLoading(true);
                findOrCreateSheet(stored.accessToken)
                    .then((id) => {
                        setSheetId(id);
                        setSheetReady(true);
                    })
                    .catch(() => {
                        setError('Could not initialize your Google Sheet. Please sign in again.');
                    })
                    .finally(() => setSheetLoading(false));
            }
        } else {
            // No valid session — clear any stale data
            clearStoredAuth();
            clearSheetId();
            setInitializing(false);
        }
    }, []);

    // ── Sheet initialization helper ──────────────────────────────────────────

    const initSheet = useCallback(async (token) => {
        setSheetLoading(true);
        setSheetReady(false);
        try {
            const id = await findOrCreateSheet(token);
            setSheetId(id);
            setSheetReady(true);
            return id;
        } catch (err) {
            setError('Could not create your Google Sheet. Please try again.');
            throw err;
        } finally {
            setSheetLoading(false);
        }
    }, []);

    // ── Google login (implicit flow — returns access_token directly) ─────────

    const login = useGoogleLogin({
        flow: 'implicit',
        scope: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
            'openid',
            'email',
            'profile',
        ].join(' '),

        onSuccess: async (tokenResponse) => {
            setError(null);
            const { access_token, expires_in = 3600 } = tokenResponse;

            // Fetch profile info
            let userInfo = { email: '', name: 'User', picture: '' };
            try {
                userInfo = await fetchUserInfo(access_token);
            } catch {
                // Non-critical
            }

            setUser(userInfo);
            setAccessToken(access_token);

            // Persist session
            saveStoredAuth({
                user: userInfo,
                accessToken: access_token,
                expiresAt: Date.now() + expires_in * 1000,
            });

            // Create/find "My Expenses" sheet
            await initSheet(access_token);
        },

        onError: () => {
            setError('Google sign-in failed. Please try again.');
        },
    });

    // ── Sign out ─────────────────────────────────────────────────────────────

    const signOut = () => {
        try { googleLogout(); } catch { /* Google library may not be loaded yet */ }
        clearStoredAuth();
        clearSheetId();
        setUser(null);
        setAccessToken(null);
        setSheetId(null);
        setSheetReady(false);
        setError(null);
    };

    // ── Context value ────────────────────────────────────────────────────────

    const sheetUrl = sheetId ? getSheetUrl(sheetId) : null;

    return (
        <GoogleAuthContext.Provider
            value={{
                user,
                accessToken,
                sheetId,
                sheetUrl,
                sheetReady,
                sheetLoading,
                initializing,
                error,
                login,
                signOut,
            }}
        >
            {children}
        </GoogleAuthContext.Provider>
    );
}

export const useGoogleAuth = () => useContext(GoogleAuthContext);
