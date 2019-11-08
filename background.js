//[      Project Manager      ]======================================================================
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

var defaultTypes = {
    "Plain Text": { "index": 1, "icon": "icons/plaintext.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Image": { "index": 2, "icon": "icons/image.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Website": { "index": 3, "icon": "icons/website.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Video": { "index": 4, "icon": "icons/video.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Social Media": { "index": 5, "icons/socialmedia.svg": "Social Media", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Group": { "index": 6, "icon": "icons/group.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Person": { "index": 7, "icon": "icons/person.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Location": { "index": 8, "icon": "icons/location.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": ["https://external-content.duckduckgo.com/ssv2/?scale=1&lang=en&colorScheme=dark&format=png&size=500x500&center="] },
    "Code": { "index": 9, "icon": "icons/code.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Username": { "index": 10, "icon": "icons/username.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Email": { "index": 11, "icon": "icons/email.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "IP Address": { "index": 12, "icon": "icons/ipaddress.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Device": { "index": 13, "icon": "icons/device.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
    "Vehicle": {  "index": 14,"icon": "icons/vehicle.svg", "save_source_url": true, "save_source_image": true, "json_api": [], "image_api": [] },
}

async function getTypes() {
    return new Promise(resolve => {
        chrome.storage.local.get({'types': defaultTypes}, function(result) {
            resolve(result.types);
        });
    });
}


//[      Script Injector      ]======================================================================

function cleanText(text, newline){
    if (newline) {
        return text.replace(/[']/g, "\\\'").replace(/["]/g, "\\\"").replace(/(\r\n|\n|\r|\s{2})/gm,"");
    }
    return text.replace(/[']/g, "\\\'").replace(/["]/g, "\\\"");
}

async function captureScreen() {
    return new Promise(resolve => {
        chrome.tabs.captureVisibleTab(function(screenshotUrl) {
            resolve(screenshotUrl);
        });
    });
}

async function injectScripts(dirEntry, tabid, info) {
    var screenshot = await captureScreen();
    dirEntry.getFile("newEntry.html", undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.addEventListener("load", function (event) {   
                    chrome.tabs.insertCSS({file: 'style.css'}, function() {
                        chrome.tabs.executeScript(tabid, {file: 'main.js'}, function() {
                            chrome.tabs.executeScript(tabid, { file: 'buttons.js' }, function() {
                                var content = 'document.body.innerHTML = \' <div id=\"popup\" style=\"visibility: visible\">' + cleanText(reader.result, true) + '</div>\' + document.body.innerHTML;';     
                                chrome.tabs.executeScript(tabid, { code: content }, function() {
                                    var command1 = 'document.getElementById(\'entry-name\').value = \'' + cleanText(info.selectionText.substring(0, 25), false) + '\';';
                                    var command2 = 'document.getElementById(\'entry-data\').value = \'' + cleanText(info.selectionText, false) + '\';';
                                    var command3 = 'document.getElementById(\'exit-popup\').src = \'' + chrome.runtime.getURL("icons/exit.svg") + '\';';
                                    var command4 = 'document.getElementById(\'image-storage\').src = \'' + cleanText(screenshot, true) + '\';';
                                    var command5 = 'finishPopup("newEntry.html");';
                                    chrome.tabs.executeScript(tabid, { code: command1 + command2 + command3 + command4 + command5 }, function() {
                                    
                                    });
                                });
                            });
                        });
                    });    
                });
                reader.readAsText(file);
            });
        });
}

//[      Menu Item Manager      ]======================================================================

function menuItem(info, tab) {
    if (info.menuItemId === "add-entry") {
        chrome.runtime.getPackageDirectoryEntry(function (dirEntry) {
            injectScripts(dirEntry, tab.id, info);
        });
    } 
}

chrome.contextMenus.create({
    title: "Add to project",
    id: "add-entry",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(menuItem);

//[      Message Handler      ]======================================================================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request.greeting + (sender.tab ? " Message from:" + sender.tab.url : " Message from the extension"));
    if (request.greeting == "add-entry") {
        createEntry(request.parent, request.type, request.name, request.data, sender.tab ? sender.tab.url : "Manual", request.image).then(sendResponse);
    }
    if (request.greeting == "add-project") {
        createProject(request.name).then(sendResponse);
    }
    if (request.greeting == "delete-file") {
        deleteDir(request.file).then(sendResponse);
    }
    if (request.greeting == "request-project") {
        getProjectName().then(sendResponse)
    }
    if (request.greeting == "request-list") {
        getFileList().then(files => {sendResponse(JSON.stringify(files))});
    }
    if (request.greeting == "request-file") {
        getFile(request.file).then(sendResponse);
    }
    if (request.greeting == "request-preview") {
        getPreview(request.file).then(files => {sendResponse(files)});
    }
    if (request.greeting == "request-types") {
        getTypes().then(types => {sendResponse(JSON.stringify(types))});
    }
    if (request.greeting == "set-project") {
        setCurrentProject(request.name);
        sendResponse(true);
    }
    return true;
});

//[      File Handlers      ]======================================================================

function errorHandler(e){
    console.log(e + " ; " + e.code);
}

function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
}

function getFileLocation(parent, type, name) {
    if (parent && parent != "none") {
        var location = parent + "/" + type + "_" + name;
    } else {
        var location = type + "_" + name;
    }
    return location;
}

async function getFileSystem() {
    return new Promise(resolve => {
        window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
            resolve(fs);
        });
    });
}
async function getPreview(file) {
    var file = await getFile(file + "/data.txt");
    var data = await readFile(file);
    return new Promise(resolve => {
        resolve(data);
    });
}
async function createProject(name) {
    return await createDir(null, "project", name);
}

async function createFile(location, data) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getFile(location, {create: true, exclusive: true},  function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    resolve(location);
                };
                fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString());
                    resolve(false);
                };
                var blob = new Blob([data], {type: 'text/plain'});
                fileWriter.write(blob);
                }, errorHandler);
        }, errorHandler);
    });
}

