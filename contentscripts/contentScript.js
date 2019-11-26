function highlightwords() {
    chrome.runtime.sendMessage({greeting: "request-highlight"}, function(words) {
        console.log("HIGHLIGHT: " + JSON.parse(words));
        var instance = new Mark(document.querySelector("*"));
        instance.unmark();
        JSON.parse(words).forEach(function(word) {
            console.log(word);
            instance.mark(word, {separateWordSearch: false});
        });
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.greeting == "refresh-highlight") {
        console.log("REFRESH HIGHLIGHT!!");
        highlightwords();
    }
});

highlightwords();