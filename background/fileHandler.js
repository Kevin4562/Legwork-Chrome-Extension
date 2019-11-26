function errorHandler(e){
    console.log(e + " ; " + e.code);
}

function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
}

function getFileLocation(parent, type, name) {
    if (parent && parent != "none") {
        var location = parent + "/" + type + "_" + name;
    } else {
        var location = type + "_" + name;
    }
    return location;
}

async function getFileSystem() {
    return new Promise(resolve => {
        window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
            resolve(fs);
        });
    });
}
async function getPreview(file) {
    var file = await getFile(file + "/data.txt");
    var data = await readFile(file);
    return new Promise(resolve => {
        resolve(data);
    });
}
async function getWordList() {
    var words = [];
    var currentProject = await getCurrentProject();
    if (await getHighlight() && currentProject) {
        console.log("HIGHLIGHT ON!");
        var filelist = await getFileList(currentProject);
        for (let index = 0; index < filelist.length; index++) {
            var file = await getFile(filelist[index].path + "/data.txt");
            if (file) {
                var data = await readFile(file);
                words.push(JSON.parse(data).data);
            }
        }
    }
    return new Promise(resolve => {
        console.log("WORDS: " + words);
        resolve(words);
    });
}
async function createProject(name) {
    return await createDir(null, "Project", name);
}

async function createFile(location, data) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getFile(location, {create: true, exclusive: true},  function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    resolve(location);
                };
                fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString());
                    resolve(false);
                };
                var blob = new Blob([data], {type: 'text/plain'});
                fileWriter.write(blob);
                }, errorHandler);
        }, errorHandler);
    });
}

async function getFileParent(file) {
    return new Promise(resolve => {
        file.getParent(function(parent) {
            resolve(parent);
        }, errorHandler);
    });
}

async function copyDir(entry) {
    var dir = await getDir(entry);
    var parent = await getFileParent(dir);
    var newName = dir.name + " (copy)";
    dir.copyTo(parent, newName, errorHandler);
    return new Promise(resolve=> {
        resolve(newName);
    });
}

async function createEntry(parent, type, name, data, source, sourceImage, images) {
    console.log(images);
    var dir = await createDir(parent, type, name);
    var types = await getTypes();
    var date = new Date;
    var time = date.getMonth() + "/" + date.getDay() + "/" + date.getFullYear() + " " + date.toLocaleTimeString('en-US');
    var info = {
        "type": type,
        "name": name,
        "data": data,
        "source": source,
        "sourceimage": sourceImage,
        "created": time,
        "imageapi": types[type].image_api.map(image => image + data),
        "images": JSON.parse(images)
    };
    return await createFile(dir.fullPath + '/data.txt', JSON.stringify(info));
}

async function createDir(parent, type, name) {
    var fs = await getFileSystem();
    console.log("Creating new dir: " + getFileLocation(parent, type, name));
    return new Promise(resolve => {
        fs.root.getDirectory(getFileLocation(parent, type, name), {create: true}, function(dirEntry) {
            resolve(dirEntry);
        }, errorHandler);
    });
}
async function readFile(fileEntry) {
    return new Promise(resolve => {
        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                console.log(this.result);
                resolve(this.result);
            };
            reader.readAsText(file);
        });
    });
}

async function getDir(name) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getDirectory(name, {create : false}, function(dirEntry) {
            resolve(dirEntry);
        }, function() {resolve(false)});
    })
}

async function getFile(name) {
    var fs = await getFileSystem();
    return new Promise(resolve => {
        fs.root.getFile(name, {}, function(fileEntry) {
            resolve(fileEntry);
        }), errorHandler;
    })

}
async function deleteFile(name) {
    var file = await getFile(name);
    console.log(file);
    return new Promise(resolve => {
        file.remove(function() {
            resolve(true);
        }, errorHandler);
    });
}

async function deleteDir(name) {
    console.log('DELETE: ' + name)
    var dir = await getDir(name);
    return new Promise(resolve => {
        dir.removeRecursively(function() {
            resolve(true);
        }, errorHandler);
    });
}

async function getFileList(currentProject) {
    var fs = await getFileSystem();
    if (currentProject != null) {
        var dir = await getDir(currentProject);
        var filelist = await listDirectories(dir, []);
    } else {
        var filelist = await listDirectories(fs.root, []);
    }
    if (filelist.length == 0) {
        var project = await getCurrentProject();
        console.log("PRoJECT: " + project);
        filelist.push(project ? {"path": "empty_Create new entry"} : {"path": "empty_Create new research project"});
    }
    console.log(filelist);
    return new Promise(resolve => {
        resolve(filelist);
    });
}

async function listDirectories(dir, file_strings) {
    var project = await getCurrentProject();
    var dir_files = await listDirectory(dir.createReader());
    for (let index = 0; index < dir_files.length; index++) {
        subdir = dir_files[index];
        if (subdir.isDirectory) {
            var parent = dir.fullPath == project ? null : dir.fullPath;
            file_strings.push({"name": subdir.name, "path": subdir.fullPath, "parent": parent});
            if (project) {
                subfiles = await listDirectories(subdir, file_strings);
            }
        }
    }
    return new Promise(resolve => {
        resolve(file_strings)
    });
}

async function listDirectory(dirReader) {
    var entries = [];
    return new Promise(resolve => {
        var readEntries = async function() {
            dirReader.readEntries (function(results) {
                if (!results.length) {
                    resolve(entries);
                } else {
                    entries = entries.concat(toArray(results));
                    readEntries();
                }
            });
        };
        readEntries();
    });
}