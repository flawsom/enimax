//todo refactor
class notification {
    constructor(DomElem, data) {
        this.data = data;
        this.elem = DomElem;
        if ("color" in data && data["color"] == "red") {
            this.className = "redNoti";
        }
        else {
            this.className = "blueNoti";
        }
        this.create();
    }
    create() {
        var newElem = document.createElement("div");
        var dur = "";
        if (this.data.perm != 0) {
            setTimeout(function () {
                try {
                    newElem.remove();
                }
                catch (err) {
                }
            }, (this.data.perm * 1000));
        }
        newElem.className = "noti " + this.className;
        let dot = document.createElement("div");
        dot.className = "dot";
        dot.onclick = function () {
            this.parentElement.remove();
        };
        newElem.append(dot);
        this.timer = document.createElement("div");
        if (this.data.perm != 0) {
            this.timer.className = "timer";
            this.timer.style.animationDuration = this.data.perm + "s";
        }
        newElem.append(this.timer);
        let notiHead = document.createElement("div");
        notiHead.className = "noti_head";
        notiHead.innerText = this.data.head;
        newElem.append(notiHead);
        let notiData = document.createElement("div");
        notiData.className = "noti_data";
        notiData.innerHTML = this.data.notiData;
        newElem.append(notiData);
        // newElem.innerHTML=`
        // 		<div class="dot" onclick='removeParent(this);'></div>
        // 		<div class="timer" style='${dur}'></div>
        // 		<div class="noti_head" >${this.data.head}</div>
        // 		<div class="noti_data">
        // 			${this.data.notiData}
        // 		</div>`;
        this.elem.prepend(newElem);
        this.noti = newElem;
    }
    remove() {
        try {
            this.noti.remove();
        }
        catch (err) {
            console.error(err);
        }
    }
    updateBody(newData) {
        try {
            this.elem.querySelector(".noti_data").innerText = newData;
        }
        catch (err) {
            console.error(err);
        }
    }
    notiTimeout(timeout) {
        const self = this;
        this.timer.className = "timer";
        this.timer.style.animationDuration = (timeout / 1000) + "s";
        setTimeout(function () {
            self.remove();
        }, timeout);
    }
}
