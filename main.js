function setCurrentProject(name) {
    chrome.runtime.sendMessage({greeting: "set-project", name: name}, function(response) {
        refreshList();
    });
}

function updateProjectName() {
    chrome.runtime.sendMessage({greeting: "request-project"}, function(response) {
        if (response == "My Projects") {
            document.getElementById('back-button').style.display = "none";
            document.getElementById('title').innerHTML = response;
        } else {
            document.getElementById('back-button').style.display = "block";
            document.getElementById('title').innerHTML = "Project: " + getFileName(response);
        }
    });
}

async function refreshList() {
    updateProjectName();
    var types = await getTypes();
    chrome.runtime.sendMessage({greeting: "request-list"}, function(response) {
        var fragment = document.createDocumentFragment();
        console.log("LIST: " + JSON.parse(response));
        JSON.parse(response).forEach(function(entry, i) {
            var element = document.createElement('div');
            element.className = 'file-entry';
            element.id = entry.path;
            var icon = getFileIcon(types, getFileType(entry.path));
            var img = '<img class="file-icon" src="' + icon + '">';
            var name = '<p class="file-name">' + getFileName(entry.path) + '</p>';
            element.innerHTML = ['<div class="file-header">', img, name, '</div>', '<div>', '<img class="copy-button icon" src="icons/copy.svg">', '<img class="options-button icon" src="icons/vert.svg">', '</div>'].join('');
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
    chrome.runtime.sendMessage({greeting: "request-preview", file: file}, function(response) {
        var previewData = document.querySelector('#preview-data');
        var entry = JSON.parse(response);
        console.log(entry);
        var txtArea = document.createElement('p');
        txtArea.id = "preview-text";
        txtArea.className = "hover-data";
        txtArea.innerHTML = entry.data;
        previewData.appendChild(txtArea);
        if (entry.imageapi) {
            entry.imageapi.forEach(function(api) {
                var apiimage = document.createElement('img');
                apiimage.className = "preview-image hover-data";
                apiimage.src = api + entry.data;
                previewData.appendChild(apiimage);
            });
        }
        if (entry.sourceimage) {
            var sourceimage = document.createElement('img');
            sourceimage.className = "preview-image hover-data";
            sourceimage.src = entry.sourceimage;
            previewData.appendChild(sourceimage);
        }
        var meta = document.createElement('div');
        meta.id = "meta";
        meta.innerHTML = ['<div id="preview-source"><p>Source</p><p style="font-size: 9px;">' + entry.created + '</p></div>'];
        var source = document.createElement('a');
        if (entry.source != "Manual") {
            source.href = entry.source;
            source.target = "_blank";
        }
        source.innerHTML = entry.source;
        meta.appendChild(source);
        previewData.appendChild(meta);

    });
}

function addOption(select, value) {
    var opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = value;
    select.appendChild(opt);
}

function openPopup(fileName, ...args) {
    closePopup();
    chrome.runtime.getPackageDirectoryEntry(function (dirEntry) {
        dirEntry.getFile(fileName, undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.addEventListener("load", function (event) {                                                      
                    document.getElementById('popup').innerHTML = reader.result;
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

async function getTypes() {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({greeting: "request-types"}, function(types) {
            resolve(JSON.parse(types));
        });
    });
}

function getFileIcon(types, name) {
    console.log(types);
    for (const [key, value] of Object.entries(types)) {
        if (key === name) {
            return value.icon;
        }
    }
    return "icons/project.svg";
}

window.onload = function() {
    console.log("onload" + Date());
    startButtons();
    refreshList();
}