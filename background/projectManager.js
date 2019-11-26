window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

async function getCurrentProject() {
    return new Promise(resolve => {
        chrome.storage.local.get(['currentproject'], function(result) {
            resolve(result['currentproject']);
        });
    });
}

async function getProjectName() {
    var currentProject = await getCurrentProject();
    if (currentProject == null) {
        return "My Projects";
    } else {
        return currentProject;
    }
}

function setCurrentProject(file) {
    if (file == null) {
        chrome.storage.local.set({'currentproject': null});
    } else {
        chrome.storage.local.set({'currentproject': file}); 
    }
}

async function getParentState(fileID) {
    return new Promise(resolve => {
        chrome.storage.local.get({[fileID]: "shown"}, function(result) {
            resolve(result[fileID]);
        });
    });
}

async function getDirectoryState(fileID) {
    var parent_list = fileID.split("/");
    var toggle = await getParentState(fileID);
    for (let index = 2; index < parent_list.length; index++) {
        var parent = parent_list.slice(0, index).join("/");
        var parentState = await getParentState(parent);
        if (parentState == "hidden") {
            toggle = "hidden";
        }
    }
    return new Promise(resolve => {
        resolve(toggle);
    });
}

async function toggleDirectory(fileID) {
    var state = await getDirectoryState(fileID);
    return new Promise(resolve => {
        var toggle = state == "hidden" ? "shown" : "hidden";
        chrome.storage.local.set({[fileID]: toggle});
        resolve(toggle);
    });
}

var defaultTypes = {
    "Plain Text": { "index": 1, "icon": "/icons/plaintext.svg", "json_api": [], "image_api": [] },
    "Image": { "index": 2, "icon": "/icons/image.svg", "json_api": [], "image_api": [] },
    "Website": { "index": 3, "icon": "/icons/website.svg", "json_api": [], "image_api": [] },
    "Video": { "index": 4, "icon": "/icons/video.svg", "json_api": [], "image_api": [] },
    "Social Media": { "index": 5, "/icons/socialmedia.svg": "Social Media", "json_api": [], "image_api": [] },
    "Group": { "index": 6, "icon": "/icons/group.svg", "json_api": [], "image_api": [] },
    "Person": { "index": 7, "icon": "/icons/person.svg", "json_api": [], "image_api": [] },
    "Location": { "index": 8, "icon": "/icons/location.svg", "json_api": [], "image_api": ["https://external-content.duckduckgo.com/ssv2/?scale=1&lang=en&colorScheme=dark&format=png&size=500x500&center="] },
    "Code": { "index": 9, "icon": "/icons/code.svg", "json_api": [], "image_api": [] },
    "Username": { "index": 10, "icon": "/icons/username.svg", "json_api": [], "image_api": [] },
    "Email": { "index": 11, "icon": "/icons/email.svg", "json_api": [], "image_api": [] },
    "IP Address": { "index": 12, "icon": "/icons/ipaddress.svg", "json_api": [], "image_api": [] },
    "Device": { "index": 13, "icon": "/icons/device.svg", "json_api": [], "image_api": [] },
    "Vehicle": {  "index": 14,"icon": "/icons/vehicle.svg", "json_api": [], "image_api": [] },
}

async function getTypes() {
    return new Promise(resolve => {
        chrome.storage.local.get({'types': defaultTypes}, function(result) {
            resolve(result.types);
        });
    });
}

async function setHighlight(checked) {
    console.log("CHECKED: " + checked);
    chrome.storage.local.set({'togglehighlight': checked});
}

async function getHighlight() {
    return new Promise(resolve => {
        chrome.storage.local.get(['togglehighlight'], function(result) {
            console.log("Highlight: " + result.togglehighlight);
            resolve(result.togglehighlight);
        });
    });
}