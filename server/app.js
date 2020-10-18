// WikiTrains Server
// Joseph Zietowski 2020

var app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const axios = require('axios');
const storage = require('node-persist');
const { count } = require('console');

// gets 500 random Wikipedia articles
var urlRandom = "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=500&format=json";
// gets the number of views of a Wikipedia article by the last 5 days (title(s) must be appended to the end)
var urlPageViews = "https://en.wikipedia.org/w/api.php?action=query&prop=pageviews&pvipdays=5&format=json&titles=";
// gets a short description of a Wikipedia article(s) (title(s) must be appended to the end)
var urlDescription = "https://en.wikipedia.org/w/api.php?action=query&prop=description&format=json&titles=";
// gets the url of the image associated with the Wikipedia article(s) (title(s) must be appended to the end)
var urlImage = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&format=json&titles="
// gets 500 Wikipedia pages that are linked from the given Wikipedia page(s) (title(s) must be appended to the end)
var urlLinks = "https://en.wikipedia.org/w/api.php?action=query&prop=links&pllimit=500&format=json&titles="

// initialize the node-persist 'databases' 
// (init should be called with await but the server is always running so it doesnt matter after startup)
const storageTierOne = storage.create({ dir: './database/tierOneArticles' });
const storageTierTwo = storage.create({ dir: './database/tierTwoArticles' });
storageTierOne.init();
storageTierTwo.init();

var databaseArticlesCount = {
    tierOne: 100, // must be at least 8
    tierTwo: 10 // must be at least 1
};

//fillDatabase(databaseArticlesCount.tierOne, databaseArticlesCount.tierTwo);


