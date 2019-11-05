//[      General Click Handler      ]======================================================================

window.onclick = function(event) {
    if (!event.target.matches('.dropdown') && !event.target.matches('.options-button')) {
        var dropdowns = document.querySelectorAll(".dropdown");
        for (var i = 0; i < dropdowns.length; i++) {
            dropdowns[i].remove();
        }
    }
};

//[      Button Click Handler      ]======================================================================
function startButtons() {
    document.getElementById('add-button').addEventListener('click', addButtonClick);
    document.getElementById('back-button').addEventListener('click', backButtonClick);
}

function backButtonClick() {
    console.log("Back Button");
    setCurrentProject(null);
}

function addButtonClick() {
    chrome.runtime.sendMessage({greeting: "request-project"}, function(response) {
        if (response == "My Projects") {
            openPopup("newProject.html");
        } else {
            openPopup("newEntry.html");
        }
    });
}

function fileButtons() {
    Array.from(document.getElementsByClassName("options-button")).forEach(function(optionButton) {
        optionButton.addEventListener('click', createDropdownClick.bind(null, optionButton));
    });

    Array.from(document.getElementsByClassName("file-header")).forEach(function(fileButton) {
        fileButton.addEventListener('click', fileHeaderClick.bind(null, fileButton));
    });
}

function createDropdownClick(optionButton) {
    var fragment = document.createDocumentFragment();
    var div = document.createElement('div');
    div.className = 'dropdown';
    var editOption = '<div id="edit-button" class="menu-option">Edit</div>';
    var duplicateOption = '<div id="duplicate-button" class="menu-option">Duplicate</div>';
    var deleteOption = '<div id="delete-button" class="menu-option">Delete</div>';
    div.innerHTML = [editOption, duplicateOption, deleteOption].join('');
    fragment.appendChild(div);
    var dropdowns = document.querySelectorAll(".dropdown");
    for (var i = 0; i < dropdowns.length; i++) {
        dropdowns[i].remove();
    }
    optionButton.parentNode.appendChild(fragment);
    document.getElementById('edit-button').addEventListener('click', function() {
        
    });
    document.getElementById('duplicate-button').addEventListener('click', function() {

    });
    document.getElementById('delete-button').addEventListener('click', function() {
        deleteFile(optionButton.parentNode.id);
    });
}

function fileHeaderClick(fileButton) {
    if (getFileType(fileButton.parentNode.id) == "project") {
        setCurrentProject(fileButton.parentNode.id);
    } else {
        openPopup("preview.html", fileButton.parentNode.id);
    }
}

function syncNewEntry(name, type, data, parent) {
    if (getCurrentProject() != null) {
        if (parent === "none") {
            createEntry(getProjectName(), type, name, data); 
        } else {
            createEntry(parent, type, name, data);
        }
    } else {
        console.log("Created new project");
        createDir(null, "project", name);
    }
}

function finishPopup(fileName, ...args) {
    if (fileName === "preview.html") {
        document.getElementById('title').innerHTML = '<img class="smallicon" src="' + getFileIcon(getFileType(args[0])) + '">' + getFileName(args[0]);
        openPreview(args[0]);
    }
    var exitButton = document.getElementById('exit-popup');
    exitButton.addEventListener('click', function() {
        closePopup();
    });
    var addEntryButton = document.getElementById('add-entry');
    if (addEntryButton) {
        addEntryButton.addEventListener('click', function() {
            var name = document.getElementById('entry-name').value;
            var type = document.getElementById('entry-type').value;
            var data = document.getElementById('entry-data').value;
            var parent = document.getElementById('entry-parent').value;

            if (name.length > 0 && type != "none" && parent != "none") {
                chrome.runtime.sendMessage({greeting: "add-entry", name: name, type: type, data: data, parent: parent}, function(response) {
                    if (response) {
                        closePopup();
                        refreshList();
                    }
                });
            }
        });
    }
}

