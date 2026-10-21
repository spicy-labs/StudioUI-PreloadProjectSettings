# Overview
This sample application dynamically creates multiple storefont catalogue entries from a single GraFx Studio template. It creates a unique catalogue block for each template layout available to end users. Each catalogue block in turn will show a preview of the template (specific to the layout attached to the entry), and a button to create and load a project from the template using said layout.

# Requirements
Node  
GraFx environment credentials  
A configured GraFx Studio template 

# Setup
1. Install the node package dependencies for the project using `npm i`
2. Run `node server/server.js` to start up the local webserver
3. Open `localhost:3000` in a web browser to use the application

# How to use the app
### Authentication
The default landing page will prompt you for GraFx authentication details.  
1. **Environment**: The technical name of your GraFx environment (i.e. "cp-abc-123")
2. **Client ID**: The client ID of the GraFx integration user you want to use
3. **Client Secret**: The client secret of the GraFx integration user you want to use

After filling these three fields out, click "Login".

> Clicking the "Switch authentication mode" button will allow you to directly provide a bearer token, if you prefer

### Template Catalogue
When logged in, the landing page will instead be the Template Catalogue page.  

The **Base Template ID** input field expects a GraFx Studio template ID that exists on the environment you specified on authentication. Once an ID is input, click "Populate Catalogue" and you should see a block formed for each layout in your template that is marked as available for end users.  

These blocks consist of:
1. The display name of the layout
2. The layout-specific template preview image
3. A button to create and load a project using that layout