
if (config.local || localStorage.getItem("offline") === 'true') {
    ini();
} else {
    window.parent.postMessage({ "action": 20 }, "*");
}

let lastScrollPos : number;
let scrollDownTopDOM = document.getElementById("scrollDownTop");

// @ts-ignore
let pullTabArray = [];

pullTabArray.push(new pullToRefresh(document.getElementById("con_11")));

let scrollElem = document.getElementById("con_11");
scrollElem.addEventListener("scroll", function () {
    if (lastScrollPos) {
        if (lastScrollPos - scrollElem.scrollTop > 0) {
            scrollDownTopDOM.className = "scrollTopDOM";
        } else {
            scrollDownTopDOM.className = "scrollBottomDOM";
        }
    }
    lastScrollPos = scrollElem.scrollTop;

}, {
    "passive": true
});


function fix_title(title : string) {
    try {
        let titleArray = title.split("-");
        let temp = "";
        for (var i = 0; i < titleArray.length; i++) {
            temp = temp + titleArray[i].substring(0, 1).toUpperCase() + titleArray[i].substring(1) + " ";
        }
        return temp;
    } catch (err) {
        return title;
    }
}


scrollDownTopDOM.onclick = function () {
    if (scrollDownTopDOM.className == "scrollTopDOM") {
        scrollElem.scrollTop = 0;
    } else if (scrollDownTopDOM.className == "scrollBottomDOM") {
        scrollElem.scrollTop = scrollElem.scrollHeight;
    }
};


function normalise(url : string) {
    url = url.replace("?watch=", "");
    url = url.split("&engine=")[0];
    return url;
}

window.onmessage = function (x) {
    if (parseInt(x.data.action) == 200) {
        ini();
    }

};


function sendNoti(notiConfig: any) {
    return new notification(document.getElementById("noti_con"), {
        "perm": notiConfig[0],
        "color": notiConfig[1],
        "head": notiConfig[2],
        "notiData": notiConfig[3]
    });
}




function checkIfExists(localURL : string, dList : Array<string>, dName : string) : Promise<string> {
    return (new Promise(function (resolve, reject) {
        let index = dList.indexOf(dName);
        if (index > -1) {
            dList.splice(index, 1);
            let timeout = setTimeout(function () {
                reject(new Error("timeout"));
            }, 1000);

            (<cordovaWindow>window.parent).makeLocalRequest("GET", `${localURL}`).then(function (x) {
                clearTimeout(timeout);
                resolve(x);
            }).catch(function () {
                clearTimeout(timeout);
                reject(new Error("notdownloaded"));

            });
        } else {
            reject("notinlist");
        }
    }));


}

