//[      General Click Handler      ]======================================================================

window.onclick = function(event) {
    if (!event.target.matches('.dropdown') && !event.target.matches('.options-button')) {
        document.querySelectorAll(".dropdown").forEach(function(dropdown) {dropdown.remove()});
        document.querySelectorAll(".file-options").forEach(function(fileoptions) {fileoptions.style.display = "block"});
    }
};

//[      Button Click Handler      ]======================================================================
function startButtons() {
    document.getElementById('legwork-add-button').addEventListener('click', addButtonClick);
    document.getElementById('legwork-back-button').addEventListener('click', backButtonClick);
    document.getElementById('legwork-is-highlight').addEventListener('click', toggleHighlightClick);
    document.getElementById('legwork-search-button').addEventListener('click', searchButtonClick);
}

function toggleHighlightClick() {
    var value = document.getElementById('legwork-is-highlight').checked;
    console.log("VALUE: " + value);
    chrome.runtime.sendMessage({greeting: "set-highlight-state", checked: value}, function(response) {

    });
}

function searchButtonClick() {
    if (document.getElementById('legwork-search-div').style.display == "none") {
        document.getElementById('legwork-file-list').style.height = '364';
        document.getElementById('legwork-search-div').style.display = "block";
    } else {
        document.getElementById('legwork-search-div').style.display = "none";
        document.getElementById('legwork-file-list').style.height = '400';
    }
}

function backButtonClick() {
    console.log("Back Button");
    setCurrentProject(null);
}

function addButtonClick() {
    chrome.runtime.sendMessage({greeting: "request-project"}, function(response) {
        console.log("CURRENT PROJECT ADD: " + response);
        if (response == "My Projects") {
            openPopup("templates/newProject.html");
        } else {
            openPopup("templates/newEntry.html");
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
    Array.from(document.getElementsByClassName("open-list")).forEach(function(openButton) {
        openButton.addEventListener('click', openListClick.bind(null, openButton));
    });
}

function openListClick(openButton) {
    var file = openButton.parentNode.parentNode.id
    chrome.runtime.sendMessage({greeting: "toggle-directory", file: file}, function(response) {
        refreshList();
    });
}

function createDropdownClick(optionButton) {
    var fragment = document.createDocumentFragment();
    var div = document.createElement('div');
    div.className = 'dropdown';
    var editOption = '<div id="legwork-edit-button" class="menu-option">Edit</div>';
    var duplicateOption = '<div id="legwork-duplicate-button" class="menu-option">Duplicate</div>';
    var deleteOption = '<div id="legwork-delete-button" class="menu-option">Delete</div>';
    div.innerHTML = [editOption, duplicateOption, deleteOption].join('');
    fragment.appendChild(div);
    document.querySelectorAll(".dropdown").forEach(function(dropdown) {dropdown.remove()});
    document.querySelectorAll(".file-options").forEach(function(fileoptions) {fileoptions.style.display = "block"});
    optionButton.parentNode.style.display = "none";
    optionButton.parentNode.parentNode.appendChild(fragment);
    document.getElementById('legwork-edit-button').addEventListener('click', function() {
        editFile(optionButton.parentNode.parentNode.id);
    });
    document.getElementById('legwork-duplicate-button').addEventListener('click', function() {
        copyFile(optionButton.parentNode.parentNode.id);
    });
    document.getElementById('legwork-delete-button').addEventListener('click', function() {
        deleteFile(optionButton.parentNode.parentNode.id);
    });
}

function fileHeaderClick(fileButton) {
    if (getFileType(fileButton.parentNode.parentNode.id) == "Project") {
        setCurrentProject(fileButton.parentNode.parentNode.id);
    } else if (fileButton.parentNode.id == "legwork-create-new") {
        addButtonClick();
    } else {
        openPopup("templates/preview.html", fileButton.parentNode.parentNode.id);
    }
}

async function finishPopup(fileName, ...args) {
    document.getElementById('legwork-exit-popup').addEventListener('click', function() {
        closePopup();
    });

    if (fileName === "templates/preview.html") {
        var types = await getTypes();
        document.getElementById('legwork-title').innerHTML = '<img class="smallicon" src="' + getFileIcon(types, getFileType(args[0])) + '">' + getFileName(args[0]);
        openPreview(args[0]);
    }
    if (fileName === "templates/newEntry.html") {
        document.getElementById('legwork-cancel-entry').addEventListener('click', function() {
            closePopup();
        });
        document.getElementById("legwork-images-button").addEventListener('click', function() {
            document.getElementById("legwork-getFile").click();
        });
        document.getElementById("legwork-entry-name").onkeypress = function(e) {
            var chr = String.fromCharCode(e.which);
            if (!/^([a-zA-Z0-9 -,@.])$/.test(chr)) {
                return false;
            }
        };
        var types = await getTypes();
        chrome.runtime.sendMessage({greeting: "request-project"}, function(project) {
            chrome.runtime.sendMessage({greeting: "request-filelist"}, function(list) {
                for (const [key, value] of Object.entries(types).sort(([,a], [,b]) => {return (a.index > b.index) ? 1 : -1})) {
                    addOption(document.getElementById('legwork-entry-type'), key, key);
                }
                addOption(document.getElementById('legwork-entry-parent'), getPrettyFilename(project), project)
                JSON.parse(list).forEach(function(file) {
                    if (file.name) {
                        addOption(document.getElementById('legwork-entry-parent'), getPrettyFilename(file.name), file.path)
                    }
                });

                //set defaults
                document.getElementById('legwork-entry-parent').value = project;

                if (args.length > 0) {
                    var defaults = args[0];
                    if (defaults['name'])
                        document.getElementById('legwork-entry-name').value = defaults['name'];
                    if (defaults['type'])
                        document.getElementById('legwork-entry-type').value = defaults['type'];
                    if (defaults['data'])
                        document.getElementById('legwork-entry-data').value = defaults['data'];
                    if (defaults['parent'])
                        document.getElementById('legwork-entry-parent').value = defaults['parent'];
                    if (defaults['sourceimage'])
                        document.getElementById('legwork-image-storage').src = defaults['sourceimage'];
                }
            });
        });

        document.getElementById('legwork-add-entry').addEventListener('click', function() {
            var name = document.getElementById('legwork-entry-name').value;
            var type = document.getElementById('legwork-entry-type').value;
            var data = document.getElementById('legwork-entry-data').value;
            var parent = document.getElementById('legwork-entry-parent').value;
            var sourceImage = document.getElementById('legwork-image-storage').src;
            var chosenImages = document.getElementById('legwork-getFile').files;

            if (name.length > 1 && type != "none" && parent != "none") {
                if (args.length > 0 && args[0]['edited']) {
                    editEntry(name, type, data, parent, sourceImage, JSON.stringify(args[0]['images']), args[0]['edited']);
                } else {
                    gatherImages(chosenImages).then(images => {
                        addEntry(name, type, data, parent, sourceImage, JSON.stringify(images));
                    })
                }
            }
        });
    }
    if (fileName === "templates/newProject.html") {
        document.getElementById('legwork-cancel-entry').addEventListener('click', function() {
            closePopup();
        });
        document.getElementById("legwork-entry-name").onkeypress = function(e) {
            var chr = String.fromCharCode(e.which);
            if (!/^([a-zA-Z0-9 -,])$/.test(chr)) {
                return false;
            }
        };
        document.getElementById('legwork-add-entry').addEventListener('click', function() {
            var name = document.getElementById('legwork-entry-name').value;
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

