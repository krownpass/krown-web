
const TOKEN_KEY = "token";

export function setToken(token: string) {

    console.log("Received token:", token);
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}
