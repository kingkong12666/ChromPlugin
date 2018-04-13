var allowedHosts = ["www.youtube.com"];
var cueContainer = [];
var mainVideo;
var button;
var scroll;
var pluginActive = false;
var visions = {};
var titles = {};
var visionCacheLimit = 10;
var visionTTL = 15;
var socials = {};
var cycleInterval = 300;
var speedFlag = false;
var visualizationFlag = false;
var video = document.querySelector('.video-stream');
video.setAttribute('id', 'playVideo');




function getPluginState() {
    return pluginActive;
}


function togglePlugin() {
    pluginActive = !pluginActive;
    return pluginActive;
}

// FIXME: Won't work
//var mainVideo = document.getElementById('playVideo');
//console.log(mainVideo);

// FIXME: Won't work too, because jQuery is not yet loaded
$(window).ready(function() {
    loadMedia()
});

$('#playVideo').ready(function() {
    console.log("#playVideo loaded");
    // mainVideo is undefined in both cases
    //mainVideo = document.getElementById('playVideo');
    mainVideo = $('#playVideo').get(0);
});


function loadMedia() {
    // TODO: Set as a hook for a video OnPlay() event
    console.log("loadMedia()");

    var currentHostname = window.location.hostname;

    // Current host is not in the whitelist
    if (!allowedHosts.includes(currentHostname))
        return false;

    $.ajax({
        url: 'https://dtdm.shelestiuk.com/api/media?url=' + window.location.href,
        dataType: "json",
        success: loadCueCallback
    });
}


var loadCueCallback = function (response) {
    console.log("loadCueCallback()");

    // Load media cues
    $.ajax({
        url: 'https://dtdm.shelestiuk.com/api/media/' + response.id + '/cues',
        dataType : "json",
        success: function (data) {
            for (cue in data.cues) {
                cueContainer.push(data.cues[cue])
            }

            // Check if media metadata is loaded. If so, then invoke the plugin
            if (data.cues.length > 0) {
                invokePlugin();
            }
        }
    });

    // Draw button
    var button = document.createElement('img');
    button.className = 'drawerButton';
    button.id = 'pluginButton';
    button.src =  chrome.extension.getURL('img/sloi_7.png');
    $('html').append(button);
}


var invokePlugin = function() {
    console.log("invokePlugin()");

    // IE lt 8 compatibility
    // Date.now()
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    }

    video = document.querySelector('.video-stream');
    video.id = 'playVideo';

    button = document.getElementById('pluginButton');
    button.onclick = function () {
        console.log("pluginButton.onclick()");
        togglePlugin();
        mainDrawer();
    }
}


function mainDrawer() {
    console.log("mainDrawer()");

    // Check if drawer is already created
    var drawer = document.getElementById('drawer');
    if (drawer == null) {
        drawer = document.createElement('div');
        drawer.id = 'drawer';
        drawer.className = 'drawer';
        $('html').append(drawer);

        // Plugin title
        title = document.createElement('div');
        title.className = 'pluginName';
        var logo = document.createElement('img');
        logo.className = 'wanamo';
        logo.src =  chrome.extension.getURL('img/sloi_7.png');
        var moreAboutTitle = document.createElement('img');
        var slower = document.createElement('img');
        slower.onclick = function () {
            speedFlag = !speedFlag
        };
        slower.className = 'slower';
        slower.src = chrome.extension.getURL('img/forma_1_7.png');
        var fullList = document.createElement('img');
        fullList.className = 'fullList';
        fullList.src = chrome.extension.getURL('img/forma_1_8.png');
        fullList.onclick = function () {
            visualizationFlag = !visualizationFlag
        };
        moreAboutTitle.src = chrome.extension.getURL('img/forma_1_6.png');
        moreAboutTitle.className = 'moreAboutTitle';


        var close = document.createElement('img');
        close.className = 'close';
        close.src = chrome.extension.getURL('img/forma_1_9.png');
        close.id = 'deleteDrawerButton';
        close.onclick = function() {
            console.log("deleteDrawer.onclick()");
            togglePlugin();
            $('.infoDTI').remove();
            $('.drawer').hide();
            $('.fullInfo').hide();
            var button = document.getElementById('pluginButton');
            button.style.display = 'block';
        };

        $('.drawer').append(title);
        $('.pluginName').append(logo);
        $('.pluginName').append(moreAboutTitle);
        $('.pluginName').append(slower);
        $('.pluginName').append(fullList);
        $('.pluginName').append(close);

        // Scroller


    }
    else {
        $('.drawer').show();
        $('.checkButton').show();
    }

    setDrawerSize();
    var button = document.getElementById('pluginButton');
    button.style.display = 'none';
}


