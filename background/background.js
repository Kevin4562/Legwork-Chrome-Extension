//[      Message Handler      ]======================================================================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request.greeting + (sender.tab ? " Message from:" + sender.tab.url : " Message from the extension"));
    switch(request.greeting) {
        case "add-entry":
            createEntry(request.parent,request.type,request.name,request.data,sender.tab ? sender.tab.url : "Manual",request.sourceImage,request.images,).then(sendResponse);
            break;
        case "add-project":
            createProject(request.name).then(sendResponse);
            break;
        case "edit-entry":
            editEntry(request.entry).then(sendResponse);
            break;
        case "duplicate-entry":
            copyDir(request.file).then(sendResponse);
            break;
        case "delete-entry":
            deleteDir(request.file).then(sendResponse);
            break;
        
        case "request-project":
            getProjectName().then(sendResponse);
            break;
        case "request-filelist":
            getCurrentProject().then(getFileList).then(files => {sendResponse(JSON.stringify(files))});
            break;
        case "request-entry":
            getPreview(request.file).then(files => {sendResponse(files)});
            break;
        case "request-highlight-state":
            getHighlight().then(sendResponse);
            break;
        case "request-highlighted-words":
            getWordList().then(words => {sendResponse(JSON.stringify(words))});
            break;
        case "request-types":
            getTypes().then(types => {sendResponse(JSON.stringify(types))});
            break;
        case "request-directory-state":
            getDirectoryState(request.file).then(sendResponse);
            break;

        case "set-project":
            setCurrentProject(request.name);
            sendResponse(true);
            break;
        case "toggle-highlight-state":
            setHighlight(request.checked);
            chrome.tabs.query({}, function(tabs) {
                for (var i=0; i<tabs.length; ++i) {
                    chrome.tabs.sendMessage(tabs[i].id, {greeting: "refresh-highlight"});
                }
            });
            sendResponse(true);
            break;
        case "toggle-directory-state":
            toggleDirectory(request.file).then(sendResponse);
            break;
        default:
            console.log("UNKOWN MESSAGE: " + request.greeting);
    }
    return true;
});

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
    dirEntry.getFile("templates/newEntry.html", undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.addEventListener("load", function (event) {   
                    chrome.tabs.insertCSS({file: 'templates/style.css'}, function() {
                        chrome.tabs.executeScript(tabid, {file: 'main.js'}, function() {
                            chrome.tabs.executeScript(tabid, { file: 'buttons.js' }, function() {
                                var content = 'document.body.innerHTML = \' <div id=\"legwork-popup\" style=\"visibility: visible\">' + cleanText(reader.result, true) + '</div>\' + document.body.innerHTML;';     
                                chrome.tabs.executeScript(tabid, { code: content }, function() {
                                    var command1 = 'document.getElementById(\'legwork-entry-name\').value = \'' + cleanText(info.selectionText.substring(0, 25), false) + '\';';
                                    var command2 = 'document.getElementById(\'legwork-entry-data\').value = \'' + cleanText(info.selectionText, false) + '\';';
                                    var command3 = 'document.getElementById(\'legwork-exit-popup\').src = \'' + chrome.runtime.getURL("icons/exit.svg") + '\';';
                                    var command4 = 'document.getElementById(\'legwork-image-storage\').src = \'' + cleanText(screenshot, true) + '\';';
                                    var command5 = 'finishPopup("templates/newEntry.html");';
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