function cleanText(text, newline){
    if (newline) {
        return text.replace(/["']/g, "\\\'").replace(/(\r\n|\n|\r)/gm,"")
    }
    return text.replace(/["']/g, "\\\'")
}

function getCSS(dirEntry, html, tabid, info) {
    dirEntry.getFile("style.css", undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader();

                reader.addEventListener("load", function (event) {   
                    var code = 'document.body.innerHTML=\'<style>' + cleanText(reader.result, true) + '</style><div id=\"popup\" style=\"visibility: visible\">' + html + '</div>\' + document.body.innerHTML;';                                       
                    chrome.tabs.executeScript(tabid, { code: code }, function() {
                        var command1 = 'document.getElementById(\'entry-name\').value = \'' + cleanText(info.selectionText.substring(0, 25), false) + '\';';
                        var command2 = 'document.getElementById(\'entry-data\').value = \'' + cleanText(info.selectionText, false) + '\';';
                        var command3 = 'document.getElementById(\'exit-popup\').src = \'' + chrome.runtime.getURL("icons/exit.svg") + '\'';
                        chrome.tabs.executeScript(tabid, { code: command1 + command2 + command3 }, function() {
                            
                        });
                    });
                });
                reader.readAsText(file);
            });
        });
}

function getHTML(dirEntry, tabid, info) {
    dirEntry.getFile("newEntry.html", undefined, function (fileEntry) {
        fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.addEventListener("load", function (event) {   
                    getCSS(dirEntry, cleanText(reader.result, true), tabid, info)
                });
                reader.readAsText(file);
            });
        });
}

function menuItem(info, tab) {
    if (info.menuItemId === "add-entry") {
        chrome.runtime.getPackageDirectoryEntry(function (dirEntry) {
            getHTML(dirEntry, tab.id, info);
        });
    } 
}

chrome.contextMenus.create({
    title: "Add to project",
    id: "add-entry",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(menuItem);