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
        editFile(optionButton.parentNode.id);
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

async function finishPopup(fileName, ...args) {
    document.getElementById('exit-popup').addEventListener('click', function() {
        closePopup();
    });

    if (fileName === "preview.html") {
        var types = await getTypes();
        document.getElementById('title').innerHTML = '<img class="smallicon" src="' + getFileIcon(types, getFileType(args[0])) + '">' + getFileName(args[0]);
        openPreview(args[0]);
    }
    if (fileName === "newEntry.html") {
        var types = await getTypes();
        chrome.runtime.sendMessage({greeting: "request-project"}, function(project) {
            for (const [key, value] of Object.entries(types).sort(([,a], [,b]) => {return (a.index > b.index) ? 1 : -1})) {
                addOption(document.getElementById('entry-type'), key);
            }
            addOption(document.getElementById('entry-parent'), project)
            document.getElementById('entry-parent').value = project;
        });

        document.getElementById('add-entry').addEventListener('click', function() {
            var name = document.getElementById('entry-name').value;
            var type = document.getElementById('entry-type').value;
            var data = document.getElementById('entry-data').value;
            var parent = document.getElementById('entry-parent').value;
            var image = document.getElementById('image-storage').src;

            if (name.length > 1 && type != "none" && parent != "none") {
                chrome.runtime.sendMessage({greeting: "add-entry", name: name, type: type, data: data, parent: parent, image: image}, function(response) {
                    if (response) {
                        closePopup();
                        refreshList();
                    }
                });
            }
        });
    }
    if (fileName === "newProject.html") {
        document.getElementById('add-entry').addEventListener('click', function() {
            var name = document.getElementById('entry-name').value;
            if (name.length > 1) {
                chrome.runtime.sendMessage({greeting: "add-project", name: name}, function(response) {
                    if (response) {
                        closePopup();
                        refreshList();
                    }
                });
            }
        });
    }
}

