let socket;
let frameHistory = [];      // Stores the history of #frame
let seekCheck = true;       // Used with the new mediaSession API. Only used with the
                            // beta flag is set to true
let downloadQueueInstance;
let notiCount = 0;          // Used by storage/download.js


/**
 * @returns the extensionList that have all the functions
 */                            
function returnExtensionList() {
    return extensionList;
}

/**
 * @returns the list of extension names
 */
function returnExtensionNames() {
    return extensionNames;
}


/**
 * Changes the background gradient
 */
function setGradient() {
    let bgGradient = parseInt(localStorage.getItem("themegradient"));
    if (bgGradient) {
        document.documentElement.style.setProperty('--theme-gradient', backgroundGradients[bgGradient]);
    } else {
        document.documentElement.style.setProperty('--theme-gradient', backgroundGradients[0]);
    }
}

/**
 * 
 * @param {string | int} index the index of the gradient stored in the variabe `backgroundGradients`
 */
function updateGradient(index) {
    localStorage.setItem("themegradient", index);
    setGradient();
}

/**
 * Changes the backdrop's brightness
 */
function setOpacity() {
    let bgOpacity = parseFloat(localStorage.getItem("bgOpacity"));
    if (bgOpacity == 0 || bgOpacity) {
        document.getElementById("bgOpacity").style.backgroundColor = `rgba(0,0,0, ${bgOpacity})`;
    } else {
        document.getElementById("bgOpacity").style.backgroundColor = `rgba(0,0,0,0.6)`;
    }
}


/**
 * Saves the configuration
 * @param {string | int} value the backdrop's brightness 
 */
function updateOpacity(value) {
    localStorage.setItem("bgOpacity", value);
    setOpacity();
}

/**
 * Changes the background image
 */
function updateImage() {
    if (localStorage.getItem("useImageBack") === "true") {
        document.getElementById("bgGrad").style.backgroundImage = `url("${cordova.file.externalDataDirectory}background.png?v=${(new Date()).getTime()}")`;
    } else {
        // If "useImageBack" is not true, then we have to use gradients
        document.getElementById("bgGrad").style.backgroundImage = `var(--theme-gradient)`;
        setGradient();
    }
}


/**
 * Changes #frame's location
 * @param {string} url 
 */
function setURL(url) {
    document.getElementById("frame").style.opacity = "0";
    setTimeout(function () {
        document.getElementById("frame").contentWindow.location = url;
        setTimeout(function () {
            document.getElementById("frame").style.opacity = "1";
        }, 200);
    }, 200);
}

/**
 * Saves the imported database
 * @param {ArrayBuffer} arrayInt the database file
 */
function saveAsImport(arrayInt) {
    try {
        let blob = new Blob([arrayInt]);
        // Closing the database first before replacing it
        db.close(async function () {
            window.resolveLocalFileSystemURL(`${window.parent.cordova.file.applicationStorageDirectory}${"databases"}`, function (fileSystem) {

                fileSystem.getFile("data4.db", { create: true, exclusive: false }, function (file) {

                    file.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function (e) {
                            alert("Done!");
                            window.location.reload();

                        };

                        fileWriter.onerror = function (e) {
                            alert("Couldn't write to the file - 2.");
                            window.location.reload();

                        };

                        fileWriter.write(blob);

                    }, (err) => {
                        alert("Couldn't write to the file.");
                        window.location.reload();
                    });

                }, function (x) {
                    alert("Error opening the database file.");
                    window.location.reload();
                });

            }, function (error) {
                alert("Error opening the database folder.");
                window.location.reload();
            });
        }, function (error) {
            alert("Error closing the database.");
            window.location.reload();
        });
    } catch (err) {
        alert("Error getting the database variable.");
        window.location.reload();
    }
}

/**
 * Saves the background image in the externalDataDirectory AKA 'files' directory
 * @param {ArrayBuffer} arrayInt the image
 */
function saveImage(arrayInt) {
    let blob = new Blob([arrayInt]);
    window.resolveLocalFileSystemURL(`${window.parent.cordova.file.externalDataDirectory}`, function (fileSystem) {

        fileSystem.getFile("background.png", { create: true, exclusive: false }, function (file) {

            file.createWriter(function (fileWriter) {

                fileWriter.onwriteend = function (e) {
                    window.parent.updateImage();
                    alert("Done!");
                };

                fileWriter.onerror = function (e) {
                    alert("Couldn't write to the file - 2.");
                };


                fileWriter.write(blob);

            }, (err) => {
                alert("Couldn't write to the file.");
            });


        }, function (x) {
            alert("Error opening the database file.");
        });

    }, function (error) {
        alert("Error opening the database folder.");
    });
}

