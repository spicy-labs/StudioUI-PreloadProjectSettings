// GLOBAL VARS
//  - Get environment + authentication info from session cookie
//  - Set up reference to catalogue.html "catalogue" div element
const sessionCookie = JSON.parse(
    decodeURIComponent(document.cookie
        .split(';')
        .find(row => row.trim().startsWith('session='))
        ?.split('=')[1]
    )
);
const token = sessionCookie.token;
const envURL = sessionCookie.env_url;

const catalogueCookie = JSON.parse(
    decodeURIComponent(document.cookie
        .split(';')
        .find(row => row.trim().startsWith('catalogue='))
        ?.split('=')[1]
    )
);
const templateFromCookie = catalogueCookie.template_id;

const catalogueContainer = document.getElementById("catalogue");
console.log(`DEBUG! templateFromCookie is: ${templateFromCookie}`);
// Create page catalogue blocks per template layout
const populateCatalogue = async () => {
    const templateID = templateFromCookie ? templateFromCookie : document.getElementById("templateID").value;
    const layouts = await getTemplateLayouts(templateID);

    // Add catalogue block for each available layout in provided template
    layouts.forEach(async (layout) => {
        await createCatalogueBlock(templateID, layout);
    });

    // set catalogue cookie with input template
    const setCatalogue = await fetch(`catalogue`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "templateId": templateID
        })
    });
    console.log(await setCatalogue.json());
}

// Reset template input, delete current catalogue cookie
const unsetCurrentTemplate = async () => {
    try {
        const response = await fetch(`catalogue`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ "templateId": null })
        });
        const data = await response.json();
        console.log(data);

        if (data.success == true) {
            // Reload the page after processing the response
            setTimeout(() => window.location.reload(), 200);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Create single catalogue block from tempalte+layout
//  - ARGUMENTS:
//      - templateID: GraFx Studio Template guid
//      - layout: Template layout object
const createCatalogueBlock = async (templateID, layout) => {
    const container = document.createElement("div");
    container.id = layout.id;
    container.classList.add("block");

    const image = document.createElement("img");
    image.src = URL.createObjectURL(await getLayoutPreview(templateID, layout.id));
    container.append(image);

    const text = document.createElement("span");
    text.innerHTML = layout.displayName ?? layout.name;
    container.append(text);

    const button = document.createElement("button");
    button.innerHTML = "Create Project";
    button.addEventListener("click", async () => await createAndLoadProject(templateID, layout));
    container.append(button);

    catalogueContainer.append(container);
}

// Get system preview of specific layout from a given template
//  - ARGUMENTS:
//      - templateID: GraFx Studio Template guid
//      - layoutID: Template layout guid
//  - RETURNS:
//      - Template+layout preview image, as a blob
const getLayoutPreview = async (templateID, layoutID) => {
    const previewURL = `${envURL}/templates/${templateID}/preview?previewType=highest&layoutId=${layoutID}`;
    let previewResponse = await fetch(previewURL, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    if (!previewResponse.ok) {
        throw new Error(`Error fetching template preview: ${previewResponse.statusText}`);
    }
    if (previewResponse.status == 200) {
        return await previewResponse.blob();
    } else {
        const task = (await previewResponse.json()).links.taskInfo;
        let polling = true;
        while (polling) {
            const taskResponse = await fetch(task, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!taskResponse.ok) {
                throw new Error(`Error polling preview task: ${previewResponse.statusText}`);
            }
            if (taskResponse.status == 200) {
                polling = false;
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        previewResponse = await fetch(previewURL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        return await previewResponse.blob();
    }
}

// Get all available layouts from input template
//  - ARGUMENTS:
//      - templateID: GraFx Studio Template guid
//  - RETURNS:
//      - Array of template layout objects
const getTemplateLayouts = async (templateID) => {
    // fetch template JSON, then pass through template info service endpoint
    const templateURL = `${envURL}/templates/${templateID}/download`;
    const getTemplateResponse = await fetch(templateURL, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    if (!getTemplateResponse.ok) {
        throw new Error(`Error fetching template JSON: ${getTemplateResponse.statusText}`);
    }
    // Return list of available layouts from template

    // This is the "correct" way to do this, but the template info endpoint throws CORS errors coming from localhost server
    // return await templateInfo(await getTemplateResponse.json());

    // This is the "wrong" way to do it, direct JSON reading is not a supported workflow
    return getLayoutsFromJson(await getTemplateResponse.json());
}

// Get available layouts via GraFx Template Information endpoint
//  - ARGUMENTS:
//      - templateJSON: GraFx Studio Template JSON definition
//  - RETURNS:
//      - Object representation of available layouts from input template JSON
const getTemplateInfoLayouts = async (templateJSON) => {
    const templateInfoURL = "https://template-information.chiligrafx.com/query";
    const templateInfoBody = {
        "documentJson": JSON.stringify(templateJSON),
        "queries": [
            {
                "property": "layoutsAvailableForUser"
            }
        ]
    };
    const templateInfoResponse = await fetch(templateInfoURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(templateInfoBody)
    });
    if (!templateInfoResponse.ok) {
        throw new Error(`Error with template information service: ${templateInfoResponse.statusText}`);
    }

    return (await templateInfoResponse.json()).results.find(result => result.type === "layoutsAvailableForUser").value;
}

// Get available layouts by directly parsing template JSON
//  - ARGUMENTS:
//      - templateJSON: GraFx Studio Template JSON definition
//  - RETURNS:
//      - Object representation of available layouts from input template JSON
//  - NOTE: This is technically an unsupported workflow! Should use getTemplateInfoFromLayouts instead
const getLayoutsFromJson = (templateJSON) => {
    const availableLayouts = templateJSON.layouts.filter(layout => layout.availableForUser === true);
    return availableLayouts;
}

// Create GraFx Studio Project and load created Project page
//  - ARGUMENTS:
//      - templateID: GraFx Studio Template guid
//      - layout: Template layout object
const createAndLoadProject = async (templateID, layout) => {
    // Create new Project from base template
    const createProjectURL = `${envURL}/projects`;
    const createProjectBody = {
        "template": {
            "id": templateID
        }
    };
    const createProjectResponse = await fetch(createProjectURL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(createProjectBody)
    });
    if (!createProjectResponse.ok) {
        throw new Error(`Error creating project: ${createProjectResponse.statusText}`);
    }
    const projectId = (await createProjectResponse.json()).id;

    // set editor session cookie with new project + relevant layout
    const setEditorResponse = await fetch(`project`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "projectId": projectId,
            "layout": layout
        })
    });
    console.log(await setEditorResponse.json());
    // open editor page
    setTimeout(() => window.location.href = "editor", 200);
}

if (templateFromCookie) {
    console.log(`DEBUG! Should be auto-populating catalogue on load :)`);
    populateCatalogue();
}