function setDrawerSize() {
    console.log("setDrawerSize()");
    
    // TODO: Detect bottom offset (for youtube player elements to be shown)
    var bottomOffset = 30;
    
    var drawer = document.getElementById('drawer');
    var drawerCoords = drawer.getBoundingClientRect();
    var mainVideo = document.getElementById('playVideo');
    var videoCoords = mainVideo.getBoundingClientRect();
    //console.log(videoCoords);
 /*   $('#drawer').offset({
        top: videoCoords.top,
        //left: videoCoords.right
        left: drawerCoords.left
    });
    $('#drawer').height(videoCoords.bottom - videoCoords.top - 1 - bottomOffset);
    //$('#drawer').height(videoCoords.height);
    //$('#drawer').width();

    $('.fullInfo').offset({
        top: videoCoords.top,
        left: videoCoords.left
    });
    $('.fullInfo').height(videoCoords.bottom - videoCoords.top - 1 - bottomOffset);
    $('.fullInfo').width(videoCoords.right - videoCoords.left - drawer.width - 20);
*/
    //$('.scrollContainer').height(videoCoords.bottom - videoCoords.top - 1 - bottomOffset - 4*bottomOffset);
}


function loadVision(id) {
    //console.log("loadVision()");

    // Cached object
    if (id in visions) {
        visions[id].last_use = Date.now();
        return visions[id];
    }

    // Proper Vision loading
    console.log("loadVision()::ajax");
    $.ajax({
        url: 'https://dtdm.shelestiuk.com/api/vision/' + id,
        dataType: "json",
        success: function (vision) {
            // Last use timestamp
            vision.last_use = Date.now();
            vision.active = false;
            visions[id] = vision;
            titles[id] = vision.title;

            // Vision set
            if (vision.children !== null && vision.children.length > 0) {
                //console.log('loadVision()::set ' + vision.title);
                sidebarImage = document.createElement('img');
                sidebarImage.id = "vision-" + vision.id;
                sidebarImage.src = vision.image;
                sidebarImage.className = 'dinamicImg';
                sidebarImage.title = vision.title;
                sidebarImage.style.display = "none";
                sidebarImage.onclick = function () {
                    console.log("sidebarImage.onclick()");
                    var movieAction = document.getElementById('playVideo');
                    childs = [];
                    for(child in vision.children){
                        childs.push(visions[vision.children[child]])
                    }
                    infoAboutDTI(vision,childs, vision.best_shown[0]);

                    movieAction.pause();
                };

                titleForImage = document.createElement('h2');
                titleForImage.id = 'title-'+vision.id;
                titleForImage.className = "titleForImage";
                titleForImage.style.display = "none";
                titleForImage.innerHTML = vision.title;
                $('.drawer').append(titleForImage);
                $('.drawer').append(sidebarImage);

            }
            // TODO: Does it actually return some value from a parent function?
            return vision;
        }
    })
}


function checkTryVision(id) {
    console.log("checkTryVision()");

    // Full Details Vision loading
    $.ajax({
        beforeSend: function() {
            // Load general Vision info first
            if (!(id in visions)) {
                loadVision(id);
            }
        },
        url: 'https://dtdm.shelestiuk.com/api/vision/' + id + '/check',
        dataType: "json",
        success: function (vision) {
            vision.last_use = Date.now();
            visions[id] = vision;

            //sidebarImage = document.getElementById("vision-" + id);
            $('.infoDetails').html(vision.details);

            // TODO: Does it actually return some value from a parent function?
            return vision;
        }
    })
}


function showVision(id) {
    console.log("showVision()");

    // Vision not loaded (?)
    if (!(id in visions))
        return;

    // Last use timestamp
    visions[id].last_use = Date.now();
    visions[id].active = true;


    var visionImage = document.getElementById('vision-' + id);
    visionImage.style.display = "block";

    var title = document.getElementById('title-'+id);
    title.style.display = "block";

    for (soc in socials[id]) {
        socials[id][soc].style.display = "inline"
    }
}


function hideVision(id) {
    //console.log("hideVision()");
    // Vision not loaded (?)
    if (!(id in visions))
        return;

    // Last use timestamp
    if (visions[id].active) {
        console.log("hideVision()::active");
        visions[id].last_use = Date.now();
        visions[id].active = false;
    }

    var visionImage = document.getElementById('vision-' + id);
    if (visionImage == null)
        return;

    for (soc in socials[id]) {
        socials[id][soc].style.display = "none"
    }

    visionImage.style.display = "none";
    var title = document.getElementById('title-'+id);
    title.style.display = "none"

}


