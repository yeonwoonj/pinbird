﻿var kDEBUG = false;
var kURL = 'http://j.mp/pinbird';
if (kDEBUG) {
 kURL = '';
}
var kBUNDLE_REPO = 'http://pin-bird.appspot.com/bundle';

function errorMessage(s,delay) {
 var delay = delay || 3000;
 //console.error(s);
 $('#msgs').html(s).hide();

 // TODO: clearQueue or stop seems to be not work.
 $('#msgs').clearQueue();
 $('#msgs').stop(true);

 //console.log( $('#msgs').queue() );
 $('#msgs').slideDown('fast').delay(delay).slideUp('slow');
}

function getDatediff(msecs)
{
 var secs = Math.floor(msecs/1000);

 if (secs < 60) {
  return secs + '초 전';
 }

 var mins = Math.floor(secs/60);
 if (mins < 60) { 
  return mins + '분 전';
 }

 var hours = Math.floor(mins/60);
 if (hours < 24) {
  return hours + "시간 전";
 }

 var days = Math.floor(hours/24);
 if (days < 30) {
  return days + "일 전";
 }

 var months = Math.floor(days/30);
 var days_remains = days%30;

 if (days_remains === 0) {
  return months + "달 전";
 }

 return months + "달 " + days_remains + "일 전";
}

