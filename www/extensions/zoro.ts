var zoro : extension = {
    "baseURL" : "https://zoro.to",
    "searchApi": async function (query : string) : Promise<extensionSearch> {
        let searchHTML = await MakeFetch(`https://zoro.to/search?keyword=${query}`, {});
        let dom = document.createElement("div");
        let orDom = dom;
        dom.innerHTML = DOMPurify.sanitize(searchHTML);

        let itemsDOM = dom.querySelectorAll('.flw-item');
        let data = [];
        for (var i = 0; i < itemsDOM.length; i++) {
            let con = itemsDOM[i];
            let src = con.querySelector("img").getAttribute("data-src");
            let aTag = con.querySelector("a");
            let animeName = aTag.getAttribute("title");
            let animeId = aTag.getAttribute("data-id");
            let animeHref = aTag.getAttribute("href").split("?")[0] + "&engine=3";
            data.push({ "name": animeName, "id": animeId, "image": src, "link": animeHref });
        }

        orDom.remove();
        return ({ data, "status": 200 });
    },


    'getAnimeInfo': async function (url) : Promise<extensionInfo> {
        url = url.split("&engine")[0];
        let idSplit = url.replace("?watch=/", "").split("-");
        let id = idSplit[idSplit.length - 1].split("?")[0];

        let response : extensionInfo= {
            "name" : "",
            "image" : "",
            "description" : "",
            "episodes" : [],
            "mainName" : ""
        };


        let animeHTML = await MakeFetch(`https://zoro.to/${url}`, {});
        let malID = null;
        let settled = "allSettled" in Promise;
        try{
            let tempID = parseInt(animeHTML.split(`"mal_id":"`)[1]);
            if(!isNaN(tempID)){
                malID = tempID;
            }
        }catch(err){

        }

        let animeDOM = document.createElement("div");
        let ogDOM = animeDOM;
        animeDOM.innerHTML = DOMPurify.sanitize(animeHTML);

        let name = url;
        let nameSplit = name.replace("?watch=", "").split("&ep=")[0].split("-");
        nameSplit.pop();
        name = nameSplit.join("-");


        response.mainName = name;
        response.name = (animeDOM.querySelector(".film-name.dynamic-name") as HTMLElement).innerText;
        response.image = (animeDOM.querySelector(".layout-page.layout-page-detail") as HTMLElement).querySelector("img").src;
        response.description = (animeDOM.querySelector(".film-description.m-hide") as HTMLElement).innerText;

        ogDOM.remove();

        let thumbnails = {};
        let promises = [];
        let episodeHTML;
        let check = false;
        if(malID !== null){
            try{

                let thumbnailsTemp = [];

                if(settled){
                    promises.push(MakeFetchTimeout(`https://api.enime.moe/mapping/mal/${malID}`, {}));
                    promises.push(MakeFetch(`https://zoro.to/ajax/v2/episode/list/${id}`, {}));

                    let responses = await Promise.allSettled(promises);

                    try{
                        if(responses[0].status === "fulfilled"){
                            thumbnailsTemp = JSON.parse(responses[0].value).episodes;
                        }
                    }catch(err){

                    }

                    if(responses[1].status === "fulfilled"){
                        episodeHTML = responses[1].value;
                        check = true;
                    }
                }else{

                    let metaData = await MakeFetchTimeout(`https://api.enime.moe/mapping/mal/${malID}`, {});
                    thumbnailsTemp = JSON.parse(metaData).episodes;
                }

                for(let i = 0; i < thumbnailsTemp.length; i++){
                    thumbnails[thumbnailsTemp[i].number] = thumbnailsTemp[i];
                }
            }catch(err){
                console.error(err);
            }
        }
        
        if(!check){
            episodeHTML = await MakeFetch(`https://zoro.to/ajax/v2/episode/list/${id}`, {});
        }

        episodeHTML = JSON.parse(episodeHTML).html;

        let dom = document.createElement("div");
        ogDOM = dom;
        dom.innerHTML = DOMPurify.sanitize(episodeHTML);


        let episodeListDOM = dom.querySelectorAll('.ep-item');
        let data = [];

        for (var i = 0; i < episodeListDOM.length; i++) {
            let tempEp : extensionInfoEpisode = {
                "link": episodeListDOM[i].getAttribute("href").replace("/watch/", "?watch=").replace("?ep=", "&ep=") + "&engine=3",
                "id": episodeListDOM[i].getAttribute("data-id"),
                "title": "Episode " + episodeListDOM[i].getAttribute("data-number"),
            };

            try{
                let epIndex = parseFloat(episodeListDOM[i].getAttribute("data-number"));
                if(epIndex in thumbnails){
                    tempEp.thumbnail = thumbnails[epIndex].image;
                    tempEp.title = "Episode " + epIndex + " - " + thumbnails[epIndex].title;
                    tempEp.description = thumbnails[epIndex].description;
                }
            }catch(err){

            }

            data.push(tempEp);

        }

        ogDOM.remove();
        response.episodes = data;
        return response;

    },

    "getEpisodeListFromAnimeId" : async function getEpisodeListFromAnimeId(showID : string, episodeId : string) {
        let res = JSON.parse((await MakeFetch(`https://zoro.to/ajax/v2/episode/list/${showID}`, {})));
        res = res.html;
        let dom = document.createElement("div");
        let ogDOM = dom;
        dom.innerHTML = DOMPurify.sanitize(res);
        let epItemsDOM = dom.querySelectorAll('.ep-item');
        let data = [];

        for (var i = 0; i < epItemsDOM.length; i++) {
            let temp = {
                "link": epItemsDOM[i].getAttribute("href").replace("/watch/", "").replace("?ep=", "&ep=") + "&engine=3",
                "id": epItemsDOM[i].getAttribute("data-id"),
                "title": parseFloat(epItemsDOM[i].getAttribute("data-number")),
                "current": 0
            };
            if (parseFloat(epItemsDOM[i].getAttribute("data-id")) == parseFloat(episodeId)) {
                temp.current = 1;
            }
            data.push(temp);

        }

        ogDOM.remove();
        return data;

    },



    addSource : async function addSource(type : string, id : string, subtitlesArray : Array<videoSubtitle>, sourceURLs: Array<videoSource>){
        let sources = await MakeFetch(`https://zoro.to/ajax/v2/episode/sources?id=${id}`, {});
        sources = JSON.parse(sources).link;
        let urlHost = (new URL(sources)).origin;


        let sourceIdArray = sources.split("/");
        let sourceId = sourceIdArray[sourceIdArray.length - 1];
        sourceId = sourceId.split("?")[0];


        let sourceJSON = JSON.parse((await MakeFetch(`${urlHost}/ajax/embed-6/getSources?id=${sourceId}&sId=lihgfedcba-abcde`, {})));
        try {
            for (let j = 0; j < sourceJSON.tracks.length; j++) {
                sourceJSON.tracks[j].label += " - " + type;
                if (sourceJSON.tracks[j].kind == "captions") {
                    subtitlesArray.push(sourceJSON.tracks[j]);
                }
            }
        } catch (err) {

        }
        try {
            if (sourceJSON.encrypted && typeof sourceJSON.sources == "string") {
                let encryptedURL = sourceJSON.sources;
                let decryptKey, tempFile;
                try {
                    decryptKey = await extractKey(6, null, true);
                    sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                } catch (err) {
                    if (err.message == "Malformed UTF-8 data") {
                        decryptKey = await extractKey(6);
                        try{
                            sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                        }catch(err){

                        }
                    }
                }
            }
            let tempSrc : videoSource = { "url": sourceJSON.sources[0].file, "name": "HLS#" + type, "type": "hls" };
            if ("intro" in sourceJSON && "start" in sourceJSON.intro && "end" in sourceJSON.intro) {
                tempSrc.skipIntro = sourceJSON.intro;
            }
            sourceURLs.push(tempSrc);
        } catch (err) {
            console.error(err);
        }
    },
    'getLinkFromUrl': async function (url : string): Promise<extensionVidSource>{
        const sourceURLs : Array<videoSource> = [];
        let subtitles : Array<videoSubtitle> = [];       

        const resp : extensionVidSource= {
            sources : sourceURLs,
            name: "",
            nameWSeason : "",
            episode : "",
            status : 400,
            message: "",
            next : null,
            prev : null,
        };

        let episodeId : string, animeId;


        episodeId = parseFloat(url.split("&ep=")[1]).toString();
        animeId = url.replace("?watch=", "").split("-");
        animeId = animeId[animeId.length - 1].split("&")[0];

        let a = await MakeFetch(`https://zoro.to/ajax/v2/episode/servers?episodeId=${episodeId}`, {});
        let domIn = JSON.parse(a).html;

        let dom = document.createElement("div");
        let ogDOM = dom;
        dom.innerHTML = DOMPurify.sanitize(domIn);



        let promises = [];
        promises.push(this.getEpisodeListFromAnimeId(animeId, episodeId));

        let tempDom = dom.querySelectorAll('[data-server-id="4"]');
        let hasSource = false;
        for (var i = 0; i < tempDom.length; i++) {
            hasSource = true;
            promises.push(this.addSource(tempDom[i].getAttribute("data-type"), tempDom[i].getAttribute('data-id'), subtitles, sourceURLs));
        }

        if (!hasSource) {
            tempDom = dom.querySelectorAll('[data-server-id="1"]');
            for (var i = 0; i < tempDom.length; i++) {
                promises.push(this.addSource(tempDom[i].getAttribute("data-type"), tempDom[i].getAttribute('data-id'), subtitles, sourceURLs));
            }
        }

        let promRes = await Promise.all(promises);

        let links = promRes[0];
        let prev = null;
        let next = null;
        let check = false;
        let epNum = 1;
        for (var i = 0; i < (links).length; i++) {
            if (check === true) {
                next = links[i].link;
                break;
            }
            if (parseFloat(links[i].id) == parseFloat(episodeId)) {
                check = true;
                epNum = links[i].title;
            }


            if (check === false) {
                prev = links[i].link;
            }
        }
        ogDOM.remove();

        resp["sources"] =  sourceURLs;
        resp["episode"] = epNum.toString();

        if (next != null) {
            resp.next = next;
        }

        if (prev != null) {
            resp.prev = prev;
        }

        let name = url;
        let nameSplit = name.replace("?watch=", "").split("&ep=")[0].split("-");
        nameSplit.pop();
        name = nameSplit.join("-");

        resp.name = name;
        resp.nameWSeason = name;
        resp.subtitles = subtitles;
        resp.status = 200;
        return resp;

    },
    "config": {
        "socketURL": "https://ws1.rapid-cloud.co",
        "origin": "https://rapid-cloud.co",
        "referer": "https://rapid-cloud.co/",
    },
    "discover": async function () :  Promise<Array<extensionDiscoverData>> {
        let temp = document.createElement("div");
        temp.innerHTML = DOMPurify.sanitize(await MakeFetch(`https://zoro.to/top-airing`, {}));
        let data = [];
        for (let elem of temp.querySelectorAll(".flw-item")) {
            let image = elem.querySelector("img").getAttribute("data-src");
            let tempAnchor = elem.querySelector("a");
            let name = tempAnchor.getAttribute("title");
            let link = tempAnchor.getAttribute("href");

            data.push({
                image,
                name,
                link
            });
        }

        return data;
    }
};