function deleteVision(id) {
    console.log("deleteVision(" + visionId + ")");    

    // Delete vision reference (cache)
    delete visions[visionId];

    // Delete vision image
    var node = document.getElementById("vision-" + id);
    var title = document.getElementById("title-" + id);
    title.parentNode.removeChild(title);
    if (node)
        node.parentNode.removeChild(node);

    // Delete vision share links
    for (soc in socials[id]) {
        var node = socials[id][soc];
        if (node)
            node.parentNode.removeChild(node);
    }
}


function isVisionActive(id) {
    // Vision not loaded
    if (!(id in visions))
        return false;
    
    return visions[id].active;
}


/**
 * Processes all visions:
 *  1. Clears expired visions from cache (ttl expired + cache limit exceeded)
 *  2. Hides all inactive visions.
 */
function checkVisions(activeVisions = null) {
    //console.log("checkVisions()");

    var visionCount = Object.keys(visions).length;
    //console.log("checkVisions(): visionCount = " + visionCount);
    //console.log(activeVisions);

    // Clear vision cache
    for (visionId in visions) {
        var vision = visions[visionId];
        // Vision is active
        if ((activeVisions !== null) && (activeVisions.includes(visionId))) {
            continue;
        }
        else if (isVisionActive(visionId)) {
            // Hide inactive vision
            hideVision(visionId);
        }
        
        // Clear cache
        if (visionCount > visionCacheLimit && (Date.now() - vision.last_use > visionTTL)) {
            deleteVision(visionId);
        }
    }
}

var shareSocial = function (id, time) {

   /* facebookAdd = document.createElement('img');
    facebookAdd.src =  chrome.extension.getURL('img/facebook.png');
    facebookAdde.display = "none";

    twitterAdd = document.createElement('img');
    twitterAdd.src = chrome.extension.getURL('img/twitter.png');
    twitterAdd.className = 'social twitter';
    twitterAdd.style.display = "none";

    gmailAdd = document.createElement('img');
    gmailAdd.src = chrome.extension.getURL('img/google.png');
    gmailAdd.className = 'social gmail';
    gmailAdd.style.display = "none";

    videoTiming = document.createElement('img');
    videoTiming.src =  chrome.extension.getURL('img/video.png');
    videoTiming.className = 'social videoTiming';
    videoTiming.style.display = "none";

    */videoTiming.onclick = function () {
        console.log("videoTiming.onclick()");
        var mainVideo = document.getElementById('playVideo');
        var movieAction = function (video, time) {
            console.log(time)
            video.currentTime = time/1000.0;
            video.pause();
        };
        movieAction(mainVideo, time);
    };
    //socials[id] = [facebookAdd, twitterAdd, gmailAdd, videoTiming];
   // $('.scrollContainer').append(facebookAdd, twitterAdd, gmailAdd,videoTiming);
};


