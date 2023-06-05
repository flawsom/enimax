var viewAsian: extension = {
    baseURL: "https://viewasian.co",
    // ajaxURL: "https://ajax.gogo-load.com/ajax",
    keys: [
        CryptoJS.enc.Utf8.parse("93422192433952489752342908585752"),
        CryptoJS.enc.Utf8.parse("9262859232435825"),
    ],
    searchApi: async function (query: string): Promise<extensionSearch> {
        let dom = document.createElement("div");

        try {
            let searchHTML = await MakeFetchZoro(`${this.baseURL}/movie/search/${query.replace(/[\W_]+/g, '-')}`, {});
            dom.innerHTML = DOMPurify.sanitize(searchHTML);

            let itemsDOM = dom.querySelectorAll(".movies-list-full .ml-item");
            let data = [];
            for (var i = 0; i < itemsDOM.length; i++) {
                let con = itemsDOM[i];
                let src = con.querySelector("img").getAttribute("data-original");
                let aTag = con.querySelector("a");
                let animeName = (con.querySelector(".mli-info") as HTMLElement)?.innerText?.trim();
                let animeHref = aTag.getAttribute("href") + "&engine=10";
                data.push({ "name": animeName, "image": src, "link": animeHref });
            }

            return ({ data, "status": 200 });
        } catch (err) {
            throw err;
        } finally {
            removeDOM(dom);
        }
    },
    getAnimeInfo: async function (url: string): Promise<extensionInfo> {
        url = url.split("&engine")[0];
        const rawURL = `${this.baseURL}/${url}`;
        console.log(this, this.baseURL, rawURL);

        const animeDOM = document.createElement("div");
        const episodeDOM = document.createElement("div");

        try {
            const response: extensionInfo = {
                "name": "",
                "image": "",
                "description": "",
                "episodes": [],
                "mainName": ""
            };


            const animeHTML = await MakeFetchZoro(rawURL, {});
            const identifier = url.split("/")[0] + "/";
            const id = url.replace(identifier, "viewasian-");


            animeDOM.innerHTML = DOMPurify.sanitize(animeHTML);

            response.mainName = id;
            response.image = (animeDOM.querySelector(".detail-mod img") as HTMLElement).getAttribute("src");
            response.name = (animeDOM.querySelector(".detail-mod h3") as HTMLElement).innerText.trim();
            response.description = (animeDOM.querySelector(".desc") as HTMLElement).innerText.trim();


            const epData: Array<extensionInfoEpisode> = [];
            const episodeHTML = await MakeFetchZoro(`${this.baseURL}/${animeDOM.querySelector(".bwac-btn").getAttribute("href")}`);
            episodeDOM.innerHTML = DOMPurify.sanitize(episodeHTML, {
                ADD_ATTR: ["episode-data"]
            });


            const episodeCon = episodeDOM.querySelectorAll("ul#episodes-sv-1 li");
            for (let i = 0; i < episodeCon.length; i++) {
                const el = episodeCon[i];
                const anchorTag = el.querySelector("a");
                let epNum = parseInt(anchorTag.getAttribute("episode-data"));
                const epParam = new URL(`${this.baseURL}${anchorTag.getAttribute("href")}`).searchParams.get("ep");

                if (epNum == 0) {
                    epNum = 0.1;
                }


                epData.unshift(
                    {
                        title: `Episode ${epNum}`,
                        link: `?watch=${id}&ep=${epParam}&engine=10`,
                        id: epNum.toString(),
                        altTitle: `Episode ${epNum}`
                    }
                );
            }

            response.episodes = epData;
            return response;
        } catch (err) {
            err.url = rawURL;
            throw err;
        } finally {
            // removeDOM(animeDOM);
            // removeDOM(episodeDOM);
        }
    },
    getLinkFromUrl: async function (url: string): Promise<extensionVidSource> {

        const watchDOM = document.createElement("div");
        const embedDOM = document.createElement("div");

        try {
            const params = new URLSearchParams("?watch=" + url);
            const sourceURLs: Array<videoSource> = [];

            watchDOM.style.display = "none";
            embedDOM.style.display = "none";

            const resp: extensionVidSource = {
                sources: sourceURLs,
                name: "",
                nameWSeason: "",
                episode: "",
                status: 400,
                message: "",
                next: null,
                prev: null,
            };

            const watchHTML = await MakeFetchZoro(`${this.baseURL}/watch/${params.get("watch").replace("viewasian-", "")}/watching.html?ep=${params.get("ep")}`);
            watchDOM.innerHTML = DOMPurify.sanitize(watchHTML, { ADD_TAGS: ["iframe"] });

            const episodeCon = watchDOM.querySelectorAll("ul#episodes-sv-1 li");

            let foundCurrentEp = false;

            for (let i = episodeCon.length - 1; i >=0; i--) {
                const el = episodeCon[i];
                const anchorTag = el.querySelector("a");

                const epParam = new URL(`${this.baseURL}${anchorTag.getAttribute("href")}`).searchParams.get("ep");

                if(foundCurrentEp){
                    resp.next = `${params.get("watch")}&ep=${epParam}&engine=10`;
                    break;  
                }

                if(params.get("ep") === epParam){
                    foundCurrentEp = true;
                }else{
                    resp.prev = `${params.get("watch")}&ep=${epParam}&engine=10`;
                }
            }

            if(!foundCurrentEp){
                resp.prev = undefined;
            }

            let asianLoadURL = "";
            const links = watchDOM.querySelectorAll('.anime_muti_link li');

            for (let i = 0; i < links.length; i++) {
                const curElem = (links[i] as HTMLElement);
                const isAsianLoad = curElem.innerText.toLowerCase().includes("asianload");

                if (isAsianLoad) {
                    asianLoadURL = curElem.getAttribute("data-video");
                }
            }


            if (asianLoadURL.substring(0, 2) === "//") {
                asianLoadURL = "https:" + asianLoadURL;
            }

            const embedHTML = await MakeFetchZoro(asianLoadURL);
            const videoURL = new URL(asianLoadURL);
            embedDOM.innerHTML = DOMPurify.sanitize(embedHTML);


            const encyptedParams = this.generateEncryptedAjaxParams(
                embedHTML.split("data-value")[1].split("\"")[1],
                videoURL.searchParams.get('id') ?? '',
                this.keys
            );


            const encryptedData = JSON.parse(await MakeFetch(
                `${videoURL.protocol}//${videoURL.hostname}/encrypt-ajax.php?${encyptedParams}`,
                {
                    "headers": {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                }
            ));

            const decryptedData = await this.decryptAjaxData(encryptedData.data, this.keys);
            if (!decryptedData.source) throw new Error('No source found.');

            for (const source of decryptedData.source) {
                sourceURLs.push({
                    url: source.file,
                    type: "hls",
                    name: "HLS"
                })
            }

            if(decryptedData.source_bk && decryptedData.source_bk?.length > 0){
                for (const source of decryptedData.source_bk) {
                    sourceURLs.push({
                        url: source.file,
                        type: "hls",
                        name: "HLS"
                    })
                }
            }

            resp.name = params.get("watch");
            resp.nameWSeason = params.get("watch");
            resp.episode = params.get("ep");
            if (parseFloat(resp.episode) === 0) {
                resp.episode = "0.1";
            }

            return resp;
        } catch (err) {
            throw err;
        } finally {
            // removeDOM(watchDOM);
            // removeDOM(embedDOM);
        }

    },
    fixTitle(title: string) {
        try {
            title = title.replace("viewasian-", "");
        } catch (err) {
            console.error(err);
        } finally {
            return title;
        }
    },
    generateEncryptedAjaxParams: function (scriptValue: string, id: string, keys: Array<string>) {
        const encryptedKey = CryptoJS.AES.encrypt(id, keys[0], {
            iv: keys[1] as any,
        });

        const decryptedToken = CryptoJS.AES.decrypt(scriptValue, keys[0], {
            iv: keys[1] as any,
        }).toString(CryptoJS.enc.Utf8);

        return `id=${encryptedKey}&alias=${id}&${decryptedToken}`;
    },
    decryptAjaxData: function (encryptedData: string, keys: Array<string>) {
        const decryptedData = CryptoJS.enc.Utf8.stringify(
            CryptoJS.AES.decrypt(encryptedData, keys[0], {
                iv: keys[1] as any,
            })
        );
        return JSON.parse(decryptedData);
    }
};

try {
    (async function () {
        const keys: Array<any> = JSON.parse(await MakeFetchZoro(`https://raw.githubusercontent.com/enimax-anime/gogo/main/viewasian.json`));
        for (let i = 0; i <= 1; i++) {
            keys[i] = CryptoJS.enc.Utf8.parse(keys[i]);
        }

        viewAsian.keys = keys;
    })();
} catch (err) {
    console.error(err);
}