function ini() {
    let downloadQueue;
    if(!config.ios){
        downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();
    }
    let username = "hi";

    if (location.search.indexOf("?watch=/") > -1 || localStorage.getItem("offline") === 'true') {

        let main_url = location.search.replace("?watch=/", "");

        //todo
        let currentEngine;
        let temp3 = main_url.split("&engine=");
        if (temp3.length == 1) {
            currentEngine = 0;
        } else {
            currentEngine = parseInt(temp3[1]);
        }


        async function processEpisodeData(data : extensionInfo, downloaded, main_url) {

            let currentLink = '';
            if (localStorage.getItem("currentLink")) {
                currentLink = localStorage.getItem("currentLink");
            }

            let scrollToDOM;
            var a = document.getElementsByClassName("card_con");
            document.getElementById("updateImage").style.display = "inline-block";
            if (!config.chrome && !config.ios) {
                document.getElementById("downloadAll").style.display = "inline-block";
            }
            document.getElementById("copyLink").style.display = "inline-block";
            document.getElementById("updateLink").style.display = "inline-block";
            document.getElementById("copyImage").style.display = "inline-block";


            document.getElementById("copyLink").onclick = function () {
                window.prompt("Copy it from below:", location.search);
            };

            document.getElementById("copyImage").onclick = function () {
                window.prompt("Copy it from below:", data.image);
            };

            document.getElementById("updateLink").onclick = async function () {
                await postMessagePromise(window.parent, {
                    "action": "apiCall",
                    "data" : { 
                        "username": username, 
                        "action": 14, 
                        "name": data.mainName, 
                        "url": location.search 
                    }
                });

                sendNoti([2, "", "Alert", "Done!"]);
            };


            document.getElementById("updateImage").onclick = async function () {

                await postMessagePromise(window.parent, {
                    "action": "apiCall",
                    "data" : { 
                        "username": username, 
                        "action": 9, 
                        "name": data.mainName, 
                        "img": data.image 
                    }
                });
                sendNoti([2, "", "Alert", "Done!"]);
            };

            let downloadedList = [];
            if (!config.chrome && !config.ios) {
                try {
                    downloadedList = await (<cordovaWindow>window.parent).listDir(data.mainName);
                    let tempList = [];
                    for (let i = 0; i < downloadedList.length; i++) {
                        if (downloadedList[i].isDirectory) {
                            tempList.push(downloadedList[i].name);
                        }
                    }

                    downloadedList = tempList;
                } catch (err) {
                    console.error(err);
                }

            }





            document.getElementById("imageTitle").innerText = data.name.trim();
            document.getElementById("imageDesc").innerText = data.description.trim();

            document.getElementById("imageMain").style.backgroundImage = `url("${data.image}")`;
            let animeEps = data.episodes;

            let epCon = document.getElementById("epListCon");

            let toAdd = [];
            for (var i = 0; i < animeEps.length; i++) {
                let trr = animeEps[i].link;

                let tempDiv = document.createElement("div");
                tempDiv.className = 'episodesCon';
                tempDiv.setAttribute('data-url', animeEps[i].link);




                let tempDiv4 = document.createElement("div");
                tempDiv4.className = 'episodesDownload';
                tempDiv4.setAttribute('data-url', animeEps[i].link);
                tempDiv4.setAttribute('data-title', animeEps[i].title);

                tempDiv4.onclick = function () {
                    window.parent.postMessage({ 
                        "action": 403, 
                        "data": (this as HTMLElement).getAttribute("data-url"), 
                        "anime": data, 
                        "mainUrl": main_url, 
                        "title": (this as HTMLElement).getAttribute("data-title") 
                    }, "*");

                    (this as HTMLElement).className = 'episodesLoading';
                };

                let tempDiv3 = document.createElement("div");
                tempDiv3.className = 'episodesTitle';
                tempDiv3.innerText = animeEps[i].title;


                let check = false;
                if (!config.chrome && !config.ios) {

                    try {
                        await checkIfExists(`/${data.mainName}/${btoa(normalise(trr))}/.downloaded`, downloadedList, btoa(normalise(trr)));
                        tempDiv4.className = 'episodesDownloaded';
                        tempDiv4.onclick = function () {
                            (<cordovaWindow>window.parent).removeDirectory(`/${data.mainName}/${btoa(normalise(trr))}/`).then(function () {
                                if (downloaded) {
                                    tempDiv.remove();
                                } else {
                                    tempDiv4.className = 'episodesDownload';
                                    tempDiv4.onclick = function () {
                                        tempDiv4.className = 'episodesLoading';

                                        window.parent.postMessage({ "action": 403, "data": tempDiv4.getAttribute("data-url"), "anime": data, "mainUrl": main_url, "title": tempDiv4.getAttribute("data-title") }, "*");


                                    };
                                }
                            }).catch(function (err) {
                                alert("Error deleting the files.");
                            });
                        }


                        check = true;

                    } catch (err) {
                        if (downloadQueue.isInQueue(downloadQueue, animeEps[i].link)) {
                            tempDiv4.className = 'episodesLoading';
                            check = true;

                        } else if (err == "notdownloaded") {


                            check = true;

                            tempDiv4.className = 'episodesBroken';
                        }

                    }

                }

               


                let tempDiv2 = document.createElement("div");
                tempDiv2.className = 'episodesPlay';

                tempDiv2.onclick = function () {
                    localStorage.setItem("mainName", data.mainName);
                    window.parent.postMessage({ "action": 4, "data": trr }, "*");
                };

                if (check || !downloaded || config.chrome || config.ios) {
                    

                    
                    if (!downloaded) {
                        tempDiv.style.flexDirection = "column";
                        
                        tempDiv2.remove();
                        let tempDiv2Con = createElement({
                            class : "episodesImageCon",
                        });

                        tempDiv2Con.append(createElement({
                            class : "episodesBackdrop",
                        }));
                        
                        
                        tempDiv2 = <HTMLImageElement>createElement({
                            "class" : "episodesThumbnail",
                            "element" : "img",
                            "attributes": {
                                "loading" : "lazy",
                                "src" : (animeEps[i].thumbnail ? animeEps[i].thumbnail : "../../assets/images/anime2.png"),
                            }
                        });
     

                        let horizontalCon = createElement({
                            "class": "hozCon"
                        });

                        let horizontalConT = createElement({
                            "class": "hozCon",
                            "style" : {
                                "marginTop" : "12px"
                            }
                        });


                        horizontalConT.append(tempDiv3);
                        tempDiv3.className = 'episodesTitle aLeft';


                        horizontalConT.append(createElement({
                            "class" : "episodesPlaySmall",
                            "listeners" : {
                                "click" : function() {
                                    localStorage.setItem("mainName", data.mainName);
                                    window.parent.postMessage({ "action": 4, "data": trr }, "*");
                                }
                            }
                        }));


                        tempDiv2Con.append(tempDiv2);
                        horizontalCon.append(tempDiv2Con);
                        horizontalCon.append(createElement({
                            "class": "episodesTitleTemp"
                        }));

                        if (!config.chrome && !config.ios) {
                            horizontalCon.append(tempDiv4);
                        }
                        tempDiv.append(horizontalCon);
                        tempDiv.append(horizontalConT);

                        let horizontalConD;
                        if(animeEps[i].description){
                            horizontalConD = createElement({
                                "class": "hozCon",
                                "style" : {
                                    "marginTop" : "12px",
                                    "flex-direction" : "column"
                                }
                            });

                            horizontalConD.append(createElement({
                                "class": "episodesDescription",
                                "innerText" : animeEps[i].description,
                                "listeners":{
                                    "click": function(){
                                        let collapsed = this.getAttribute("collapsed");
                                        let readMore = this.nextSibling;
                                        if(collapsed !== "false"){
                                            this.style.maxHeight = "none";
                                            this.setAttribute("collapsed", "false");

                                            if(readMore){
                                                readMore.style.display = "none";
                                            }
                                        }else{
                                            this.style.maxHeight = "94px";
                                            this.setAttribute("collapsed", "true");
                                            if(readMore){
                                                readMore.style.display = "block";
                                            }
                                        }
                                    }
                                }
                            }));
                            horizontalConD.append(createElement({
                                "class" : "episodesDescEllipsis",
                                "innerText" : "Read more..."
                            }));
                            tempDiv.append(horizontalConD);

                        }
                        // epCon.append(tempDiv);
                        toAdd.push(tempDiv);
                    } else {
                        if (downloaded) {
                            let localQuery = encodeURIComponent(`/${data.mainName}/${btoa(normalise(trr))}`);
                            tempDiv2.onclick = function () {
                                window.parent.postMessage({ "action": 4, "data": `?watch=${localQuery}` }, "*");
                            };
                        }    
                        tempDiv.append(tempDiv2);
                        tempDiv.append(tempDiv3);
                        if (!config.chrome && !config.ios) {
                            tempDiv.append(tempDiv4);
                        }
                        // epCon.append(tempDiv);
                        toAdd.push(tempDiv);
                    }
                    

                    if (trr == currentLink) {
                        scrollToDOM = tempDiv;
                        tempDiv.style.backgroundColor = "rgba(255,255,255,1)";
                        tempDiv.classList.add("episodesSelected");
                    }
                } else {
                    try {
                        tempDiv.remove();
                    } catch (err) {

                    }
                }

            }

            for(let e of toAdd){
                epCon.append(e);
            }

            if (downloaded) {
                for (let downloadIndex = 0; downloadIndex < downloadedList.length; downloadIndex++) {

                    let thisLink = downloadedList[downloadIndex];
                    let localQuery = encodeURIComponent(`/${data.mainName}/${thisLink}`);

                    let tempDiv = document.createElement("div");
                    tempDiv.className = 'episodesCon';


                    let tempDiv2 = document.createElement("div");
                    tempDiv2.className = 'episodesPlay';

                    tempDiv2.onclick = function () {
                        localStorage.setItem("mainName", data.mainName);
                        window.parent.postMessage({ "action": 4, "data": `?watch=${localQuery}` }, "*");

                    };

                    let tempDiv4 = document.createElement("div");
                    tempDiv4.className = 'episodesDownloaded';
                    tempDiv4.onclick = function () {
                        (<cordovaWindow>window.parent).removeDirectory(`/${data.mainName}/${thisLink}`).then(function () {
                            tempDiv.remove();
                        }).catch(function () {
                            alert("Error deleting the files");
                        });
                    }


                    let tempDiv3 = document.createElement("div");
                    tempDiv3.className = 'episodesTitle';
                    try {
                        tempDiv3.innerText = fix_title(atob(thisLink));
                    } catch (err) {
                        tempDiv3.innerText = "Could not parse the titles";
                    }



                    tempDiv.append(tempDiv2);
                    tempDiv.append(tempDiv3);
                    tempDiv.append(tempDiv4);
                    epCon.append(tempDiv);
                }
            }

            try {
                if (!downloaded && localStorage.getItem("scrollBool") !== "false") {
                    scrollToDOM.scrollIntoView();

                }
            } catch (err) {

            }

            if (scrollToDOM && !config.chrome && !config.ios) {
                document.getElementById("downloadNext").style.display = "inline-block";
                document.getElementById("downloadNext").onclick = function () {
                    let howmany = parseInt(prompt("How many episodes do you want to download?", "5"));
                    if (isNaN(howmany)) {
                        alert("Not a valid number");
                    } else {
                        let cur = scrollToDOM;
                        let count = howmany;
                        while (cur != null && count > 0) {
                            cur = cur.nextElementSibling;
                            let temp = cur.querySelector(".episodesDownload");
                            if (temp) {
                                temp.click();
                            }
                            count--;
                        }
                    }
                };
            }

            document.getElementById("downloadAll").onclick = function () {
                let allEps = document.querySelectorAll(".episodesDownload");
                for (let index = 0; index < allEps.length; index++) {
                    const element = <HTMLElement>allEps[index];
                    element.click();
                }

            };


            if (!("image" in data) || data.image == undefined || data.image == null || data.image == "") {
                data.image = "https://raw.githubusercontent.com/enimax-anime/enimax/main/www/assets/images/placeholder.jpg";
            }


            postMessagePromise(window.parent, {
                "action": "apiCall",
                "data" : { 
                    "username": username, 
                    "action": 5, 
                    "name": data.mainName, 
                    "img": data.image, 
                    "url": location.search 
                }
            });

            postMessagePromise(window.parent, {
                "action": "apiCall",
                "data" : { 
                    "username": username, 
                    "action": 5, 
                    "name": data.mainName, 
                    "img": data.image, 
                    "url": location.search 
                }
            }).then((epData) => {
                let episodes = {};
                for(let ep of epData.data){
                    console.log(epData);
                    if(epData.dexie){
                        if(ep.comp != 0 && ep.ep != 0){
                            let thisEp = {
                                duration : ep.comp,
                                curtime : ep.cur_time
                            };
                            episodes[ep.main_link] = thisEp;
                        }
                    }else{
                        if(ep.duration != 0 && ep.ep != 0){
                            let thisEp = {
                                duration : ep.duration,
                                curtime : ep.curtime,
                            };
                            episodes[ep.name] = thisEp;
                        }
                    }
                }


                for(const elem of document.getElementsByClassName("episodesCon")){
                    let dataURL = elem.getAttribute("data-url");
                    if(dataURL in episodes){
                        try{
                            let imageCon = elem.children[0].children[0];
                            let curEp = episodes[dataURL];

                            let tempDiv = createElement({
                                "class" : "episodesProgressCon",
                            });

                            tempDiv.append(createElement({
                                "class" : "episodesProgress",
                                "style" : {
                                    "width" : `${100*(parseInt(curEp.curtime)/parseInt(curEp.duration))}%`
                                }
                            }));

                            imageCon.append(tempDiv);
                        }catch(err){
                            console.error(err);
                        }

                        delete episodes[dataURL];
                    }


                    if(Object.keys(episodes).length == 0){
                        break;
                    }
                }

            }).catch((error) => console.error(error));
        }


        if (localStorage.getItem("offline") === 'true') {
            (<cordovaWindow> window.parent).makeLocalRequest("GET", `/${main_url.split("&downloaded")[0]}/info.json`).then(function (data) {
                let temp = JSON.parse(data);
                temp.data.episodes = temp.episodes;
                processEpisodeData(temp.data, true, main_url);

            }).catch(function (err) {
                console.error(err);
                alert("Could not find info.json");
            });

        } else {
            postMessagePromise(window.parent, {
                action : "infoExtension",
                value: main_url,
                engine : currentEngine
            }).then(function (data : extensionInfo) {
                processEpisodeData(data, false, main_url);
            }).catch(function (err) {
                console.error(err);
                alert(err);
            });
        }
    }
}

applyTheme();