var infoAboutDTI = function(vision, childs, time) {
    $('.fullInfo').remove();
    fullInfo = document.createElement('div');
    fullInfo.className = 'fullInfo';
    $('html').append(fullInfo);

    $('.imageForVision').remove();
    imageForVision = document.createElement('img');
    imageForVision.src = vision.placeholder_image;
    imageForVision.style.width = '100%';
    imageForVision.style.height = '477px';
    $('.fullInfo').append(imageForVision);
    $('.infoDTI').remove();

    function createInfoForVisions(elementForDescription, titleForVision, descriptionForVision, detailsForVision, image) {

        $('.infoDTI').remove();
        infoDTI = document.createElement('div');
        infoDTI.className = 'infoDTI';
        $('html').append(infoDTI);

        title = document.createElement('p');
        title.className = 'ditailsTitle'
        title.innerHTML = titleForVision;

        img = document.createElement('img');
        img.src = image;
        img.style.width = '99%';

        description = document.createElement('p');
        description.className = "infoDescription";
        description.innerText = descriptionForVision;

        details = document.createElement('div');
        details.className = "infoDetails";
        details.innerHTML = detailsForVision ;

        like = document.createElement('img');
        like.src =  chrome.extension.getURL('img/shape_1.png');
        like.className = 'socialMedia';

        dislike = document.createElement('img');
        dislike.src =  chrome.extension.getURL('img/shape_1_kopiya.png');
        dislike.className = 'socialMedia';

        comment = document.createElement('img');
        comment.src =  chrome.extension.getURL('img/forma_1_3.png');
        comment.className = 'socialMedia';

        share = document.createElement('img');
        share.src =  chrome.extension.getURL('img/forma_1_2.png');
        share.className = 'socialMedia';

        save = document.createElement('img');
        save.src =  chrome.extension.getURL('img/forma_1_4.png');
        save.className = 'socialMedia';

        bestTime = document.createElement('img');
        bestTime.src =  chrome.extension.getURL('img/forma_1_kop_ya.png');
        bestTime.className = 'socialMedia';
        bestTime.onclick = function () {
            var mainVideo = document.getElementById('playVideo');
            var movieAction = function (video, time) {
                console.log(time);
                mainVideo.currentTime = time/1000.0;
                mainVideo.pause();
            };
            movieAction(mainVideo, time);
        };

        buy = document.createElement('img');
        buy.src =  chrome.extension.getURL('img/forma_1_5.png');
        buy.className = 'socialMedia';
        buy.onclick = function(){
            // FIXME: Put here proper Ajax loader
            console.log(visions)
            console.log(elementForDescription)
            console.log(visions[elementForDescription])
            $.when( checkTryVision(visions[elementForDescription].id) )
        };


        $('.infoDTI').append(title);
        $('.infoDTI').append(img);
        $('.infoDTI').append(like);
        $('.infoDTI').append(dislike);
        $('.infoDTI').append(comment);
        $('.infoDTI').append(share);
        $('.infoDTI').append(save);
        $('.infoDTI').append(bestTime);
        $('.infoDTI').append(buy);
        $('.infoDTI').append(description);
        $('.infoDTI').append(details);
    }

    createInfoForVisions(vision, vision.title, vision.details, vision.description, vision.image);

    if (vision.active != null){
        for(element in vision.active_elements){
            //console.log(visions[element].title)
            //console.log(vision.active_elements[element][0])
            let elementForDescriptions = element;
            let currentTitle = visions[element].title;
            let currentDescription = visions[element].description;
            let currentDetails = visions[element].details;
            let imageForVision = visions[element].image;

            itemButton1 = document.createElement('button');
            itemButton1.innerHTML = visions[element].title;
            itemButton1.className = "mainLoop";
            itemButton1.style.bottom = vision.active_elements[element][0] + '%';
            itemButton1.style.right = vision.active_elements[element][1]+ '%';
            itemButton1.onclick = function () {
                createInfoForVisions(elementForDescriptions, currentTitle, currentDescription, currentDetails, imageForVision)
            };
            $('.fullInfo').append(itemButton1);
            setDrawerSize();
        }
    }
    closeInfo = document.createElement('img');
    closeInfo.src = chrome.extension.getURL('img/forma_1_kopiya_2.png');

    closeInfo.className = 'remove';
    $('.fullInfo').append(closeInfo);
    closeInfo.onclick = function(){
        $('.fullInfo').remove();
        $('.infoDTI').remove();
    };

    console.log("infoAboutDTI()");
};


var timer = setInterval(function() {

    var preloadTimeOffset = 7000;
    var mainVideo = document.getElementById('playVideo');
    var button;

    if (getPluginState()) {
        button = document.getElementById('deleteDrawerButton');
    }
    else {
        button = document.getElementById('pluginButton');
    }
    if (button == null)
        return;
    
    var activeCueFlag = false;
    var activeVisions = [];
    for (set in cueContainer) {

        //Change Speed
        if (speedFlag === true) {
            video.playbackRate = 0.5;
        } else {
            video.playbackRate = 1;
            // не нажат
        }

        // Vision ID
        visionId = cueContainer[set].vision_id;
        // TODO: toggle visions/buttons only if video is playing
        // Vision preload
        if (visualizationFlag === false){
            if (getPluginState() && mainVideo.currentTime >= (cueContainer[set].time_start - preloadTimeOffset)/1000.0
                && mainVideo.currentTime < cueContainer[set].time_end/1000.0)
                loadVision(visionId);
            // Cue active
            if (mainVideo.currentTime >= (cueContainer[set].time_start)/1000.0 && mainVideo.currentTime < (cueContainer[set].time_end)/1000) {

                activeCueFlag = true;
                activeVisions.push(visionId);

                // Activate Vision
                if (getPluginState() && !isVisionActive(visionId)) {
                    showVision(visionId);
                }
            }
        }

        else{

            console.log(123);
            console.log(visionId);
            loadVision(visionId);
            activeVisions.push(visionId)
            activeCueFlag = true;if (getPluginState() && !isVisionActive(visionId)) {
                showVision(visionId);
            }
        }

    }

    // Clear vision cache and hidden visions
    checkVisions(activeVisions);

    // Button active cue status (activeVisions.length > 0)
 /*   if (activeCueFlag) {
        button.style.backgroundColor = "green";
    }
    else {
        button.style.backgroundColor = "#ddd";
    }
*/
}, cycleInterval);