/**
 * @param {string} path the path that is being read
 * @returns {Promise<Array<FileEntry|DirectoryEntry>> | Promise<FileError>} a list of files/folders stored in the directory 
 */
function listDir(path) {
    return (new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(`${cordova.file.externalDataDirectory}${path}`,
            function (fileSystem) {
                var reader = fileSystem.createReader();
                reader.readEntries(
                    function (entries) {
                        resolve(entries);
                    },
                    function (err) {
                        reject(err);
                    }
                );
            }, function (err) {
                reject(err);
            }
        );
    }));
}

/**
 * @returns {downloadQueue} the downloadQueue
 */
function returnDownloadQueue() {
    return downloadQueueInstance;
}

function sendNoti(x) {
    return new notification(document.getElementById("noti_con"), {
        "perm": x[0],
        "color": x[1],
        "head": x[2],
        "notiData": x[3]
    });
}

async function MakeCusReq(url, options) {
    return new Promise(function (resolve, reject) {
        cordova.plugin.http.sendRequest(url, options, function (response) {
            resolve(response.data);
        }, function (response) {
            reject(response.error);
        });
    });
}

async function MakeFetch(url, options) {
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response) => {
            resolve(response);
        }).catch(function (err) {
            reject(err);
        });
    });
}


/**
 * Updates the themecolor. Mainly used for browsers
 */
function updateTheme() {
    try {
        document.querySelector(`meta[name="theme-color"]`).setAttribute("content", localStorage.getItem("themecolor"));
    } catch (err) {
        console.error(err);
    }
}


/**
 * 
 * @param {string} method the method of the request
 * @param {string} url the url that needs to be fetched 
 * @returns {Promise<string> | Promise<Error>} the response
 */
function makeLocalRequest(method, url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(errorBuilder("Request failed!", {
                    status: xhr.status,
                    statusText: xhr.statusText
                }));
            }
        };
        xhr.onerror = function () {
            reject(errorBuilder("Request failed!", {
                status: xhr.status,
                statusText: xhr.statusText
            }));
        };
        xhr.send();
    });
}

/**
 * @param {string} url the path that needs to be deleted
 * @returns {Promise<string> | Promise<Error>} "done" if the directory was successfully deleted
 */
function removeDirectory(url) {
    return new Promise(function (resolve, reject) {
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function (fs) {
            fs.getDirectory(url, { create: false, exclusive: false }, function (directory) {
                    directory.removeRecursively(function () {
                        resolve("done");
                    },
                    function (err) {
                        reject(err);
                    });
            }, function (err) {
                reject(err);
            });
        }, function (err) {
            reject(err);
        });
    });
}

