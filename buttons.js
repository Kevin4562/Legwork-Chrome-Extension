window.onclick = function(event) {
    if (!event.target.matches('.dropdown') && !event.target.matches('.options-button')) {
        var dropdowns = document.querySelectorAll(".dropdown");
        for (var i = 0; i < dropdowns.length; i++) {
            dropdowns[i].remove();
        }
    }
}

function startButtons() {
    var addButton = document.getElementById('add-button');
    addButton.addEventListener('click', function() {
        if (getCurrentPorject() == null) {
            openPopup("newProject.html");
        } else {
            openPopup("newEntry.html");
        }
    });
    var backButton = document.getElementById('back-button');
    backButton.addEventListener('click', function() {
        setCurrentProject(null);
    });
    var options = document.getElementsByClassName("options-button");
    Array.from(options).forEach(function(optionButton) {
        optionButton.addEventListener('click', function() {
            var fragment = document.createDocumentFragment();
            var div = document.createElement('div');
            div.className = 'dropdown';
            var editOption = '<div id="edit-button" class="menu-option">Edit</div>'
            var duplicateOption = '<div id="duplicate-button" class="menu-option">Duplicate</div>'
            var deleteOption = '<div id="delete-button" class="menu-option">Delete</div>'
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

        });
      });
    var files = document.getElementsByClassName("file-header");
    Array.from(files).forEach(function(fileButton) {
        fileButton.addEventListener('click', function() {
            if (getFileType(fileButton.parentNode.id) == "project") {
                setCurrentProject(fileButton);
            } else {
                openPopup("preview.html", fileButton.parentNode.id);
            }
        });
    });
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

            if (getCurrentPorject() != null) {
                var parent = document.getElementById('entry-parent').value;
                var type = document.getElementById('entry-type').value;
                var data = document.getElementById('entry-data').value;

                if (name.length > 0 && type != "Select Type") {
                    if (parent === "none") {
                        createEntry(getProjectName(), type, name, data); 
                    } else {
                        createEntry(parent, type, name, data);
                    }
                }

            } else {
                console.log("Created new project");
                createDir(null, "project", name)
            }
            closePopup();
        });
    }
}