// on connection from client 
io.on('connection', function (socket) {
    console.log("made socket connection:", socket.id);
    // the current article choices the client can choose from
    var currentChoices = [];
    var endingArticleTitle = null;

    // when the client is ready to start the game
    socket.on('initGame', function () {
        // generate a 9 unique random indices: one for the starting article (Tier 2, index 0),
        // and 8 for the possible ending articles (Tier 1, indices 1-8).
        // (in the game,the user gets to pick the ending article)
        let randIndices = [];
        randIndices[0] = random(0, databaseArticlesCount.tierTwo - 1);
        for (let i = 1; i < 9; i++) {
            randIndices[i] = random(0, databaseArticlesCount.tierOne - 1)
            // make sure that the number is different from every number before it
            // if its not, try again
            for (let j = 1; j < i; j++)
                if (randIndices[i] == randIndices[j])
                    i--;
        }

        // get 9 unique articles based on randIndices
        let allPromises = [];
        allPromises[0] = storageTierTwo.getItem(randIndices[0].toString());
        for (let i = 1; i < randIndices.length; i++)
            allPromises[i] = storageTierOne.getItem(randIndices[i].toString());

        // send the articles to the server
        Promise.all(allPromises).then(function (articles) {
            console.log(articles)
            currentChoices = articles.slice(1);
            socket.emit('initArticles', articles);
        }).catch(function (err) {
            throw err;
        });
    });

    // called when the client has chosen the ending article
    socket.on('endingArticleChosen', function (articleTitle) {
        if (endingArticleTitle == null && currentChoices.map(a => a.title).includes(articleTitle)) {
            endingArticleTitle = articleTitle
            console.log("ending article: " + endingArticleTitle)
        }
        else
            console.log(articleTitle + " is not a valid ending article or the ending article has already been chosen")
    });

    // called when the client has chosen the next article
    socket.on('nextArticleChosen', function (articleTitle) {
        getNextArticles(articleTitle, 3).then(function (newChoices) {
            socket.emit('newChoices', newChoices);
        }).catch(function (err) {
            throw err;
        });
    });


    // on disconnection from client 
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

http.listen(3000, function () {
    console.log("listening to requests on port 3000")
});

// Fills the node-persist 'database' with Wikipedia article
// information to be used later. This allowes requests to
// be fast by calling the WikiMedia API ahead of time.
//
// Tier 1 Wikipedia articles have at least 500 views
// Tier 2 Wikipedia articles have at least 200 views
async function fillDatabase(tierOneCount, tierTwoCount) {

    let tierOneArticles = await randomArticles(tierOneCount, 200);
    let tierTwoArticles = await randomArticles(tierTwoCount, 100);

    // insert the tier one articles into the 'database'
    for (let i = 0; i < tierOneArticles.length; i++)
        await storageTierOne.setItem(i.toString(), tierOneArticles[i]);

    // insert the tier two articles into the 'database'
    for (let i = 0; i < tierTwoArticles.length; i++)
        await storageTierTwo.setItem(i.toString(), tierTwoArticles[i]);
}

// returns 'count' random Wikipedia articles that have been viewed
// at least viewLimit times in a day, contain an image URL, and 
// are not actors/actresses
async function randomArticles(count, viewLimit) {
    try {
        let foundArticles = [];
        while (foundArticles.length < count) {
            let res = await axios.get(urlRandom);
            let randomArticles = res.data.query.random;
            // for each random article
            for (let i = 0; i < randomArticles.length; i++) {
                let title = randomArticles[i].title;

                // make sure it has enough views
                let viewCount = await articleViews(title);
                if (viewCount < viewLimit)
                    continue;

                // make sure it has an imageURL
                let imageURL = await articleImage(title);
                if (imageURL == "")
                    continue;

                // make sure the article description exists and doesn't contain
                // "actor" or "actress"
                let description = await articleDescription(title);
                if (description == "" || description.toLowerCase().includes("actor") || description.toLowerCase().includes("actress")) {
                    console.log("actor: " + title)
                    continue;
                }

                // add the article information to foundArticles
                foundArticles.push({
                    title: title,
                    description: description,
                    imageURL: imageURL
                });

                console.log(foundArticles.length, title);

                if (foundArticles.length >= count)
                    break;
            }
        }
        return foundArticles;
    } catch (err) {
        console.log(err);
    }
}

// returns the number of views of of the Wikipedia article given in the past day
function articleViews(title) {
    return new Promise((resolve, reject) => {
        let url = encodeURI(urlPageViews + formatTitle(title));
        axios.get(url)
            .then(res => {
                let pageId = Object.keys(res.data.query.pages)[0];
                let date = Object.keys(res.data.query.pages[pageId].pageviews)[0];
                let viewCount = res.data.query.pages[pageId].pageviews[date];
                if (viewCount == null)
                    resolve(0);
                else
                    resolve(viewCount);
            })
            .catch(err => {
                reject(err);
            });
    });
}

// returns a short description of the Wikipedia article given
function articleDescription(title) {
    return new Promise((resolve, reject) => {
        let url = encodeURI(urlDescription + formatTitle(title));
        axios.get(url)
            .then(res => {
                let pageId = Object.keys(res.data.query.pages)[0];
                let description = res.data.query.pages[pageId].description;
                if (description == null)
                    resolve("");
                else
                    resolve(description);
            })
            .catch(err => {
                reject(err);
            });
    });
}

// returns the image URL of the Wikipedia article given
function articleImage(title) {
    return new Promise((resolve, reject) => {
        let url = encodeURI(urlImage + formatTitle(title));
        axios.get(url)
            .then(res => {
                let pageId = Object.keys(res.data.query.pages)[0];
                if (res.data.query.pages[pageId].original == null)
                    resolve("");
                else
                    resolve(res.data.query.pages[pageId].original.source);
            })
            .catch(err => {
                reject(err);
            });
    });
}

// replaces spaces with underscores so that the Wikipedia
// API will recognize the title
function formatTitle(title) {
    console.log(title);
    return title.replace(/ /g, "_");
}

// gets 'count' Wikipedia articles that are linked from the given article
async function getNextArticles(title, count) {
    let url = encodeURI(urlLinks + formatTitle(title));
    let res = await axios.get(url)
    let pageId = Object.keys(res.data.query.pages)[0];
    let linksCount = res.data.query.pages[pageId].links.length;

    if (linksCount < count) {
        console.log("Error: there arent enough links");
        return null;
    }

    // generate 'count' unique random indices
    let randIndices = [];
    for (let i = 0; i < count; i++) {
        randIndices[i] = random(0, linksCount - 1)
        // make sure the random index is unique
        for (let j = 0; j < i; j++) {
            if (randIndices[i] == randIndices[j]) {
                i--;
                break;
            }
        }
    }

    let articles = [];
    while (articles.length < count) {
        // random article
        let article = res.data.query.pages[pageId].links[random(0, linksCount - 1)];

        // make sure this article has not already been added to the list
        if (articles.map(a => a.title).includes(article))
            continue;

        // make sure it has an imageURL
        let imageURL = await articleImage(article);
        if (imageURL == "")
            continue;

        // make sure the article description exists and doesn't contain
        // "actor" or "actress"
        let description = await articleDescription(article);
        if (description == "" || description.toLowerCase().includes("actor") || description.toLowerCase().includes("actress"))
            continue;

        // finally, add the article to the list
        articles.push({
            title: article,
            description: description,
            imageURL: imageURL
        });
    }
    return articles;
}

// returns a random integer between min and max
function random(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
}