function exec_action(x, reqSource) {

    if (x.action == 1) {
        screen.orientation.lock(x.data);
    }
    else if (x.action == 3) {
        window.location = x.data;
    }
    else if (x.action == 5) {

        let currentEngine;
        let temp = x.data.split("&engine=");
        if (temp.length == 1) {
            currentEngine = wco;
        } else {
            currentEngine = parseInt(temp[1]);
            if (currentEngine == 0) {
                currentEngine = extensionList[0];
            } else {
                currentEngine = extensionList[currentEngine];
            }
        }

        currentEngine.getLinkFromUrl(temp[0]).then(function (x) {
            x.action = 1;
            reqSource.postMessage(x, "*");
        }).catch(function (x) {
            x.action = 1;
            console.error(x);
            reqSource.postMessage(x, "*");
        });
        
    } else if (x.action == 11) {

        PictureInPicture.enter(480, 270, () => {});
        
    } else if (x.action == 15) {
        if (!config.chrome) {
            MusicControls.updateIsPlaying(true);
        }
    } else if (x.action == 400) {
        screen.orientation.lock("any");
        document.getElementById("player").classList.add("pop");
        document.getElementById("frame").style.height = "calc(100% - 200px)";
        document.getElementById("frame").style.display = "block";
        document.getElementById("player").style.display = "block";
    }
    else if (x.action == 401) {
        screen.orientation.lock("landscape");
        document.getElementById("player").classList.remove("pop");
        document.getElementById("frame").style.height = "100%";
        document.getElementById("frame").style.display = "none";
        document.getElementById("player").style.display = "block";

    } else if (x.action == 16) {
        if (!config.chrome) {
            MusicControls.updateIsPlaying(false);
        }
    } else if (x.action == 20) {

        let toSend;

        if (config.chrome) {
            toSend = "";
        } else {
            toSend = cordova.plugin.http.getCookieString(config.remoteWOport);
        }
        reqSource.postMessage({ "action": 200, "data": toSend }, "*");

    } else if (x.action == 403) {

        downloadQueueInstance.add(x.data, x.anime, x.mainUrl, x.title);

    } else if (x.action == 21) {

        window.location = "login.html";

    } else if (x.action == 402) {

        updateTheme();

    } else if (x.action == 500) {

        setURL(x.data);


    } else if (x.action == 22) {

        window.location = "reset.html";

    } else if (x.action == 26) {

        window.location = "settings.html";

    } else if (x.action == 301 && config.beta && seekCheck) {

        MusicControls.updateElapsed({
            elapsed: x.elapsed * 1000,
            isPlaying: x.isPlaying
        });

    } else if (x.action == 12) {
        if (!config.chrome) {

            let showName = x.nameShow.split("-");

            for (var i = 0; i < showName.length; i++) {
                let temp = showName[i];
                temp = temp.charAt(0).toUpperCase() + temp.slice(1);
                showName[i] = temp;

            }

            seekCheck = true;


            x.nameShow = showName.join(" ");
            const controlOption = {
                track: x.nameShow,
                artist: "Episode " + x.episode,
                cover: 'assets/images/anime.png',

                isPlaying: true,							// optional, default : true
                dismissable: true,							// optional, default : false


                hasPrev: x.prev,
                hasNext: x.next,
                hasClose: true,



                playIcon: 'media_play',
                pauseIcon: 'media_pause',
                prevIcon: 'media_prev',
                nextIcon: 'media_next',
                closeIcon: 'media_close',
                notificationIcon: 'notification'
            };

            if (config.beta) {
                controlOption.hasScrubbing = true;
                controlOption.duration = x.duration ? x.duration * 1000 : 0;
                controlOption.elapsed = x.elapsed ? x.elapsed : 0;
            }

            MusicControls.create(controlOption, () => {}, () => {});
            function events(action) {

                const message = JSON.parse(action).message;
                switch (message) {
                    case 'music-controls-next':
                        document.getElementById("player").contentWindow.postMessage({ "action": "next" }, "*");
                        break;
                    case 'music-controls-previous':
                        document.getElementById("player").contentWindow.postMessage({ "action": "previous" }, "*");
                        break;
                    case 'music-controls-pause':
                        document.getElementById("player").contentWindow.postMessage({ "action": "pause" }, "*");
                        break;
                    case 'music-controls-play':
                        document.getElementById("player").contentWindow.postMessage({ "action": "play" }, "*");
                        break;
                    case 'music-controls-media-button-play':
                        document.getElementById("player").contentWindow.postMessage({ "action": "play" }, "*");
                        break;
                    case 'music-controls-media-button-pause':
                        document.getElementById("player").contentWindow.postMessage({ "action": "pause" }, "*");
                        break;
                    case 'music-controls-media-button-previous':
                        document.getElementById("player").contentWindow.postMessage({ "action": "previous" }, "*");
                        break;
                    case 'music-controls-media-button-next':
                        document.getElementById("player").contentWindow.postMessage({ "action": "next" }, "*");
                        break;
                    case 'music-controls-destroy':
                        seekCheck = false;
                        break;
                    case 'music-controls-toggle-play-pause':
                        document.getElementById("player").contentWindow.postMessage({ "action": "toggle" }, "*");
                        break;
                    case 'music-controls-headset-unplugged':
                        document.getElementById("player").contentWindow.postMessage({ "action": "pause" }, "*");
                        break;
                    case 'music-controls-seek-to':
                        document.getElementById("player").contentWindow.postMessage({ "action": "elapsed", "elapsed": (JSON.parse(action).position) / 1000 }, "*");
                        break;
                    default:
                        break;
                }
            }

            MusicControls.subscribe(events);
            MusicControls.listen();
            MusicControls.updateIsPlaying(true);
        }
    } else if (x.action == 4) {

        if (config.chrome && document.getElementById("player").contentWindow.location.href.includes("/www/fallback.html")) {

            document.getElementById("player").contentWindow.location = ("pages/player/index.html" + x.data);

        } else if (config.chrome) {

            document.getElementById("player").contentWindow.location.replace("pages/player/index.html" + x.data);

        }


        if (!config.chrome) {
            let checkLock = 0;

            setTimeout(function () {
                if (checkLock == 0) {
                    document.getElementById("player").contentWindow.location.replace("pages/player/index.html" + x.data);
                }
            }, 100);

            screen.orientation.lock("landscape").then(function () {

            }).catch(function (error) {
                console.error(error);
            }).finally(function () {
                checkLock = 1;
                document.getElementById("player").contentWindow.location.replace("pages/player/index.html" + x.data);
            });
        }

        document.getElementById("frame").style.display = "none";
        document.getElementById("frame").style.height = "100%";
        document.getElementById("player").style.display = "block";
        document.getElementById("player").classList.remove("pop");
    } else if (x.action == "updateGrad") {

        updateGradient(parseInt(x.data));
    }
    else if (x.action == "updateOpacity") {

        updateOpacity(parseFloat(x.data));
    }
    else if (x.action == "updateImage") {

        updateImage();
    
    }

}

