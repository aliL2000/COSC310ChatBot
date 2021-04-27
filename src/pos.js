const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const WordPOS = require('wordpos');
const wordpos = new WordPOS();

var com_phrase = {}; // word => rank
initialize();

// load word ranking
function initialize() {
    fs.createReadStream(path.resolve(__dirname, 'data', 'wordFrequency.csv'))
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', row => (com_phrase[row.word] = parseInt(row.rank)))
        .on('end', rowCount => console.log(com_phrase));
}

// Pos & Synonyms recongnition
// Replaces complex adjectives/adverbs with simple, higher ranked synonyms
// Improves the chance of the bot of correctly understanding the sentence
async function process(sentence) {
    
    if (sentence.length < 1)
        return '';

    var adjectives, adverbs, nouns;
    await wordpos.getPOS(sentence, function (element) {
        adjectives = element.adjectives;
        adverbs = element.adverbs;
        nouns = element.nouns;
    });

    if (adjectives) {
        for (var adj of adjectives) {
            var newadj = adj;
            var rank = getrank(adj);
            await wordpos.lookupAdjective(adj, function (definitions) {
                var synonyms = definitions[0].synonyms;
                if (synonyms) {
                    synonyms.forEach(syn => {
                        if (getrank(syn) < rank) {
                            newadj = syn;
                            rank = getrank(syn);
                        }
                    });
                }
            });
            sentence = sentence.replace(adj, newadj);
            //console.log(adj, getrank(adj), newadj, rank);
        }
    }

    if (adverbs) {
        for (var adv of adverbs) {
            var newadv = adv;
            var rank = getrank(adv);
            await wordpos.lookupAdverb(adv, function (definitions) {
                var synonyms = definitions[0].synonyms;
                if (synonyms) {
                    synonyms.forEach(syn => {
                        if (getrank(syn) < rank) {
                            newadv = syn;
                            rank = getrank(syn);
                        }
                    });
                }
            });
            sentence = sentence.replace(adv, newadv);
            //console.log(adv, getrank(adv), newadv, rank);
        }
    }

    if (nouns){
        var key = "INSERT PERSONAL API Key here"
        //default tag will be cat, and if there is a noun, it will switch to that noun
        if (nouns!="ASTARTE"){
            var tag = nouns[Math.floor(Math.random() * nouns.length)];
            
            var url1="https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key="+key+"&tags="+tag+"&per_page=1&page=1&format=json&nojsoncallback=1";
            let urls1 = "";
            $.get(url1, function(data1) {
                var tex1 = (JSON.stringify(data1));
                var obj1 = JSON.parse(tex1);
                if (obj1.stat=="ok"){
                    var temp1 = JSON.stringify(obj1.photos.photo)
                    var temp2=JSON.parse(temp1.substring(1, temp1.length-1));
                    var farm2=temp2.farm;
                    var server2=temp2.server;
                    var id2=temp2.id;
                    var secret2=temp2.secret;

                    urls1 = 'http://farm'+farm2+'.staticflickr.com/'+server2+'/'+id2+'_'+secret2+'.jpg';
                    try{
                        document.querySelector('.message_template>.message>.avatar').style.background='url('+urls1+')';
                        document.querySelector('.message_template>.message>.avatar').style.backgroundSize = "60px 60px";
                        document.querySelector('.message_template>.message>.avatar').style.backgroundRepeat = "no repeat";
                    }
                    catch (err){
                        document.querySelector('.message_template>.message>a>.avatar').style.background='url('+urls1+')';
                        document.querySelector('.message_template>.message>a>.avatar').style.backgroundSize = "60px 60px";
                        document.querySelector('.message_template>.message>a>.avatar').style.backgroundRepeat = "no repeat";
                    }
                    
                    getWiki(tag);
                }
           });
        }
        else{
            var tags = "dog";
            
            var url2="https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key="+key+"&tags="+tags+"&per_page=1&page=1&format=json&nojsoncallback=1";
            console.log(url2);
            let urls2 = "";
            $.get(url2, function(data2) {
                var tex2 = (JSON.stringify(data2));
                var obj2 = JSON.parse(tex2);
                
                var temp3 = JSON.stringify(obj2.photos.photo)
                var temp4=JSON.parse(temp3.substring(1, temp3.length-1));
                var farm=temp4.farm;
                var server=temp4.server;
                var id=temp4.id;
                var secret=temp4.secret;

                urls2 = 'http://farm'+farm+'.staticflickr.com/'+server+'/'+id+'_'+secret+'.jpg';
                console.log(urls2);
                document.querySelector('.message_template>.message>.avatar').style.background='url('+urls2+')';
                document.querySelector('.message_template>.message>.avatar').style.backgroundSize = "60px 60px";
                document.querySelector('.message_template>.message>.avatar').style.backgroundRepeat = "no repeat";
           });
        }
        
        //This section above implements the FlickrAPI, with the
        //Flicker SDK, see what you can do
        //https://www.youtube.com/watch?v=GglrI5poe7k&ab_channel=CodeTime
        //https://www.youtube.com/watch?v=RkXotG7YUek&ab_channel=TomLynch
    }
    return sentence;
}

function getWiki(searchterm){
    console.log(searchterm);
    let url = "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=";
    var urlFull = url +searchterm;
    $.get(urlFull,function(data){
        var content = (JSON.stringify(data));
        var obj = JSON.parse(content);
        var linkToData=obj[3][1];
        let imgs = document.getElementsByClassName('text_wrapper');
        //alert(imgs.length);
        for (var i=0;i<imgs.length;i++){
            $(imgs[i]).wrap("<a href="+linkToData+" target='_blank'></a>");
        }
        
    });

};


function getrank(word) {
    if (com_phrase[word])
        return com_phrase[word];
    else
        return Number.MAX_SAFE_INTEGER;
}

exports.process = process;
