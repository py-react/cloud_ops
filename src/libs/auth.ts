import { DefaultService } from "@/gingerJs_api_client";

export const getAuthToken = () => {
    const name = 'k1w1_token';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
};

export const logout = async () => {
    try {
        await DefaultService.apiV1AuthLogoutPost();
    } catch {
        document.cookie = "k1w1_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    window.location.href = '/login';
};