async function createEntry(parent, type, name, data, source, image) {
    var dir = await createDir(parent, type, name);
    var types = await getTypes();
    var date = new Date;
    time = date.getMonth() + "/" + date.getDay() + "/" + date.getFullYear() + " " + date.toLocaleTimeString('en-US')
    var info = {"data": data, "source": source, "sourceimage": image, "created": time, "imageapi": types[type].image_api};
    return await createFile(dir.fullPath + '/data.txt', JSON.stringify(info));
}

async function createDir(parent, type, name) {
    var fs = await getFileSystem();
    console.log("Creating new dir: " + getFileLocation(parent, type, name));
    return new Promise(resolve => {
        fs.root.getDirectory(getFileLocation(parent, type, name), {create: true}, function(dirEntry) {
            resolve(dirEntry);
        }, errorHandler);
    });
}
async function readFile(fileEntry) {
    return new Promise(resolve => {
        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                console.log(this.result);
                resolve(this.result);
            };
            reader.readAsText(file);
        });
    });
}

async function getDir(name) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getDirectory(name, {}, function(dirEntry) {
            resolve(dirEntry);
        }, errorHandler);
    })
}

async function getFile(name) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getFile(name, {}, function(fileEntry) {
            resolve(fileEntry);
        }), errorHandler;
    })

}
async function deleteFile(name) {
    var file = await getFile(name);
    console.log(file);
    return new Promise(resolve => {
        file.remove(function() {
            resolve(true);
        }, errorHandler);
    });
}

async function deleteDir(name) {
    var dir = await getDir(name);
    return new Promise(resolve => {
        dir.removeRecursively(function() {
            resolve(true);
        }, errorHandler);
    });
}

async function getFileList() {
    var currentProject = await getCurrentProject();
    var fs = await getFileSystem();
    if (currentProject != null) {
        var dir = await getDir(currentProject);
        return await listDirectory(dir.createReader());
    } else {
        return await listDirectory(fs.root.createReader());
    }
}

async function listDirectory(dirReader) {
    var entries = [];
    return new Promise(resolve => {
        var readEntries = async function() {
            dirReader.readEntries (function(results) {
                if (!results.length) {
                    var strings = []
                    entries.forEach(function(file) {
                        strings.push({"name": file.name, "path": file.fullPath});
                    });
                    resolve(strings);
                } else {
                    entries = entries.concat(toArray(results));
                    readEntries();
                }
            });
        };
        readEntries();
    });
}