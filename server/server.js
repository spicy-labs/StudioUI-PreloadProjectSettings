import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import * as fs from 'fs';
import { setSessionCookie, getSessionCookie, deleteSessionCookie, setEditorCookie, getEditorCookie, deleteEditorCookie, setCatalogueCookie, getCatalogueCookie, deleteCatalogueCookie } from './utils.js';

const app = new Hono();

// PAGE NAV/JS FETCHERS
app.get("/", async (context) => {
    const sessionCookie = getSessionCookie(context);
    if (sessionCookie == "unauth") {
        const loginPage = await fs.promises.readFile("public/auth.html", "utf8");
        return context.html(loginPage);
    } else {
        const cataloguePage = await fs.promises.readFile("public/catalogue.html", "utf8");
        return context.html(cataloguePage);
    }
});

app.get("/editor", async (context) => {
    const editorCookie = getEditorCookie(context);
    if(editorCookie == "undefined") {
        const cataloguePage = await fs.promises.readFile("public/catalogue.html", "utf8");
        return context.html(cataloguePage);
    } else {
        const editorPage = await fs.promises.readFile("public/editor.html", 'utf8');
        return context.html(editorPage);
    }
});

app.get("/public/js/studioUI.js", async (context) => {
    const js = await fs.promises.readFile("public/js/studioUI.js", "utf8");
    return context.text(js);
});

app.get("/public/js/catalogue.js", async (context) => {
    const js = await fs.promises.readFile("public/js/catalogue.js", "utf8");
    return context.text(js);
});

// GRAFX AUTH
app.post("/auth", async (context) => {
    const body = await context.req.json();
    setCatalogueCookie(context, null);
    return setSessionCookie(context, body.environmentURL, body.token);
});

app.delete("/logout", async (context) => {
    deleteCatalogueCookie(context);
    return deleteSessionCookie(context);
});

// CATALOGUE
app.post("/catalogue", async (context) => {
    const body = await context.req.json();
    return setCatalogueCookie(context, body.templateId);
});

app.delete("/catalogue", async (context) => {
    return deleteCatalogueCookie(context);
})

// EDITOR SESSION MANAGEMENT
app.post("/project", async (context) => {
    const body = await context.req.json();
    return setEditorCookie(context, body.projectId, body.layout);
});

app.delete("/project", async (context) => {
    return deleteEditorCookie(context);
});

serve(app);