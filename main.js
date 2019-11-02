window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

var currentProject = null;

function getCurrentPorject() {
    return currentProject
}

function getProjectName() {
    if (getCurrentPorject() == null) {
        return "My Projects"
    } else {
        return getCurrentPorject();
    }
}

function setCurrentProject(file) {
    if (file == null) {
        chrome.storage.local.set({'currentproject': null});
        currentProject = null;
    } else {
        chrome.storage.local.set({'currentproject': file.parentNode.id}); 
        currentProject = file.parentNode.id;
    }
    updateProjectName();
}

function updateProjectName() {
    if (getCurrentPorject() == null) {
        document.getElementById('back-button').style.display = "none";
    } else {
        document.getElementById('back-button').style.display = "block";
    }
    document.getElementById('title').innerHTML = this.getProjectName();
    refreshList();
}

function getFileType(id) {
    return id.split('\\').pop().split('/').pop().split("_")[0];
}

function getFileName(id) {
    return id.split('\\').pop().split('/').pop().split("_")[1];
}

function errorHandler(e){
    alert(e + " ; " + e.code);
}

function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
}

function createPreview(files) {
    var fragment = document.createDocumentFragment();
    files.forEach(function(fileEntry, i) {
        fileEntry.file(function(file) {
            var reader = new FileReader();
     
            reader.onloadend = function(e) {
              var txtArea = document.createElement('div');
              txtArea.innerHTML = this.result;
              var previewData = document.querySelector('#preview-data');
              previewData.appendChild(txtArea);
            };
     
            reader.readAsText(file);
         }, errorHandler);
    });
}

function openPreview(path) {
    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
        fs.root.getDirectory(path, {}, function(dirEntry) {
            var dirReader = dirEntry.createReader();
            var entries = [];

            var readEntries = function() {
                dirReader.readEntries (function(results) {
                    if (!results.length) {
                        createPreview(entries.reverse());
                    } else {
                        entries = entries.concat(toArray(results));
                        readEntries();
                    }
                });
        };
        readEntries();
                
        }, errorHandler);
    }, errorHandler);
}

function openPopup(fileName, ...args) {
    closePopup()
    chrome.runtime.getPackageDirectoryEntry(function (dirEntry) {
        dirEntry.getFile(fileName, undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader()
                reader.addEventListener("load", function (event) {                                                      
                    document.getElementById('popup').innerHTML = reader.result;
                    finishPopup(fileName, ...args);
                });
                reader.readAsText(file);
            });
        }, errorHandler);
    });
    document.getElementById('popup').style.visibility = "visible";
}

function closePopup() {
    document.getElementById('popup').innerHTML = "";
    document.getElementById('popup').style.visibility = "hidden";
}

function refreshList() {
    window.requestFileSystem(window.TEMPORARY, 5*1024*1024 /*5MB*/, onInitFs, errorHandler);
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
  
function listResults(entries) {
    var fragment = document.createDocumentFragment();

    entries.forEach(function(entry, i) {
        var element = document.createElement('div');
        element.className = 'file-entry';
        element.id = entry.fullPath;
        var icon = getFileIcon(getFileType(entry.fullPath));
        var img = '<img class="file-icon" src="' + icon + '">';
        var name = '<p class="file-name">' + getFileName(entry.fullPath) + '</p>';
        element.innerHTML = ['<div class="file-header">', img, name, '</div>', '<img class="options-button icon" src="icons/vert.svg">'].join('');
        fragment.appendChild(element);
    });
    var fileList = document.querySelector('#file-list')
    fileList.innerHTML = "";
    fileList.appendChild(fragment);
    startButtons()
}

function listDirectory(dirReader) {
    var entries = [];

    var readEntries = function() {
        dirReader.readEntries (function(results) {
            if (!results.length) {
                listResults(entries.reverse());
            } else {
                entries = entries.concat(toArray(results));
                readEntries();
            }
        });
    };
    readEntries();
}

function onInitFs(fs) {
    if (getCurrentPorject() != null) {
        fs.root.getDirectory(getProjectName(), {}, function(dirEntry) {
            listDirectory(dirEntry.createReader());
        });
    } else {
        listDirectory(fs.root.createReader())
    }
}

function getFileLocation(parent, type, name) {
    if (parent != null) {
        var location = parent + "/" + type + "_" + name;
    } else {
        var location = type + "_" + name;
    }
    return location
}

function createEntry(parent, type, name, data) {
    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
        fs.root.getDirectory(getFileLocation(parent, type, name), {create: true}, function(dirEntry) {
            fs.root.getFile(dirEntry.fullPath + '/data.txt', {create: true, exclusive: true},  function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function(e) {
                      console.log('Write completed.');
                    };
    
                    fileWriter.onerror = function(e) {
                      console.log('Write failed: ' + e.toString());
                    };
              
                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob([data], {type: 'text/plain'});
              
                    fileWriter.write(blob);
                    refreshList();
              
                  }, errorHandler);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}

function createDir(parent, type, name) {
    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
        fs.root.getDirectory(getFileLocation(parent, type, name), {create: true}, function(dirEntry) {
                refreshList();
            }, errorHandler);
        }, errorHandler);
}

function deleteFile(file) {
    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
        fs.root.getDirectory(file, {}, function(dirEntry) {
          dirEntry.remove(function() {
            refreshList();
          }, errorHandler);
        }, errorHandler);
      }, errorHandler);
}
chrome.storage.local.get(['currentproject'], function(result) {
    currentProject = result['currentproject'];
    refreshList();
 });   

window.onload = function() {
    console.log("onload" + Date());
    this.updateProjectName();
}