async function onDeviceReady() {
    await SQLInit();
    await SQLInitDownloaded();
    updateImage();
    cordova.plugins.backgroundMode.on('activate', function () {
        cordova.plugins.backgroundMode.disableWebViewOptimizations();
        cordova.plugins.backgroundMode.disableBatteryOptimizations();
    });

    downloadQueueInstance = new downloadQueue();
    document.getElementById("frame").src = "pages/homepage/index.html";

    function onBackKeyDown() {
        try {
            if (document.getElementById("player").contentWindow.a.locked === true) {
                return;
            }
        } catch (err) {

        }
        
        let frameLocation = document.getElementById("frame").contentWindow.location.pathname;
        if (frameLocation.indexOf("www/pages/homepage/index.html") > -1 || (document.getElementById("player").className.indexOf("pop") == -1 && document.getElementById("player").contentWindow.location.pathname.indexOf("www/pages/player/index.html") > -1)) {
            document.getElementById("player").contentWindow.location.replace("fallback.html");
            document.getElementById("player").classList.remove("pop");

            document.getElementById("player").style.display = "none";
            document.getElementById("frame").style.display = "block";

            if (frameLocation.indexOf("www/pages/homepage/index.html") > -1) {
                setURL(document.getElementById("frame").contentWindow.location);
            }

            document.getElementById("frame").style.height = "100%";
            MusicControls.destroy((x) => { }, (x) => { });


            screen.orientation.lock("any").then(function () {

            }).catch(function (error) {

            });




        } else {

            if (frameHistory.length > 1) {
                frameHistory.pop();
                setURL(frameHistory[frameHistory.length - 1]);
            }

        }
    }

    if (cordova.plugin.http.getCookieString(config.remoteWOport).indexOf("connect.sid") == -1 && config.local == false && localStorage.getItem("offline") === 'false') {
        window.location = "login.html";
    }

    document.addEventListener("backbutton", onBackKeyDown, false);
}

document.addEventListener("deviceready", onDeviceReady, false);
window.addEventListener('message', function (x) {
    if (x.data.action == "eval") {
        if (x.data.value == "error") {
            currentReject("error");
        } else {
            currentResolve(x.data.value);
        }
        document.getElementById("evalScript").src = `eval.html?v=${(new Date()).getTime()}`;
    } else {
        exec_action(x.data, x.source);
    }
});
document.getElementById("frame").onload = function () {
    document.getElementById("frame").style.opacity = 1;

    if (frameHistory.length === 0) {
        frameHistory.push(document.getElementById("frame").contentWindow.location.href);
    }
    else if (frameHistory[frameHistory.length - 1] != document.getElementById("frame").contentWindow.location.href) {
        frameHistory.push(document.getElementById("frame").contentWindow.location.href);

    }
};

if (!config.chrome) {
    let scriptDOM = document.createElement("script");
    scriptDOM.setAttribute("type", "text/javascript");
    scriptDOM.setAttribute("src", `https://enimax-anime.github.io/key-extractor/index.js?v=${(new Date()).getTime()}`);
    document.body.append(scriptDOM);
}else {
    document.getElementById("frame").src = "pages/homepage/index.html";
    document.getElementById("player").onload = function () {
        if (document.getElementById("player").contentWindow.location.href.includes("www/fallback.html")) {
            document.getElementById("player").style.display = "none";
            document.getElementById("frame").style.height = "100%";
            document.getElementById("frame").style.display = "block";
        }
    };
}



updateTheme();
setGradient();