function replaceURLWithHTMLLinks(text) {

  var re_quote = /&quot;.*?&quot;|“.*?”/ig;
  text = text.replace(re_quote, '<span class="quote">$&</span>');

  var re_link = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
  text = text.replace(re_link,'<a href="$1" target="_blank">$1</a>');
//  text = text.replace(re_link,'<p class="ellipsis"><a href="$1" target="_blank">$1</a></p>');
  
  var re_user = /(\@)(\w+)/ig;
  //text = text.replace(re_user,'<a class="user" href="http://twitter.com/$2" target="_blank">$&</a>');
  text = text.replace(re_user,'<a class="user" href="#" onclick="addPane(\'$&\');">$&</a>');
  
  var re_hashtag = /(\#)(\w+)/ig;
  //text = text.replace(re_hashtag,'<a class="hashtag" href="http://twitter.com/search/%23$2" target="_blank">$&</a>');
  text = text.replace(re_hashtag,'<a class="hashtag" href="#" onclick="addPane(\'$&\');">$&</a>');
  
  // s.replace(/&quot;.*?&quot;/ig,'<span class="quote">$&</span>');
  
  return text;
}

// return a unique id for a pane
var lastId = 1;
var paneIds = {};
function paneId(id, withoutSharp) {
 var id = id.toLowerCase();
 var value = paneIds[id];
 if (!value) {
  value = paneIds[id] = 'pid_' + lastId++;
 }

 if (!withoutSharp) {
  value = '#' + value;
 }
 
 return value;
}

function removePaneAll() {
 $('#view #stream div.pane').remove();
}

function removePane(keyword) {

 $(paneId(keyword)).hide(function() {
  $(this).remove();
 });
 
/*
 if ($('li.first').length > 1) {
  $(paneId(keyword)).hide(function() {
   $(this).remove();
  });
 }
 else {
  errorMessage('하나는 남겨 놓으셔야죠. :^D');
 }
*/
}

function togglePane(elem, keyword, refresh_callback) {

 var headli = $(paneId(keyword) + ' li.first');
 if (headli.hasClass('stopped')) {
  headli.removeClass('stopped');
  //headli.mycallback();
  return;
 }

 headli.addClass('stopped');
 //headli.mycallback = refresh_callback;
}

function queueRefresh(keyword, refresh_url, rpp, interval) {

 if (refresh_url.length <= 0) {
  errorMessage('타이머가 멈췄습니다!' + refresh_url);
 }
 else {
  window.setTimeout(function() {
   refreshPane(keyword, refresh_url, rpp, interval);
  }, interval);
 }

}

function makeListItem(item, now) {

   var at = Date.parse(item.created_at);
   var user_url = 'http://twitter.com/' + item.from_user;
   var status_url = 'http://twitter.com/' + item.from_user + '/status/' + item.id_str;

   var user = $('<div />').html('<a href="' + user_url + '" target="_blank">' + item.from_user + '</a>')
                          .addClass('user');
   var text = $('<div />').html(replaceURLWithHTMLLinks(item.text))
                          .addClass('ellipsis')
                          .addClass('text');
   var date = $('<div />').html(getDatediff(now-at))
                          .attr('title',item.created_at)
                          //.append('<a href="javascript:favCreate('+ item.id_str +');">☆</a>')
                          .append('<a href="'+ status_url +'" target="_blank">↗</a>')
                          .addClass('date');

   // pick interval from 50 secs to 60 secs
   var interval = 50 + Math.floor(Math.random()*100) % 10;
   if (kDEBUG) { interval = 5; }
   window.setInterval(function() {
    var now = new Date();
    var at = Date.parse(date.attr('title'));
    date.html(getDatediff(now-at))
        //.append('<a href="javascript:favCreate('+ item.id_str +');">☆</a>')
        .append('<a href="'+ status_url +'" target="_blank">↗</a>');

   }, interval * 1000);

   return $('<li />').append(user)
                     .append(text)
                     .append(date);
}

function refreshPane(keyword, refresh_url, rpp, interval) {

 var now = new Date();
 var headli = $(paneId(keyword) + ' li.first');
 if (headli.length <= 0 || headli.hasClass('stopped')) {
  return;
 }

 $.getJSON('http://search.twitter.com/search.json' + refresh_url + '&rpp=' + rpp + '&callback=?', function(JSON) {
  var item, li;
  refresh_url = JSON.refresh_url;
  //console.log(refresh_url + ': ' + JSON.results.length);

  for (var idx in JSON.results) {
   item = JSON.results[idx];
   refresh_url = JSON.refresh_url;

   li = makeListItem(item, now);
   headli.after(li.hide());

   li.delay(500).slideDown();

  }

 }).done(function() {

  queueRefresh(keyword, refresh_url, rpp, interval);

 }).fail(function() {

  queueRefresh(keyword, refresh_url, rpp, interval);

 });

}

function addPane(keyword, rpp, interval) {
 // parameter validation
 var keyword = keyword.replace(/^\s+/,'').replace(/\s+$/,'');
 if (keyword.length <= 0) {
  errorMessage('키워드를 입력해 주세요.');
  return;
 }

 var user;
 if (/^@/.test(keyword)) {
  user = keyword.substr(1);
  keyword = keyword.replace(/^@/, 'from:');
 }

 if ($(paneId(keyword)).length > 0) {
  $(paneId(keyword))
   .animate({"opacity": .3}, 100)
   .animate({"opacity":  1}, 200)
   .animate({"opacity": .3}, 100)
   .animate({"opacity":  1}, 400);
  return;
 }
 
 var rpp = rpp || 30;
 if (kDEBUG) rpp = 5;
 var interval = interval || 30000;
 if (kDEBUG) interval = 5000;

 // make div.ul.li
 var div = $('<div />')
            .attr('id', paneId(keyword, true))
            .addClass('pane')
            .addClass('shadow');

 var ul = $('<ul />')
           .appendTo(div);

 var heada = $('<a />').attr('title', 'click to suspend.')
          //.attr('href','#')
          .text(user ? '@' + user : keyword)
          .addClass('stream_title')
          .click(function() {
           togglePane(this, keyword, function() {
            //queueRefresh(keyword, refresh_url, rpp, interval);
           });
          });

 $('<li />').html(heada)
            .append('<sup> <a href="#" onclick="removePane(\''+keyword+'\');" title="click to close this pane.">ⓧ</a></sup>')
            .addClass('first')
            .appendTo(ul)
            .show();

 $('#view #stream').append(div);
 div.show('fast');

 // request search result
 var now = new Date();
 var refresh_url = '';
 var url = 'http://search.twitter.com/search.json?q=' + encodeURIComponent(keyword);

 $.getJSON(url + '&rpp=' + rpp + '&callback=?', function(JSON) {

  refresh_url = JSON.refresh_url;

  for (var idx in JSON.results) {
   var item = JSON.results[idx];

   var li = makeListItem(item, now);
   li.hide()
    .appendTo(ul);

   var interval = 500 + Math.floor(Math.random()*10000) % 3500;

   ul.queue(function(){
    li.delay(interval).slideDown('slow');
    $(this).dequeue();
   });

  }
  $('<li />').html('-')
             .addClass('last')
             .appendTo(ul);

 }).done(function() {

   queueRefresh(keyword, refresh_url, rpp, interval);

 }).fail(function() {

   queueRefresh(keyword, refresh_url, rpp, interval);

 });
}

function favCreate(id) {
/*
 $.ajax({

  type: 'POST',
  url: 'http://api.twitter.com/1/favorites/create/' + id + '.json?callback=?',
  success: function(JSON) {
   console.log(JSON);
  },
  dataType: 'jsonp'
 });

 console.log('http://api.twitter.com/1/favorites/create/' + id + '.json');
*/
// $.post('http://api.twitter.com/1/favorites/create/' + id + '.json?callback=?', function(JSON) {
//  console.log(JSON);
// });
}


function loadBundle(bdname, rpp) {
 removePaneAll();

 $.getJSON(kBUNDLE_REPO + '/get/' + encodeURIComponent(bdname) + '?callback=?', function(JSON) {

  if (JSON.result != 0) {
   errorMessage('# ' + bdname + ' 묶음은 삭제되었습니다!');
   return;
  }

  for (var idx = 0; idx < JSON.keywords.length; idx++) {
   addPane(JSON.keywords[idx], rpp);
  }
 });
}

function parseBundleHash(href) {
 var anchorPos = href.indexOf('#');
 if (anchorPos == -1) {
  return '';
 }

 var bdname = href.substr(anchorPos + 1);

 return decodeURIComponent(bdname);
}

function parseBundleURL(href) {
 // remove anchor part if it exists
 var anchorPos = href.indexOf('#');
 if (anchorPos != -1) {
  href = href.substring(anchorPos, 0);
 }

 href = decodeURIComponent(href);

 var bundlePos = href.indexOf('bundle=');
 if (bundlePos == -1) {
  return '';
 }

 return href.substr(bundlePos + 7);
}

function popup() {

 if ($('li.first').length <= 0) {
  errorMessage('먼저 글타래나 묶음을 열고, 새 묶음을 만들어 주세요.');
  return;
 }

 var popup =  $('#modal_popup');

 $('#modal_bg')
  .fadeTo('fast', 0.5)
  //.fadeIn('slow')
  .click(function(){ unpopup(); });

 $(window).scrollTop(0);
 $(window).scrollLeft(0);

 popup
  .css('top', ( $(window).height() - popup.height() ) / 3 + $(window).scrollTop() + 'px')
  .css('left', ( $(window).width() - popup.width() ) / 2 + $(window).scrollLeft() + 'px')
  //.css('top', '100px').css('left', '100px')
  .fadeIn('slow');

 //$('#bundle_edit').delay(1000).focus();
}

function unpopup() {
 $('#modal_bg').fadeOut('fast');
 $('#modal_popup').hide();
}

function onloadz()
{
 $('#keyword').keydown(function(e) {
  if (e.keyCode == 13) {
   addPane(this.value);
   this.value = '';
  }
 });
 
 $('#bundle_create').click(function(e) { popup(); });

 $('#bundle_edit input').keydown(function(e) {
  if (e.keyCode == 13) {
   var bdname = this.value;
   var bdnameEncoded = encodeURIComponent(this.value);
   var bd_url = kURL + '#' + bdname;
   this.value = '';

   var keywords = [];
   $('#view #stream div.pane li.first a.stream_title').each(function(i) {
    var encoded = encodeURIComponent(this.innerText);
    keywords.push(encoded);
   });
  
   $.getJSON(kBUNDLE_REPO + '/create/' + bdnameEncoded + '/' + keywords.join(',') + '?callback=?', function(JSON) {
    var code = JSON.result;
    if (code == 0) {
     errorMessage('묶음이 저장되었습니다: <a href="' + bd_url + '">' + bd_url + '</a>',10*1000);
    }
    else if (code == 103) {
     errorMessage('이미 존재하는 묶음 이름입니다. 다른 이름을 골라주세요: ' + bdname, 5*1000);
    }
    else {
     errorMessage('오류가 발생했습니다. 처음부터 다시 시도해 주세요.');
    }
   });

   unpopup();
  };
 });

 $.getJSON(kBUNDLE_REPO + '/top?callback=?', function(JSON) {

  $('#bundle_loading').remove();

  for (var idx = 0; idx < JSON.length; idx++) {

   var name = JSON[idx].name;
   var onclick = (function(bdname) { return function() { loadBundle(bdname); } })(name);

   var li = $('<li />').html('<a href="#' + name + '"># ' + name + '</a>').click(onclick);

   $('#bundle #seps').closest('li').before(li);
  }
 });

 var bdname = parseBundleHash(document.location.href);
 if (bdname.length) {
  loadBundle(bdname);
 }
 else {
  var rpp = 5; // default rpp는 낮게
  loadBundle('GDC 2011', rpp);
 }
 
}
