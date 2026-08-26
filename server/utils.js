import { setCookie, getCookie, deleteCookie } from "hono/cookie";

// these should really be generic get/set/delete functions but I'm being lazy
export function setSessionCookie(context, environmentURL, token) {
    const cookie = {
        "env_url": environmentURL,
        "token": token
    }

    const options = {
        secure: false,
        maxAge: 3600,
        httpOnly: false,
        path: "/"
    };

    setCookie(context, "session", JSON.stringify(cookie), options);

    return context.json({ success: true }, 200);
}

export function getSessionCookie(context) {
    const sessionCookie = getCookie(context, "session");
    if (!sessionCookie) {
        return "unauth";
    }

    // later -- put a check here for any empty values in the cookie

    return JSON.parse(sessionCookie);
}

export function deleteSessionCookie(context) {
    deleteCookie(context, 'session');

    return context.json({ success: true }, 200);
}

export function setEditorCookie(context, projectId, layout) {
    const cookie = {
        "project_id": projectId,
        "layout_id": layout.id,
        "layout_name": layout.name,
        "layout_displayName": layout.displayName ?? layout.name
    };

    const options = {
        secure: false,
        maxAge: 72000,
        httpOnly: false,
        path: "/"
    };

    setCookie(context, "editor", JSON.stringify(cookie), options);
    return context.json( {success: true }, 200);
}

export function getEditorCookie(context) {
    const editorCookie = getCookie(context, "editor");
    if(!editorCookie) {
        return "undefined";
    }

    return JSON.parse(editorCookie);
}

export function deleteEditorCookie(context) {
    deleteCookie(context, "editor");

    return context.json({ success: true }, 200);
}