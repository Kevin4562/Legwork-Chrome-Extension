function setCurrentProject(name) {
    chrome.runtime.sendMessage({greeting: "set-project", name: name}, function(response) {
        refreshList();
    });
}

function updateProjectName() {
    chrome.runtime.sendMessage({greeting: "request-project"}, function(response) {
    if (response == "My Projects") {
        document.getElementById('back-button').style.display = "none";
    } else {
        document.getElementById('back-button').style.display = "block";
    }
    document.getElementById('title').innerHTML = response;
});
}

function refreshList() {
    updateProjectName();
    chrome.runtime.sendMessage({greeting: "request-list"}, function(response) {
        var fragment = document.createDocumentFragment();
        console.log("LIST: " + JSON.parse(response));

        JSON.parse(response).forEach(function(entry, i) {
            var element = document.createElement('div');
            element.className = 'file-entry';
            element.id = entry.path;
            var icon = getFileIcon(getFileType(entry.path));
            var img = '<img class="file-icon" src="' + icon + '">';
            var name = '<p class="file-name">' + getFileName(entry.path) + '</p>';
            element.innerHTML = ['<div class="file-header">', img, name, '</div>', '<img class="options-button icon" src="icons/vert.svg">'].join('');
            fragment.appendChild(element);
        });
        var fileList = document.querySelector('#file-list');
        fileList.innerHTML = "";
        fileList.appendChild(fragment);
        fileButtons();
    });
}

function deleteFile(file) {
    chrome.runtime.sendMessage({greeting: "delete-file", file: file}, function(response) {
        refreshList();
    });
}

function getFileType(id) {
    return id.split('/').pop().split("_")[0];
}

function getFileName(id) {
    return id.split('/').pop().split("_")[1];
}

function errorHandler(e){
    alert(e + " ; " + e.code);
}

function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
}

function openPreview(file) {
    var fragment = document.createDocumentFragment();
    var txtArea = document.createElement('div');
    txtArea.innerHTML = this.result;
    var previewData = document.querySelector('#preview-data');
    previewData.appendChild(txtArea);
}

function addOption(select, value) {
    var opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = value;
    select.appendChild(opt);
}

function loadValues(fileName) {
    if (fileName = "newEntry") {
        chrome.runtime.sendMessage({greeting: "request-types"}, function(types) {
            chrome.runtime.sendMessage({greeting: "request-project"}, function(project) {
                console.log(types);
                addOption(document.getElementById('entry-parent'), project)
                document.getElementById('entry-parent').value = project;
            });
        });
    }
}

function openPopup(fileName, ...args) {
    closePopup();
    chrome.runtime.getPackageDirectoryEntry(function (dirEntry) {
        dirEntry.getFile(fileName, undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.addEventListener("load", function (event) {                                                      
                    document.getElementById('popup').innerHTML = reader.result;
                    loadValues(fileName);
                    finishPopup(fileName, ...args);
                    document.getElementById('popup').style.visibility = "visible";
                });
                reader.readAsText(file);
            });
        }, errorHandler);
    });
}

function closePopup() {
    document.getElementById('popup').innerHTML = "";
    document.getElementById('popup').style.visibility = "hidden";
}

function getFileIcon(name) {
    switch(name) {
        case "project":
            return "icons/project.svg";
        case "article":
            return "icons/article.svg";
        case "email":
            return "icons/email.svg";
        case "group":
            return "icons/group.svg";
        case "location":
            return "icons/location.svg";
        case "person":
            return "icons/person.svg";
        case "website":
            return "icons/website.svg";
        case "video":
            return "icons/video.svg";
        case "folder":
            return "icons/folder.svg";
        default:
            return "icons/folder.svg";
    }
}

window.onload = function() {
    console.log("onload" + Date());
    startButtons();
    refreshList();
}