// pull auth/env info from session cookie
const sessionCookie = JSON.parse(
    decodeURIComponent(document.cookie
        .split(';')
        .find(row => row.startsWith('session='))
        ?.split('=')[1]
    )
);
const token = sessionCookie.token;
const envURL = sessionCookie.env_url;

const catalogueContainer = document.getElementById("catalogue");
const getTemplateLayouts = async(templateID) => {
    // fetch template JSON, then pass through template info service endpoint
    const templateURL = `${envURL}/templates/${templateID}/download`;
    const getTemplateResponse = await fetch(templateURL, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    if(!getTemplateResponse.ok) {
        throw new Error(`Error fetching template JSON: ${getTemplateResponse.statusText}`);
    }
    // This is the "correct" way to do this, but the template info endpoint throws CORS errors coming from basic localhost server
    // return await templateInfo(await getTemplateResponse.json());

    // This is the "wrong" way to do it, direct JSON reading is not a supported workflow
    return getLayoutsFromJson(await getTemplateResponse.json());
    
}


const templateInfo = async(templateJSON) => {
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
    if(!templateInfoResponse.ok) {
        throw new Error(`Error with template information service: ${templateInfoResponse.statusText}`);
    }

    return (await templateInfoResponse.json()).results.find(result => result.type === "layoutsAvailableForUser").value;
}

const getLayoutsFromJson = templateJSON => {
    const availableLayouts = templateJSON.layouts.filter(layout => layout.availableForUser === true);
    return availableLayouts;

}

const populateCatalogue = async() => {
    const templateID = document.getElementById("templateID").value;
    const layouts = await getTemplateLayouts(templateID);

    // Add catalogue block for each available layout in provided template
    layouts.forEach(async (layout) => {
        await createCatalogueBlock(templateID, layout);
    });
}

const createCatalogueBlock = async(templateID, layout) => {
    // none styling on this atm, will be very ugly
    const container = document.createElement("div");
    container.id = layout.id;

    const text = document.createElement("span");
    text.innerHTML = layout.displayName;
    container.append(text);

    const button = document.createElement("button");
    button.innerHTML = "Create Project";
    button.addEventListener("click", async() => await createAndLoadProject(templateID, layout));
    container.append(button);

    catalogueContainer.append(container);
}

const createAndLoadProject = async(templateID, layout) => {
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
    if(!createProjectResponse.ok) {
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