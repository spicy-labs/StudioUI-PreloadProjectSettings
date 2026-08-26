let studioUISDK;
// pull session/editor cookies
const sessionCookie = JSON.parse(
    decodeURIComponent(document.cookie
        .split(';')
        .find(row => row.trim().startsWith('session='))
        ?.split('=')[1]
    )
);
const token = sessionCookie.token;
const environmentBaseURL = sessionCookie.env_url;
const editorCookie = JSON.parse(
    decodeURIComponent(document.cookie
        .split(';')
        .find(row => row.trim().startsWith('editor='))
        ?.split('=')[1]
    )
);
const projectID = editorCookie.project_id;
const layoutId = editorCookie.layout_id;
const layoutName = editorCookie.layout_displayName;

const studioUIContainer = 'studio-ui-container';
// UI options for Studio UI
const uiOptions = {
    widgets: {
        downloadButton: {
            visible: true,
        },
        backButton: {
            visible: false
        },
    }
}
// placeholder, token will just silently expire in this app
const refreshTokenAction = () => Promise.resolve(token);

// onProjectLoaded event listener
const onProjectLoaded = async() => {
    window.StudioUISDK.layout.select(layoutId);
}

// download button override example, not used here but keeping for reference
/*
const onProjectGetDownloadLink = async () => {
    const outputSettings = "OUTPUT_SETTINGS_ID"
    // Get current date
    const date = formatDate(new Date(Date.now()).toLocaleDateString());
    // Get current doc state
    const docJSON = (await window.StudioUISDK.document.getCurrentState()).parsedData;
    // just assuming we always use a PDF for this
    const outputURL = `${environmentBaseURL}/output/pdf`;
    const requestBody = {
        variables: [{ "Date": date }],
        outputSettingsId: outputSettings,
        documentContent: docJSON
    };

    // Start output task
    const response = await fetch(outputURL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });
    if (response.ok) {
        const taskID = (await response.json()).data.taskId;
        return await pollOutputTask(taskID);
    }
}
*/

window.StudioUI.studioUILoaderConfig({
    selector: studioUIContainer,
    projectDownloadUrl: `${environmentBaseURL}/projects/${projectID}/document`,
    projectID: projectID,
    projectUploadUrl: `${environmentBaseURL}/projects/${projectID}`,
    graFxStudioEnvironmentApiBaseUrl: environmentBaseURL,
    authToken: token,
    refreshTokenAction: refreshTokenAction,
    projectName: layoutName,
    onProjectLoaded: onProjectLoaded
});

const getVariableID = async (varName) => {
    return (await window.StudioUISDK.variable.getByName(varName)).parsedData.id;
}

const pollOutputTask = async (taskID) => {
    const statusURL = `${environmentBaseURL}/output/tasks/${taskID}`;
    let isPolling = true;
    let download;
    while (isPolling) {
        const response = await fetch(statusURL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (response.ok) {
            // 202 means task still running
            if (response.status == 202) {
                await new Promise(r => setTimeout(r, 1000));
            }
            // 200 means task finished
            else if (response.status == 200) {
                isPolling = false;
                download = (await response.json()).links.download;
            }
            // anything else means task failed, break loop
            else {
                isPolling = false;
                return {
                    status: 500,
                    success: false,
                    parsedData: undefined,
                    data: undefined,
                    error: "Unexpected error during download",
                };
                return "TASK FAILED";
            }
        }
    }
    return {
        status: 200,
        success: true,
        parsedData: download,
        data: download,
        error: undefined,
    };
}

const saveDoc = async () => {
    const json = (await window.StudioUISDK.document.getCurrentState()).parsedData;
    console.log(JSON.stringify(json));

    const response = await fetch(`${environmentBaseURL}/projects/${projectID}/document`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentJson: json }),
    });
    if (!response.ok) {
        throw new Error(`Error saving document: ${response.statusText}`);
    }
}