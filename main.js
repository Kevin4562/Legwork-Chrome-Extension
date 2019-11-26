function setCurrentProject(name) {
    chrome.runtime.sendMessage({greeting: "set-project", name: name}, function(response) {
        refreshList();
    });
}
function getPrettyFilename(fileName) {
    return getFileType(fileName) + ": " + getFileName(fileName);
}
function updateHighlight() {
    chrome.runtime.sendMessage({greeting: "request-highlight-state"}, function(response) {
        chrome.tabs.query({}, function(tabs) {
            for (var i=0; i<tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, {greeting: "refresh-highlight"});
            }
        });
        document.getElementById('legwork-is-highlight').checked = response;
    });
}
function updateProjectName() {
    chrome.runtime.sendMessage({greeting: "request-project"}, function(response) {
        if (response == "My Projects") {
            document.getElementById('legwork-back-button').parentNode.style.display = "none";
            document.getElementById('legwork-toggle-highlight').style.display = "none";
            document.getElementById('legwork-title').innerHTML = response;
        } else {
            document.getElementById('legwork-back-button').parentNode.style.display = "block";
            document.getElementById('legwork-toggle-highlight').style.display = "flex";
            document.getElementById('legwork-title').innerHTML = getPrettyFilename(response);
        }
    });
}

async function requestList() {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({greeting: "request-filelist"}, function(response) {
            resolve(JSON.parse(response));
        });
    });
}

async function requestDirectoryState(file) {
    return new Promise(resolve => {
        if (!file) {
            resolve("shown");
        } else {
            chrome.runtime.sendMessage({greeting: "request-directory-state", file: file}, function(response) {
                resolve(response);
            });
        }
    });
}

async function refreshList() {
    updateProjectName();
    updateHighlight();
    var types = await getTypes();
    var file_list = await requestList();
    var fragment = document.createDocumentFragment();
    console.log("LIST: " + file_list);
    for (let index = 0; index < file_list.length; index++) {
        var entry = file_list[index];
        var shown = await requestDirectoryState(entry.parent);
        if (shown != "hidden") {
            var fileType = getFileType(entry.path);
            var fileName = getFileName(entry.path);
            var element = document.createElement('div');
            element.className = 'file-entry';  
            if (fileType === "empty") {
                element.id = "legwork-create-new";
                var img = '<img class="file-icon" src="/icons/add.svg">';
                var name = '<p class="file-name">' + fileName +'</p>';
                element.innerHTML = ['<div class="file-header">', img, name, '</div>'].join('');
            } else {
                element.id = entry.path;
                var icon = getFileIcon(types, fileType);
                var img = '<img class="file-icon" src="' + icon + '">';
                var name = '<p class="file-name">' + fileName + '</p>';
                var dropdown = '';
                var next_entry = file_list[index + 1];
                if (next_entry && next_entry.parent == entry.path) {
                    var rotate = await requestDirectoryState(entry.path);
                    if (rotate == "hidden") {
                        dropdown = '<img style="transform: rotate(-90deg);" class="file-icon open-list" src="/icons/open.svg">';
                    } else {
                        dropdown = '<img class="file-icon open-list" src="/icons/open.svg">';
                    }
                }
                if (entry.parent) {
                    if (dropdown == '') {
                        dropdown = '<img class="file-icon open-list" src="">'
                    }
                    element.style.paddingLeft = ((entry.path.split("/").length - 3) * 10) + 10;
                }
                element.innerHTML = ['<div class="file-left">', dropdown, '<div class="file-header">', img, name, '</div>', '</div>', '<div class="file-options">', '<img class="copy-button icon" src="/icons/copy.svg">', '<img class="options-button icon" src="/icons/vert.svg">', '</div>'].join('');
            }
                fragment.appendChild(element);
        }
    }
    var fileList = document.querySelector('#legwork-file-list');
    fileList.innerHTML = "";
    fileList.appendChild(fragment);
    fileButtons();
}

function editFile(file) {
    chrome.runtime.sendMessage({greeting: "request-entry", file: file}, function(response) {
        var entry = JSON.parse(response);
        openPopup("templates/newEntry.html", {"name": entry.name, "type": entry.type, "data": entry.data, "sourceimage": entry.sourceimage, "images": entry.images, "edited": file});
    });
}

function editEntry(name, type, data, parent, sourceimage, images, original) {
    chrome.runtime.sendMessage({greeting: "delete-entry", file: original}, function(response) {
        chrome.runtime.sendMessage({greeting: "add-entry", name: name, type: type, data: data, parent: parent, sourceImage: sourceimage, images: images}, function(response) {
            closePopup();
            refreshList();
        });
    });
}

function addEntry(name, type, data, parent, sourceimage, images) {
    chrome.runtime.sendMessage({greeting: "add-entry", name: name, type: type, data: data, parent: parent, sourceImage: sourceimage, images: images}, function(response) {
        closePopup();
        refreshList();
    });
}

function deleteFile(file) {
    chrome.runtime.sendMessage({greeting: "delete-entry", file: file}, function(response) {
        refreshList();
    });
}

function copyFile(file) {
    console.log("COPYING");
    chrome.runtime.sendMessage({greeting: "duplicate-entry", file: file}, function(response) {
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
    chrome.runtime.sendMessage({greeting: "request-entry", file: file}, function(response) {
        var entry = JSON.parse(response);
        console.log(entry);
        document.getElementById("legwork-preview-text").innerHTML = entry.data;
        var previewImages = document.querySelector('#legwork-preview-images');
        console.log("IMAGEES: " + entry.images);
        var images = [...entry.images, ...entry.imageapi, entry.sourceimage];
        console.log("IMAGE ARRAY: " + images);
        images.forEach(function(image) {
            if (image) {
                var imageLink = document.createElement('a');
                var imageTag = document.createElement('img');
                imageTag.className = "preview-image hover-data";
                imageTag.src = image;
                imageLink.appendChild(imageTag);
                previewImages.appendChild(imageLink);
            }
        });
        var meta = document.getElementById("legwork-meta");
        meta.innerHTML = ['<div id="legwork-preview-source"><p>Source</p><p style="font-size: 9px;">' + entry.created + '</p></div>'];
        var source = document.createElement('a');
        if (entry.source != "Manual") {
            source.href = entry.source;
            source.target = "_blank";
        }
        source.innerHTML = entry.source;
        meta.appendChild(source);
    });
}

function addOption(select, value, id) {
    var opt = document.createElement('option');
    opt.value = id;
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
                    document.getElementById('legwork-popup').innerHTML = reader.result;
                    finishPopup(fileName, ...args);
                    document.getElementById('legwork-popup').style.visibility = "visible";
                });
                reader.readAsText(file);
            });
        }, errorHandler);
    });
}

function closePopup() {
    document.getElementById('legwork-popup').innerHTML = "";
    document.getElementById('legwork-popup').style.visibility = "hidden";
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
    return "/icons/project.svg";
}

async function gatherImages(images) {
    console.log("GATHERING IMAGES!")
    imageJsons = [];
    for(let index = 0; index < images.length; index++) {
        var image = images[index];
        var base64 = await toBase64(image);
        imageJsons.push(base64);
    }
    return imageJsons;
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

window.onload = function() {
    console.log("onload" + Date());
    startButtons();
    refreshList();
}