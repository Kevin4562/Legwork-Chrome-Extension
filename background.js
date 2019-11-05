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
    "Plain Text": { "icon": "Plain Text", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Image": { "icon": "Image", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Website": { "icon": "Website", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Video": { "icon": "Video", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Social Media": { "name": "Social Media", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Group": { "icon": "Group", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Person": { "icon": "Person", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Location": { "icon": "Location", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Username": { "icon": "Username", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Email": { "icon": "Email", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "IP Address": { "icon": "IP Address", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Device": { "icon": "Device", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
    "Vehicle": { "icon": "Vehicle", "save_source_url": true, "save_source_image": true, "save_source_html": true, "json_api": [] },
}

function getTypes() {
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

function injectScripts(dirEntry, tabid, info) {
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
                                    var command4 = 'finishPopup("Text.html");';
                                    chrome.tabs.executeScript(tabid, { code: command1 + command2 + command3 + command4 }, function() {
                                    
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
    console.log(sender.tab ? "Message from:" + sender.tab.url : "Message from the extension");
    if (request.greeting == "add-entry") {
        createEntry(request.parent, request.type, request.name, request.data).then(sendResponse);
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
        getPreview(requests.file).then(files => {sendResponse(JSON.stringify(files))});
    }
    if (request.greeting == "request-types") {
        getTypes().then(sendResponse);
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
    if (parent != "none") {
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
    var data = await getFile(file + "/data.txt").then(readFile);
    return new Promise(resolve => {
        resolve(data);
    });
}
async function createEntry(parent, type, name, data) {
    var fs = await getFileSystem();
    var dir = await createDir(parent, type, name);
    console.log("Creating: " + dir.fullPath + "/data.txt");
    return new Promise(resolve => {
        fs.root.getFile(dir.fullPath + '/data.txt', {create: true, exclusive: true},  function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    resolve(true);
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

async function createDir(parent, type, name) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getDirectory(getFileLocation(parent, type, name), {create: true}, function(dirEntry) {
            resolve(dirEntry);
        }, errorHandler);
    });
}
async function readFile(file) {
    var reader = new FileReader();
    return new Promise(resolve => {
        reader.onloadend = function(e) {
            resolve(this.result);
        };
        reader.readAsText(file);
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
    console.log(name);
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
        dir.remove(function() {
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